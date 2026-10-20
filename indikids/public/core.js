// IndiKids rules engine. Pure functions shared by the parent app, the child app,
// the demo backend and the server. Loads in the browser (window.IKCore) and in Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IKCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Apps shown on the child device. "essential" apps are never locked.
  const APPS = [
    { id: 'phone', name: 'Phone', icon: '📞', category: 'Essential', essential: true },
    { id: 'maps', name: 'Maps', icon: '🗺️', category: 'Essential', essential: true },
    { id: 'calculator', name: 'Calculator', icon: '🧮', category: 'Essential', essential: true },
    { id: 'classroom', name: 'Google Classroom', icon: '🎓', category: 'Education', essential: true },
    { id: 'diksha', name: 'DIKSHA', icon: '📘', category: 'Education', essential: true },
    { id: 'youtube', name: 'YouTube', icon: '▶️', category: 'Entertainment' },
    { id: 'instagram', name: 'Instagram', icon: '📸', category: 'Social' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', category: 'Communication' },
    { id: 'bgmi', name: 'BGMI', icon: '🎮', category: 'Games' },
    { id: 'freefire', name: 'Free Fire', icon: '🔥', category: 'Games' },
    { id: 'chrome', name: 'Chrome', icon: '🌐', category: 'Browser' },
    { id: 'camera', name: 'Camera', icon: '📷', category: 'Tools' },
  ];
  const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a]));

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const TRIAL_DAYS = 7;

  function defaultRules() {
    return {
      dailyLimitMin: 120,
      appLimits: { youtube: 60, bgmi: 45, freefire: 45 },
      blockedApps: [],
      paused: false,
      bonus: {}, // { 'YYYY-MM-DD': extraMinutes }
      downtime: [
        { id: 'bed', label: 'Bedtime', start: '21:30', end: '07:00', days: [0, 1, 2, 3, 4, 5, 6], enabled: true },
        { id: 'study', label: 'Study hours', start: '17:00', end: '19:00', days: [1, 2, 3, 4, 5], enabled: true },
      ],
    };
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function dayKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseHM(s) {
    const [h, m] = String(s).split(':').map(Number);
    return h * 60 + m;
  }

  function minutesOfDay(date) {
    const d = new Date(date);
    return d.getHours() * 60 + d.getMinutes();
  }

  // Returns the downtime window active at `date`, or null. A window that crosses
  // midnight (21:30 -> 07:00) belongs to the day it starts on.
  function activeDowntime(rules, date) {
    const d = new Date(date);
    const now = minutesOfDay(d);
    const today = d.getDay();
    const yesterday = (today + 6) % 7;
    for (const w of rules.downtime || []) {
      if (!w.enabled) continue;
      const s = parseHM(w.start);
      const e = parseHM(w.end);
      if (s === e) continue;
      if (s < e) {
        if (w.days.includes(today) && now >= s && now < e) return w;
      } else {
        if (w.days.includes(today) && now >= s) return w;
        if (w.days.includes(yesterday) && now < e) return w;
      }
    }
    return null;
  }

  function usageFor(child, date) {
    return (child.usage && child.usage[dayKey(date)]) || {};
  }

  // Minutes counted against the daily limit (essential apps are free).
  function countedMinutes(dayUsage) {
    let total = 0;
    for (const [id, min] of Object.entries(dayUsage)) {
      if (!(APP_BY_ID[id] && APP_BY_ID[id].essential)) total += min;
    }
    return total;
  }

  function totalMinutes(dayUsage) {
    return Object.values(dayUsage).reduce((a, b) => a + b, 0);
  }

  function dailyAllowance(rules, date) {
    return (rules.dailyLimitMin || 0) + ((rules.bonus || {})[dayKey(date)] || 0);
  }

  function remainingToday(child, date) {
    const r = child.rules;
    if (!r.dailyLimitMin) return Infinity;
    return Math.max(0, dailyAllowance(r, date) - countedMinutes(usageFor(child, date)));
  }

  // Decide whether `appId` may be opened right now.
  // reason: essential | blocked | paused | downtime | daily-limit | app-limit | ok
  function appStatus(child, appId, date) {
    const app = APP_BY_ID[appId];
    const rules = child.rules;
    if (!app) return { allowed: false, reason: 'unknown', remaining: 0 };
    if (app.essential) return { allowed: true, reason: 'essential', remaining: Infinity };
    if ((rules.blockedApps || []).includes(appId)) return { allowed: false, reason: 'blocked', remaining: 0 };
    if (rules.paused) return { allowed: false, reason: 'paused', remaining: 0 };
    const dt = activeDowntime(rules, date);
    if (dt) return { allowed: false, reason: 'downtime', remaining: 0, window: dt };
    const day = usageFor(child, date);
    const daily = remainingToday(child, date);
    if (daily <= 0) return { allowed: false, reason: 'daily-limit', remaining: 0 };
    const appLimit = (rules.appLimits || {})[appId];
    let remaining = daily;
    if (appLimit) {
      const appLeft = Math.max(0, appLimit + ((rules.bonus || {})[dayKey(date)] || 0) - (day[appId] || 0));
      if (appLeft <= 0) return { allowed: false, reason: 'app-limit', remaining: 0 };
      remaining = Math.min(remaining, appLeft);
    }
    return { allowed: true, reason: 'ok', remaining };
  }

  const REASON_TEXT = {
    blocked: 'Blocked by your parent',
    paused: 'Device paused by your parent',
    downtime: 'Downtime is on',
    'daily-limit': 'Daily screen time is used up',
    'app-limit': 'Time limit for this app is used up',
    unknown: 'Not available',
  };

  function formatMin(min) {
    if (min === Infinity) return 'No limit';
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return `${m}m`;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  function validHM(s) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s));
  }

  // Normalise rules coming from a client before they are stored.
  function sanitizeRules(input) {
    const base = defaultRules();
    const r = Object.assign({}, base, input || {});
    const clampMin = (v) => Math.max(0, Math.min(24 * 60, Math.round(Number(v) || 0)));
    const out = {
      dailyLimitMin: clampMin(r.dailyLimitMin),
      appLimits: {},
      blockedApps: [],
      paused: !!r.paused,
      bonus: {},
      downtime: [],
    };
    for (const [id, v] of Object.entries(r.appLimits || {})) {
      if (APP_BY_ID[id] && !APP_BY_ID[id].essential && clampMin(v) > 0) out.appLimits[id] = clampMin(v);
    }
    for (const id of r.blockedApps || []) {
      if (APP_BY_ID[id] && !APP_BY_ID[id].essential && !out.blockedApps.includes(id)) out.blockedApps.push(id);
    }
    for (const [k, v] of Object.entries(r.bonus || {})) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && clampMin(v) > 0) out.bonus[k] = clampMin(v);
    }
    for (const w of (r.downtime || []).slice(0, 10)) {
      if (!validHM(w.start) || !validHM(w.end)) continue;
      out.downtime.push({
        id: String(w.id || Math.random().toString(36).slice(2, 8)).slice(0, 20),
        label: String(w.label || 'Downtime').slice(0, 40),
        start: w.start,
        end: w.end,
        days: [...new Set((w.days || []).map(Number).filter((d) => d >= 0 && d <= 6))].sort(),
        enabled: w.enabled !== false,
      });
    }
    return out;
  }

  return {
    APPS,
    APP_BY_ID,
    DAYS,
    TRIAL_DAYS,
    REASON_TEXT,
    defaultRules,
    sanitizeRules,
    dayKey,
    activeDowntime,
    usageFor,
    countedMinutes,
    totalMinutes,
    dailyAllowance,
    remainingToday,
    appStatus,
    formatMin,
    validHM,
  };
});
