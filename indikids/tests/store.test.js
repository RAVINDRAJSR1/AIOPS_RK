'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createStore } = require('../public/store.js');

function setup() {
  let state = {};
  let t = new Date('2026-10-20T12:00').getTime();
  const store = createStore({ load: () => JSON.parse(JSON.stringify(state)), save: (s) => (state = s), now: () => t });
  return { store, advance: (ms) => (t += ms) };
}

function family(store) {
  const fam = store.createFamily({ parentName: 'Priya', acceptedTerms: true, acceptedPrivacy: true });
  const { code } = store.newPairCode(fam.token);
  const kid = store.pair({ code, childName: 'Aarav', deviceName: 'Redmi', acceptedTerms: true, acceptedPrivacy: true });
  return { p: fam.token, c: kid.token, id: kid.childId };
}

test('terms must be accepted', () => {
  const { store } = setup();
  assert.throws(() => store.createFamily({ parentName: 'X' }), /Terms/);
  assert.throws(() => store.createFamily({ parentName: 'X', acceptedTerms: true }), /Privacy/);
});

test('pairing links child to parent; codes are single use and expire', () => {
  const { store, advance } = setup();
  const { p, id } = family(store);
  assert.equal(store.parentView(p).children[id].name, 'Aarav');
  const { code } = store.newPairCode(p);
  store.pair({ code, childName: 'Diya', acceptedTerms: true, acceptedPrivacy: true });
  assert.throws(() => store.pair({ code, childName: 'Again', acceptedTerms: true, acceptedPrivacy: true }), /expired/);
  const { code: c2 } = store.newPairCode(p);
  advance(31 * 60000);
  assert.throws(() => store.pair({ code: c2, childName: 'Late', acceptedTerms: true, acceptedPrivacy: true }), /expired/);
});

test('roles are enforced', () => {
  const { store } = setup();
  const { p, c, id } = family(store);
  assert.throws(() => store.parentView(c), (e) => e.status === 401);
  assert.throws(() => store.childView(p), (e) => e.status === 401);
  assert.throws(() => store.updateRules('nope', id, {}), (e) => e.status === 401);
  const other = store.createFamily({ parentName: 'Other', acceptedTerms: true, acceptedPrivacy: true });
  assert.throws(() => store.updateRules(other.token, id, {}), (e) => e.status === 404);
});

test('child reports usage, location and battery', () => {
  const { store } = setup();
  const { p, c, id } = family(store);
  store.childReport(c, { usage: { '2026-10-20': { youtube: 2.5, bogus: 3 } }, location: { lat: 12.9, lng: 77.6, accuracy: 10 }, battery: 55, currentApp: 'youtube' });
  store.childReport(c, { usage: { '2026-10-20': { youtube: 1 } } });
  const kid = store.parentView(p).children[id];
  assert.deepEqual(kid.usage['2026-10-20'], { youtube: 3.5 });
  assert.equal(kid.location.lat, 12.9);
  assert.equal(kid.battery, 55);
  store.childReport(c, { usage: { '2026-10-20': { youtube: 999 } } });
  assert.equal(store.parentView(p).children[id].usage['2026-10-20'].youtube, 18.5, 'one report is capped at 15 minutes');
});

test('time requests: approve adds bonus for that day, one pending at a time', () => {
  const { store } = setup();
  const { p, c, id } = family(store);
  const req = store.childRequest(c, { appId: 'youtube', minutes: 30, note: 'project', day: '2026-10-20' });
  assert.throws(() => store.childRequest(c, { minutes: 15 }), /already/);
  store.resolveRequest(p, id, req.id, true);
  assert.throws(() => store.resolveRequest(p, id, req.id, true), /already/);
  const kid = store.parentView(p).children[id];
  assert.equal(kid.rules.bonus['2026-10-20'], 30);
  assert.equal(kid.requests[0].status, 'approved');
  assert.ok(store.parentView(p).events.some((e) => e.type === 'request'));
});

test('rules are sanitized and visible to the child', () => {
  const { store } = setup();
  const { p, c, id } = family(store);
  store.updateRules(p, id, { dailyLimitMin: 90, blockedApps: ['bgmi', 'phone'], paused: true, downtime: [] });
  const r = store.childView(c).child.rules;
  assert.equal(r.dailyLimitMin, 90);
  assert.deepEqual(r.blockedApps, ['bgmi']);
  assert.equal(r.paused, true);
});

test('SOS creates an alert; removing a child signs the device out', () => {
  const { store } = setup();
  const { p, c, id } = family(store);
  store.childSos(c, { location: { lat: 1, lng: 2 } });
  assert.equal(store.parentView(p).events[0].type, 'sos');
  store.removeChild(p, id);
  assert.throws(() => store.childView(c), (e) => e.status === 401);
});

test('subscription: trial, cancel, subscribe; close account deletes everything', () => {
  const { store, advance } = setup();
  const { p, c } = family(store);
  assert.equal(store.parentView(p).trialActive, true);
  advance(8 * 864e5);
  assert.equal(store.parentView(p).premiumActive, false);
  assert.equal(store.setPlan(p, 'subscribe').premiumActive, true);
  assert.equal(store.setPlan(p, 'cancel').premiumActive, false);
  store.closeAccount(p);
  assert.throws(() => store.parentView(p), (e) => e.status === 401);
  assert.throws(() => store.childView(c), (e) => e.status === 401);
});

test('onboarding answers set the first child rules', () => {
  const { store } = setup();
  const fam = store.createFamily({ parentName: 'P', acceptedTerms: true, acceptedPrivacy: true, setup: { goals: ['sleep', 'bogus'], answers: { websites: true, x: 1 } } });
  assert.deepEqual(store.parentView(fam.token).setup, { goals: ['sleep'], answers: { websites: true }, skipped: false });
  const { code } = store.newPairCode(fam.token);
  const kid = store.pair({ code, childName: 'K', acceptedTerms: true, acceptedPrivacy: true });
  const rules = store.parentView(fam.token).children[kid.childId].rules;
  assert.deepEqual(rules.downtime.map((w) => [w.id, w.enabled]), [['school', false], ['sleep', true]]);
});

test('browsing and YouTube history', () => {
  const { store, advance } = setup();
  const { p, c, id } = family(store);
  store.childHistory(c, { type: 'web', text: 'gambling.com', blocked: true, reason: 'gambling' });
  store.childHistory(c, { type: 'youtube', text: 'volcano experiment' });
  let h = store.parentView(p).children[id].history;
  assert.equal(h.length, 2);
  assert.equal(h[0].type, 'youtube');
  assert.equal(h[1].blocked, true);
  assert.throws(() => store.childHistory(c, { text: '  ' }), /Nothing/);
  assert.throws(() => store.childHistory(p, { text: 'x' }), (e) => e.status === 401);
  advance(31 * 864e5);
  store.childHistory(c, { text: 'new.example.com' });
  h = store.parentView(p).children[id].history;
  assert.equal(h.length, 1, 'entries older than 30 days are dropped');
  store.clearHistory(p, id);
  assert.equal(store.parentView(p).children[id].history.length, 0);
});
