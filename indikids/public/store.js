// IndiKids data store. The same code backs the Node server (live mode, saved to a
// JSON file) and the in-browser demo backend (saved to localStorage).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.IKStore = factory(root.IKCore);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

  const PAIR_CODE_TTL = 30 * 60 * 1000;
  const MAX_EVENTS = 50;
  const KEEP_DAYS = 30;

  function fail(status, message) {
    const err = new Error(message);
    err.status = status;
    throw err;
  }

  function randomHex(bytes) {
    const a = new Uint8Array(bytes);
    globalThis.crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function randomCode() {
    const a = new Uint32Array(1);
    globalThis.crypto.getRandomValues(a);
    return String(a[0] % 1000000).padStart(6, '0');
  }

  function clean(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function text(v, max, fallback) {
    const s = String(v == null ? '' : v).trim().slice(0, max);
    return s || fallback;
  }

  function createStore({ load, save, now = () => Date.now() }) {
    function read() {
      const s = load() || {};
      s.families = s.families || {};
      s.tokens = s.tokens || {};
      s.codes = s.codes || {};
      return s;
    }

    function auth(state, token, role) {
      const t = state.tokens[token];
      if (!t || t.role !== role || !state.families[t.familyId]) fail(401, 'Not signed in');
      const family = state.families[t.familyId];
      if (role === 'child') {
        const child = family.children[t.childId];
        if (!child) fail(401, 'This device was removed by the parent');
        return { family, child };
      }
      return { family };
    }

    function getChild(family, childId) {
      const c = family.children[childId];
      if (!c) fail(404, 'Child not found');
      return c;
    }

    function addEvent(family, ev) {
      family.events.unshift(Object.assign({ id: randomHex(4), ts: now() }, ev));
      family.events.length = Math.min(family.events.length, MAX_EVENTS);
    }

    function trimUsage(child) {
      const cutoff = Core.dayKey(now() - KEEP_DAYS * 864e5);
      for (const k of Object.keys(child.usage)) if (k < cutoff) delete child.usage[k];
      for (const k of Object.keys(child.rules.bonus || {})) if (k < cutoff) delete child.rules.bonus[k];
    }

    // Run `fn` against fresh state and persist it afterwards.
    function tx(fn) {
      const state = read();
      const result = fn(state);
      save(state);
      return result === undefined ? { ok: true } : clean(result);
    }

    function familyView(family) {
      const view = clean(family);
      view.trialActive = family.plan === 'trial' && now() < family.trialEndsAt;
      view.premiumActive = family.plan === 'premium' || view.trialActive;
      return view;
    }

    return {
      createFamily({ parentName, acceptedTerms }) {
        if (!acceptedTerms) fail(400, 'Please accept the Terms of Use to continue');
        return tx((s) => {
          const familyId = randomHex(6);
          const token = randomHex(16);
          s.families[familyId] = {
            id: familyId,
            parentName: text(parentName, 40, 'Parent'),
            createdAt: now(),
            termsAcceptedAt: now(),
            plan: 'trial',
            trialEndsAt: now() + Core.TRIAL_DAYS * 864e5,
            children: {},
            events: [],
          };
          s.tokens[token] = { role: 'parent', familyId };
          return { token, familyId };
        });
      },

      parentView(token) {
        const s = read();
        return familyView(auth(s, token, 'parent').family);
      },

      newPairCode(token) {
        return tx((s) => {
          const { family } = auth(s, token, 'parent');
          for (const [c, v] of Object.entries(s.codes)) {
            if (v.familyId === family.id || v.expiresAt < now()) delete s.codes[c];
          }
          let code = randomCode();
          while (s.codes[code]) code = randomCode();
          s.codes[code] = { familyId: family.id, expiresAt: now() + PAIR_CODE_TTL };
          return { code, expiresAt: s.codes[code].expiresAt };
        });
      },

      pair({ code, childName, deviceName, acceptedTerms }) {
        if (!acceptedTerms) fail(400, 'Please accept the Terms of Use to continue');
        return tx((s) => {
          const entry = s.codes[String(code || '').trim()];
          if (!entry || entry.expiresAt < now() || !s.families[entry.familyId]) {
            fail(400, 'That pairing code is wrong or has expired. Ask your parent for a new one.');
          }
          delete s.codes[String(code).trim()];
          const family = s.families[entry.familyId];
          const childId = randomHex(6);
          const token = randomHex(16);
          family.children[childId] = {
            id: childId,
            name: text(childName, 30, 'Child'),
            deviceName: text(deviceName, 40, 'Child phone'),
            pairedAt: now(),
            lastSeen: now(),
            battery: null,
            currentApp: null,
            location: null,
            permissions: { location: false, usage: false, accessibility: false },
            rules: Core.defaultRules(),
            usage: {},
            requests: [],
          };
          s.tokens[token] = { role: 'child', familyId: family.id, childId };
          addEvent(family, { type: 'paired', childId, text: `${family.children[childId].name}'s device is connected` });
          return { token, childId };
        });
      },

      updateRules(token, childId, rules) {
        return tx((s) => {
          const child = getChild(auth(s, token, 'parent').family, childId);
          child.rules = Core.sanitizeRules(rules);
          return child.rules;
        });
      },

      addBonus(token, childId, minutes, day) {
        return tx((s) => {
          const child = getChild(auth(s, token, 'parent').family, childId);
          const key = /^\d{4}-\d{2}-\d{2}$/.test(day || '') ? day : Core.dayKey(now());
          const min = Math.max(0, Math.min(240, Math.round(Number(minutes) || 0)));
          child.rules.bonus[key] = (child.rules.bonus[key] || 0) + min;
          return child.rules;
        });
      },

      resolveRequest(token, childId, requestId, approve, minutes) {
        return tx((s) => {
          const { family } = auth(s, token, 'parent');
          const child = getChild(family, childId);
          const req = child.requests.find((r) => r.id === requestId);
          if (!req) fail(404, 'Request not found');
          if (req.status !== 'pending') fail(409, 'Request was already answered');
          req.status = approve ? 'approved' : 'declined';
          req.answeredAt = now();
          if (approve) {
            req.granted = Math.max(5, Math.min(240, Math.round(Number(minutes) || req.minutes)));
            child.rules.bonus[req.day] = (child.rules.bonus[req.day] || 0) + req.granted;
          }
          return req;
        });
      },

      removeChild(token, childId) {
        return tx((s) => {
          const { family } = auth(s, token, 'parent');
          const child = getChild(family, childId);
          delete family.children[childId];
          for (const [t, v] of Object.entries(s.tokens)) if (v.childId === childId) delete s.tokens[t];
          addEvent(family, { type: 'removed', text: `${child.name}'s device was removed` });
        });
      },

      setPlan(token, action) {
        return tx((s) => {
          const { family } = auth(s, token, 'parent');
          if (action === 'subscribe') family.plan = 'premium';
          else if (action === 'cancel') {
            family.plan = 'cancelled';
            family.cancelledAt = now();
          } else fail(400, 'Unknown plan action');
          return familyView(family);
        });
      },

      closeAccount(token) {
        return tx((s) => {
          const { family } = auth(s, token, 'parent');
          delete s.families[family.id];
          for (const [t, v] of Object.entries(s.tokens)) if (v.familyId === family.id) delete s.tokens[t];
          for (const [c, v] of Object.entries(s.codes)) if (v.familyId === family.id) delete s.codes[c];
        });
      },

      childView(token) {
        const s = read();
        const { family, child } = auth(s, token, 'child');
        return { parentName: family.parentName, child: clean(child) };
      },

      // Periodic check-in from the child device. `usage` holds minutes used since
      // the last report, keyed by the device's local day: { '2026-10-20': { youtube: 1.5 } }.
      childReport(token, report) {
        return tx((s) => {
          const { child } = auth(s, token, 'child');
          const r = report || {};
          for (const [day, apps] of Object.entries(r.usage || {})) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
            const bucket = (child.usage[day] = child.usage[day] || {});
            for (const [appId, min] of Object.entries(apps || {})) {
              const m = Number(min);
              if (!Core.APP_BY_ID[appId] || !(m > 0)) continue;
              bucket[appId] = Math.round(((bucket[appId] || 0) + Math.min(m, 15)) * 100) / 100;
            }
          }
          const loc = r.location;
          if (loc && isFinite(loc.lat) && isFinite(loc.lng) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180) {
            child.location = { lat: +loc.lat, lng: +loc.lng, accuracy: Math.round(+loc.accuracy || 0), ts: now() };
          }
          if (r.battery != null && isFinite(r.battery)) child.battery = Math.max(0, Math.min(100, Math.round(r.battery)));
          if (r.permissions) {
            for (const k of ['location', 'usage', 'accessibility']) {
              if (k in r.permissions) child.permissions[k] = !!r.permissions[k];
            }
          }
          child.currentApp = Core.APP_BY_ID[r.currentApp] ? r.currentApp : null;
          child.lastSeen = now();
          trimUsage(child);
          return child;
        });
      },

      childRequest(token, { appId, minutes, note, day }) {
        return tx((s) => {
          const { family, child } = auth(s, token, 'child');
          if (child.requests.some((r) => r.status === 'pending')) fail(409, 'You already have a request waiting');
          const req = {
            id: randomHex(4),
            appId: Core.APP_BY_ID[appId] ? appId : null,
            minutes: Math.max(5, Math.min(120, Math.round(Number(minutes) || 15))),
            note: text(note, 140, ''),
            day: /^\d{4}-\d{2}-\d{2}$/.test(day || '') ? day : Core.dayKey(now()),
            status: 'pending',
            ts: now(),
          };
          child.requests.unshift(req);
          child.requests.length = Math.min(child.requests.length, 20);
          const what = req.appId ? ` for ${Core.APP_BY_ID[req.appId].name}` : '';
          addEvent(family, { type: 'request', childId: child.id, text: `${child.name} asked for ${req.minutes} more minutes${what}` });
          return req;
        });
      },

      childSos(token, { location }) {
        return tx((s) => {
          const { family, child } = auth(s, token, 'child');
          if (location && isFinite(location.lat) && isFinite(location.lng)) {
            child.location = { lat: +location.lat, lng: +location.lng, accuracy: Math.round(+location.accuracy || 0), ts: now() };
          }
          addEvent(family, { type: 'sos', childId: child.id, text: `SOS from ${child.name}` });
        });
      },
    };
  }

  return { createStore };
});
