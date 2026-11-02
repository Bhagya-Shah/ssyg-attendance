(function () {
  var state = {
    token: null, isAdmin: false, members: [], events: [],
    tab: 'events', currentEvent: null, present: {}, dirty: false, report: null
  };

  /* ---------- helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }
    catch (e) { return null; }
  }
  var pending = 0;
  function apiCall(action, args) {
    var url = (window.APP_CONFIG || {}).API_URL;
    if (!url || url.indexOf('PASTE') >= 0) return Promise.reject(new Error('API_URL is not set in config.js'));
    // text/plain keeps this a "simple" request, so the browser skips the CORS preflight
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, args: args }) })
      .then(function (r) { if (!r.ok) throw new Error('Server error ' + r.status); return r.json(); })
      .then(function (res) { if (!res.ok) throw new Error(res.error || 'Something went wrong'); return res.data; });
  }
  function call(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    pending++; $('loading').classList.remove('hidden');
    var done = function () { if (--pending <= 0) { pending = 0; $('loading').classList.add('hidden'); } };
    return apiCall(fn, args).then(function (r) { done(); return r; }, function (e) {
      done();
      var msg = (e && e.message) || String(e);
      if (msg === 'Failed to fetch') msg = 'Could not reach the server. Check your internet connection.';
      if (msg.indexOf('SESSION_EXPIRED') >= 0) { setAdmin(null); msg = 'Admin session expired. Please log in again.'; }
      toast(msg, true); throw e;
    });
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = $('toast'); t.textContent = msg; t.className = isErr ? 'err' : '';
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'hidden'; }, isErr ? 5000 : 2500);
  }
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function parseDate(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) {
    if (!s) return '';
    var d = parseDate(s); if (isNaN(d)) return s;
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function activeMembers() { return state.members.filter(function (m) { return m.active; }).sort(byName); }
  function byName(a, b) { return a.name.localeCompare(b.name); }

  /* ---------- modal ---------- */
  function modal(html, onReady) {
    var root = $('modalRoot');
    root.innerHTML = '<div class="overlay"><div class="modal">' + html + '</div></div>';
    var ov = root.firstChild;
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    root.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = closeModal; });
    var first = root.querySelector('input, textarea'); if (first) first.focus();
    if (onReady) onReady(root);
  }
  function closeModal() { $('modalRoot').innerHTML = ''; }
  function confirmBox(title, text, okLabel) {
    return new Promise(function (resolve) {
      modal('<h2>' + esc(title) + '</h2><div class="muted">' + esc(text) + '</div>' +
        '<div class="actions"><button data-close>Cancel</button><button class="primary" id="cOk">' + esc(okLabel || 'OK') + '</button></div>',
        function () { $('cOk').onclick = function () { closeModal(); resolve(true); }; });
    });
  }

  /* ---------- auth ---------- */
  function setAdmin(token) {
    state.token = token; state.isAdmin = !!token;
    store('ssyg_token', token || null);
    document.body.classList.toggle('is-admin', state.isAdmin);
    $('modeBadge').textContent = state.isAdmin ? 'Admin' : 'Viewer';
    $('authBtn').textContent = state.isAdmin ? 'Log out' : 'Admin login';
    applyRoleVisibility(); render();
    if (started) load();
  }
  var started = false;
  function applyRoleVisibility() {
    document.querySelectorAll('.admin-only').forEach(function (el) { el.classList.toggle('hidden', !state.isAdmin); });
    document.querySelectorAll('.viewer-only').forEach(function (el) { el.classList.toggle('hidden', state.isAdmin); });
  }
  $('authBtn').onclick = function () {
    if (state.isAdmin) { call('logout', state.token); setAdmin(null); toast('Logged out'); return; }
    modal('<h2>Admin login</h2><div class="muted">Admins can add members, events and mark attendance.</div>' +
      '<form id="loginForm"><label>Password</label><input type="password" id="pw" autocomplete="current-password">' +
      '<div class="actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Log in</button></div></form>',
      function () {
        $('loginForm').onsubmit = function (e) {
          e.preventDefault();
          call('login', $('pw').value).then(function (tok) { closeModal(); setAdmin(tok); toast('Logged in as admin'); });
        };
      });
  };

  /* ---------- tabs ---------- */
  document.querySelectorAll('nav button').forEach(function (b) {
    b.onclick = function () { if (leaveCheck()) showTab(b.getAttribute('data-tab')); };
  });
  function showTab(tab) {
    state.tab = tab;
    document.querySelectorAll('nav button').forEach(function (b) {
      var t = b.getAttribute('data-tab'); b.classList.toggle('on', t === tab || (tab === 'event' && t === 'events'));
    });
    ['events', 'event', 'members', 'export'].forEach(function (t) { $('tab-' + t).classList.toggle('hidden', t !== tab); });
    render(); window.scrollTo(0, 0);
  }
  function leaveCheck() {
    if (state.tab === 'event' && state.dirty && state.isAdmin) {
      if (!window.confirm('You have unsaved attendance. Leave without saving?')) return false;
    }
    state.dirty = false; return true;
  }

  function render() {
    if (state.tab === 'events') renderEvents();
    if (state.tab === 'event') renderEvent();
    if (state.tab === 'members') renderMembers();
  }

  /* ---------- data ---------- */
  function load() {
    return call('getAppData', state.token).then(function (d) {
      state.members = d.members; state.events = d.events;
      if (d.title) { $('appTitle').textContent = d.title; document.title = d.title; }
      render();
    });
  }

  /* ---------- events ---------- */
  $('eventSearch').oninput = renderEvents;
  function renderEvents() {
    var q = $('eventSearch').value.toLowerCase();
    var list = state.events.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; })
      .filter(function (e) { return !q || (e.name + ' ' + e.description + ' ' + e.date).toLowerCase().indexOf(q) >= 0; });
    var total = activeMembers().length;
    if (!list.length) {
      $('eventList').innerHTML = '<div class="empty">' + (state.events.length ? 'No events match.' :
        'No events yet.' + (state.isAdmin ? ' Tap “+ New event” to create one.' : '')) + '</div>';
      return;
    }
    $('eventList').innerHTML = list.map(function (e) {
      var d = parseDate(e.date);
      return '<div class="card list-item" data-id="' + esc(e.id) + '">' +
        '<div class="date-box"><div class="d">' + (isNaN(d) ? '?' : d.getDate()) + '</div><div class="m">' +
        (isNaN(d) ? '' : MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(-2)) + '</div></div>' +
        '<div style="flex:1;min-width:0"><div class="title">' + esc(e.name) + '</div>' +
        '<div class="muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(e.description || fmtDate(e.date)) + '</div></div>' +
        '<span class="pill">' + e.presentCount + ' present</span></div>';
    }).join('');
    $('eventList').querySelectorAll('.list-item').forEach(function (el) {
      el.onclick = function () { openEvent(el.getAttribute('data-id')); };
    });
  }

  function eventForm(ev) {
    ev = ev || { date: iso(new Date()), name: '', description: '' };
    modal('<h2>' + (ev.id ? 'Edit event' : 'New event') + '</h2><form id="evForm">' +
      '<label>Date</label><input type="date" id="fDate" required value="' + esc(ev.date) + '">' +
      '<label>Event name</label><input id="fName" required maxlength="120" value="' + esc(ev.name) + '" placeholder="e.g. Weekly sabha">' +
      '<label>Description (optional)</label><textarea id="fDesc" maxlength="1000">' + esc(ev.description) + '</textarea>' +
      '<div class="actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save</button></div></form>',
      function () {
        $('evForm').onsubmit = function (e) {
          e.preventDefault();
          var data = { id: ev.id, date: $('fDate').value, name: $('fName').value, description: $('fDesc').value };
          call('saveEvent', state.token, data).then(function (id) {
            closeModal(); toast('Event saved');
            return load().then(function () { if (!ev.id) openEvent(id); });
          });
        };
      });
  }
  $('newEventBtn').onclick = function () { eventForm(); };

  function openEvent(id) {
    var ev = state.events.filter(function (e) { return e.id === id; })[0];
    if (!ev) return;
    state.currentEvent = ev; state.present = {}; state.dirty = false;
    $('attSearch').value = '';
    showTab('event');
    $('attList').innerHTML = '<div class="empty">Loading…</div>';
    call('getEventAttendance', id).then(function (ids) {
      state.present = {}; ids.forEach(function (m) { state.present[m] = true; });
      renderEvent();
    });
  }
  $('backBtn').onclick = function () { if (leaveCheck()) showTab('events'); };
  $('editEventBtn').onclick = function () { eventForm(state.currentEvent); };
  $('deleteEventBtn').onclick = function () {
    var ev = state.currentEvent;
    confirmBox('Delete event?', 'This deletes “' + ev.name + '” and its attendance. This cannot be undone.', 'Delete').then(function () {
      call('deleteEvent', state.token, ev.id).then(function () { state.dirty = false; toast('Event deleted'); showTab('events'); load(); });
    });
  };
  $('attSearch').oninput = renderEvent;
  $('allBtn').onclick = function () { visibleAttMembers().forEach(function (m) { state.present[m.id] = true; }); state.dirty = true; renderEvent(); };
  $('noneBtn').onclick = function () { visibleAttMembers().forEach(function (m) { delete state.present[m.id]; }); state.dirty = true; renderEvent(); };

  function visibleAttMembers() {
    var q = $('attSearch').value.toLowerCase();
    // Active members, plus removed members who were present at this event (keeps history visible)
    var list = state.members.filter(function (m) { return m.active || state.present[m.id]; }).sort(byName);
    if (!state.isAdmin) list = list.filter(function (m) { return state.present[m.id]; });
    return list.filter(function (m) { return !q || m.name.toLowerCase().indexOf(q) >= 0; });
  }
  function renderEvent() {
    var ev = state.currentEvent; if (!ev) return;
    // refresh from latest data (after edit)
    ev = state.events.filter(function (e) { return e.id === ev.id; })[0] || ev; state.currentEvent = ev;
    $('evDate').textContent = fmtDate(ev.date);
    $('evName').textContent = ev.name;
    $('evDesc').textContent = ev.description || '';
    var list = visibleAttMembers();
    var count = Object.keys(state.present).length;
    var total = activeMembers().length;
    $('attCount').textContent = count + ' of ' + total + ' present' + (state.dirty ? ' · unsaved changes' : '');
    $('attCountView').textContent = count + ' of ' + total + ' members were present.';
    if (!list.length) {
      $('attList').innerHTML = '<div class="empty">' + (state.isAdmin ? (state.members.length ? 'No members match.' : 'Add members first in the Members tab.') : 'No attendance marked for this event yet.') + '</div>';
      return;
    }
    if (state.isAdmin) {
      $('attList').innerHTML = list.map(function (m) {
        var on = !!state.present[m.id];
        return '<label class="check' + (on ? ' on' : '') + '" data-id="' + esc(m.id) + '"><input type="checkbox"' + (on ? ' checked' : '') + '>' +
          '<span class="name">' + esc(m.name) + (m.active ? '' : ' <span class="pill off">removed</span>') + '</span>' +
          '<span class="muted">' + (on ? 'Present' : '') + '</span></label>';
      }).join('');
      $('attList').querySelectorAll('.check input').forEach(function (cb) {
        cb.onchange = function () {
          var id = cb.parentNode.getAttribute('data-id');
          if (cb.checked) state.present[id] = true; else delete state.present[id];
          state.dirty = true; renderEvent();
        };
      });
    } else {
      $('attList').innerHTML = list.map(function (m) {
        return '<div class="member"><span class="name">' + esc(m.name) + '</span><span class="pill">Present</span></div>';
      }).join('');
    }
  }
  $('saveAttBtn').onclick = function () {
    var ev = state.currentEvent; var ids = Object.keys(state.present);
    $('saveAttBtn').disabled = true;
    call('saveAttendance', state.token, ev.id, ids).then(function (n) {
      state.dirty = false; toast('Saved: ' + n + ' present'); renderEvent(); load();
    }).then(function () { $('saveAttBtn').disabled = false; }, function () { $('saveAttBtn').disabled = false; });
  };

  /* ---------- members ---------- */
  $('memberSearch').oninput = renderMembers;
  $('showRemoved').onchange = renderMembers;
  function renderMembers() {
    var q = $('memberSearch').value.toLowerCase();
    var showRemoved = state.isAdmin && $('showRemoved').checked;
    var list = state.members.filter(function (m) { return m.active || showRemoved; }).sort(byName)
      .filter(function (m) { return !q || (m.name + ' ' + m.phone + ' ' + m.email).toLowerCase().indexOf(q) >= 0; });
    $('memberCount').textContent = activeMembers().length + ' active members';
    if (!list.length) {
      $('memberList').innerHTML = '<div class="empty">' + (state.members.length ? 'No members match.' : 'No members yet.' + (state.isAdmin ? ' Add them with “+ Add member” or “Add many”.' : '')) + '</div>';
      return;
    }
    $('memberList').innerHTML = list.map(function (m) {
      var sub = [m.phone, state.isAdmin ? m.email : ''].filter(String).join(' · ');
      var btns = '';
      if (state.isAdmin) {
        btns = m.active
          ? '<button class="small" data-act="edit">Edit</button><button class="small danger" data-act="remove">Remove</button>'
          : '<button class="small" data-act="restore">Restore</button><button class="small danger" data-act="purge">Delete forever</button>';
      }
      return '<div class="member" data-id="' + esc(m.id) + '"><div class="name"><div>' + esc(m.name) +
        (m.active ? '' : ' <span class="pill off">removed</span>') + '</div>' +
        (sub ? '<div class="muted">' + esc(sub) + '</div>' : '') + '</div>' + btns + '</div>';
    }).join('');
    $('memberList').querySelectorAll('button[data-act]').forEach(function (b) {
      b.onclick = function () {
        var id = b.closest('.member').getAttribute('data-id');
        var m = state.members.filter(function (x) { return x.id === id; })[0];
        var act = b.getAttribute('data-act');
        if (act === 'edit') memberForm(m);
        if (act === 'remove') confirmBox('Remove ' + m.name + '?', 'They will no longer appear when marking attendance. Their past attendance is kept, and you can restore them later.', 'Remove')
          .then(function () { call('removeMember', state.token, id, false).then(function () { toast('Member removed'); load(); }); });
        if (act === 'restore') call('restoreMember', state.token, id).then(function () { toast('Member restored'); load(); });
        if (act === 'purge') confirmBox('Delete ' + m.name + ' forever?', 'This also deletes all their past attendance. This cannot be undone.', 'Delete forever')
          .then(function () { call('removeMember', state.token, id, true).then(function () { toast('Member deleted'); load(); }); });
      };
    });
  }
  function memberForm(m) {
    m = m || { name: '', phone: '', email: '', notes: '' };
    modal('<h2>' + (m.id ? 'Edit member' : 'Add member') + '</h2><form id="mForm">' +
      '<label>Name</label><input id="mName" required maxlength="100" value="' + esc(m.name) + '">' +
      '<label>Phone (optional)</label><input id="mPhone" maxlength="30" value="' + esc(m.phone) + '">' +
      '<label>Email (optional)</label><input id="mEmail" type="email" maxlength="100" value="' + esc(m.email) + '">' +
      '<label>Notes (optional)</label><textarea id="mNotes" maxlength="500">' + esc(m.notes) + '</textarea>' +
      '<div class="actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save</button></div></form>',
      function () {
        $('mForm').onsubmit = function (e) {
          e.preventDefault();
          call('saveMember', state.token, { id: m.id, name: $('mName').value, phone: $('mPhone').value, email: $('mEmail').value, notes: $('mNotes').value, active: true })
            .then(function () { closeModal(); toast('Member saved'); load(); });
        };
      });
  }
  $('newMemberBtn').onclick = function () { memberForm(); };
  $('bulkBtn').onclick = function () {
    modal('<h2>Add many members</h2><div class="muted">One member per line. You can add a phone after a comma, e.g. <b>Ravi Patel, 9876543210</b>. Names that already exist are skipped.</div>' +
      '<form id="bForm"><textarea id="bText" style="min-height:200px;margin-top:10px"></textarea>' +
      '<div class="actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Add</button></div></form>',
      function () {
        $('bForm').onsubmit = function (e) {
          e.preventDefault();
          call('addMembersBulk', state.token, $('bText').value).then(function (n) { closeModal(); toast(n + ' member(s) added'); load(); });
        };
      });
  };

  /* ---------- export ---------- */
  document.querySelectorAll('[data-range]').forEach(function (b) {
    b.onclick = function () {
      var now = new Date(), r = b.getAttribute('data-range'), from = '', to = '';
      if (r === 'month') { from = iso(new Date(now.getFullYear(), now.getMonth(), 1)); to = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)); }
      if (r === '3m') { from = iso(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())); to = iso(now); }
      if (r === 'year') { from = now.getFullYear() + '-01-01'; to = now.getFullYear() + '-12-31'; }
      $('fromDate').value = from; $('toDate').value = to;
      runReport();
    };
  });
  $('previewBtn').onclick = runReport;
  function runReport() {
    var from = $('fromDate').value, to = $('toDate').value;
    if (from && to && from > to) { toast('“From” date is after “To” date', true); return; }
    call('getAttendanceReport', from, to, $('incRemoved').checked, state.token).then(function (rep) {
      state.report = { rows: rep.rows, from: from, to: to };
      $('reportInfo').textContent = rep.eventCount + ' event(s), ' + rep.memberCount + ' member(s)' +
        (from || to ? ' · ' + (from ? fmtDate(from) : 'start') + ' to ' + (to ? fmtDate(to) : 'today') : ' · all time');
      $('csvBtn').disabled = !rep.eventCount;
      $('reportWrap').classList.toggle('hidden', !rep.eventCount);
      if (!rep.eventCount) { $('reportTable').innerHTML = ''; return; }
      var rows = rep.rows;
      $('reportTable').innerHTML = '<thead><tr>' + rows[0].map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.slice(1).map(function (r) {
          return '<tr>' + r.map(function (c) { return '<td class="' + (c === 'P' || c === 'A' ? c : '') + '">' + esc(c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody>';
    });
  }
  $('csvBtn').onclick = function () {
    var r = state.report; if (!r) return;
    var csv = r.rows.map(function (row) {
      return row.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',');
    }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'attendance_' + (r.from || 'start') + '_to_' + (r.to || 'today') + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };

  /* ---------- start ---------- */
  // Errors are already shown as a toast by call(); don't log them twice.
  window.addEventListener('unhandledrejection', function (e) { e.preventDefault(); });
  applyRoleVisibility();
  var saved = store('ssyg_token');
  if (saved) {
    call('checkSession', saved).then(function (ok) { if (ok) { setAdmin(saved); load(); } else store('ssyg_token', null); });
  }
  load().then(function () { started = true; }, function () { started = true; });
})();
