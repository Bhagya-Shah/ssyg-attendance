/**
 * ONE-TIME IMPORT of the old attendance, Jan-May 2026 (Presli export, 01 Jan - 31 May 2026):
 * 42 members, 35 events, 230 attendance marks.
 *
 * How to use:
 *   1. In Apps Script, click + next to Files > Script, name it ImportJanMay, paste this file.
 *   2. Pick importJanToMay in the function dropdown and click Run.
 *   3. Check the sheet, then you can delete this file.
 *
 * Safe to run again: it first removes events it imported before (and their
 * attendance), then imports fresh. Members with the same name are not added twice.
 * It does not touch the Jul-Nov import or anything you added in the app.
 */
var OLD_DATA_JAN_MAY = {"members":["Aagam Shah Surat","Bhagya Shah","Bhavya Chhajed","Dhruvit Surana","Divya Shah","Divyam Shah","Harsh Gungliea","Harshil Shah","Hitesh Dhami","Jash Shah","Jaynish Mandot","Jenil Jain","Kamalraj Jain","Khush Jain","Kunal Shah","Laksh Jain","Manthan Gandhi","Meet Doshi","Meet Mehta","Moksh Kothari","Moksh Shah","Neeil Shah","Neer Chheda","Nidhish Chhajed","Pakshal Jain","Prasham Shah","Pratik Gundecha","Rahul Kataria","Rakesh Kothari","Rakshit Jodhawat","Rikin Dedhia","Rishabh Kothari","Ronak Bhandari","Sashwat Doshi","Shlok Jain","Sumit Dhoka","Sushil Jain","Tejesh Jain","Tirth Shah","Vidit Shah","Vishal Bhandari","Vishal Dhoka"],"events":[{"date":"2026-01-10","name":"Sandhya Bhakti","present":["Divyam Shah","Meet Doshi","Neeil Shah","Ronak Bhandari","Sumit Dhoka","Sushil Jain"]},{"date":"2026-01-11","name":"Anukampa Daan","present":["Ronak Bhandari","Sushil Jain"]},{"date":"2026-01-15","name":"Bhandar Counting","present":["Manthan Gandhi","Nidhish Chhajed","Rahul Kataria","Shlok Jain"]},{"date":"2026-01-17","name":"Sandhya Bhakti","present":["Bhagya Shah","Divya Shah","Divyam Shah","Kamalraj Jain","Kunal Shah","Meet Mehta","Moksh Kothari","Neeil Shah","Rishabh Kothari","Ronak Bhandari","Sashwat Doshi","Sushil Jain"]},{"date":"2026-01-18","name":"SSYG AGM","present":["Bhagya Shah","Divyam Shah","Harshil Shah","Jenil Jain","Kunal Shah","Laksh Jain","Moksh Kothari","Neeil Shah","Nidhish Chhajed","Pratik Gundecha","Rahul Kataria","Ronak Bhandari","Sashwat Doshi","Shlok Jain"]},{"date":"2026-01-18","name":"Kulupwadi Bhakti","present":["Divyam Shah","Harshil Shah","Kunal Shah","Moksh Kothari","Ronak Bhandari"]},{"date":"2026-01-18","name":"Anukampa Daan","present":["Sashwat Doshi"]},{"date":"2026-01-19","name":"Ghar Bhakti @ Kulupwadi","present":["Divyam Shah","Kunal Shah","Moksh Kothari","Neeil Shah","Neer Chheda","Rahul Kataria","Sushil Jain"]},{"date":"2026-01-23","name":"Carter Road Sangh, Shree Sambhavnath Dada Dhwaja","present":["Bhagya Shah","Divya Shah","Divyam Shah","Hitesh Dhami","Kunal Shah","Laksh Jain","Manthan Gandhi","Rahul Kataria","Rakesh Kothari","Rishabh Kothari","Ronak Bhandari","Tirth Shah"]},{"date":"2026-01-23","name":"Carter Road Sangh, Shree Sambhavnath Dada Dhwaja Swami Vatsalya","present":["Bhagya Shah","Divyam Shah","Hitesh Dhami","Laksh Jain","Rahul Kataria","Ronak Bhandari","Sashwat Doshi"]},{"date":"2026-01-24","name":"Sandhya Bhakti","present":["Divya Shah","Divyam Shah","Kunal Shah","Manthan Gandhi","Moksh Shah","Rahul Kataria","Ronak Bhandari","Sashwat Doshi"]},{"date":"2026-01-25","name":"Anukampa Daan","present":["Ronak Bhandari"]},{"date":"2026-01-31","name":"Sandhya Bhakti","present":["Bhagya Shah","Divyam Shah","Kunal Shah","Neer Chheda","Nidhish Chhajed","Rakshit Jodhawat","Shlok Jain","Sumit Dhoka"]},{"date":"2026-02-01","name":"Anukampa Daan","present":["Ronak Bhandari"]},{"date":"2026-02-07","name":"Sandhya Bhakti","present":["Bhagya Shah","Divyam Shah","Kunal Shah","Moksh Kothari","Rahul Kataria","Rishabh Kothari"]},{"date":"2026-02-08","name":"Anukampa Daan","present":["Ronak Bhandari","Shlok Jain","Vidit Shah"]},{"date":"2026-02-15","name":"Anukampa Daan","present":["Bhagya Shah","Jenil Jain"]},{"date":"2026-02-21","name":"Sandhya Bhakti","present":["Bhagya Shah","Divya Shah","Jenil Jain","Moksh Shah","Neeil Shah","Sumit Dhoka"]},{"date":"2026-02-28","name":"Sandhya Bhakti","present":["Divya Shah","Divyam Shah","Harsh Gungliea","Kunal Shah","Ronak Bhandari"]},{"date":"2026-03-01","name":"Anukampa Daan","present":["Ronak Bhandari"]},{"date":"2026-03-03","name":"Dahisar Ghar Bhakti","present":["Divyam Shah","Kunal Shah","Nidhish Chhajed","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-03-07","name":"Sandhya Bhakti","present":["Divyam Shah","Harsh Gungliea","Kunal Shah","Pakshal Jain","Rahul Kataria","Rishabh Kothari","Ronak Bhandari"]},{"date":"2026-03-08","name":"Anukampa Daan","present":["Ronak Bhandari","Sashwat Doshi"]},{"date":"2026-03-14","name":"Sandhya Bhakti","present":["Bhagya Shah","Divya Shah","Divyam Shah","Manthan Gandhi","Moksh Kothari","Neer Chheda","Ronak Bhandari","Sashwat Doshi","Sumit Dhoka","Tejesh Jain"]},{"date":"2026-03-21","name":"Sandhya Bhakti","present":["Neeil Shah"]},{"date":"2026-03-28","name":"Sandhya Bhakti","present":["Bhagya Shah","Divya Shah","Divyam Shah","Moksh Kothari","Neeil Shah","Rikin Dedhia","Sumit Dhoka","Vidit Shah"]},{"date":"2026-03-31","name":"Mahaveer Naad Sandhya Bhakti","present":["Bhagya Shah","Divya Shah","Divyam Shah","Harsh Gungliea","Hitesh Dhami","Jash Shah","Jenil Jain","Kunal Shah","Laksh Jain","Manthan Gandhi","Moksh Kothari","Moksh Shah","Neer Chheda","Nidhish Chhajed","Pakshal Jain","Prasham Shah","Pratik Gundecha","Rahul Kataria","Rakesh Kothari","Rakshit Jodhawat","Rishabh Kothari","Shlok Jain","Sumit Dhoka","Sushil Jain","Tejesh Jain","Tirth Shah","Vidit Shah","Vishal Bhandari","Vishal Dhoka"]},{"date":"2026-04-04","name":"Sandhya Bhakti","present":["Divyam Shah","Kunal Shah","Moksh Kothari","Ronak Bhandari"]},{"date":"2026-04-11","name":"Sandhya Bhakti","present":["Divyam Shah","Khush Jain","Kunal Shah","Moksh Kothari","Neeil Shah","Pakshal Jain","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-04-18","name":"Sandhya Bhakti","present":["Bhagya Shah","Divyam Shah","Sumit Dhoka"]},{"date":"2026-04-25","name":"Sandhya Bhakti","present":["Divyam Shah","Kunal Shah","Prasham Shah","Ronak Bhandari","Sashwat Doshi"]},{"date":"2026-05-02","name":"Sandhya Bhakti","present":["Divyam Shah","Harshil Shah","Kunal Shah","Moksh Kothari","Ronak Bhandari"]},{"date":"2026-05-03","name":"Dhwaja Bhakti Jay Chamunda","present":["Bhagya Shah","Divyam Shah","Harshil Shah","Jenil Jain","Moksh Kothari","Ronak Bhandari","Shlok Jain"]},{"date":"2026-05-23","name":"Sandhya Bhakti","present":["Jenil Jain","Kunal Shah","Laksh Jain","Moksh Kothari","Nidhish Chhajed","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-05-30","name":"SSYG Notebook Distribution","present":["Bhagya Shah","Divyam Shah","Harsh Gungliea","Harshil Shah","Jaynish Mandot","Jenil Jain","Kunal Shah","Laksh Jain","Meet Mehta","Nidhish Chhajed","Pakshal Jain","Pratik Gundecha","Rahul Kataria","Ronak Bhandari","Shlok Jain","Sumit Dhoka","Sushil Jain","Tejesh Jain"]}]};

function importJanToMay() {
  setup_();
  return withLock_(function () {
    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');

    // Members
    var idByName = {};
    readMembers_().forEach(function (m) { idByName[m.name.trim().toLowerCase()] = m.id; });
    var newMembers = [];
    OLD_DATA_JAN_MAY.members.forEach(function (name) {
      var k = name.toLowerCase();
      if (idByName[k]) return;
      var id = newId_('M');
      idByName[k] = id;
      newMembers.push([id, name, '', '', '', true, today_()]);
    });
    var msh = sheet_('members');
    if (newMembers.length) msh.getRange(msh.getLastRow() + 1, 1, newMembers.length, 7).setValues(newMembers);

    // Remove events from an earlier run of this import (and their attendance)
    var IMPORT_NOTE = 'Imported from old attendance app (Jan-May 2026)';
    var esh0 = sheet_('events');
    var oldIds = {};
    readEvents_().forEach(function (e) { if (e.description === IMPORT_NOTE) oldIds[e.id] = true; });
    for (var r = esh0.getLastRow(); r >= 2; r--) {
      if (oldIds[String(esh0.getRange(r, 1).getValue())]) esh0.deleteRow(r);
    }
    deleteAttendanceWhere_(function (eId) { return !!oldIds[eId]; });

    // Events + attendance
    var existing = {};
    readEvents_().forEach(function (e) { existing[e.date + '|' + e.name] = true; });
    var newEvents = [], newAtt = [];
    OLD_DATA_JAN_MAY.events.forEach(function (ev) {
      if (existing[ev.date + '|' + ev.name]) return;
      var id = newId_('E');
      newEvents.push([id, ev.date, ev.name, IMPORT_NOTE, today_()]);
      ev.present.forEach(function (name) {
        newAtt.push([id, idByName[name.toLowerCase()], now]);
      });
    });
    var esh = sheet_('events');
    if (newEvents.length) esh.getRange(esh.getLastRow() + 1, 1, newEvents.length, 5).setValues(newEvents);
    var ash = sheet_('attendance');
    if (newAtt.length) ash.getRange(ash.getLastRow() + 1, 1, newAtt.length, 3).setValues(newAtt);

    var msg = 'Imported ' + newMembers.length + ' members, ' + newEvents.length + ' events, ' + newAtt.length + ' attendance marks.';
    Logger.log(msg);
    return msg;
  });
}
