// Minimal in-memory mock of the Apps Script services used by Code.gs (for local testing only).
(function (g) {
  function Sheet(name) { this.name = name; this.data = []; }
  Sheet.prototype.getLastRow = function () {
    for (var i = this.data.length; i > 0; i--) if (this.data[i - 1].some(function (c) { return c !== '' && c != null; })) return i;
    return 0;
  };
  Sheet.prototype.ensure = function (r, c) { while (this.data.length < r) this.data.push([]); this.data.forEach(function (row) { while (row.length < c) row.push(''); }); };
  Sheet.prototype.getRange = function (a, b, nr, nc) {
    var sh = this;
    if (typeof a === 'string') return { setNumberFormat: function () { return this; } };
    nr = nr || 1; nc = nc || 1;
    return {
      setValues: function (v) { sh.ensure(a + nr - 1, b + nc - 1); for (var i = 0; i < nr; i++) for (var j = 0; j < nc; j++) sh.data[a - 1 + i][b - 1 + j] = v[i][j]; return this; },
      getValues: function () { sh.ensure(a + nr - 1, b + nc - 1); var out = []; for (var i = 0; i < nr; i++) { out.push(sh.data[a - 1 + i].slice(b - 1, b - 1 + nc)); } return out; },
      getValue: function () { return this.getValues()[0][0]; },
      setValue: function (v) { return this.setValues([[v]]); },
      clearContent: function () { return this.setValues(Array.from({ length: nr }, function () { return Array(nc).fill(''); })); },
      setFontWeight: function () { return this; }, setNumberFormat: function () { return this; }
    };
  };
  Sheet.prototype.appendRow = function (row) { var r = this.getLastRow() + 1; this.getRange(r, 1, 1, row.length).setValues([row]); };
  Sheet.prototype.deleteRow = function (r) { this.data.splice(r - 1, 1); };
  Sheet.prototype.setFrozenRows = function () {};
  var sheets = {};
  var ss = {
    getSheetByName: function (n) { return sheets[n] || null; },
    insertSheet: function (n) { return (sheets[n] = new Sheet(n)); }
  };
  g.__sheets = sheets;
  g.SpreadsheetApp = { getActiveSpreadsheet: function () { return ss; } };
  var props = { ADMIN_PASSWORD: 'secret123' };
  g.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return props[k] || null; }, setProperty: function (k, v) { props[k] = v; } }; } };
  var cache = {};
  g.CacheService = { getScriptCache: function () { return { put: function (k, v) { cache[k] = v; }, get: function (k) { return cache[k] || null; }, remove: function (k) { delete cache[k]; } }; } };
  g.Utilities = {
    getUuid: function () { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function () { return (Math.random() * 16 | 0).toString(16); }); },
    sleep: function () {},
    formatDate: function (d, tz, f) { var p = function (n) { return ('0' + n).slice(-2); }; var s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); return f.indexOf('HH') >= 0 ? s + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) : s; }
  };
  g.Session = { getScriptTimeZone: function () { return 'Asia/Kolkata'; } };
  g.LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };
  // google.script.run shim
  function runner(ok, fail) {
    return new Proxy({}, { get: function (_, k) {
      if (k === 'withSuccessHandler') return function (f) { return runner(f, fail); };
      if (k === 'withFailureHandler') return function (f) { return runner(ok, f); };
      return function () { var args = arguments; setTimeout(function () {
        try { var r = g[k].apply(null, JSON.parse(JSON.stringify(Array.from(args)))); ok && ok(JSON.parse(JSON.stringify(r === undefined ? null : r))); }
        catch (e) { fail && fail(e); } }, 20); };
    } });
  }
  g.google = { script: { get run() { return runner(null, null); } } };
})(window);
