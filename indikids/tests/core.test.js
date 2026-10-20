'use strict';
const test = require('node:test');
const assert = require('node:assert');
const C = require('../public/core.js');

function kid(rules, usage) {
  return { rules: Object.assign(C.defaultRules(), { downtime: [] }, rules), usage: usage || {} };
}
const at = (s) => new Date(s); // local time
const DAY = '2026-10-20'; // a Tuesday

test('essential apps are always allowed', () => {
  const c = kid({ paused: true, dailyLimitMin: 1 }, { [DAY]: { youtube: 500 } });
  assert.equal(C.appStatus(c, 'phone', at(`${DAY}T12:00`)).allowed, true);
  assert.equal(C.appStatus(c, 'classroom', at(`${DAY}T12:00`)).allowed, true);
});

test('daily limit locks non-essential apps and ignores essential usage', () => {
  const c = kid({ dailyLimitMin: 60, appLimits: {} }, { [DAY]: { youtube: 50, classroom: 200 } });
  assert.equal(C.remainingToday(c, at(`${DAY}T12:00`)), 10);
  assert.deepEqual(C.appStatus(c, 'whatsapp', at(`${DAY}T12:00`)).allowed, true);
  c.usage[DAY].youtube = 60;
  assert.equal(C.appStatus(c, 'whatsapp', at(`${DAY}T12:00`)).reason, 'daily-limit');
});

test('per-app limit and bonus minutes', () => {
  const c = kid({ dailyLimitMin: 120, appLimits: { youtube: 30 } }, { [DAY]: { youtube: 30 } });
  assert.equal(C.appStatus(c, 'youtube', at(`${DAY}T12:00`)).reason, 'app-limit');
  assert.equal(C.appStatus(c, 'instagram', at(`${DAY}T12:00`)).allowed, true);
  c.rules.bonus[DAY] = 15;
  const st = C.appStatus(c, 'youtube', at(`${DAY}T12:00`));
  assert.equal(st.allowed, true);
  assert.equal(st.remaining, 15);
});

test('blocked and paused', () => {
  assert.equal(C.appStatus(kid({ blockedApps: ['bgmi'] }), 'bgmi', at(`${DAY}T12:00`)).reason, 'blocked');
  assert.equal(C.appStatus(kid({ paused: true }), 'bgmi', at(`${DAY}T12:00`)).reason, 'paused');
});

test('downtime windows, including ones that cross midnight', () => {
  const rules = {
    downtime: [
      { id: 'bed', label: 'Bedtime', start: '21:30', end: '07:00', days: [2], enabled: true }, // Tuesday night
      { id: 'study', label: 'Study', start: '17:00', end: '19:00', days: [1, 2, 3, 4, 5], enabled: true },
    ],
  };
  const c = kid(rules);
  assert.equal(C.activeDowntime(c.rules, at(`${DAY}T22:00`)).id, 'bed');
  assert.equal(C.activeDowntime(c.rules, at('2026-10-21T06:30')).id, 'bed'); // Wed morning, started Tue
  assert.equal(C.activeDowntime(c.rules, at('2026-10-21T07:00')), null);
  assert.equal(C.activeDowntime(c.rules, at('2026-10-20T06:30')), null); // Tue morning: Mon night not scheduled
  assert.equal(C.activeDowntime(c.rules, at(`${DAY}T18:00`)).id, 'study');
  assert.equal(C.activeDowntime(c.rules, at('2026-10-25T18:00')), null); // Sunday
  assert.equal(C.appStatus(c, 'youtube', at(`${DAY}T18:00`)).reason, 'downtime');
  c.rules.downtime[1].enabled = false;
  assert.equal(C.activeDowntime(c.rules, at(`${DAY}T18:00`)), null);
});

test('no daily limit means unlimited', () => {
  const c = kid({ dailyLimitMin: 0, appLimits: {} }, { [DAY]: { youtube: 900 } });
  assert.equal(C.appStatus(c, 'youtube', at(`${DAY}T12:00`)).allowed, true);
});

test('sanitizeRules drops bad input', () => {
  const r = C.sanitizeRules({
    dailyLimitMin: -5,
    appLimits: { youtube: 30, phone: 10, nope: 5 },
    blockedApps: ['bgmi', 'phone', 'bgmi', 'x'],
    downtime: [{ label: '<b>x</b>', start: '25:00', end: '07:00', days: [1] }, { start: '08:00', end: '09:00', days: [9, 1, 1] }],
  });
  assert.equal(r.dailyLimitMin, 0);
  assert.deepEqual(r.appLimits, { youtube: 30 });
  assert.deepEqual(r.blockedApps, ['bgmi']);
  assert.equal(r.downtime.length, 1);
  assert.deepEqual(r.downtime[0].days, [1]);
});

test('formatMin', () => {
  assert.equal(C.formatMin(0), '0m');
  assert.equal(C.formatMin(45), '45m');
  assert.equal(C.formatMin(60), '1h');
  assert.equal(C.formatMin(95), '1h 35m');
  assert.equal(C.formatMin(Infinity), 'No limit');
});

test('one-button block locks games, videos and social only', () => {
  const c = kid({ blockedCategories: C.FUN_CATEGORIES });
  const now = at(`${DAY}T12:00`);
  assert.equal(C.appStatus(c, 'youtube', now).reason, 'category');
  assert.equal(C.appStatus(c, 'bgmi', now).reason, 'category');
  assert.equal(C.appStatus(c, 'instagram', now).reason, 'category');
  assert.equal(C.appStatus(c, 'whatsapp', now).allowed, true);
  assert.equal(C.appStatus(c, 'phone', now).allowed, true);
});

test('downtime can lock only some kinds of apps', () => {
  const c = kid({ downtime: [{ id: 'school', label: 'School', start: '09:00', end: '15:00', days: [2], blocks: ['Games', 'Entertainment'], enabled: true }] });
  const now = at(`${DAY}T10:00`);
  assert.equal(C.appStatus(c, 'bgmi', now).reason, 'downtime');
  assert.equal(C.appStatus(c, 'youtube', now).reason, 'downtime');
  assert.equal(C.appStatus(c, 'whatsapp', now).allowed, true);
  assert.equal(C.activeDowntime(c.rules, now).id, 'school', 'banner still shows the window');
});

test('starting rules follow onboarding answers', () => {
  const none = C.defaultRules({ goals: ['location'], answers: { sleepStudy: false } });
  assert.deepEqual(none.downtime.map((w) => w.enabled), [false, false]);
  const sleep = C.defaultRules({ goals: ['sleep'], answers: {} });
  assert.deepEqual(sleep.downtime.map((w) => [w.id, w.enabled]), [['school', false], ['sleep', true]]);
  const yes = C.defaultRules({ goals: [], answers: { sleepStudy: true } });
  assert.deepEqual(yes.downtime.map((w) => w.enabled), [true, true]);
  const skipped = C.defaultRules(null);
  assert.deepEqual(skipped.downtime.map((w) => w.enabled), [true, true]);
  assert.equal(skipped.downtime[1].blocks, 'all');
  assert.deepEqual(skipped.downtime[0].blocks, ['Games', 'Entertainment', 'Social']);
});

test('website filter', () => {
  const rules = C.defaultRules();
  assert.equal(C.checkWeb(rules, 'en.wikipedia.org').allowed, true);
  assert.equal(C.checkWeb(rules, 'how to draw a tiger').allowed, true);
  assert.equal(C.checkWeb(rules, 'xxx-films.com').reason, 'adult');
  assert.equal(C.checkWeb(rules, 'https://www.gambling.com/offers').reason, 'gambling');
  assert.equal(C.checkWeb(rules, 'online rummy cash').reason, 'gambling');
  rules.web.blockedSites = ['instagram.com'];
  assert.equal(C.checkWeb(rules, 'm.instagram.com').reason, 'blocked-site');
  assert.equal(C.checkWeb(rules, 'notinstagram.com').allowed, true);
  rules.web.allowedSites = ['sexeducation.example.org'];
  assert.equal(C.checkWeb(rules, 'sexeducation.example.org').allowed, true, 'allow list wins');
  rules.web.filter = false;
  assert.equal(C.checkWeb(rules, 'casino.com').allowed, true);
  assert.equal(C.checkWeb(rules, 'instagram.com').allowed, false, 'blocked sites apply even with the filter off');
});

test('sanitizeRules keeps categories, downtime blocks and web settings', () => {
  const r = C.sanitizeRules({
    blockedCategories: ['Games', 'Nope'],
    downtime: [{ start: '09:00', end: '15:00', days: [1], blocks: ['Games', 'Bad'] }, { start: '22:00', end: '07:00', days: [1], blocks: 'all' }],
    web: { filter: true, blockAdult: false, blockedSites: ['https://www.Example.com/x', 'not a site'], allowedSites: [] },
  });
  assert.deepEqual(r.blockedCategories, ['Games']);
  assert.deepEqual(r.downtime[0].blocks, ['Games']);
  assert.equal(r.downtime[1].blocks, 'all');
  assert.equal(r.web.blockAdult, false);
  assert.equal(r.web.blockGambling, true);
  assert.deepEqual(r.web.blockedSites, ['example.com']);
});
