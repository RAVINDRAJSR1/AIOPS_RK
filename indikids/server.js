#!/usr/bin/env node
// IndiKids server: serves the apps and the live-mode JSON API. No dependencies.
//   node server.js            -> http://localhost:8080
//   PORT=3000 DATA_FILE=/path/data.json node server.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createStore } = require('./public/store.js');

const PORT = Number(process.env.PORT) || 8080;
const PUBLIC = path.join(__dirname, 'public');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'indikids.json');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

let cache = null;
const store = createStore({
  load() {
    if (!cache) {
      try {
        cache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      } catch {
        cache = {};
      }
    }
    return JSON.parse(JSON.stringify(cache));
  },
  save(state) {
    cache = state;
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, DATA_FILE);
  },
});

// Slow down guessing of 6-digit pairing codes: 10 tries per minute per address.
const pairTries = new Map();
function tooManyPairTries(ip) {
  const t = Date.now();
  const list = (pairTries.get(ip) || []).filter((x) => t - x < 60000);
  list.push(t);
  pairTries.set(ip, list);
  return list.length > 10;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, Object.assign({ 'Cache-Control': 'no-store' }, headers));
  res.end(body);
}

function json(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': TYPES['.json'] });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 32 * 1024) {
        reject(Object.assign(new Error('Request too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

// [method, pattern, handler(token, body, params, req)]
const routes = [
  ['POST', /^\/api\/family$/, (t, b) => store.createFamily(b)],
  ['GET', /^\/api\/family$/, (t) => store.parentView(t)],
  ['DELETE', /^\/api\/family$/, (t) => store.closeAccount(t)],
  ['POST', /^\/api\/family\/plan$/, (t, b) => store.setPlan(t, b.action)],
  ['POST', /^\/api\/family\/pair-code$/, (t) => store.newPairCode(t)],
  ['PUT', /^\/api\/children\/(\w+)\/rules$/, (t, b, p) => store.updateRules(t, p[1], b)],
  ['POST', /^\/api\/children\/(\w+)\/bonus$/, (t, b, p) => store.addBonus(t, p[1], b.minutes, b.day)],
  ['POST', /^\/api\/children\/(\w+)\/requests\/(\w+)$/, (t, b, p) => store.resolveRequest(t, p[1], p[2], b.approve, b.minutes)],
  ['DELETE', /^\/api\/children\/(\w+)$/, (t, b, p) => store.removeChild(t, p[1])],
  [
    'POST',
    /^\/api\/pair$/,
    (t, b, p, req) => {
      if (tooManyPairTries(req.socket.remoteAddress)) {
        throw Object.assign(new Error('Too many tries. Wait a minute and try again.'), { status: 429 });
      }
      return store.pair(b);
    },
  ],
  ['GET', /^\/api\/me$/, (t) => store.childView(t)],
  ['POST', /^\/api\/me\/report$/, (t, b) => store.childReport(t, b)],
  ['POST', /^\/api\/me\/request$/, (t, b) => store.childRequest(t, b)],
  ['POST', /^\/api\/me\/sos$/, (t, b) => store.childSos(t, b)],
];

async function handleApi(req, res, pathname) {
  const route = routes.find(([m, re]) => m === req.method && re.test(pathname));
  if (!route) return json(res, 404, { error: 'Not found' });
  try {
    const body = req.method === 'GET' ? {} : await readBody(req);
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    json(res, 200, route[2](token, body, pathname.match(route[1]), req));
  } catch (err) {
    json(res, err.status || 500, { error: err.status ? err.message : 'Server error' });
    if (!err.status) console.error(err);
  }
}

function serveStatic(res, pathname) {
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(PUBLIC, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    send(res, 200, data, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
  });
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname.startsWith('/api/')) handleApi(req, res, pathname);
  else if (req.method === 'GET' || req.method === 'HEAD') serveStatic(res, pathname);
  else send(res, 405, 'Method not allowed');
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`IndiKids running at http://localhost:${PORT}`));
}

module.exports = { server, store };
