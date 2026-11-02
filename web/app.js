(function () {
  'use strict';

  /* ================= icons ================= */
  var ICONS = {
    calendar: '<path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
    users: '<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.87M15.5 3.63a3.5 3.5 0 0 1 0 6.74"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
    undo: '<path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>',
    selectAll: '<path d="M4 12.5l4 4L18 6.5M10 18.5l1 1L21 9.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    clear: '<circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/>'
  };
  function icon(name, size) {
    var s = size || 22;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  /* ================= state ================= */
  var state = {
    token: null, isAdmin: false, loaded: false,
    members: [], events: [],
    view: 'events', currentEvent: null,
    present: {}, saved: {}, attFilter: 'all',
    showRemoved: false, report: null, range: 'all', catFilter: '',
    memberSort: store('ssyg_msort') || 'name', eventSort: store('ssyg_esort') || 'new'
  };

  /* ================= helpers ================= */
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function parseDate(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fmtDate(s) {
    var d = parseDate(s); if (isNaN(d)) return s || '';
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function relDay(s) {
    var d = parseDate(s); if (isNaN(d)) return '';
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var diff = Math.round((d - t) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    return '';
  }

  var AV_COLORS = ['#1e2a78', '#0891b2', '#7c3aed', '#16a34a', '#db2777', '#ca8a04', '#2563eb', '#dc2626', '#0d9488', '#9333ea'];
  function avatar(name) {
    var parts = String(name).trim().split(/\s+/);
    var ini = ((parts[0] || '')[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return '<span class="avatar" style="background:' + AV_COLORS[h % AV_COLORS.length] + '">' + esc(ini.toUpperCase()) + '</span>';
  }
  function byName(a, b) { return a.name.localeCompare(b.name); }
  function activeMembers() { return state.members.filter(function (m) { return m.active; }).sort(byName); }
  function findMember(id) { return state.members.filter(function (m) { return m.id === id; })[0]; }
  function findEvent(id) { return state.events.filter(function (e) { return e.id === id; })[0]; }
  function categories() {
    var seen = {}, out = [];
    state.events.forEach(function (e) { var c = e.category; if (c && !seen[c.toLowerCase()]) { seen[c.toLowerCase()] = 1; out.push(c); } });
    return out.sort(function (a, b) { return a.localeCompare(b); });
  }
  function catChips(boxId, current, onPick) {
    var cats = categories(), box = $(boxId);
    if (!cats.length) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    if (current && cats.indexOf(current) < 0) current = '';
    box.classList.remove('hidden');
    box.innerHTML = '<button data-c=""' + (current ? '' : ' class="on"') + '>All</button>' + cats.map(function (c) {
      return '<button data-c="' + esc(c) + '"' + (c === current ? ' class="on"' : '') + '>' + esc(c) + '</button>';
    }).join('');
    box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { onPick(b.getAttribute('data-c')); }; });
    return current;
  }
  function emptyBox(ico, title, text) {
    return '<div class="empty"><div class="em-ico">' + icon(ico, 26) + '</div><b>' + esc(title) + '</b>' + esc(text || '') + '</div>';
  }

  /* ================= API ================= */
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
      if (msg === 'Failed to fetch' || msg.indexOf('NetworkError') >= 0 || msg.indexOf('Load failed') >= 0) msg = 'Could not reach the server. Check your internet.';
      if (msg.indexOf('SESSION_EXPIRED') >= 0) { setAdmin(null); msg = 'Admin login expired. Please log in again.'; }
      toast(msg, true); throw e;
    });
  }

  var toastTimer;
  function toast(msg, isErr) {
    var t = $('toast'); t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast hidden'; }, isErr ? 4500 : 2200);
  }

  /* ================= bottom sheet ================= */
  function sheet(html, onReady) {
    var root = $('sheetRoot');
    root.innerHTML = '<div class="overlay"><div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>' + html + '</div></div>';
    var ov = root.firstChild;
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
    root.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = closeSheet; });
    if (onReady) onReady(root);
  }
  function closeSheet() { $('sheetRoot').innerHTML = ''; }
  function confirmSheet(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      sheet('<h2>' + esc(title) + '</h2><p class="sub">' + esc(text) + '</p>' +
        '<div class="sheet-actions"><button class="btn" data-close>Cancel</button><button class="btn ' + (danger ? 'danger' : 'primary') + '" id="cOk">' + esc(okLabel || 'OK') + '</button></div>',
        function () { $('cOk').onclick = function () { closeSheet(); resolve(true); }; });
    });
  }
  function busy(btn, on) {
    if (!btn) return;
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Saving…'; }
    else if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }

  /* ================= auth ================= */
  function setAdmin(token) {
    state.token = token; state.isAdmin = !!token;
    store('ssyg_token', token || null);
    var sub = $('appSub');
    sub.className = 'appbar-sub' + (state.isAdmin ? ' admin' : '');
    sub.innerHTML = '<span class="dot"></span>' + (state.isAdmin ? 'Logged in · can edit' : 'Viewing');
    $('authBtn').setAttribute('aria-label', state.isAdmin ? 'Log out' : 'Login to edit');
    $('authBtn').title = state.isAdmin ? 'Log out' : 'Login to edit';
    $('authBtn').innerHTML = state.isAdmin ? icon('logout', 17) + '<span>Log out</span>' : icon('lock', 17) + '<span>Login</span>';
    document.querySelectorAll('.admin-only').forEach(function (el) { el.classList.toggle('hidden', !state.isAdmin); });
    render();
  }
  $('authBtn').onclick = function () {
    if (state.isAdmin) {
      confirmSheet('Log out of admin?', 'You will still be able to view everything.', 'Log out').then(function () {
        call('logout', state.token).catch(function () {}); setAdmin(null); load(); toast('Logged out');
      });
      return;
    }
    sheet('<h2>Login to edit</h2><p class="sub">Log in to add members and events and mark attendance. Viewing doesn’t need a login.</p>' +
      '<form id="loginForm"><label class="field"><span>Password</span><input type="password" id="pw" autocomplete="current-password" required></label>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary" type="submit" id="loginBtn">Log in</button></div></form>',
      function () {
        setTimeout(function () { $('pw').focus(); }, 250);
        $('loginForm').onsubmit = function (e) {
          e.preventDefault();
          var b = $('loginBtn'); busy(b, true);
          call('login', $('pw').value).then(function (tok) {
            closeSheet(); setAdmin(tok); load(); toast('Welcome, admin');
          }, function () { busy(b, false); $('pw').select(); });
        };
      });
  };

  /* ================= navigation ================= */
  document.querySelectorAll('#tabbar button').forEach(function (b) {
    b.onclick = function () { if (leaveCheck()) go(b.getAttribute('data-tab')); };
  });
  $('backBtn').innerHTML = icon('back');
  $('backBtn').onclick = function () { history.back(); };
  window.addEventListener('popstate', function () {
    if (state.view === 'event') {
      if (!leaveCheck()) { history.pushState({ v: 'event' }, ''); return; }
      go('events', true);
    }
  });

  function go(view, fromPop) {
    if (view === 'event' && !fromPop) history.pushState({ v: 'event' }, '');
    if (state.view === 'event' && view !== 'event' && !fromPop && history.state && history.state.v === 'event') {
      history.replaceState(null, '');
    }
    state.view = view;
    ['events', 'event', 'members', 'reports'].forEach(function (v) { $('view-' + v).classList.toggle('hidden', v !== view); });
    document.querySelectorAll('#tabbar button').forEach(function (b) {
      var t = b.getAttribute('data-tab'); b.classList.toggle('on', t === view || (view === 'event' && t === 'events'));
    });
    var inEvent = view === 'event';
    $('backBtn').classList.toggle('hidden', !inEvent);
    $('tabbar').classList.toggle('hidden', inEvent && state.isAdmin);
    render();
    window.scrollTo(0, 0);
  }
  function isDirty() {
    if (state.view !== 'event' || !state.isAdmin) return false;
    var a = Object.keys(state.present), b = Object.keys(state.saved);
    if (a.length !== b.length) return true;
    return a.some(function (k) { return !state.saved[k]; });
  }
  function leaveCheck() {
    if (isDirty() && !window.confirm('You have unsaved attendance. Leave without saving?')) return false;
    return true;
  }
  window.addEventListener('beforeunload', function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

  function render() {
    if (state.view === 'events') renderEvents();
    if (state.view === 'event') renderEvent();
    if (state.view === 'members') renderMembers();
    if (state.view === 'reports') renderReportsChrome();
    renderFab();
    renderActionbar();
  }

  function renderFab() {
    var fab = $('fab');
    var show = state.isAdmin && (state.view === 'events' || state.view === 'members');
    fab.classList.toggle('hidden', !show);
    if (!show) return;
    fab.innerHTML = icon('plus', 22) + '<span>' + (state.view === 'events' ? 'New event' : 'Add member') + '</span>';
    fab.onclick = state.view === 'events' ? function () { eventForm(); } : function () { memberForm(); };
  }

  /* ================= data ================= */
  function load() {
    return call('getAppData', state.token).then(function (d) {
      state.members = d.members; state.events = d.events; state.loaded = true;
      if (d.title) { $('appTitle').textContent = d.title; document.title = d.title; }
      render();
    });
  }

  /* ================= events ================= */
  $('eventSearch').oninput = renderEvents;
  var EVENT_SORTS = { new: 'Newest', old: 'Oldest', most: 'Most attended' };
  function renderEvents() {
    var total = activeMembers().length;
    var evs = state.events;
    // stats
    var now = new Date(), monthKey = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    var thisMonth = evs.filter(function (e) { return e.date.slice(0, 7) === monthKey; }).length;
    var recent = evs.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .filter(function (e) { return e.date <= iso(now); }).slice(0, 5);
    var avg = recent.length && total ? Math.round(recent.reduce(function (s, e) { return s + Math.min(e.presentCount, total); }, 0) / (recent.length * total) * 100) : null;
    $('stats').innerHTML = !state.loaded ? '' :
      '<div class="stat"><div class="v">' + total + '</div><div class="l">Members</div></div>' +
      '<div class="stat"><div class="v">' + thisMonth + '</div><div class="l">Events this month</div></div>' +
      '<div class="stat accent"><div class="v">' + (avg == null ? '–' : avg + '%') + '</div><div class="l">Avg. attendance</div></div>';

    if (!state.loaded) { $('eventList').innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>'; return; }
    state.catFilter = catChips('eventCats', state.catFilter, function (c) { state.catFilter = c; renderEvents(); }) || '';
    var q = $('eventSearch').value.trim().toLowerCase();
    sortChips('eventSort', EVENT_SORTS, state.eventSort, function (k) { state.eventSort = k; store('ssyg_esort', k); renderEvents(); });
    var es = state.eventSort;
    var list = evs.slice().sort(function (a, b) {
      if (es === 'most') return b.presentCount - a.presentCount || (a.date < b.date ? 1 : -1);
      if (es === 'old') return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    })
      .filter(function (e) { return !state.catFilter || e.category === state.catFilter; })
      .filter(function (e) { return !q || (e.name + ' ' + e.description + ' ' + (e.category || '') + ' ' + fmtDate(e.date)).toLowerCase().indexOf(q) >= 0; });
    if (!list.length) {
      $('eventList').innerHTML = evs.length ? emptyBox('search', 'No matches', 'Try a different search.')
        : state.catFilter ? emptyBox('search', 'No events', 'No events in this category.')
        : emptyBox('calendar', 'No events yet', state.isAdmin ? 'Tap “New event” to create the first one.' : 'Events will show up here.');
      return;
    }
    var html = '', lastMonth = '';
    list.forEach(function (e) {
      var d = parseDate(e.date), mk = isNaN(d) ? '' : MONTHS_FULL[d.getMonth()] + ' ' + d.getFullYear();
      if (es === 'most' && !html) html += '<div class="month-title">Most attended first</div>';
      if (es !== 'most' && mk !== lastMonth) { html += '<div class="month-title">' + esc(mk) + '</div>'; lastMonth = mk; }
      var pct = total ? Math.min(100, Math.round(e.presentCount / total * 100)) : 0;
      var rel = relDay(e.date);
      html += '<button class="ev-card" data-id="' + esc(e.id) + '">' +
        '<div class="dtile"><div class="d">' + (isNaN(d) ? '?' : d.getDate()) + '</div><div class="w">' + (isNaN(d) ? '' : DAYS[d.getDay()]) + '</div></div>' +
        '<div class="ev-body">' + (e.category ? '<span class="cat-tag">' + esc(e.category) + '</span>' : '') + '<div class="ev-name">' + esc(e.name) + '</div>' +
        '<div class="ev-desc">' + esc(rel ? rel + (e.description ? ' · ' + e.description : '') : (e.description || fmtDate(e.date))) + '</div>' +
        '<div class="ev-meta"><div class="bar"><span style="width:' + pct + '%"></span></div><span>' + e.presentCount + ' present</span></div></div>' +
        '<span class="chev">' + icon('chev', 18) + '</span></button>';
    });
    $('eventList').innerHTML = html;
    $('eventList').querySelectorAll('.ev-card').forEach(function (el) {
      el.onclick = function () { openEvent(el.getAttribute('data-id')); };
    });
  }

  function eventForm(ev) {
    var isNew = !ev;
    ev = ev || { date: iso(new Date()), name: '', description: '', category: state.catFilter || '' };
    var cats = categories();
    sheet('<h2>' + (isNew ? 'New event' : 'Edit event') + '</h2><p class="sub">' + (isNew ? 'After saving you can mark who was present.' : 'Update the event details.') + '</p>' +
      '<form id="evForm">' +
      '<label class="field"><span>Event name</span><input id="fName" required maxlength="120" value="' + esc(ev.name) + '" placeholder="e.g. Weekly sabha" autocomplete="off"></label>' +
      '<label class="field"><span>Date</span><input type="date" id="fDate" required value="' + esc(ev.date) + '"></label>' +
      '<label class="field"><span>Category (optional)</span><input id="fCat" maxlength="60" list="catList" value="' + esc(ev.category || '') + '" placeholder="e.g. Sandhya Bhakti, Shibir, Seva" autocomplete="off">' +
      '<datalist id="catList">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></label>' +
      (cats.length ? '<div class="chips cat-pick" id="catPick">' + cats.map(function (c) { return '<button type="button" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="field"><span>Description (optional)</span><textarea id="fDesc" maxlength="1000" placeholder="Venue, topic, notes…">' + esc(ev.description) + '</textarea></label>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary" type="submit" id="evSave">' + (isNew ? 'Create' : 'Save') + '</button></div>' +
      (isNew ? '' : '<button type="button" class="menu-item danger" id="evDel" style="justify-content:center;margin-top:10px">' + icon('trash', 20) + 'Delete event</button>') +
      '</form>',
      function () {
        var markPick = function () {
          var v = $('fCat').value.trim();
          document.querySelectorAll('#catPick button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-c') === v); });
        };
        document.querySelectorAll('#catPick button').forEach(function (b) {
          b.onclick = function () { var c = b.getAttribute('data-c'); $('fCat').value = $('fCat').value.trim() === c ? '' : c; markPick(); };
        });
        $('fCat').oninput = markPick; markPick();
        $('evForm').onsubmit = function (e) {
          e.preventDefault();
          var b = $('evSave'); busy(b, true);
          var data = { id: ev.id, date: $('fDate').value, name: $('fName').value, description: $('fDesc').value, category: $('fCat').value };
          call('saveEvent', state.token, data).then(function (id) {
            closeSheet(); toast(isNew ? 'Event created' : 'Event updated');
            return load().then(function () { if (isNew) openEvent(id); });
          }, function () { busy(b, false); });
        };
        if (!isNew) $('evDel').onclick = function () {
          confirmSheet('Delete “' + ev.name + '”?', 'This deletes the event and its attendance. It cannot be undone.', 'Delete', true).then(function () {
            call('deleteEvent', state.token, ev.id).then(function () {
              state.present = {}; state.saved = {}; toast('Event deleted'); history.back(); load();
            });
          });
        };
      });
  }

  /* ================= event detail / marking ================= */
  function openEvent(id) {
    var ev = findEvent(id); if (!ev) return;
    state.currentEvent = ev; state.present = {}; state.saved = {}; state.attFilter = 'all'; state.attLoading = true;
    $('attSearch').value = '';
    document.querySelectorAll('#attFilter button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-f') === 'all'); });
    go('event');
    call('getEventAttendance', id).then(function (ids) {
      state.present = {}; state.saved = {};
      ids.forEach(function (m) { state.present[m] = true; state.saved[m] = true; });
      state.attLoading = false; render();
    }, function () { state.attLoading = false; render(); });
  }
  $('editEventBtn').onclick = function () { eventForm(state.currentEvent); };
  $('attSearch').oninput = renderEvent;
  document.querySelectorAll('#attFilter button').forEach(function (b) {
    b.onclick = function () {
      state.attFilter = b.getAttribute('data-f');
      document.querySelectorAll('#attFilter button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderEvent();
    };
  });

  function attMembers() {
    // Active members, plus removed members who were present (keeps history visible)
    var list = state.members.filter(function (m) { return m.active || state.present[m.id]; }).sort(byName);
    if (!state.isAdmin) return list.filter(function (m) { return state.present[m.id]; });
    if (state.attFilter === 'present') list = list.filter(function (m) { return state.present[m.id]; });
    if (state.attFilter === 'absent') list = list.filter(function (m) { return !state.present[m.id]; });
    return list;
  }
  function visibleAttMembers() {
    var q = $('attSearch').value.trim().toLowerCase();
    return attMembers().filter(function (m) { return !q || m.name.toLowerCase().indexOf(q) >= 0; });
  }
  function presentCount() { return Object.keys(state.present).length; }

  function renderEventHero() {
    var ev = state.currentEvent; if (!ev) return;
    var total = activeMembers().length, n = presentCount();
    var rel = relDay(ev.date);
    $('evDate').textContent = (rel ? rel + ' · ' : '') + fmtDate(ev.date);
    $('evCat').textContent = ev.category || '';
    $('evCat').classList.toggle('hidden', !ev.category);
    $('evName').textContent = ev.name;
    $('evDesc').textContent = ev.description || '';
    $('evPresent').textContent = n;
    $('evOf').textContent = 'of ' + total + ' present';
    $('evBar').style.width = (total ? Math.min(100, n / total * 100) : 0) + '%';
  }
  function renderEvent() {
    if (!state.currentEvent) return;
    state.currentEvent = findEvent(state.currentEvent.id) || state.currentEvent;
    renderEventHero();
    var box = $('attList');
    if (state.attLoading) { box.innerHTML = '<div class="skel" style="margin:0;border-radius:0"></div>'; return; }
    var list = visibleAttMembers();
    if (!list.length) {
      box.innerHTML = '';
      var msg = !state.isAdmin ? emptyBox('users', 'No attendance yet', 'Nobody has been marked present for this event.')
        : !state.members.length ? emptyBox('users', 'No members yet', 'Add members in the Members tab first.')
        : emptyBox('search', 'Nobody here', 'No members match this filter.');
      box.innerHTML = '<div>' + msg + '</div>';
      return;
    }
    if (state.isAdmin) {
      box.innerHTML = list.map(function (m) {
        var on = !!state.present[m.id];
        return '<button class="item mark' + (on ? ' on' : '') + '" data-id="' + esc(m.id) + '" aria-pressed="' + on + '">' + avatar(m.name) +
          '<div class="item-body"><div class="item-name">' + esc(m.name) + '</div>' +
          (m.active ? '' : '<div class="item-sub">Removed member</div>') + '</div>' +
          '<span class="tick">' + icon('check', 18) + '</span></button>';
      }).join('');
      box.querySelectorAll('.mark').forEach(function (row) {
        row.onclick = function () {
          var id = row.getAttribute('data-id');
          if (state.present[id]) delete state.present[id]; else state.present[id] = true;
          var on = !!state.present[id];
          row.classList.toggle('on', on); row.setAttribute('aria-pressed', on);
          buzz();
          // In Present/Absent filters keep the row until the next re-render so it doesn't jump away under the finger
          renderEventHero(); renderActionbar();
        };
      });
    } else {
      box.innerHTML = list.map(function (m) {
        return '<div class="item">' + avatar(m.name) + '<div class="item-body"><div class="item-name">' + esc(m.name) + '</div></div><span class="tag">Present</span></div>';
      }).join('');
    }
  }

  function renderActionbar() {
    var bar = $('actionbar');
    var show = state.view === 'event' && state.isAdmin;
    bar.classList.toggle('hidden', !show);
    $('tabbar').classList.toggle('hidden', show);
    if (!show) return;
    var n = presentCount(), total = activeMembers().length, dirty = isDirty();
    bar.innerHTML = '<div class="actionbar-inner">' +
      '<button class="btn more" id="moreBtn" aria-label="More options">' + icon('dots') + '</button>' +
      '<div class="info"><b>' + n + '</b> <span style="color:var(--muted);font-weight:600">/ ' + total + '</span>' +
      '<div class="' + (dirty ? 'unsaved' : '') + '">' + (dirty ? 'Unsaved changes' : 'All saved') + '</div></div>' +
      '<button class="btn ' + (dirty ? 'ok' : '') + '" id="saveAttBtn"' + (dirty ? '' : ' disabled') + '>' + icon('check', 20) + 'Save</button></div>';
    $('saveAttBtn').onclick = saveAttendance;
    $('moreBtn').onclick = function () {
      sheet('<h2>Quick actions</h2><p class="sub">Applies to the members shown in the list.</p>' +
        '<button class="menu-item" id="qAll">' + icon('selectAll') + 'Mark all present</button>' +
        '<button class="menu-item" id="qNone">' + icon('clear') + 'Clear all</button>' +
        '<button class="menu-item" id="qUndo"' + (dirty ? '' : ' disabled style="opacity:.4"') + '>' + icon('undo') + 'Undo unsaved changes</button>' +
        '<button class="menu-item" id="qEdit">' + icon('edit') + 'Edit event details</button>',
        function () {
          $('qAll').onclick = function () { visibleAttMembers().forEach(function (m) { state.present[m.id] = true; }); closeSheet(); render(); };
          $('qNone').onclick = function () { visibleAttMembers().forEach(function (m) { delete state.present[m.id]; }); closeSheet(); render(); };
          $('qUndo').onclick = function () { if (!isDirty()) return; state.present = Object.assign({}, state.saved); closeSheet(); render(); };
          $('qEdit').onclick = function () { closeSheet(); eventForm(state.currentEvent); };
        });
    };
  }
  function saveAttendance() {
    var ev = state.currentEvent, ids = Object.keys(state.present), b = $('saveAttBtn');
    busy(b, true);
    call('saveAttendance', state.token, ev.id, ids).then(function (n) {
      state.saved = Object.assign({}, state.present);
      toast('Saved · ' + n + ' present');
      ev.presentCount = n; render(); load();
    }, function () { busy(b, false); });
  }

  /* ================= members ================= */
  $('memberSearch').oninput = renderMembers;
  $('showRemovedBtn').onclick = function () { state.showRemoved = !state.showRemoved; renderMembers(); };
  function memberPct(m) { var n = state.events.length; return n ? Math.round((m.attended || 0) / n * 100) : 0; }
  function memberRow(m) {
    var pct = memberPct(m);
    var sub = state.isAdmin ? [m.phone, m.email].filter(String).join(' · ') : '';
    var tag = m.active ? '' : '<span class="tag off">Removed</span>';
    return '<button class="item" data-id="' + esc(m.id) + '">' + avatar(m.name) +
      '<div class="item-body"><div class="item-name">' + esc(m.name) + '</div>' +
      '<div class="item-sub">' + (sub ? esc(sub) + ' · ' : '') + pct + '% attendance</div>' +
      '<div class="bar mini-bar"><span style="width:' + pct + '%"></span></div></div>' + tag +
      '<div class="count-pill"><b>' + (m.attended || 0) + '</b><span>events</span></div></button>';
  }
  var MEMBER_SORTS = { name: 'A–Z', most: 'Most attended', least: 'Least attended' };
  function sortMembers(list) {
    var by = state.memberSort;
    return list.slice().sort(function (a, b) {
      if (by === 'most') return (b.attended || 0) - (a.attended || 0) || byName(a, b);
      if (by === 'least') return (a.attended || 0) - (b.attended || 0) || byName(a, b);
      return byName(a, b);
    });
  }
  function sortChips(boxId, opts, current, onPick) {
    $(boxId).innerHTML = Object.keys(opts).map(function (k) {
      return '<button data-s="' + k + '"' + (k === current ? ' class="on"' : '') + '>' + esc(opts[k]) + '</button>';
    }).join('');
    $(boxId).querySelectorAll('button').forEach(function (b) { b.onclick = function () { onPick(b.getAttribute('data-s')); }; });
  }
  function renderMembers() {
    if (!state.loaded) { $('memberList').innerHTML = '<div class="skel" style="margin:0"></div>'; return; }
    var q = $('memberSearch').value.trim().toLowerCase();
    var match = function (m) { return !q || (m.name + ' ' + (m.phone || '') + ' ' + (m.email || '')).toLowerCase().indexOf(q) >= 0; };
    var active = activeMembers();
    var removed = state.members.filter(function (m) { return !m.active; }).sort(byName);
    $('memberCount').textContent = active.length + ' member' + (active.length === 1 ? '' : 's');
    sortChips('memberSort', MEMBER_SORTS, state.memberSort, function (k) { state.memberSort = k; store('ssyg_msort', k); renderMembers(); });
    var list = sortMembers(active.filter(match));
    $('memberList').innerHTML = list.length ? list.map(memberRow).join('') : '';
    if (!list.length) {
      $('memberList').innerHTML = '<div>' + (active.length ? emptyBox('search', 'No matches', 'Try a different name.')
        : emptyBox('users', 'No members yet', state.isAdmin ? 'Tap “Add member”, or “Paste list” to add everyone at once.' : 'Members will show up here.')) + '</div>';
    }
    var showToggle = state.isAdmin && removed.length;
    document.querySelector('.removed-toggle').classList.toggle('hidden', !showToggle);
    $('showRemovedBtn').textContent = (state.showRemoved ? 'Hide' : 'Show') + ' removed members (' + removed.length + ')';
    var rl = sortMembers(removed.filter(match));
    $('removedList').classList.toggle('hidden', !(showToggle && state.showRemoved && rl.length));
    $('removedList').innerHTML = rl.map(memberRow).join('');
    document.querySelectorAll('#memberList button.item, #removedList button.item').forEach(function (b) {
      b.onclick = function () { var m = findMember(b.getAttribute('data-id')); if (m) memberDetail(m); };
    });
  }
  function memberDetail(m) {
    var n = state.events.length, pct = memberPct(m);
    sheet('<div class="md-head">' + avatar(m.name) + '<div><h2>' + esc(m.name) + '</h2><p class="sub" style="margin:0">' +
      (m.active ? 'Member' : 'Removed member') + (state.isAdmin && m.phone ? ' · ' + esc(m.phone) : '') + '</p></div></div>' +
      '<div class="stats" style="margin:16px 0 12px"><div class="stat"><div class="v">' + (m.attended || 0) + '</div><div class="l">Attended</div></div>' +
      '<div class="stat"><div class="v">' + n + '</div><div class="l">Total events</div></div>' +
      '<div class="stat accent"><div class="v">' + pct + '%</div><div class="l">Attendance</div></div></div>' +
      '<div class="section-title" style="margin:6px 2px 8px">Events attended</div>' +
      '<div class="list md-list" id="mdList"><div class="skel" style="margin:0;border-radius:0;height:64px"></div></div>' +
      '<div class="sheet-actions" style="margin-top:14px"><button class="btn" data-close>Close</button>' +
      (state.isAdmin ? '<button class="btn primary" id="mdEdit">' + icon('edit', 18) + 'Edit</button>' : '') + '</div>',
      function () {
        if ($('mdEdit')) $('mdEdit').onclick = function () { memberForm(m); };
        call('getMemberAttendance', m.id).then(function (ids) {
          var box = $('mdList'); if (!box) return;
          var evs = ids.map(findEvent).filter(Boolean).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
          if (!evs.length) { box.innerHTML = '<div>' + emptyBox('calendar', 'No events yet', 'No attendance recorded for ' + m.name + '.') + '</div>'; return; }
          box.innerHTML = evs.map(function (e) {
            var d = parseDate(e.date);
            return '<button class="item md-ev" data-id="' + esc(e.id) + '"><div class="dtile sm"><div class="d">' + d.getDate() + '</div><div class="w">' + MONTHS[d.getMonth()] + '</div></div>' +
              '<div class="item-body"><div class="item-name">' + esc(e.name) + '</div><div class="item-sub">' + esc(fmtDate(e.date)) + (e.category ? ' · ' + esc(e.category) : '') + '</div></div></button>';
          }).join('');
          box.querySelectorAll('.md-ev').forEach(function (b) {
            b.onclick = function () { closeSheet(); openEvent(b.getAttribute('data-id')); };
          });
        }, function () { var box = $('mdList'); if (box) box.innerHTML = ''; });
      });
  }
  function memberForm(m) {
    var isNew = !m;
    m = m || { name: '', phone: '', email: '', notes: '', active: true };
    var extra = '';
    if (!isNew) {
      extra = m.active
        ? '<button type="button" class="menu-item danger" id="mRemove" style="justify-content:center;margin-top:10px">' + icon('trash', 20) + 'Remove member</button>'
        : '<button type="button" class="menu-item" id="mRestore" style="justify-content:center;margin-top:10px">' + icon('undo', 20) + 'Restore member</button>' +
          '<button type="button" class="menu-item danger" id="mPurge" style="justify-content:center">' + icon('trash', 20) + 'Delete forever</button>';
    }
    sheet('<h2>' + (isNew ? 'Add member' : esc(m.name)) + '</h2><p class="sub">' + (isNew ? 'Only the name is required.' : (m.active ? 'Edit details' : 'This member was removed.')) + '</p>' +
      '<form id="mForm">' +
      '<label class="field"><span>Full name</span><input id="mName" required maxlength="100" value="' + esc(m.name) + '" autocomplete="off"></label>' +
      '<label class="field"><span>Phone (optional)</span><input id="mPhone" type="tel" inputmode="tel" maxlength="30" value="' + esc(m.phone) + '"></label>' +
      '<label class="field"><span>Email (optional)</span><input id="mEmail" type="email" inputmode="email" maxlength="100" value="' + esc(m.email) + '"></label>' +
      '<label class="field"><span>Notes (optional)</span><textarea id="mNotes" maxlength="500">' + esc(m.notes) + '</textarea></label>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary" type="submit" id="mSave">' + (isNew ? 'Add' : 'Save') + '</button></div>' +
      extra + '</form>',
      function () {
        if (isNew) setTimeout(function () { $('mName').focus(); }, 250);
        $('mForm').onsubmit = function (e) {
          e.preventDefault();
          var b = $('mSave'); busy(b, true);
          call('saveMember', state.token, { id: m.id, name: $('mName').value, phone: $('mPhone').value, email: $('mEmail').value, notes: $('mNotes').value, active: m.active !== false })
            .then(function () { closeSheet(); toast(isNew ? 'Member added' : 'Saved'); load(); }, function () { busy(b, false); });
        };
        if ($('mRemove')) $('mRemove').onclick = function () {
          confirmSheet('Remove ' + m.name + '?', 'They won’t appear when marking attendance. Past attendance is kept and you can restore them anytime.', 'Remove', true)
            .then(function () { call('removeMember', state.token, m.id, false).then(function () { toast('Member removed'); load(); }); });
        };
        if ($('mRestore')) $('mRestore').onclick = function () {
          closeSheet(); call('restoreMember', state.token, m.id).then(function () { toast('Member restored'); load(); });
        };
        if ($('mPurge')) $('mPurge').onclick = function () {
          confirmSheet('Delete ' + m.name + ' forever?', 'This also deletes all their past attendance. It cannot be undone.', 'Delete forever', true)
            .then(function () { call('removeMember', state.token, m.id, true).then(function () { toast('Member deleted'); load(); }); });
        };
      });
  }
  $('bulkBtn').onclick = function () {
    sheet('<h2>Paste a list</h2><p class="sub">One member per line. Add a phone after a comma if you like:<br><b>Ravi Patel, 9876543210</b><br>Names that already exist are skipped.</p>' +
      '<form id="bForm"><label class="field"><textarea id="bText" style="min-height:220px" placeholder="Asha Shah\nRavi Patel, 9876543210\n…"></textarea></label>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary" type="submit" id="bSave">Add all</button></div></form>',
      function () {
        $('bForm').onsubmit = function (e) {
          e.preventDefault();
          var b = $('bSave'); busy(b, true);
          call('addMembersBulk', state.token, $('bText').value).then(function (n) {
            closeSheet(); toast(n + ' member' + (n === 1 ? '' : 's') + ' added'); load();
          }, function () { busy(b, false); });
        };
      });
  };

  /* ================= reports ================= */
  function setRange(r) {
    var now = new Date(), from = '', to = '';
    if (r === 'month') { from = iso(new Date(now.getFullYear(), now.getMonth(), 1)); to = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)); }
    if (r === 'last') { from = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)); to = iso(new Date(now.getFullYear(), now.getMonth(), 0)); }
    if (r === '3m') { from = iso(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate() + 1)); to = iso(now); }
    if (r === 'year') { from = now.getFullYear() + '-01-01'; to = now.getFullYear() + '-12-31'; }
    $('fromDate').value = from; $('toDate').value = to;
    state.range = r; renderReportsChrome();
  }
  document.querySelectorAll('#rangeChips button').forEach(function (b) {
    b.onclick = function () { setRange(b.getAttribute('data-range')); runReport(); };
  });
  $('fromDate').onchange = $('toDate').onchange = function () { state.range = ''; renderReportsChrome(); };
  $('previewBtn').onclick = runReport;
  $('incRemoved').onchange = function () { if (state.report) runReport(); };
  $('tableBtn').onclick = function () {
    var showTable = $('reportTableWrap').classList.contains('hidden');
    $('reportTableWrap').classList.toggle('hidden', !showTable);
    $('reportList').classList.toggle('hidden', showTable);
    $('tableBtn').textContent = showTable ? 'Summary' : 'Full table';
  };
  function renderReportsChrome() {
    state.repCat = catChips('repCats', state.repCat, function (c) { state.repCat = c; renderReportsChrome(); runReport(); }) || '';
    $('repCatLabel').classList.toggle('hidden', !categories().length);
    document.querySelectorAll('#rangeChips button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-range') === state.range); });
  }
  function runReport() {
    var from = $('fromDate').value, to = $('toDate').value;
    if (from && to && from > to) { toast('“From” is after “To”', true); return; }
    var b = $('previewBtn'); b.disabled = true; b.textContent = 'Loading…';
    var cat = state.repCat || '';
    call('getAttendanceReport', from, to, $('incRemoved').checked, state.token, cat).then(function (rep) {
      b.disabled = false; b.textContent = 'Show report';
      state.report = { rows: rep.rows, from: from, to: to, category: cat };
      showReport(rep);
    }, function () { b.disabled = false; b.textContent = 'Show report'; });
  }
  function showReport(rep) {
    var rows = rep.rows, header = rows[0], body = rows.slice(1, -1);
    var iPresent = header.indexOf('Present'), iPct = header.indexOf('Attendance %');
    var nameCol = 0;
    $('reportOut').classList.remove('hidden');
    var totalPresent = body.reduce(function (s, r) { return s + (+r[iPresent] || 0); }, 0);
    var avg = rep.eventCount && body.length ? Math.round(totalPresent / (rep.eventCount * body.length) * 100) : 0;
    $('reportStats').innerHTML =
      '<div class="stat"><div class="v">' + rep.eventCount + '</div><div class="l">Events</div></div>' +
      '<div class="stat"><div class="v">' + rep.memberCount + '</div><div class="l">Members</div></div>' +
      '<div class="stat accent"><div class="v">' + (rep.eventCount ? avg + '%' : '–') + '</div><div class="l">Avg. attendance</div></div>';
    if (!rep.eventCount) {
      $('reportList').innerHTML = '<div>' + emptyBox('calendar', 'No events in this range', 'Pick a different date range.') + '</div>';
      $('reportTable').innerHTML = '';
      renderActionbarReport(false);
      return;
    }
    var sorted = body.slice().sort(function (a, b) { return (+b[iPresent] || 0) - (+a[iPresent] || 0) || String(a[nameCol]).localeCompare(String(b[nameCol])); });
    $('reportList').innerHTML = sorted.map(function (r) {
      var pct = parseInt(r[iPct], 10) || 0;
      var cls = pct >= 75 ? 'good' : pct >= 40 ? 'mid' : 'low';
      return '<div class="item">' + avatar(String(r[nameCol]).replace(' (removed)', '')) + '<div class="item-body"><div class="item-name">' + esc(r[nameCol]) + '</div>' +
        '<div class="item-sub">' + r[iPresent] + ' of ' + rep.eventCount + ' events</div>' +
        '<div class="bar mini-bar"><span style="width:' + pct + '%"></span></div></div>' +
        '<span class="pct ' + cls + '">' + esc(r[iPct]) + '</span></div>';
    }).join('');
    $('reportTable').innerHTML = '<thead><tr>' + header.map(function (h, i) {
      var label = h;
      var m = /^(\d{4}-\d{2}-\d{2}) (.*)$/.exec(h);
      if (m) { var d = parseDate(m[1]); label = d.getDate() + ' ' + MONTHS[d.getMonth()] + '<br><small style="font-weight:500;color:var(--muted)">' + esc(m[2].slice(0, 14)) + '</small>'; }
      else label = esc(h);
      return '<th>' + label + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.slice(1).map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td class="' + (c === 'P' || c === 'A' ? c : '') + '">' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
    renderActionbarReport(true);
  }
  function renderActionbarReport(canDownload) {
    // Floating download button on the reports view
    var fab = $('fab');
    if (state.view !== 'reports') return;
    fab.classList.toggle('hidden', !canDownload);
    fab.innerHTML = icon('download', 22) + '<span>Download</span>';
    fab.onclick = function () {
      sheet('<h2>Download report</h2><p class="sub">' + esc(rangeLabel(state.report)) + '</p>' +
        '<button class="menu-item" id="dPdf">' + icon('file') + '<span style="flex:1">PDF report<div class="item-sub" style="font-weight:500">Top 5, every member\'s total and %, events list, member-wise events</div></span></button>' +
        '<label class="switch-row" style="padding:10px 4px 4px"><span>Include member-wise events in PDF<div class="item-sub" style="font-weight:500">Each member’s attended events, month by month (adds pages)</div></span><input type="checkbox" id="dMemberEv" class="switch"' + (store('ssyg_pdf_mev') === '0' ? '' : ' checked') + '></label>' +
        '<button class="menu-item" id="dCsv">' + icon('table') + '<span style="flex:1">Excel / CSV<div class="item-sub" style="font-weight:500">Full P/A grid for every event</div></span></button>',
        function () {
          $('dMemberEv').onchange = function () { store('ssyg_pdf_mev', $('dMemberEv').checked ? '1' : '0'); };
          $('dPdf').onclick = function () { var mev = $('dMemberEv').checked; closeSheet(); downloadPdf({ memberEvents: mev }); };
          $('dCsv').onclick = function () { closeSheet(); downloadCsv(); };
        });
    };
  }
  function downloadCsv() {
    var r = state.report; if (!r) return;
    var csv = r.rows.map(function (row) {
      return row.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',');
    }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'SSYG_attendance_' + (r.category ? r.category.replace(/[^\w]+/g, '-') + '_' : '') + (r.from || 'start') + '_to_' + (r.to || iso(new Date())) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    toast('Report downloaded');
  }

  /* ================= PDF report ================= */
  function rangeLabel(r) {
    if (!r) return '';
    var range = !r.from && !r.to ? 'All time' : (r.from ? fmtDate(r.from) : 'Start') + '  to  ' + (r.to ? fmtDate(r.to) : 'Today');
    return range + (r.category ? '  ·  ' + r.category : '');
  }
  var pdfLibs;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res;
      s.onerror = function () { rej(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadPdfLibs() {
    if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable) return Promise.resolve();
    if (!pdfLibs) {
      pdfLibs = loadScript('vendor/jspdf.umd.min.js').then(function () { return loadScript('vendor/jspdf.plugin.autotable.min.js'); });
      pdfLibs.catch(function () { pdfLibs = null; });
    }
    return pdfLibs;
  }
  function logoDataUrl() {
    var img = $('logo');
    if (!img) return Promise.resolve(null);
    if (img.src.indexOf('data:') === 0) return Promise.resolve(img.src);
    return fetch(img.src).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(b); });
    }).catch(function () { return null; });
  }
  /** Turns the report grid into ranked members + per-event totals. */
  function reportSummary(rows) {
    var header = rows[0], body = rows.slice(1, -1), totals = rows[rows.length - 1];
    var iPresent = header.indexOf('Present'), firstEv = header.indexOf('Phone') === 1 ? 2 : 1;
    var events = header.slice(firstEv, iPresent).map(function (h, i) {
      var m = /^(\d{4}-\d{2}-\d{2}) (.*)$/.exec(h) || [h, '', h];
      return { date: m[1], name: m[2], present: +totals[firstEv + i] || 0 };
    });
    var n = events.length;
    var members = body.map(function (r) {
      var p = +r[iPresent] || 0;
      var attended = events.filter(function (e, i) { return r[firstEv + i] === 'P'; });
      return { name: String(r[0]), present: p, pct: n ? Math.round(p / n * 100) : 0, attended: attended };
    }).sort(function (a, b) { return b.present - a.present || a.name.localeCompare(b.name); });
    // Standard competition ranking: ties share a rank (1, 2, 2, 4)
    members.forEach(function (m, i) { m.rank = i && m.present === members[i - 1].present ? members[i - 1].rank : i + 1; });
    var avg = n && members.length ? Math.round(members.reduce(function (s, m) { return s + m.present; }, 0) / (n * members.length) * 100) : 0;
    return { events: events, members: members, avg: avg };
  }
  function downloadPdf(opts) {
    opts = opts || {};
    var r = state.report; if (!r) return;
    toast('Preparing PDF…');
    Promise.all([loadPdfLibs(), logoDataUrl()]).then(function (res) {
      var logo = res[1];
      var sum = reportSummary(r.rows);
      var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
      var W = doc.internal.pageSize.getWidth(), M = 40;
      var NAVY = [28, 26, 102], BLUE = [37, 65, 178], SOFT = [234, 240, 255], MUTED = [102, 112, 145], GREEN = [22, 130, 74], AMBER = [190, 120, 10], RED = [200, 40, 40];
      var pctColor = function (p) { return p >= 75 ? GREEN : p >= 40 ? AMBER : RED; };

      // Header band
      doc.setFillColor.apply(doc, NAVY); doc.rect(0, 0, W, 96, 'F');
      var stripe = [[225, 29, 29], [245, 184, 0], [255, 255, 255], [31, 157, 58], [59, 110, 245]];
      stripe.forEach(function (c, i) { doc.setFillColor.apply(doc, c); doc.rect(i * W / 5, 96, W / 5 + 1, 4, 'F'); });
      var tx = M;
      if (logo) {
        doc.setFillColor(255, 255, 255); doc.circle(M + 30, 48, 31, 'F');
        try { doc.addImage(logo, 'PNG', M + 2, 20, 56, 56); tx = M + 76; } catch (e) {}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('SSYG Attendance Report', tx, 44);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(rangeLabel(r), tx, 63);
      doc.setFontSize(9); doc.text('Generated ' + fmtDate(iso(new Date())), tx, 79);

      // Summary boxes
      var y = 124, bw = (W - 2 * M - 20) / 3;
      [['Events', String(sum.events.length)], ['Members', String(sum.members.length)], ['Average attendance', sum.avg + '%']].forEach(function (b, i) {
        var x = M + i * (bw + 10);
        doc.setFillColor.apply(doc, SOFT); doc.roundedRect(x, y, bw, 54, 8, 8, 'F');
        doc.setTextColor.apply(doc, NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(b[1], x + 14, y + 28);
        doc.setTextColor.apply(doc, MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.text(b[0], x + 14, y + 44);
      });
      y += 82;

      // Top 5
      var top = sum.members.filter(function (m) { return m.rank <= 5 && m.present > 0; });
      doc.setTextColor.apply(doc, NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('Top 5 attendees', M, y); y += 8;
      var MEDAL = { 1: [245, 184, 0], 2: [160, 170, 190], 3: [205, 127, 50] };
      if (top.length) {
        doc.autoTable({
          startY: y, margin: { left: M, right: M },
          head: [['Rank', 'Member', 'Attended', 'Attendance %']],
          body: top.map(function (m) { return ['#' + m.rank, m.name, m.present + ' of ' + sum.events.length, m.pct + '%']; }),
          theme: 'plain',
          headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold', fontSize: 10 },
          bodyStyles: { fontSize: 11, cellPadding: 7, textColor: [20, 26, 51] },
          alternateRowStyles: { fillColor: [247, 248, 252] },
          columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', halign: 'center' }, 1: { fontStyle: 'bold' }, 2: { cellWidth: 90, halign: 'center' }, 3: { cellWidth: 100, halign: 'center', fontStyle: 'bold' } },
          didParseCell: function (d) {
            if (d.section !== 'body') return;
            var m = top[d.row.index];
            if (d.column.index === 0 && MEDAL[m.rank]) { d.cell.styles.fillColor = MEDAL[m.rank]; d.cell.styles.textColor = 255; }
            if (d.column.index === 3) d.cell.styles.textColor = pctColor(m.pct);
          }
        });
        y = doc.lastAutoTable.finalY + 14;
        if (top.length > 5) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor.apply(doc, MUTED);
          doc.text('Members with the same attendance share a rank, so more than 5 can appear here.', M, y); 
        }
        y += 18;
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor.apply(doc, MUTED);
        doc.text('No attendance recorded in this period.', M, y + 14); y += 40;
      }

      // All members
      doc.setTextColor.apply(doc, NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('All members', M, y); y += 8;
      doc.autoTable({
        startY: y, margin: { left: M, right: M, top: 50 },
        head: [['#', 'Member', 'Attended', 'Total events', 'Attendance %']],
        body: sum.members.map(function (m) { return [m.rank, m.name, m.present, sum.events.length, m.pct + '%']; }),
        theme: 'striped',
        headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10, cellPadding: 5, textColor: [20, 26, 51] },
        alternateRowStyles: { fillColor: [247, 248, 252] },
        columnStyles: { 0: { cellWidth: 36, halign: 'center', textColor: MUTED }, 2: { cellWidth: 70, halign: 'center' }, 3: { cellWidth: 80, halign: 'center' }, 4: { cellWidth: 92, halign: 'center', fontStyle: 'bold' } },
        didParseCell: function (d) {
          if (d.section === 'body' && d.column.index === 4) d.cell.styles.textColor = pctColor(sum.members[d.row.index].pct);
        }
      });
      y = doc.lastAutoTable.finalY + 26;

      // Member-wise: which events each member attended, grouped by month
      if (opts.memberEvents !== false && sum.events.length) {
      doc.addPage(); y = 50;
      doc.setTextColor.apply(doc, NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text('Member-wise attendance', M, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED);
      doc.text('Events each member attended, grouped by month. Sorted by most attended.', M, y + 14);
      var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      var monthsSpan = {};
      sum.events.forEach(function (e) { monthsSpan[e.date.slice(0, 4)] = 1; });
      var multiYear = Object.keys(monthsSpan).length > 1;
      var memberRows = [];
      sum.members.forEach(function (m) {
        var groups = [], cur = null;
        m.attended.forEach(function (e) {
          var key = e.date.slice(0, 7);
          if (!cur || cur.key !== key) { cur = { key: key, items: [] }; groups.push(cur); }
          cur.items.push(parseInt(e.date.slice(8), 10) + ' ' + e.name);
        });
        var head = { content: '', member: m, rowSpan: Math.max(1, groups.length) };
        if (!groups.length) {
          memberRows.push([head, { content: '', none: true }, { content: 'No events attended in this period.', none: true }]);
          return;
        }
        groups.forEach(function (g, i) {
          var label = MON[+g.key.slice(5) - 1] + (multiYear ? " '" + g.key.slice(2, 4) : '');
          var row = [{ content: label, month: true }, { content: g.items.join('   •   ') }];
          if (i === 0) row.unshift(head);
          memberRows.push(row);
        });
      });
      doc.autoTable({
        startY: y + 24, margin: { left: M, right: M, top: 50 },
        head: [['Member', 'Month', 'Events attended (date + event)']],
        body: memberRows,
        theme: 'grid', rowPageBreak: 'avoid',
        headStyles: { fillColor: NAVY, textColor: 255, fontSize: 10, lineColor: NAVY },
        styles: { lineColor: [227, 231, 241], lineWidth: 0.6 },
        bodyStyles: { fontSize: 8.6, cellPadding: { top: 5, bottom: 5, left: 7, right: 7 }, textColor: [40, 46, 70], valign: 'top' },
        columnStyles: { 0: { cellWidth: 122, minCellHeight: 40 }, 1: { cellWidth: 40, halign: 'center' } },
        didParseCell: function (d) {
          if (d.section !== 'body' || !d.cell.raw) return;
          if (d.cell.raw.month) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = BLUE; d.cell.styles.fillColor = [247, 248, 252]; }
          if (d.cell.raw.none) { d.cell.styles.textColor = MUTED; d.cell.styles.fontStyle = 'italic'; }
        },
        didDrawCell: function (d) {
          if (d.section !== 'body' || d.column.index !== 0 || !d.cell.raw || !d.cell.raw.member) return;
          var m = d.cell.raw.member, x = d.cell.x + 8, yy = d.cell.y + 15;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 26, 51);
          doc.text(doc.splitTextToSize(m.name, d.cell.width - 16)[0], x, yy);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor.apply(doc, pctColor(m.pct));
          doc.text(m.present + ' of ' + sum.events.length + '  ·  ' + m.pct + '%', x, yy + 13);
          doc.setFillColor(227, 231, 241); doc.roundedRect(x, yy + 19, d.cell.width - 16, 3, 1.5, 1.5, 'F');
          if (m.pct) { doc.setFillColor.apply(doc, pctColor(m.pct)); doc.roundedRect(x, yy + 19, (d.cell.width - 16) * m.pct / 100, 3, 1.5, 1.5, 'F'); }
        }
      });
      y = doc.lastAutoTable.finalY + 26;
      }

      // Events in the period
      if (sum.events.length) {
        if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 50; }
        doc.setTextColor.apply(doc, NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
        doc.text('Events in this period', M, y); y += 8;
        doc.autoTable({
          startY: y, margin: { left: M, right: M, top: 50 },
          head: [['Date', 'Event', 'Present']],
          body: sum.events.map(function (e) { return [fmtDate(e.date), e.name, e.present]; }),
          theme: 'striped',
          headStyles: { fillColor: BLUE, textColor: 255, fontSize: 10 },
          bodyStyles: { fontSize: 10, cellPadding: 5, textColor: [20, 26, 51] },
          alternateRowStyles: { fillColor: [247, 248, 252] },
          columnStyles: { 0: { cellWidth: 120 }, 2: { cellWidth: 70, halign: 'center', fontStyle: 'bold' } }
        });
      }

      // Footer on every page
      var pages = doc.internal.getNumberOfPages(), H = doc.internal.pageSize.getHeight();
      for (var i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor.apply(doc, MUTED);
        doc.text('SSYG Attendance', M, H - 20);
        doc.text('Page ' + i + ' of ' + pages, W - M, H - 20, { align: 'right' });
      }
      doc.save('SSYG_attendance_' + (r.category ? r.category.replace(/[^\w]+/g, '-') + '_' : '') + (r.from || 'start') + '_to_' + (r.to || iso(new Date())) + '.pdf');
      toast('PDF downloaded');
    }).catch(function (e) { toast('Could not create PDF: ' + ((e && e.message) || e), true); });
  }

  // Keep the download FAB when returning to Reports
  var _renderFab = renderFab;
  renderFab = function () {
    _renderFab();
    if (state.view === 'reports') renderActionbarReport(!!(state.report && state.report.rows.length > 2));
  };

  /* ================= start ================= */
  // Errors are already shown as a toast by call(); don't log them twice.
  window.addEventListener('unhandledrejection', function (e) { e.preventDefault(); });
  document.querySelectorAll('[data-icon]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-icon'), 22); });
  document.querySelectorAll('.search-ico').forEach(function (el) { el.innerHTML = icon('search', 20); });

  var saved = store('ssyg_token');
  if (saved) state.token = saved; // try the saved admin session; server tells us if it's still valid
  setAdmin(null);
  if (saved) state.token = saved;
  load().then(function () {
    if (!saved) return;
    return call('checkSession', saved).then(function (ok) {
      if (ok) { setAdmin(saved); } else { state.token = null; store('ssyg_token', null); }
    });
  }).catch(function () {});
})();
