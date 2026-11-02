// Run: ./test/build.sh && mkdir -p test/shots && node test/e2e.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('file://' + process.cwd() + '/test/preview.html'); await p.waitForTimeout(300);
  const toast = async () => (await p.textContent('#toast'));
  // viewer: no admin buttons
  console.log('viewer new-event visible:', await p.isVisible('#newEventBtn'));
  // wrong password
  await p.click('#authBtn'); await p.fill('#pw', 'nope'); await p.click('#loginForm button[type=submit]'); await p.waitForTimeout(200);
  console.log('wrong pw toast:', await toast());
  await p.fill('#pw', 'secret123'); await p.click('#loginForm button[type=submit]'); await p.waitForTimeout(300);
  console.log('badge:', await p.textContent('#modeBadge'));
  // bulk add members
  await p.click('nav button[data-tab=members]'); await p.click('#bulkBtn');
  await p.fill('#bText', 'Ravi Patel, 09876543210\nAsha Shah\nKiran Mehta\nasha shah\n'); await p.click('#bForm button[type=submit]'); await p.waitForTimeout(300);
  console.log('bulk toast:', await toast(), '|', await p.textContent('#memberCount'));
  // add single
  await p.click('#newMemberBtn'); await p.fill('#mName', 'Dev Joshi'); await p.fill('#mPhone', '+911234'); await p.click('#mForm button[type=submit]'); await p.waitForTimeout(300);
  console.log(await p.textContent('#memberCount'));
  // event
  await p.click('nav button[data-tab=events]'); await p.click('#newEventBtn');
  await p.fill('#fDate', '2026-10-15'); await p.fill('#fName', 'Diwali Sabha'); await p.fill('#fDesc', 'Evening program'); await p.click('#evForm button[type=submit]'); await p.waitForTimeout(400);
  console.log('event view:', await p.textContent('#evName'), await p.textContent('#attCount'));
  await p.click('.check:has-text("Asha") input'); await p.click('.check:has-text("Ravi") input');
  console.log(await p.textContent('#attCount'));
  await p.click('#saveAttBtn'); await p.waitForTimeout(300); console.log('save:', await toast());
  await p.screenshot({ path: 'test/shots/mark.png', fullPage: true });
  // 2nd event
  await p.click('#backBtn'); await p.click('#newEventBtn'); await p.fill('#fDate', '2026-11-01'); await p.fill('#fName', 'Weekly meet'); await p.click('#evForm button[type=submit]'); await p.waitForTimeout(400);
  await p.click('#allBtn'); await p.click('#saveAttBtn'); await p.waitForTimeout(300); console.log('save2:', await toast());
  // remove Kiran (soft)
  await p.click('nav button[data-tab=members]'); await p.click('.member:has-text("Kiran") button[data-act=remove]'); await p.click('#cOk'); await p.waitForTimeout(300);
  console.log(await p.textContent('#memberCount'));
  // edit event
  await p.click('nav button[data-tab=events]'); await p.waitForTimeout(100);
  await p.screenshot({ path: 'test/shots/events.png', fullPage: true });
  console.log('events list:', (await p.textContent('#eventList')).replace(/\s+/g,' '));
  // export
  await p.click('nav button[data-tab=export]'); await p.fill('#fromDate', '2026-10-01'); await p.fill('#toDate', '2026-10-31'); await p.click('#previewBtn'); await p.waitForTimeout(300);
  console.log('report oct:', await p.textContent('#reportInfo'));
  await p.click('[data-range=all]'); await p.waitForTimeout(300);
  console.log('report all:', await p.textContent('#reportInfo'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csvBtn')]);
  const path = await dl.path(); console.log('csv', dl.suggestedFilename()); console.log(require('fs').readFileSync(path,'utf8'));
  await p.screenshot({ path: 'test/shots/export.png', fullPage: true });
  // viewer mode
  await p.click('#authBtn'); await p.waitForTimeout(300);
  await p.click('nav button[data-tab=events]'); await p.click('.list-item:has-text("Diwali")'); await p.waitForTimeout(300);
  console.log('viewer event:', (await p.textContent('#attList')).replace(/\s+/g,' '), '|', await p.textContent('#attCountView'), 'save visible', await p.isVisible('#saveAttBtn'));
  await p.click('nav button[data-tab=members]'); console.log('viewer members:', (await p.textContent('#memberList')).replace(/\s+/g,' '));
  // direct backend call without token must fail
  const r = await p.evaluate(() => { try { saveMember('bad', {name:'x'}); return 'allowed'; } catch(e) { return e.message; } });
  console.log('no-token write:', r);
  console.log('sheets:', JSON.stringify(await p.evaluate(() => Object.fromEntries(Object.entries(__sheets).map(([k,v])=>[k,v.data.length])))));
  console.log('ERRORS:', errs);
  await b.close();
})();
