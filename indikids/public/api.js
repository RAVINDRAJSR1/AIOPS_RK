// IndiKids client API. Picks the live server backend or the in-browser demo backend.
(function () {
  'use strict';
  const Core = window.IKCore;

  const params = new URLSearchParams(location.search);
  const isFile = location.protocol === 'file:';
  const isDemo = params.get('demo') === '1' || isFile || /demo\.html$/.test(location.pathname);
  const mode = isDemo ? 'demo' : 'live';
  const DEMO_KEY = 'ik-demo-state';

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function storageSet(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* private mode: tokens only last for this page */
    }
  }

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('indikids-demo') : null;

  function demoBackend() {
    const store = IKStore.createStore({
      load: () => JSON.parse(storageGet(DEMO_KEY) || '{}'),
      save: (state) => {
        storageSet(DEMO_KEY, JSON.stringify(state));
        if (channel) channel.postMessage('changed');
      },
    });
    const call = (fn) => new Promise((resolve, reject) => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    });
    return {
      createFamily: (b) => call(() => store.createFamily(b)),
      family: (t) => call(() => store.parentView(t)),
      closeAccount: (t) => call(() => store.closeAccount(t)),
      setPlan: (t, action) => call(() => store.setPlan(t, action)),
      pairCode: (t) => call(() => store.newPairCode(t)),
      updateRules: (t, id, rules) => call(() => store.updateRules(t, id, rules)),
      addBonus: (t, id, minutes, day) => call(() => store.addBonus(t, id, minutes, day)),
      resolveRequest: (t, id, rid, approve, minutes) => call(() => store.resolveRequest(t, id, rid, approve, minutes)),
      removeChild: (t, id) => call(() => store.removeChild(t, id)),
      pair: (b) => call(() => store.pair(b)),
      me: (t) => call(() => store.childView(t)),
      report: (t, b) => call(() => store.childReport(t, b)),
      request: (t, b) => call(() => store.childRequest(t, b)),
      sos: (t, b) => call(() => store.childSos(t, b)),
    };
  }

  function liveBackend() {
    async function req(method, url, token, body) {
      let res;
      try {
        res = await fetch(url, {
          method,
          headers: Object.assign(
            { 'Content-Type': 'application/json' },
            token ? { Authorization: 'Bearer ' + token } : {}
          ),
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch {
        throw Object.assign(new Error('No internet connection. Retrying…'), { status: 0 });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status });
      return data;
    }
    return {
      createFamily: (b) => req('POST', '/api/family', null, b),
      family: (t) => req('GET', '/api/family', t),
      closeAccount: (t) => req('DELETE', '/api/family', t),
      setPlan: (t, action) => req('POST', '/api/family/plan', t, { action }),
      pairCode: (t) => req('POST', '/api/family/pair-code', t, {}),
      updateRules: (t, id, rules) => req('PUT', `/api/children/${id}/rules`, t, rules),
      addBonus: (t, id, minutes, day) => req('POST', `/api/children/${id}/bonus`, t, { minutes, day }),
      resolveRequest: (t, id, rid, approve, minutes) => req('POST', `/api/children/${id}/requests/${rid}`, t, { approve, minutes }),
      removeChild: (t, id) => req('DELETE', `/api/children/${id}`, t),
      pair: (b) => req('POST', '/api/pair', null, b),
      me: (t) => req('GET', '/api/me', t),
      report: (t, b) => req('POST', '/api/me/report', t, b),
      request: (t, b) => req('POST', '/api/me/request', t, b),
      sos: (t, b) => req('POST', '/api/me/sos', t, b),
    };
  }

  const backend = isDemo ? demoBackend() : liveBackend();

  const token = {
    get: (role) => storageGet(`ik-${mode}-${role}-token`),
    set: (role, value) => storageSet(`ik-${mode}-${role}-token`, value),
  };

  // Call `cb` whenever data may have changed: instantly in demo mode, by polling otherwise.
  function onChange(cb, everyMs) {
    if (channel && isDemo) channel.addEventListener('message', () => cb());
    window.addEventListener('storage', (e) => e.key === DEMO_KEY && cb());
    setInterval(cb, everyMs || (isDemo ? 2000 : 4000));
  }

  // Demo mode can run on a shifted clock so bedtime and study hours can be tried any time.
  function now() {
    if (!isDemo) return Date.now();
    return Date.now() + (Number(storageGet('ik-demo-offset')) || 0);
  }
  function setDemoHour(hour) {
    if (hour == null) return storageSet('ik-demo-offset', null);
    const d = new Date();
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0);
    storageSet('ik-demo-offset', String(target - d));
    if (channel) channel.postMessage('changed');
  }

  // ---- Demo data ---------------------------------------------------------------
  // Seeds a family with one child, a week of usage history and a location.
  function seedDemo({ withChild = true } = {}) {
    storageSet(DEMO_KEY, null);
    setDemoHour(16);
    const store = IKStore.createStore({
      load: () => JSON.parse(storageGet(DEMO_KEY) || '{}'),
      save: (s) => storageSet(DEMO_KEY, JSON.stringify(s)),
    });
    const fam = store.createFamily({ parentName: 'Priya', acceptedTerms: true });
    token.set('parent', fam.token);
    token.set('child', null);
    if (withChild) {
      const { code } = store.newPairCode(fam.token);
      const kid = store.pair({ code, childName: 'Aarav', deviceName: 'Redmi Note 13', acceptedTerms: true });
      token.set('child', kid.token);
      const state = JSON.parse(storageGet(DEMO_KEY));
      const child = state.families[fam.familyId].children[kid.childId];
      const pattern = { youtube: 48, whatsapp: 22, bgmi: 35, instagram: 18, chrome: 12, classroom: 30, diksha: 15 };
      for (let i = 6; i >= 1; i--) {
        const day = Core.dayKey(now() - i * 864e5);
        child.usage[day] = {};
        for (const [app, base] of Object.entries(pattern)) {
          child.usage[day][app] = Math.round(base * (0.6 + ((i * 7 + app.length * 3) % 9) / 10));
        }
      }
      child.usage[Core.dayKey(now())] = { whatsapp: 8, classroom: 20, youtube: 14 };
      child.permissions = { location: true, usage: true, accessibility: true };
      child.location = { lat: 12.9716, lng: 77.5946, accuracy: 15, ts: Date.now() };
      child.battery = 76;
      state.families[fam.familyId].events.unshift({ id: 'seed', ts: Date.now() - 36e5, type: 'info', text: 'Demo family created' });
      storageSet(DEMO_KEY, JSON.stringify(state));
    }
    if (channel) channel.postMessage('changed');
  }

  // ---- Small UI helpers shared by the pages ------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function toast(message, kind) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = 'toast show ' + (kind || '');
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.className = 'toast'), 3200);
  }

  function ago(ts) {
    if (!ts) return 'never';
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 15) return 'just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    return new Date(ts).toLocaleDateString();
  }

  // Keep ?demo=1 on internal links so the whole visit stays in one mode.
  function link(href) {
    return isDemo && !isFile ? href + (href.includes('?') ? '&' : '?') + 'demo=1' : href;
  }

  function demoBadge() {
    if (!isDemo) return;
    const b = document.createElement('div');
    b.className = 'demo-badge';
    b.textContent = 'DEMO MODE · 1 second = 1 minute';
    document.body.prepend(b);
  }

  if ('serviceWorker' in navigator && !isFile && !isDemo) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  window.IK = { mode, isDemo, isFile, backend, token, onChange, seedDemo, now, setDemoHour, esc, toast, ago, link, demoBadge, speed: isDemo ? 60 : 1 };
})();
