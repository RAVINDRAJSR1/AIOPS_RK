// Browser check of both apps: demo mode first, then live mode against the server.
//   node tests/e2e.js [screenshot-dir]
'use strict';
const path = require('path');
const os = require('os');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

process.env.DATA_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ik-e2e-')), 'data.json');
const { server } = require('../server.js');
const shots = process.argv[2];
const errors = [];
let step = 0;

function check(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log(`  ✓ ${msg}`);
}
async function shot(page, name) {
  if (shots) await page.screenshot({ path: path.join(shots, `${String(++step).padStart(2, '0')}-${name}.png`), fullPage: false });
}
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/tile\.openstreetmap|Failed to load resource/.test(m.text()) && errors.push(`${label}: ${m.text()}`));
}
async function tab(page, name) {
  await page.click(`.tabs button[data-tab="${name}"]`);
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const phone = { viewport: { width: 400, height: 860 }, deviceScaleFactor: 1, geolocation: { latitude: 12.97, longitude: 77.59 }, permissions: ['geolocation'] };

  try {
    // ---------------- DEMO MODE ----------------
    console.log('Demo mode');
    const ctx = await browser.newContext(phone);
    const hub = await ctx.newPage();
    watch(hub, 'demo hub');
    await hub.setViewportSize({ width: 1000, height: 900 });
    await hub.goto(`${base}/demo.html`);
    await hub.frameLocator('#child-frame').locator('#launcher').waitFor();
    await hub.frameLocator('#parent-frame').locator('#used-today').waitFor();
    await shot(hub, 'demo-hub');
    await hub.close();

    const parent = await ctx.newPage();
    const child = await ctx.newPage();
    watch(parent, 'parent');
    watch(child, 'child');
    await parent.goto(`${base}/parent.html?demo=1`);
    await child.goto(`${base}/child.html?demo=1`);
    await child.locator('#launcher').waitFor();
    check(await parent.locator('.demo-badge').isVisible(), 'demo badge shown');
    check((await parent.locator('h2').first().textContent()).includes('Aarav'), 'parent sees seeded child Aarav');
    await shot(parent, 'parent-home');
    await shot(child, 'child-home');

    const usedBefore = await parent.locator('#used-today').textContent();
    await child.click('[data-app="youtube"]');
    await child.locator('#close-app').waitFor();
    await shot(child, 'child-using-youtube');
    await parent.waitForFunction(() => /Now using/.test(document.body.innerText), null, { timeout: 8000 });
    await parent.waitForTimeout(3000);
    const usedAfter = await parent.locator('#used-today').textContent();
    check(usedAfter !== usedBefore, `parent sees usage grow (${usedBefore} -> ${usedAfter})`);
    check(/Now using/.test(await parent.textContent('body')), 'parent sees app in use');

    // Lower the YouTube limit below what was used: child gets kicked out.
    await tab(parent, 'limits');
    await parent.selectOption('[data-applimit="youtube"]', '15');
    await child.locator('#lockscreen').waitFor({ timeout: 8000 });
    check(/limit for this app/i.test(await child.textContent('#lockscreen')), 'child locked out of YouTube by app limit');
    await shot(parent, 'parent-limits');
    await shot(child, 'child-locked');

    // Ask for more time -> parent approves -> unlocked.
    await child.click('#lock-ask');
    await child.selectOption('#ask-min', '30');
    await child.fill('#ask-note', 'Science video for homework');
    await child.click('#ask-form button[value="send"]');
    await tab(parent, 'home');
    await parent.locator('[data-approve]').waitFor({ timeout: 8000 });
    check(/Science video/.test(await parent.textContent('body')), 'parent sees request with note');
    await shot(parent, 'parent-request');
    await parent.click('[data-approve]');
    await child.waitForFunction(() => /gave you 30 more minutes/.test(document.body.innerText), null, { timeout: 8000 });
    check(!(await child.locator('[data-app="youtube"]').getAttribute('class')).includes('locked'), 'YouTube unlocked after approval');

    // Block an app.
    await tab(parent, 'limits');
    await parent.click('[data-allow="bgmi"]', { force: true });
    await child.waitForFunction(() => document.querySelector('[data-app="bgmi"]').classList.contains('locked'), null, { timeout: 8000 });
    check(true, 'blocked BGMI shows locked on child');
    await child.click('[data-app="bgmi"]');
    check(/Blocked by your parent/.test(await child.textContent('#lockscreen')), 'blocked app explains why');
    check((await child.locator('#lock-ask').count()) === 0, 'no "ask for time" on a blocked app');
    await child.click('#lock-home');

    // Pause the phone.
    await tab(parent, 'home');
    await parent.click('#pause-btn');
    await child.waitForFunction(() => /paused this phone/.test(document.body.innerText), null, { timeout: 8000 });
    check((await child.locator('.tile:not(.locked)').count()) === 5, 'paused: only the 5 essential apps open');
    await shot(child, 'child-paused');
    await parent.click('#pause-btn');
    await child.waitForFunction(() => !/paused this phone/.test(document.body.innerText), null, { timeout: 8000 });
    check(true, 'resume unlocks phone');

    // One button: block games & videos.
    await tab(parent, 'home');
    await parent.click('#fun-btn');
    await child.waitForFunction(() => document.querySelector('[data-app="youtube"]').classList.contains('locked'), null, { timeout: 8000 });
    check(/blocked games, entertainment, social apps/.test(await child.textContent('body')), 'one-button block: child sees banner');
    check(!(await child.locator('[data-app="whatsapp"]').getAttribute('class')).includes('locked'), 'one-button block leaves WhatsApp open');
    await shot(parent, 'parent-block-button');
    await shot(child, 'child-games-blocked');
    await parent.click('#fun-btn');
    await child.waitForFunction(() => !document.querySelector('[data-app="youtube"]').classList.contains('locked'), null, { timeout: 8000 });
    check(true, 'unblock restores games & videos');

    // School downtime (weekdays 09:00-15:00) locks only games and entertainment.
    if ([1, 2, 3, 4, 5].includes(new Date().getDay())) {
      await parent.evaluate(() => IK.setDemoHour(10));
      await child.reload();
      await child.waitForFunction(() => /School/.test(document.body.innerText), null, { timeout: 8000 });
      const cls = async (id) => child.locator(`[data-app="${id}"]`).getAttribute('class');
      check((await cls('freefire')).includes('locked') && !(await cls('whatsapp')).includes('locked'), 'school time: games locked, WhatsApp open');
      await shot(child, 'child-school');
    }

    // Sleep downtime via the demo clock.
    await parent.evaluate(() => IK.setDemoHour(22));
    await child.reload();
    await child.waitForFunction(() => /Sleep<\/strong> until/.test(document.body.innerHTML), null, { timeout: 8000 });
    check((await child.locator('.tile:not(.locked)').count()) === 5, 'sleep downtime at 22:00 locks all but essential apps');
    await shot(child, 'child-sleep');
    await parent.reload();
    await tab(parent, 'schedule');
    check(/Sleep<\/strong> is on right now/.test(await parent.innerHTML('#view')), 'parent sees sleep is on');
    await shot(parent, 'parent-downtime');
    await parent.click('[data-toggle="sleep"]', { force: true });
    await child.waitForFunction(() => !/Sleep<\/strong> until/.test(document.body.innerHTML), null, { timeout: 8000 });
    check(true, 'turning sleep off unlocks child');
    await parent.click('#add-dt');
    await parent.fill('#dt-label', 'Dinner');
    await parent.fill('#dt-start', '21:00');
    await parent.fill('#dt-end', '23:00');
    await parent.click('#dt-save');
    await child.waitForFunction(() => /Dinner/.test(document.body.innerText), null, { timeout: 8000 });
    check(true, 'new downtime from parent applies on child');
    await parent.evaluate(() => IK.setDemoHour(16));
    await child.reload();
    await child.locator('#launcher').waitFor();

    // Safe internet: browser + YouTube, history on the parent side.
    await child.click('[data-app="chrome"]');
    await child.fill('#web-input', 'online-casino-bonus.net');
    await child.click('#web-form button');
    await child.locator('#web-blocked').waitFor();
    check(/gambling/.test(await child.textContent('#web-blocked')), 'gambling site blocked in browser');
    await child.fill('#web-input', 'en.wikipedia.org/wiki/Tiger');
    await child.click('#web-form button');
    await child.locator('#web-ok').waitFor();
    check(true, 'normal site allowed');
    await shot(child, 'child-browser');
    await child.click('#close-app');
    await child.click('[data-app="youtube"]');
    await child.fill('#web-input', 'volcano experiment for kids');
    await child.click('#web-form button');
    await child.locator('#web-ok').waitFor();
    await child.click('#close-app');
    await tab(parent, 'web');
    await parent.waitForFunction(() => /volcano experiment/.test(document.getElementById('history').innerText), null, { timeout: 8000 });
    check(/online-casino-bonus\.net[\s\S]*Gambling/.test(await parent.textContent('#history')), 'parent history shows blocked gambling visit');
    await shot(parent, 'parent-internet');
    await parent.fill('[data-addsite="blockedSites"] input', 'wikipedia.org');
    await parent.click('[data-addsite="blockedSites"] button');
    await parent.waitForFunction(() => /wikipedia\.org/.test(document.body.innerText));
    await child.waitForTimeout(2500);
    await child.click('[data-app="chrome"]');
    await child.fill('#web-input', 'en.wikipedia.org');
    await child.click('#web-form button');
    await child.locator('#web-blocked').waitFor();
    check(/blocked this website/.test(await child.textContent('#web-blocked')), 'parent-blocked website is blocked on child');
    await child.click('#close-app');
    await parent.click('[data-hfilter="blocked"]');
    check((await parent.locator('#history li').count()) >= 3, 'history filter "Blocked" works');

    // SOS + location + reports.
    await child.click('#sos');
    await tab(parent, 'home');
    await parent.locator('#sos-alert').waitFor({ timeout: 8000 });
    check(true, 'SOS alert reaches parent');
    await tab(parent, 'location');
    await parent.locator('#map').waitFor();
    check(/Updated/.test(await parent.textContent('#view')), 'location tab shows map and update time');
    await shot(parent, 'parent-location');
    await tab(parent, 'reports');
    check((await parent.locator('.chart rect').count()) === 7, '7-day chart has 7 bars');
    check((await parent.locator('#usage-list li').count()) >= 3, 'per-app breakdown listed');
    await shot(parent, 'parent-reports');

    // Subscription.
    await tab(parent, 'settings');
    await shot(parent, 'parent-settings');
    await parent.click('#cancel-plan');
    await parent.click('#confirm-yes');
    await parent.waitForFunction(() => /subscription was cancelled/.test(document.body.innerText));
    await tab(parent, 'limits');
    await parent.selectOption('[data-applimit="youtube"]', '60');
    await parent.waitForFunction(() => /Activate a plan/.test(document.getElementById('toast').textContent));
    check(true, 'cancelled plan: rules cannot be changed');
    await tab(parent, 'settings');
    await parent.click('#subscribe');
    await parent.waitForFunction(() => /Premium/.test(document.body.innerText) && !/subscription was cancelled/.test(document.body.innerText));
    check(true, 're-activating Premium works');

    // Fresh pairing flow in demo.
    await parent.evaluate(() => IK.seedDemo({ withChild: false }));
    await parent.reload();
    await child.reload();
    await parent.click('#pair-btn');
    const code = (await parent.textContent('#pair-code')).trim();
    check(/^\d{6}$/.test(code), `pairing code shown (${code})`);
    await shot(parent, 'parent-pair-code');
    await child.fill('#code', '000000');
    await child.fill('#kid-name', 'Diya');
    await child.check('#terms');
    await child.check('#privacy');
    await child.click('#continue');
    await child.locator('.alert.bad').waitFor();
    check(true, 'wrong pairing code rejected');
    await child.fill('#code', code);
    await child.fill('#kid-name', 'Diya');
    await child.check('#terms');
    await child.check('#privacy');
    await shot(child, 'child-pairing');
    await child.click('#continue');
    await child.locator('[data-perm="location"]').waitFor();
    await shot(child, 'child-permissions');
    for (const p of ['location', 'usage', 'accessibility']) {
      await child.click(`[data-perm="${p}"]`);
      await child.waitForFunction((k) => !document.querySelector(`[data-perm="${k}"]`), p);
    }
    await child.click('#done');
    await child.locator('#launcher').waitFor();
    await parent.waitForFunction(() => /Diya/.test(document.body.innerText) && !/Permissions missing/.test(document.body.innerText), null, { timeout: 8000 });
    check(true, 'paired child Diya appears with all permissions');
    await ctx.close();

    // ---------------- LIVE MODE ----------------
    console.log('Live mode (server)');
    const pctx = await browser.newContext(phone);
    const cctx = await browser.newContext(phone);
    const lp = await pctx.newPage();
    const lc = await cctx.newPage();
    watch(lp, 'live parent');
    watch(lc, 'live child');
    await lp.goto(base + '/');
    await shot(lp, 'onboarding-welcome');
    check(await lp.locator('#start').isDisabled(), 'Start disabled until Terms and Privacy are accepted');
    await lp.check('#terms');
    check(await lp.locator('#start').isDisabled(), 'Terms alone is not enough');
    await lp.check('#privacy');
    await lp.click('#start');
    await shot(lp, 'onboarding-who');
    await lp.click('#next');
    check(await lp.locator('#next').isDisabled(), 'goals: Continue disabled until one is picked');
    await lp.click('[data-goal="sleep"]');
    await lp.click('[data-goal="location"]');
    await lp.click('[data-goal="threats"]');
    await shot(lp, 'onboarding-goals');
    await lp.click('#next');
    check(/Keep the phone away at bedtime/.test(await lp.textContent('body')), 'benefits match chosen goals');
    await shot(lp, 'onboarding-benefits');
    let guard = 0;
    const shotKinds = new Set();
    while (!(await lp.locator('#signup-form').count()) && guard++ < 20) {
      if (await lp.locator('[data-answer]').count()) {
        check(await lp.locator('#next').isDisabled(), `question ${guard}: Continue waits for an answer`);
        await lp.click('[data-answer="yes"]');
        if (!shotKinds.has('q')) { shotKinds.add('q'); await shot(lp, 'onboarding-question'); }
      } else if (await lp.locator('.mock-phone, .ob-cards, .mock-map').count()) {
        const title = await lp.textContent('.ob-title');
        if (shotKinds.size < 6) { shotKinds.add(title); await shot(lp, 'onboarding-info'); }
      }
      await lp.click('#next');
    }
    check(await lp.locator('#signup-form').count(), 'reached sign-up after all questions');
    const plan = await lp.textContent('.ob-benefits');
    check(/Sleep downtime/.test(plan) && /School downtime/.test(plan), 'plan summary reflects answers (sleep/study = yes)');
    await shot(lp, 'onboarding-signup');
    await lp.fill('#parent-name', 'Ravi');
    await lp.click('#get-started');
    await lp.waitForURL(/parent\.html/);
    await lp.click('#pair-btn');
    const liveCode = (await lp.textContent('#pair-code')).trim();
    await lc.goto(base + '/child.html');
    await lc.fill('#code', liveCode);
    await lc.fill('#kid-name', 'Meera');
    await lc.check('#terms');
    await lc.check('#privacy');
    await lc.click('#continue');
    await lc.click('[data-perm="location"]');
    await lc.waitForFunction(() => !document.querySelector('[data-perm="location"]'));
    await lc.click('[data-perm="usage"]');
    await lc.click('[data-perm="accessibility"]');
    await lc.click('#done');
    await lc.locator('#launcher').waitFor();
    await lp.waitForFunction(() => /Meera/.test(document.body.innerText), null, { timeout: 10000 });
    check(true, 'live: child pairs from a separate browser');
    const liveRules = await lc.evaluate(() => fetch('/api/me', { headers: { Authorization: 'Bearer ' + IK.token.get('child') } }).then((r) => r.json()));
    check(liveRules.child.rules.downtime.every((w) => w.enabled), 'live: child starts with downtime from onboarding answers');
    await lp.reload();
    await lp.locator('.tabs button[data-tab="location"]').click();
    await lp.locator('#map').waitFor({ timeout: 15000 });
    check(/12\.97/.test(await lp.textContent('#view')), 'live: real browser GPS location reaches parent');
    await lp.locator('.tabs button[data-tab="home"]').click();
    await lp.click('#pause-btn');
    await lc.waitForFunction(() => /paused this phone/.test(document.body.innerText), null, { timeout: 15000 });
    check(true, 'live: pause reaches child');
    await lp.locator('.tabs button[data-tab="settings"]').click();
    await lp.click('[data-remove]');
    await lp.click('#confirm-yes');
    await lc.waitForFunction(() => /Connect to your parent/.test(document.body.innerText), null, { timeout: 20000 });
    check(true, 'live: removing the device signs the child app out');
    await lp.click('#close-account');
    await lp.click('#confirm-yes');
    await lp.waitForURL(/index\.html/);
    check(true, 'live: close account returns to start');

    // "Kid" on the who-is-this screen goes to the child app.
    const kp = await (await browser.newContext(phone)).newPage();
    watch(kp, 'kid onboarding');
    await kp.goto(base + '/');
    await kp.check('#terms');
    await kp.check('#privacy');
    await kp.click('#start');
    await kp.click('[data-who="kid"]');
    await kp.click('#next');
    await kp.waitForURL(/child\.html/);
    check(true, '"Kid" choice opens IndiKids Child');

    check(errors.length === 0, 'no JavaScript errors in any page' + (errors.length ? ':\n' + errors.join('\n') : ''));
    console.log('\nALL CHECKS PASSED');
  } catch (e) {
    console.error(e.message);
    if (errors.length) console.error('Page errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})();
