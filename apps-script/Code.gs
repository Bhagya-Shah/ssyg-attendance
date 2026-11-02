/**
 * SSYG Attendance Tracker - Google Apps Script backend.
 *
 * The Google Sheet this script is bound to is the database:
 *   Members    : ID | Name | Phone | Email | Notes | Active | Added On
 *   Events     : ID | Date | Name | Description | Created On | Category
 *   Attendance : Event ID | Member ID | Marked At
 *     (one row per member who was PRESENT at an event)
 *
 * This script is a JSON API. The website (folder web/, hosted on Vercel)
 * calls it with fetch(). Anyone with the website link can VIEW.
 * Only someone who knows the admin password can add / edit / delete
 * members and events and mark attendance.
 *
 * The admin password lives in Project Settings > Script Properties
 * under the key ADMIN_PASSWORD (see README.md).
 */

var SHEETS = {
  members: { name: 'Members', headers: ['ID', 'Name', 'Phone', 'Email', 'Notes', 'Active', 'Added On'] },
  events: { name: 'Events', headers: ['ID', 'Date', 'Name', 'Description', 'Created On', 'Category'] },
  attendance: { name: 'Attendance', headers: ['Event ID', 'Member ID', 'Marked At'] }
};

var APP_TITLE = 'SSYG Attendance';
var SESSION_HOURS = 6;

/* ------------------------------------------------------------------ */
/* JSON API (the website on Vercel calls this)                         */
/* ------------------------------------------------------------------ */

// Only these functions can be called from the website.
var API = {
  getAppData: getAppData,
  getEventAttendance: getEventAttendance,
  getMemberAttendance: getMemberAttendance,
  getAttendanceReport: getAttendanceReport,
  login: login,
  logout: logout,
  checkSession: checkSession,
  saveMember: saveMember,
  addMembersBulk: addMembersBulk,
  removeMember: removeMember,
  restoreMember: restoreMember,
  saveEvent: saveEvent,
  deleteEvent: deleteEvent,
  saveAttendance: saveAttendance
};

/**
 * The website sends POST with body {"action": "...", "args": [...]}
 * as text/plain (this avoids a CORS preflight, which Apps Script can't answer).
 */
function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = API.hasOwnProperty(req.action) ? API[req.action] : null;
    if (!fn) throw new Error('Unknown action: ' + req.action);
    out = { ok: true, data: fn.apply(null, Array.isArray(req.args) ? req.args : []) };
  } catch (err) {
    out = { ok: false, error: (err && err.message) || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Opening the API URL in a browser just shows that it works. */
function doGet() {
  setup_();
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: APP_TITLE, message: 'API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* One-time setup helpers (run from the Apps Script editor)            */
/* ------------------------------------------------------------------ */

/** Creates the three sheet tabs with headers if they don't exist. */
function setup() {
  setup_();
  return 'Sheets ready: Members, Events, Attendance';
}

/**
 * Optional: set the admin password from the editor.
 * Change the text below, click Run, then change it back to '' so the
 * password isn't left in the code.
 */
function setAdminPassword() {
  var NEW_PASSWORD = ''; // <-- type your password here, run once, then clear it
  if (!NEW_PASSWORD) throw new Error('Type a password into NEW_PASSWORD first.');
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', NEW_PASSWORD);
  return 'Admin password saved.';
}

/**
 * Suggests a category from the event name (used by the imports and by
 * autoCategorizeEvents). Returns '' when nothing fits.
 */
function categoryFor_(name) {
  var n = String(name || '').toLowerCase();
  if (n.indexOf('sandhya bhakti') >= 0 || n.indexOf('sandha bhakti') >= 0) return 'Sandhya Bhakti';
  if (n.indexOf('anukampa') >= 0) return 'Anukampa Daan';
  if (n.indexOf('shibir') >= 0) return 'Shibir';
  if (n.indexOf('paryushan') >= 0) return 'Paryushan';
  if (n.indexOf('varghoda') >= 0 || n.indexOf('vargoda') >= 0) return 'Varghoda';
  if (n.indexOf('dhwaja') >= 0) return 'Dhwaja';
  if (n.indexOf('bhakti') >= 0) return 'Ghar Bhakti';
  if (/management|setup|sticker|filling|counting|distribution|seva/.test(n)) return 'Seva';
  return '';
}

/**
 * Run once from the editor: fills in a category for every event that
 * doesn't have one yet, based on its name. Events you already set are kept.
 */
function autoCategorizeEvents() {
  setup_();
  return withLock_(function () {
    var sh = sheet_('events'), last = sh.getLastRow(), done = 0;
    if (last < 2) return 'No events.';
    var rows = sh.getRange(2, 1, last - 1, 6).getValues();
    var cats = rows.map(function (r) {
      var cur = String(r[5] || '').trim();
      if (cur || !r[0]) return [cur];
      var c = categoryFor_(r[2]);
      if (c) done++;
      return [c];
    });
    sh.getRange(2, 6, cats.length, 1).setValues(cats);
    var msg = 'Categorised ' + done + ' events.';
    Logger.log(msg);
    return msg;
  });
}

function setup_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (key) {
    var def = SHEETS[key];
    var sh = ss.getSheetByName(def.name);
    if (!sh) {
      sh = ss.insertSheet(def.name);
    }
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
    } else if (sh.getLastColumn() < def.headers.length) {
      // Newer version added columns (e.g. Category): add their headers, keep all data.
      var from = sh.getLastColumn() + 1;
      sh.getRange(1, from, 1, def.headers.length - from + 1)
        .setValues([def.headers.slice(from - 1)]).setFontWeight('bold');
    }
  });
  // Keep the event date column as plain text (yyyy-MM-dd) so time zones never shift it.
  ss.getSheetByName(SHEETS.events.name).getRange('B:B').setNumberFormat('@');
  // Keep phone numbers as text so leading 0 / + are not lost.
  ss.getSheetByName(SHEETS.members.name).getRange('C:C').setNumberFormat('@');
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function login(password) {
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!real) {
    throw new Error('Admin password is not set yet. Add ADMIN_PASSWORD in Script Properties.');
  }
  if (String(password) !== real) {
    Utilities.sleep(800); // slow down guessing
    throw new Error('Wrong password.');
  }
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('admin_' + token, '1', SESSION_HOURS * 3600);
  return token;
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove('admin_' + token);
  return true;
}

function checkSession(token) {
  return !!(token && CacheService.getScriptCache().get('admin_' + token));
}

function requireAdmin_(token) {
  if (!checkSession(token)) {
    throw new Error('SESSION_EXPIRED: Please log in as admin again.');
  }
}

/* ------------------------------------------------------------------ */
/* Read (open to everyone)                                             */
/* ------------------------------------------------------------------ */

/** Everything the UI needs on load: members, events and attendance counts. */
function getAppData(token) {
  setup_();
  var isAdmin = checkSession(token);
  var members = readMembers_();
  if (!isAdmin) {
    // Viewers only see names; contact details stay private to admins.
    members = members.map(function (m) { return { id: m.id, name: m.name, active: m.active, phone: '', email: '', notes: '' }; });
  }
  var events = readEvents_();
  var att = readAttendance_();
  var counts = {};
  att.forEach(function (a) { counts[a.eventId] = (counts[a.eventId] || 0) + 1; });
  events.forEach(function (e) { e.presentCount = counts[e.id] || 0; });
  var byMember = {};
  att.forEach(function (a) { byMember[a.memberId] = (byMember[a.memberId] || 0) + 1; });
  members.forEach(function (m) { m.attended = byMember[m.id] || 0; });
  return { title: APP_TITLE, members: members, events: events, isAdmin: isAdmin };
}

/** Event IDs one member was present at. */
function getMemberAttendance(memberId) {
  return readAttendance_()
    .filter(function (a) { return a.memberId === memberId; })
    .map(function (a) { return a.eventId; });
}

/** Member IDs present at one event. */
function getEventAttendance(eventId) {
  return readAttendance_()
    .filter(function (a) { return a.eventId === eventId; })
    .map(function (a) { return a.memberId; });
}

/**
 * Attendance report for events whose date is between from and to
 * (inclusive, yyyy-MM-dd; either may be empty for no limit).
 * Returns a 2-D array ready to be turned into CSV.
 */
function getAttendanceReport(from, to, includeInactive, token, category) {
  var isAdmin = checkSession(token);
  var events = readEvents_().filter(function (e) {
    return (!from || e.date >= from) && (!to || e.date <= to) && (!category || e.category === category);
  }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  var eventIds = {};
  events.forEach(function (e) { eventIds[e.id] = true; });

  var present = {};
  readAttendance_().forEach(function (a) {
    if (eventIds[a.eventId]) present[a.eventId + '|' + a.memberId] = true;
  });

  var members = readMembers_().filter(function (m) {
    if (m.active || includeInactive) return true;
    // Keep removed members if they attended something in this range
    return events.some(function (e) { return present[e.id + '|' + m.id]; });
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  var header = isAdmin ? ['Member', 'Phone'] : ['Member'];
  events.forEach(function (e) { header.push(e.date + ' ' + e.name); });
  header.push('Present', 'Total Events', 'Attendance %');

  var rows = [header];
  members.forEach(function (m) {
    var row = [m.name + (m.active ? '' : ' (removed)')];
    if (isAdmin) row.push(m.phone);
    var count = 0;
    events.forEach(function (e) {
      var p = !!present[e.id + '|' + m.id];
      if (p) count++;
      row.push(p ? 'P' : 'A');
    });
    row.push(count, events.length, events.length ? Math.round((count / events.length) * 100) + '%' : '-');
    rows.push(row);
  });

  var totals = isAdmin ? ['Total present', ''] : ['Total present'];
  events.forEach(function (e) {
    totals.push(members.filter(function (m) { return present[e.id + '|' + m.id]; }).length);
  });
  totals.push('', '', '');
  rows.push(totals);

  return { rows: rows, eventCount: events.length, memberCount: members.length };
}

/* ------------------------------------------------------------------ */
/* Write (admin only)                                                  */
/* ------------------------------------------------------------------ */

function saveMember(token, member) {
  requireAdmin_(token);
  var name = clean_(member && member.name);
  if (!name) throw new Error('Name is required.');
  return withLock_(function () {
    var sh = sheet_('members');
    var row = [
      member.id || newId_('M'),
      name,
      clean_(member.phone),
      clean_(member.email),
      clean_(member.notes),
      member.active === false ? false : true,
      ''
    ];
    var idx = member.id ? findRow_(sh, member.id) : -1;
    if (idx > 0) {
      row[6] = sh.getRange(idx, 7).getValue();
      sh.getRange(idx, 1, 1, row.length).setValues([row]);
    } else {
      row[6] = today_();
      sh.appendRow(row);
    }
    return row[0];
  });
}

/** Bulk add: one member per line, "Name" or "Name, Phone". */
function addMembersBulk(token, text) {
  requireAdmin_(token);
  var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(String);
  if (!lines.length) throw new Error('Nothing to add.');
  return withLock_(function () {
    var sh = sheet_('members');
    var existing = {};
    readMembers_().forEach(function (m) { existing[m.name.toLowerCase()] = true; });
    var rows = [];
    lines.forEach(function (line) {
      var parts = line.split(',');
      var name = clean_(parts[0]);
      if (!name || existing[name.toLowerCase()]) return;
      existing[name.toLowerCase()] = true;
      rows.push([newId_('M'), name, clean_(parts[1]), clean_(parts[2]), '', true, today_()]);
    });
    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    return rows.length;
  });
}

/**
 * Remove a member. Default is a soft remove (marked inactive) so past
 * attendance history stays correct. permanent=true deletes the member
 * and all their attendance rows.
 */
function removeMember(token, memberId, permanent) {
  requireAdmin_(token);
  return withLock_(function () {
    var sh = sheet_('members');
    var idx = findRow_(sh, memberId);
    if (idx < 0) throw new Error('Member not found.');
    if (permanent) {
      sh.deleteRow(idx);
      deleteAttendanceWhere_(function (eId, mId) { return mId === memberId; });
    } else {
      sh.getRange(idx, 6).setValue(false);
    }
    return true;
  });
}

function restoreMember(token, memberId) {
  requireAdmin_(token);
  return withLock_(function () {
    var sh = sheet_('members');
    var idx = findRow_(sh, memberId);
    if (idx < 0) throw new Error('Member not found.');
    sh.getRange(idx, 6).setValue(true);
    return true;
  });
}

function saveEvent(token, ev) {
  requireAdmin_(token);
  var name = clean_(ev && ev.name);
  var date = clean_(ev && ev.date);
  if (!name) throw new Error('Event name is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Event date is required.');
  return withLock_(function () {
    var sh = sheet_('events');
    var row = [ev.id || newId_('E'), date, name, clean_(ev.description), '', clean_(ev.category)];
    var idx = ev.id ? findRow_(sh, ev.id) : -1;
    if (idx > 0) {
      row[4] = sh.getRange(idx, 5).getValue();
      sh.getRange(idx, 1, 1, row.length).setValues([row]);
    } else {
      row[4] = today_();
      sh.appendRow(row);
    }
    return row[0];
  });
}

function deleteEvent(token, eventId) {
  requireAdmin_(token);
  return withLock_(function () {
    var sh = sheet_('events');
    var idx = findRow_(sh, eventId);
    if (idx < 0) throw new Error('Event not found.');
    sh.deleteRow(idx);
    deleteAttendanceWhere_(function (eId) { return eId === eventId; });
    return true;
  });
}

/** Replace the attendance of one event with the given list of present member IDs. */
function saveAttendance(token, eventId, presentMemberIds) {
  requireAdmin_(token);
  if (findRow_(sheet_('events'), eventId) < 0) throw new Error('Event not found.');
  var ids = (presentMemberIds || []).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; });
  return withLock_(function () {
    deleteAttendanceWhere_(function (eId) { return eId === eventId; });
    if (ids.length) {
      var sh = sheet_('attendance');
      var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
      var rows = ids.map(function (id) { return [eventId, id, now]; });
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
    }
    return ids.length;
  });
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

function sheet_(key) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS[key].name);
}

function dataRows_(key) {
  var sh = sheet_(key);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, SHEETS[key].headers.length).getValues();
}

function readMembers_() {
  return dataRows_('members').filter(function (r) { return r[0] !== ''; }).map(function (r) {
    return {
      id: String(r[0]),
      name: String(r[1]),
      phone: String(r[2]),
      email: String(r[3]),
      notes: String(r[4]),
      active: !(r[5] === false || String(r[5]).toUpperCase() === 'FALSE'),
      addedOn: asDate_(r[6])
    };
  });
}

function readEvents_() {
  return dataRows_('events').filter(function (r) { return r[0] !== ''; }).map(function (r) {
    return {
      id: String(r[0]),
      date: asDate_(r[1]),
      name: String(r[2]),
      description: String(r[3]),
      category: String(r[5] || '').trim()
    };
  });
}

function readAttendance_() {
  return dataRows_('attendance').filter(function (r) { return r[0] !== ''; }).map(function (r) {
    return { eventId: String(r[0]), memberId: String(r[1]) };
  });
}

/** Rewrites the Attendance sheet without the rows matching fn(eventId, memberId). */
function deleteAttendanceWhere_(fn) {
  var sh = sheet_('attendance');
  var rows = dataRows_('attendance');
  var keep = rows.filter(function (r) { return r[0] !== '' && !fn(String(r[0]), String(r[1])); });
  if (keep.length === rows.length) return;
  if (rows.length) sh.getRange(2, 1, rows.length, 3).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, 3).setValues(keep);
}

function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2 || !id) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function newId_(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function clean_(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function asDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '');
}
