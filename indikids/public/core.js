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

  // Categories a parent can lock as a group (essential apps never lock).
  const CATEGORIES = ['Entertainment', 'Games', 'Social', 'Communication', 'Browser', 'Tools'];
  // "Block games and videos with just one button".
  const FUN_CATEGORIES = ['Games', 'Entertainment', 'Social'];

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const TRIAL_DAYS = 7;

  // Onboarding goals the parent can pick, and what IndiKids does for each.
  const GOALS = [
    { id: 'screen', icon: '📱', label: 'Reduce screen time', benefit: "Reclaim your child's time for important things to do off the phone" },
    { id: 'study', icon: '📚', label: 'Improve focus on studies', benefit: 'Help your child stay focused on school and avoid phone distractions' },
    { id: 'threats', icon: '🛡️', label: 'Protect from online threats', benefit: 'Protect your child from inappropriate websites and online threats' },
    { id: 'sleep', icon: '🛏️', label: 'Set sleep schedule', benefit: 'Keep the phone away at bedtime so your child sleeps better' },
    { id: 'calm', icon: '🪁', label: 'Reduce irritability', benefit: 'Fewer arguments: clear rules, and a polite way to ask for more time' },
    { id: 'location', icon: '📍', label: 'Know where my kid is', benefit: 'Always know where your child is, without unnecessary calls or worries' },
  ];

  // Rules for a newly paired child. `setup` holds the parent's onboarding answers
  // ({ goals: [...], answers: { sleepStudy: true, websites: true, ... } }); with no
  // setup everything starts switched on.
  function defaultRules(setup) {
    const goals = (setup && setup.goals) || null;
    const answers = (setup && setup.answers) || {};
    const want = (goal, answer) => !goals || goals.includes(goal) || answers[answer] === true;
    return {
      dailyLimitMin: 120,
      appLimits: { youtube: 60, bgmi: 45, freefire: 45 },
      blockedApps: [],
      blockedCategories: [],
      paused: false,
      bonus: {}, // { 'YYYY-MM-DD': extraMinutes }
      downtime: [
        { id: 'school', label: 'School', start: '09:00', end: '15:00', days: [1, 2, 3, 4, 5], blocks: FUN_CATEGORIES.slice(), enabled: want('study', 'sleepStudy') },
        { id: 'sleep', label: 'Sleep', start: '22:00', end: '07:00', days: [0, 1, 2, 3, 4, 5, 6], blocks: 'all', enabled: want('sleep', 'sleepStudy') },
      ],
      web: { filter: true, blockAdult: true, blockGambling: true, blockedSites: [], allowedSites: [] },
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

  function windowBlocks(w, app) {
    if (!app) return true;
    return w.blocks === 'all' || w.blocks == null || (Array.isArray(w.blocks) && w.blocks.includes(app.category));
  }

  // Returns the downtime window active at `date`, or null. With `appId`, only a
  // window that blocks that app counts. A window that crosses midnight
  // (22:00 -> 07:00) belongs to the day it starts on.
  function activeDowntime(rules, date, appId) {
    const app = appId ? APP_BY_ID[appId] : null;
    const d = new Date(date);
    const now = minutesOfDay(d);
    const today = d.getDay();
    const yesterday = (today + 6) % 7;
    for (const w of rules.downtime || []) {
      if (!w.enabled || !windowBlocks(w, app)) continue;
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
    if ((rules.blockedCategories || []).includes(app.category)) return { allowed: false, reason: 'category', remaining: 0 };
    if (rules.paused) return { allowed: false, reason: 'paused', remaining: 0 };
    const dt = activeDowntime(rules, date, appId);
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
    category: 'Games and videos are blocked by your parent right now',
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

  // ---- Internet safety --------------------------------------------------------
  // A small built-in list; the native app can swap in a full category database.
  const ADULT_WORDS = ['porn', 'xxx', 'sex', 'nude', 'adult', 'xvideos', 'xnxx', 'onlyfans', 'hentai', 'nsfw'];
  const GAMBLING_WORDS = ['casino', 'gambling', 'betting', 'bet365', '1xbet', 'stake.com', 'poker', 'rummy', 'teenpatti', 'teen-patti', 'lottery', 'satta', 'parimatch', 'roulette', 'slots'];

  // Turn what the child typed into { host, url } or a search.
  function parseAddress(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(raw) || /^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
        return { kind: 'site', host: u.hostname.replace(/^www\./, '').toLowerCase(), url: u.href };
      } catch {
        /* fall through to search */
      }
    }
    return { kind: 'search', query: raw.slice(0, 200), url: 'https://www.google.com/search?safe=active&q=' + encodeURIComponent(raw.slice(0, 200)) };
  }

  function hostMatches(host, site) {
    site = String(site).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    return host === site || host.endsWith('.' + site);
  }

  // Decide if a site visit or search is allowed. Returns { allowed, reason }.
  function checkWeb(rules, text) {
    const web = rules.web || {};
    const parsed = typeof text === 'string' ? parseAddress(text) : text;
    if (!parsed) return { allowed: false, reason: 'empty' };
    const hay = (parsed.host || '') + ' ' + (parsed.query || '') + ' ' + (parsed.url || '');
    const lower = hay.toLowerCase();
    if (parsed.host && (web.allowedSites || []).some((s) => hostMatches(parsed.host, s))) return { allowed: true, reason: 'allowed-list' };
    if (parsed.host && (web.blockedSites || []).some((s) => hostMatches(parsed.host, s))) return { allowed: false, reason: 'blocked-site' };
    if (!web.filter) return { allowed: true, reason: 'ok' };
    if (web.blockAdult && ADULT_WORDS.some((w) => lower.includes(w))) return { allowed: false, reason: 'adult' };
    if (web.blockGambling && GAMBLING_WORDS.some((w) => lower.includes(w))) return { allowed: false, reason: 'gambling' };
    return { allowed: true, reason: 'ok' };
  }

  const WEB_REASON_TEXT = {
    'blocked-site': 'Your parent blocked this website',
    adult: 'This looks like an adult (18+) website',
    gambling: 'This looks like a gambling website',
  };

  function cleanSite(s) {
    const v = String(s || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v) ? v.slice(0, 80) : null;
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
      blockedCategories: [],
      paused: !!r.paused,
      bonus: {},
      downtime: [],
      web: { filter: true, blockAdult: true, blockGambling: true, blockedSites: [], allowedSites: [] },
    };
    for (const c of r.blockedCategories || []) {
      if (CATEGORIES.includes(c) && !out.blockedCategories.includes(c)) out.blockedCategories.push(c);
    }
    const w = r.web || base.web;
    out.web.filter = w.filter !== false;
    out.web.blockAdult = w.blockAdult !== false;
    out.web.blockGambling = w.blockGambling !== false;
    for (const key of ['blockedSites', 'allowedSites']) {
      for (const site of (w[key] || []).slice(0, 100)) {
        const c = cleanSite(site);
        if (c && !out.web[key].includes(c)) out.web[key].push(c);
      }
    }
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
        blocks: Array.isArray(w.blocks) ? CATEGORIES.filter((c) => w.blocks.includes(c)) : 'all',
        enabled: w.enabled !== false,
      });
    }
    return out;
  }

  return {
    APPS,
    APP_BY_ID,
    CATEGORIES,
    FUN_CATEGORIES,
    GOALS,
    WEB_REASON_TEXT,
    parseAddress,
    checkWeb,
    cleanSite,
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
