// The turn loop: take a decision, resolve its risk, run the quarter, deal the
// next scene. Kept separate from engine.js so the card deck can import the
// engine without a circular dependency.

import {
  applyFx, advanceQuarter, endCareer, pushLog, rand, netWorth, companyValue,
  quarterProfit, newGame, tierOf, fmtMoney,
} from './engine';
import { nextCard, cardById, visibleOptions, resolve, now } from './cards';

const clone = (s) => JSON.parse(JSON.stringify(s));

const snapshot = (s) => ({
  netWorth: netWorth(s), cash: s.cash, revenue: s.revenue, rep: s.rep,
  morale: s.morale, influence: s.influence, stress: s.stress,
  team: s.teamSize, equity: s.equity, debt: s.debt, value: companyValue(s),
});

function deltas(a, b) {
  const out = {};
  Object.keys(a).forEach((k) => { out[k] = b[k] - a[k]; });
  return out;
}

export function startGame(opts) {
  const s = newGame(opts);
  s.pending = nextCard(s).id;
  return s;
}

export function currentCard(s) {
  return s.pending ? cardById(s.pending) : null;
}

export function choose(prev, index) {
  const s = clone(prev);
  const card = cardById(s.pending);
  if (!card || s.status !== 'playing') return { state: s, outcome: null };

  const opt = visibleOptions(card, s)[index];
  if (!opt) return { state: s, outcome: null };

  const before = snapshot(s);
  const texts = [];
  let tone = 'neutral';

  applyFx(s, opt.fx);
  texts.push(resolve(opt.res, s));

  if (opt.risk) {
    const bad = rand(s) < opt.risk.p;
    const branch = bad ? opt.risk.bad : opt.risk.good;
    applyFx(s, branch.fx);
    texts.push(resolve(branch.res, s));
    tone = bad ? 'bad' : 'good';
  }

  s.seen[card.id] = now(s);
  s.queued = (s.queued || []).filter((q) => q.id !== card.id);
  if (opt.queue) {
    opt.queue.forEach((q) => {
      if (!s.seen[q.id] && !s.queued.some((x) => x.id === q.id)) {
        s.queued.push({ id: q.id, at: now(s) + (q.in || 3) });
      }
    });
  }
  pushLog(s, tone === 'neutral' ? 'story' : tone, texts[texts.length - 1]);

  // Options that deliberately close the career.
  if (opt.end === 'sold') {
    const proceeds = companyValue(s) * (s.equity / 100);
    s.cash += proceeds;
    s.equity = 0;
    s.revenue = 0;
    endCareer(s, 'sold');
    return { state: s, outcome: { texts, tone: 'good', deltas: deltas(before, snapshot(s)), card } };
  }
  if (opt.end) {
    endCareer(s, opt.end);
    return { state: s, outcome: { texts, tone: 'good', deltas: deltas(before, snapshot(s)), card } };
  }

  advanceQuarter(s);

  const report = {
    profit: s.lastProfit || 0,
    growth: s.lastGrowth || 0,
  };

  if (s.status === 'playing') s.pending = nextCard(s).id;
  else s.pending = null;

  return { state: s, outcome: { texts, tone, deltas: deltas(before, snapshot(s)), report, card } };
}

// ------------------------------------------------------------- persistence

const SAVE_KEY = 'career.sim.save.v1';
const HOF_KEY = 'career.sim.hof.v1';

const canStore = () => {
  try { return typeof window !== 'undefined' && !!window.localStorage; } catch (e) { return false; }
};

export function saveGame(s) {
  if (!canStore()) return;
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* quota or private mode */ }
}

// Careers saved by an older build are brought forward rather than dropped.
function migrate(s) {
  if (!s.people) s.people = {};
  if (!s.queued) s.queued = [];
  if (!s.yearStats) {
    s.yearStats = { year: s.year, startRevenue: s.revenue, startNW: netWorth(s), profit: 0 };
  }
  if (s.yearReport === undefined) s.yearReport = null;
  if (s.rivalSeq === undefined) s.rivalSeq = s.rivals ? s.rivals.length : 0;
  return s;
}

export function loadGame() {
  if (!canStore()) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.v === 1 ? migrate(s) : null;
  } catch (e) { return null; }
}

export function clearGame() {
  if (!canStore()) return;
  try { window.localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

export function loadHof() {
  if (!canStore()) return [];
  try { return JSON.parse(window.localStorage.getItem(HOF_KEY) || '[]'); } catch (e) { return []; }
}

export function recordHof(s) {
  if (!canStore() || !s.ending) return loadHof();
  const entry = {
    name: s.name,
    industry: s.industry,
    score: s.ending.score,
    netWorth: s.ending.netWorth,
    peak: s.ending.peak,
    years: Math.round(s.ending.years * 10) / 10,
    level: s.ending.level,
    rank: s.ending.rank,
    suffix: s.ending.suffix,
    ending: s.ending.key,
    at: Date.now(),
  };
  const list = [...loadHof(), entry].sort((a, b) => b.score - a.score).slice(0, 12);
  try { window.localStorage.setItem(HOF_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  return { list, at: entry.at };
}

export { netWorth, companyValue, quarterProfit, tierOf, fmtMoney };
