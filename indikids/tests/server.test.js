'use strict';
const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.DATA_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ik-')), 'data.json');
const { server } = require('../server.js');

test('live API end to end', async (t) => {
  await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, token, body) => {
    const res = await fetch(base + url, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json() };
  };

  const fam = await call('POST', '/api/family', null, { parentName: 'Priya', acceptedTerms: true, acceptedPrivacy: true });
  assert.equal(fam.status, 200);
  const p = fam.data.token;
  const { data: pc } = await call('POST', '/api/family/pair-code', p, {});
  const kid = await call('POST', '/api/pair', null, { code: pc.code, childName: 'Aarav', acceptedTerms: true, acceptedPrivacy: true });
  assert.equal(kid.status, 200);
  const c = kid.data.token;
  const id = kid.data.childId;

  assert.equal((await call('PUT', `/api/children/${id}/rules`, p, { dailyLimitMin: 30, downtime: [] })).status, 200);
  assert.equal((await call('POST', '/api/me/report', c, { usage: { '2026-10-20': { youtube: 5 } } })).status, 200);
  const me = await call('GET', '/api/me', c);
  assert.equal(me.data.child.rules.dailyLimitMin, 30);
  assert.equal(me.data.child.usage['2026-10-20'].youtube, 5);

  assert.equal((await call('GET', '/api/family', c)).status, 401, 'child token cannot read parent data');
  assert.equal((await call('GET', '/api/family')).status, 401);
  assert.equal((await call('GET', '/api/nope')).status, 404);
  assert.ok(fs.existsSync(process.env.DATA_FILE), 'data is saved to disk');

  const page = await fetch(base + '/parent.html');
  assert.equal(page.status, 200);
  assert.equal((await fetch(base + '/../server.js')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e/server.js')).status, 404);
  assert.equal((await fetch(base + '/..%2Fserver.js')).status, 403);
});
