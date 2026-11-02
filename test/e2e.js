// Run: ./test/build.sh && mkdir -p test/shots && node test/e2e.js
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('dialog', d => d.accept());
  await p.goto('file://' + process.cwd() + '/test/preview.html'); await p.waitForTimeout(300);
  const shot = n => p.screenshot({ path: 'test/shots/' + n + '.png' });
  const toast = () => p.textContent('#toast');
  const wait = (ms = 250) => p.waitForTimeout(ms);
  const check = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) process.exitCode = 1; };

  await shot('01-viewer-empty');
  check('viewer has no FAB', !(await p.isVisible('#fab')));
  // login
  await p.click('#authBtn'); await wait(); await p.fill('#pw', 'nope'); await p.click('#loginBtn'); await wait();
  check('wrong password rejected', (await toast()) === 'Wrong password.');
  await p.fill('#pw', 'secret123'); await p.click('#loginBtn'); await wait(400);
  check('admin mode', (await p.textContent('#appSub')).includes('Admin'));
  // members
  await p.click('#tabbar button[data-tab=members]'); await p.click('#bulkBtn'); await wait();
  await p.fill('#bText', ['Ravi Patel, 09876543210','Asha Shah','Kiran Mehta','asha shah','Priya Desai','Neel Trivedi','Meera Joshi','Arjun Bhatt','Kavya Modi'].join('\n'));
  await shot('02-paste-list');
  await p.click('#bSave'); await wait(400);
  check('bulk add skips duplicate', (await toast()) === '8 members added');
  await p.click('#fab'); await wait(); await p.fill('#mName', 'Dev Joshi'); await p.fill('#mPhone', '+911234'); await p.click('#mSave'); await wait(400);
  check('9 members', (await p.textContent('#memberCount')) === '9 members');
  await shot('03-members');
  // events
  await p.click('#tabbar button[data-tab=events]'); await p.click('#fab'); await wait();
  await p.fill('#fName', 'Diwali Sabha'); await p.fill('#fDate', '2026-10-15'); await p.fill('#fDesc', 'Evening program at the hall'); await p.fill('#fCat', 'Festival');
  await shot('04-new-event');
  await p.click('#evSave'); await wait(500);
  check('opens event after create', (await p.textContent('#evName')) === 'Diwali Sabha');
  for (const n of ['Asha', 'Ravi', 'Priya', 'Neel']) await p.click(`.mark:has-text("${n}")`);
  check('4 marked, unsaved', (await p.textContent('#evPresent')) === '4' && (await p.textContent('#actionbar')).includes('Unsaved'));
  await shot('05-marking');
  await p.click('#saveAttBtn'); await wait(400);
  check('saved', (await toast()) === 'Saved · 4 present');
  await p.click('#attFilter button[data-f=absent]'); await wait(100);
  check('absent filter', (await p.$$('.mark')).length === 5);
  await p.click('#backBtn'); await wait(300);
  check('back to list', await p.isVisible('#view-events'));
  await p.click('#fab'); await wait(); await p.fill('#fName', 'Weekly meet'); await p.fill('#fDate', '2026-11-01'); await p.click('#evSave'); await wait(500);
  await p.click('#moreBtn'); await wait(); await p.click('#qAll'); await wait(); await p.click('.mark:has-text("Arjun")');
  await p.click('#saveAttBtn'); await wait(400);
  check('mark all then untick one', (await toast()) === 'Saved · 8 present');
  await p.click('#backBtn'); await wait(300);
  check('category chips on events list', (await p.textContent('#eventCats')).includes('Festival'));
  await p.click('#eventCats button[data-c="Festival"]'); await wait(100);
  check('category filter shows 1 event', (await p.$$('.ev-card')).length === 1);
  await p.click('#eventCats button[data-c=""]'); await wait(100);
  // optional: event without category still saves; quick-pick chip fills the field
  await p.click('#fab'); await wait(); await p.fill('#fName', 'Seva day'); await p.fill('#fDate', '2026-09-05');
  await p.click('#catPick button[data-c="Festival"]');
  check('quick-pick fills category', (await p.inputValue('#fCat')) === 'Festival');
  await p.click('#catPick button[data-c="Festival"]');
  check('tap again clears category', (await p.inputValue('#fCat')) === '');
  await p.click('#evSave'); await wait(500); await p.click('#backBtn'); await wait(300);
  check('3 events', (await p.$$('.ev-card')).length === 3);
  await shot('06-events');
  // remove member
  await p.click('#tabbar button[data-tab=members]'); await p.click('#memberList .item:has-text("Kiran")'); await wait();
  await shot('07-edit-member');
  await p.click('#mRemove'); await wait(); await p.click('#cOk'); await wait(400);
  check('8 active after remove', (await p.textContent('#memberCount')) === '8 members');
  // reports
  await p.click('#tabbar button[data-tab=reports]'); await p.click('#rangeChips button[data-range=all]'); await wait(400);
  check('report 3 events', (await p.textContent('#reportStats')).includes('3Events'));
  await p.click('#repCats button[data-c="Festival"]'); await wait(400);
  check('report category filter', (await p.textContent('#reportStats')).includes('1Events'));
  await shot('08c-report-category');
  await p.click('#repCats button[data-c=""]'); await wait(400);
  await shot('08-report');
  await p.click('#fab'); await wait(); await shot('08b-download-sheet');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dCsv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  check('csv has header + removed member', csv.includes('2026-10-15 Diwali Sabha') && csv.includes('Kiran Mehta (removed)'));
  await wait(); await p.click('#fab'); await wait();
  const [pdf] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#dPdf')]);
  fs.copyFileSync(await pdf.path(), 'test/shots/report.pdf');
  check('pdf downloaded', pdf.suggestedFilename().endsWith('.pdf') && fs.readFileSync('test/shots/report.pdf').slice(0, 4).toString() === '%PDF');
  await p.click('#tableBtn'); await wait(); await shot('09-table');
  // viewer
  await p.click('#authBtn'); await wait(); await p.click('#cOk'); await wait(400);
  await p.click('#tabbar button[data-tab=events]'); await p.click('.ev-card:has-text("Diwali")'); await wait(400);
  check('viewer sees only present', (await p.$$('#attList .item')).length === 4 && !(await p.isVisible('#actionbar')));
  await shot('10-viewer-event');
  await p.click('#tabbar button[data-tab=members]'); await wait();
  check('viewer sees no phone', !(await p.textContent('#memberList')).includes('0987'));
  check('API blocks write without login', await p.evaluate(() => JSON.parse(doPost({ postData: { contents: JSON.stringify({ action: 'saveMember', args: ['x', { name: 'x' }] }) } }).text).error.includes('SESSION_EXPIRED')));
  check('API blocks private fn', await p.evaluate(() => JSON.parse(doPost({ postData: { contents: JSON.stringify({ action: 'setup_' }) } }).text).error.includes('Unknown')));
  // desktop + dark screenshot
  const d = await b.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  await d.goto('file://' + process.cwd() + '/test/preview.html'); await d.waitForTimeout(400);
  await d.screenshot({ path: 'test/shots/11-desktop-dark.png' });
  check('no JS errors', errs.length === 0); if (errs.length) console.log(errs);
  await b.close();
})();
