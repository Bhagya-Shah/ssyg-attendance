/**
 * ONE-TIME IMPORT of the old attendance (Presli export, 04 Jul - 01 Nov 2026):
 * 42 members, 45 meetings, 283 attendance marks.
 *
 * How to use:
 *   1. In Apps Script, click + next to Files > Script, name it ImportOldData, paste this file.
 *   2. Pick importOldData in the function dropdown and click Run.
 *   3. Check the sheet, then you can delete this file.
 *
 * Safe to run twice: members with the same name and events with the same
 * date + name are not added again.
 * Old meetings are named "SSYG Meet" (with (2), (3) when there were several on one day).
 * Rename them in the app any time.
 */
var OLD_DATA = {"members":["Aagam Shah Surat","Bhagya Shah","Bhavya Chhajed","Dhruvit Surana","Divya Shah","Divyam Shah","Harsh Gungliea","Harshil Shah","Hitesh Dhami","Jash Shah","Jaynish Mandot","Jenil Jain","Kamalraj Jain","Khush Jain","Kunal Shah","Laksh Jain","Manthan Gandhi","Meet Doshi","Meet Mehta","Moksh Kothari","Moksh Shah","Neeil Shah","Neer Chheda","Nidhish Chhajed","Pakshal Jain","Prasham Shah","Pratik Gundecha","Rahul Kataria","Rakshit Jodhawat","Rikin Dedhia","Rishabh Kothari","Ronak Bhandari","Sashwat Doshi","Shlok Jain","Sumit Dhoka","Sushil Jain","Tejesh Jain","Tirth Shah","Vidit Shah","Vishal Bhandari","Vishal Dhoka","Yogesh Jain"],"events":[{"date":"2026-07-04","name":"SSYG Meet","present":["Divya Shah","Divyam Shah","Jenil Jain","Moksh Kothari","Ronak Bhandari","Vidit Shah"]},{"date":"2026-07-11","name":"SSYG Meet","present":["Divya Shah","Divyam Shah","Moksh Kothari","Nidhish Chhajed"]},{"date":"2026-07-18","name":"SSYG Meet","present":["Divya Shah","Divyam Shah","Moksh Kothari"]},{"date":"2026-07-23","name":"SSYG Meet","present":["Bhagya Shah","Harshil Shah","Jaynish Mandot","Jenil Jain","Moksh Kothari","Rahul Kataria","Sashwat Doshi"]},{"date":"2026-07-23","name":"SSYG Meet (2)","present":["Bhagya Shah","Moksh Kothari","Rahul Kataria","Tejesh Jain"]},{"date":"2026-07-25","name":"SSYG Meet","present":["Divyam Shah","Moksh Kothari"]},{"date":"2026-08-01","name":"SSYG Meet","present":["Bhagya Shah","Divya Shah","Divyam Shah","Harshil Shah","Kunal Shah","Moksh Kothari","Neeil Shah","Nidhish Chhajed","Rakshit Jodhawat","Ronak Bhandari","Shlok Jain","Sumit Dhoka","Sushil Jain","Vidit Shah"]},{"date":"2026-08-02","name":"SSYG Meet","present":["Bhagya Shah","Jenil Jain","Kunal Shah","Moksh Kothari","Nidhish Chhajed","Sumit Dhoka","Vidit Shah"]},{"date":"2026-08-08","name":"SSYG Meet","present":["Divya Shah","Divyam Shah","Harsh Gungliea","Moksh Kothari","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-08-09","name":"SSYG Meet","present":["Bhagya Shah","Jenil Jain","Nidhish Chhajed"]},{"date":"2026-08-15","name":"SSYG Meet","present":["Divya Shah","Harshil Shah","Jenil Jain","Kunal Shah","Moksh Kothari","Neeil Shah","Rikin Dedhia","Sashwat Doshi","Sumit Dhoka","Sushil Jain","Vishal Dhoka"]},{"date":"2026-08-16","name":"SSYG Meet","present":["Jenil Jain"]},{"date":"2026-08-22","name":"SSYG Meet","present":["Divya Shah","Laksh Jain","Neeil Shah","Sushil Jain","Tejesh Jain"]},{"date":"2026-08-23","name":"SSYG Meet","present":["Bhagya Shah","Divya Shah","Harshil Shah","Jenil Jain","Kunal Shah","Laksh Jain","Meet Doshi","Moksh Kothari","Nidhish Chhajed","Rahul Kataria","Ronak Bhandari","Sashwat Doshi","Sumit Dhoka","Tejesh Jain"]},{"date":"2026-08-29","name":"SSYG Meet","present":["Moksh Kothari","Nidhish Chhajed","Ronak Bhandari","Sashwat Doshi","Vidit Shah"]},{"date":"2026-08-30","name":"SSYG Meet","present":["Jenil Jain"]},{"date":"2026-09-05","name":"SSYG Meet","present":[]},{"date":"2026-09-08","name":"SSYG Meet","present":["Bhagya Shah","Jenil Jain","Kunal Shah","Nidhish Chhajed","Rahul Kataria","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-09-09","name":"SSYG Meet","present":["Bhagya Shah","Harshil Shah","Kunal Shah","Neeil Shah","Nidhish Chhajed","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-09-10","name":"SSYG Meet","present":["Bhagya Shah","Divyam Shah","Harshil Shah","Jenil Jain","Laksh Jain","Neeil Shah","Nidhish Chhajed","Pratik Gundecha","Ronak Bhandari","Tirth Shah"]},{"date":"2026-09-11","name":"SSYG Meet","present":["Bhagya Shah","Divyam Shah","Harshil Shah","Laksh Jain","Manthan Gandhi","Neeil Shah","Ronak Bhandari"]},{"date":"2026-09-12","name":"SSYG Meet","present":["Divyam Shah","Harshil Shah","Laksh Jain","Pratik Gundecha","Ronak Bhandari","Sashwat Doshi","Sumit Dhoka"]},{"date":"2026-09-13","name":"SSYG Meet","present":["Bhagya Shah","Harshil Shah","Jenil Jain","Laksh Jain","Pratik Gundecha","Ronak Bhandari","Sashwat Doshi","Sumit Dhoka"]},{"date":"2026-09-13","name":"SSYG Meet (2)","present":["Bhagya Shah","Divyam Shah","Harsh Gungliea","Harshil Shah","Jenil Jain","Kunal Shah","Moksh Kothari","Neeil Shah","Pratik Gundecha","Ronak Bhandari","Shlok Jain","Sumit Dhoka"]},{"date":"2026-09-14","name":"SSYG Meet","present":["Bhagya Shah","Divya Shah","Divyam Shah","Harsh Gungliea","Harshil Shah","Jenil Jain","Kunal Shah","Neeil Shah","Pratik Gundecha","Ronak Bhandari","Shlok Jain","Sumit Dhoka"]},{"date":"2026-09-14","name":"SSYG Meet (2)","present":["Bhagya Shah","Harshil Shah","Jenil Jain","Laksh Jain","Pratik Gundecha","Ronak Bhandari","Sashwat Doshi","Sumit Dhoka"]},{"date":"2026-09-15","name":"SSYG Meet","present":["Harsh Gungliea","Harshil Shah","Manthan Gandhi","Pratik Gundecha","Rakshit Jodhawat","Ronak Bhandari","Shlok Jain","Sumit Dhoka"]},{"date":"2026-09-16","name":"SSYG Meet","present":["Harsh Gungliea","Hitesh Dhami","Jenil Jain","Rahul Kataria","Vishal Dhoka"]},{"date":"2026-09-19","name":"SSYG Meet","present":["Manthan Gandhi","Moksh Kothari","Ronak Bhandari","Sashwat Doshi"]},{"date":"2026-09-20","name":"SSYG Meet","present":["Bhagya Shah","Jenil Jain","Kunal Shah","Meet Doshi","Moksh Kothari","Nidhish Chhajed","Rahul Kataria"]},{"date":"2026-09-23","name":"SSYG Meet","present":["Bhagya Shah","Hitesh Dhami","Jenil Jain","Rahul Kataria","Sumit Dhoka","Tejesh Jain"]},{"date":"2026-09-24","name":"SSYG Meet","present":["Bhagya Shah","Divya Shah","Divyam Shah","Moksh Shah","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-09-25","name":"SSYG Meet","present":["Kunal Shah","Laksh Jain","Ronak Bhandari","Sashwat Doshi","Sushil Jain","Tejesh Jain"]},{"date":"2026-09-26","name":"SSYG Meet","present":["Divyam Shah","Manthan Gandhi","Ronak Bhandari","Sashwat Doshi","Tejesh Jain","Vidit Shah"]},{"date":"2026-09-27","name":"SSYG Meet","present":["Bhagya Shah","Divya Shah","Divyam Shah","Harshil Shah","Jaynish Mandot","Jenil Jain","Laksh Jain","Nidhish Chhajed","Pratik Gundecha","Ronak Bhandari","Tejesh Jain"]},{"date":"2026-09-27","name":"SSYG Meet (2)","present":["Bhagya Shah","Divya Shah","Divyam Shah","Jenil Jain","Laksh Jain","Nidhish Chhajed","Ronak Bhandari"]},{"date":"2026-09-27","name":"SSYG Meet (3)","present":["Harshil Shah","Hitesh Dhami","Moksh Kothari","Rahul Kataria","Sashwat Doshi","Vishal Dhoka"]},{"date":"2026-10-03","name":"SSYG Meet","present":["Divya Shah","Divyam Shah","Manthan Gandhi","Rahul Kataria","Sumit Dhoka"]},{"date":"2026-10-10","name":"SSYG Meet","present":["Divyam Shah","Harsh Gungliea","Ronak Bhandari","Vidit Shah"]},{"date":"2026-10-17","name":"SSYG Meet","present":["Divyam Shah","Ronak Bhandari","Sushil Jain"]},{"date":"2026-10-24","name":"SSYG Meet","present":["Bhagya Shah","Divyam Shah","Jenil Jain","Rishabh Kothari","Ronak Bhandari","Sashwat Doshi","Sushil Jain","Vidit Shah"]},{"date":"2026-10-30","name":"SSYG Meet","present":["Divyam Shah","Kunal Shah","Rahul Kataria","Sashwat Doshi","Shlok Jain","Sumit Dhoka"]},{"date":"2026-10-31","name":"SSYG Meet","present":["Divyam Shah","Ronak Bhandari"]},{"date":"2026-10-31","name":"SSYG Meet (2)","present":["Bhagya Shah","Divyam Shah","Hitesh Dhami","Jenil Jain","Ronak Bhandari","Sumit Dhoka"]},{"date":"2026-11-01","name":"SSYG Meet","present":["Divyam Shah","Jenil Jain","Kunal Shah","Ronak Bhandari","Shlok Jain","Sumit Dhoka"]}]};

function importOldData() {
  setup_();
  return withLock_(function () {
    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');

    // Members
    var idByName = {};
    readMembers_().forEach(function (m) { idByName[m.name.trim().toLowerCase()] = m.id; });
    var newMembers = [];
    OLD_DATA.members.forEach(function (name) {
      var k = name.toLowerCase();
      if (idByName[k]) return;
      var id = newId_('M');
      idByName[k] = id;
      newMembers.push([id, name, '', '', '', true, today_()]);
    });
    var msh = sheet_('members');
    if (newMembers.length) msh.getRange(msh.getLastRow() + 1, 1, newMembers.length, 7).setValues(newMembers);

    // Events + attendance
    var existing = {};
    readEvents_().forEach(function (e) { existing[e.date + '|' + e.name] = true; });
    var newEvents = [], newAtt = [];
    OLD_DATA.events.forEach(function (ev) {
      if (existing[ev.date + '|' + ev.name]) return;
      var id = newId_('E');
      newEvents.push([id, ev.date, ev.name, 'Imported from old attendance app', today_()]);
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
