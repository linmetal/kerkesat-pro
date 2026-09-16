// Standalone build of the career simulator: the same simulation as the Next.js
// page, with a dependency-free view so the whole game fits in one HTML file
// that opens anywhere — including a phone with no server behind it.

import { UI } from '../lib/game/i18n';
import {
  ENDINGS, INDUSTRIES, industryById, PHASES, netWorth, companyValue,
  quarterProfit, runway, fmtMoney, fmtPct, tierOf,
} from '../lib/game/engine';
import {
  startGame, choose, currentCard, saveGame, loadGame, clearGame, loadHof, recordHof,
} from '../lib/game/play';
import { visibleOptions, resolve } from '../lib/game/cards';
import { createCloud, adoptRemote, hotBoot } from './cloud';

const root = document.getElementById('app');
const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const S = {
  lang: 'sq',
  phase: 'boot',
  game: null,
  outcome: null,
  hof: [],
  saved: null,
  industry: 'tech',
  name: '',
  lastRun: null,
  confirm: false,
  prevNw: 0,
};

const T = () => UI[S.lang];
const tx = (field) => {
  const o = resolve(field, S.game);
  return o ? o[S.lang] : '';
};

const store = {
  get(k, d) { try { return window.localStorage.getItem(k) || d; } catch (e) { return d; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};

/* ------------------------------------------------------------------ pieces */

const ROLE_KEY = { cofounder: 'roleCofounder', mentor: 'roleMentor', hand: 'roleHand' };

function meter(label, value, invert) {
  const v = Math.max(0, Math.min(100, value));
  const good = invert ? v < 45 : v > 55;
  const bad = invert ? v > 75 : v < 25;
  const color = bad ? '#ff4d4d' : good ? '#38e08a' : '#f0b429';
  return `<div class="meter">
    <div class="meter-top"><span>${esc(label)}</span><span style="color:${color}">${Math.round(v)}</span></div>
    <div class="meter-track"><div class="meter-fill" style="width:${v}%;background:${color}"></div></div>
  </div>`;
}

function spark(data, color) {
  const w = 260; const h = 54;
  if (!data || data.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"></svg>`;
  const pts = data.slice(-80);
  const min = Math.min(...pts, 0);
  const max = Math.max(...pts, 1);
  const span = max - min || 1;
  const x = (i) => (i / (pts.length - 1)) * w;
  const y = (v) => h - ((v - min) / span) * (h - 6) - 3;
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const zero = min < 0 ? `<line x1="0" y1="${y(0)}" x2="${w}" y2="${y(0)}" stroke="#2a3440" stroke-dasharray="2 3"/>` : '';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${zero}
    <polygon points="0,${h} ${line} ${w},${h}" fill="url(#sf)"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="1.6"/>
    <circle cx="${x(pts.length - 1)}" cy="${y(pts[pts.length - 1])}" r="2.6" fill="${color}"/>
  </svg>`;
}

const delta = (v, invert) => {
  const d = invert ? -v : v;
  if (!d || Math.abs(d) < 0.5) return '';
  return `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${esc(fmtMoney(Math.abs(d)))}</span>`;
};

function row(label, value, d, invert) {
  const color = value < 0 ? '#ff6b6b' : invert && value > 0 ? '#f0b429' : '#eef3f8';
  return `<div class="row"><span class="label">${esc(label)}</span>
    <span class="v" style="color:${color}">${esc(fmtMoney(value))}${d ? delta(d, invert) : ''}</span></div>`;
}

/* ------------------------------------------------------------------ screens */

function bootScreen(lines) {
  return `<div class="boot">${lines.map((l) => `<div class="bootline">&gt; ${esc(l)}</div>`).join('')}<div class="cursor">_</div></div>`;
}

function menuScreen() {
  const t = T();
  const resumeBtn = S.saved && S.saved.status !== 'over'
    ? `<button class="btn primary wide" data-act="resume">${esc(t.continue)} — ${esc(S.saved.name)} · ${esc(t.year)} ${S.saved.year} · ${esc(t.level)} ${S.saved.level}</button>`
    : '';
  const inds = INDUSTRIES.map((ind) => `
    <button class="indcard ${S.industry === ind.id ? 'on' : ''}" data-act="ind" data-id="${ind.id}">
      <div class="ind-top"><span class="icon">${ind.icon}</span><span class="ind-name">${esc(ind.name[S.lang])}</span></div>
      <p>${esc(ind.blurb[S.lang])}</p>
      <div class="ind-stats">
        <span>${S.lang === 'sq' ? 'kapital' : 'capital'} ${esc(fmtMoney(ind.cash))}</span>
        <span>${S.lang === 'sq' ? 'marzh' : 'margin'} ${(ind.margin * 100).toFixed(0)}%</span>
        <span>${S.lang === 'sq' ? 'paqëndrueshmëri' : 'volatility'} ${ind.volatility.toFixed(1)}x</span>
      </div>
    </button>`).join('');
  const hof = S.hof.length ? `
    <div class="block">
      <div class="label">${esc(t.hof)}</div>
      <table class="hof"><tbody>${S.hof.slice(0, 6).map((h, i) => `
        <tr><td class="rk">${String(i + 1).padStart(2, '0')}</td><td>${esc(h.name)}</td>
        <td class="dim">${esc(h.rank[S.lang])} ${esc(h.suffix)}</td>
        <td class="num">${esc(fmtMoney(h.peak))}</td><td class="dim">${h.years}y</td></tr>`).join('')}
      </tbody></table>
    </div>` : '';

  return `<div class="menu">
    <button class="lang" data-act="lang">${esc(t.lang)}</button>
    <div class="brand">
      <div class="logo">${S.lang === 'sq' ? 'PERANDORI' : 'EMPIRE'}</div>
      <div class="subtag">${esc(t.tagline)}</div>
    </div>
    ${resumeBtn}
    <div class="block">
      <div class="label">${esc(t.yourName)}</div>
      <input class="input" id="nm" maxlength="22" value="${esc(S.name)}" placeholder="${esc(t.namePlaceholder)}">
    </div>
    <div class="block">
      <div class="label">${esc(t.pickIndustry)}</div>
      <div class="inds">${inds}</div>
    </div>
    <button class="btn primary wide big" data-act="start">${esc(t.startBtn)}</button>
    ${hof}
  </div>`;
}

function header(view) {
  const t = T();
  const g = S.game;
  const warn = [];
  if (view.runway !== Infinity && view.runway < 2) warn.push(t.bankruptWarn);
  if (g.stress > 78) warn.push(t.stressWarn);
  if (g.rep < 18) warn.push(t.repWarn);
  return `<header class="hd">
    <div class="hd-main">
      <div class="who"><span class="nm">${esc(g.name)}</span><span class="dot">·</span>
        <span class="indname">${view.ind.icon} ${esc(view.ind.name[S.lang])}</span></div>
      <div class="clock"><span>${esc(t.year)} <b>${g.year}</b></span><span class="dot">·</span>
        <span>${esc(t.quarter)}<b>${g.quarter}</b></span><span class="dot">·</span>
        <span class="lvl">${esc(t.level)} <b>${view.tier.level}</b> — ${esc(view.tier.name[S.lang])} ${esc(view.tier.suffix)}</span></div>
      <div class="tools">
        <span class="ecotag" style="color:${view.eco.color}">● ${esc(view.eco.name[S.lang])}</span>
        <button class="mini" data-act="lang">${esc(t.lang)}</button>
        <button class="mini" data-act="quit">${esc(t.abandon)}</button>
      </div>
    </div>
    ${warn.length ? `<div class="warn">${warn.map((w) => `<span>⚠ ${esc(w)}</span>`).join('')}</div>` : ''}
  </header>`;
}

function statsPanel(view) {
  const t = T();
  const g = S.game;
  const d = S.outcome ? S.outcome.deltas : null;
  const nwColor = view.nw >= 0 ? '#38e08a' : '#ff4d4d';
  const people = Object.entries(g.people || {}).filter(([r]) => ROLE_KEY[r]);
  const circle = people.length ? `
    <div class="sep"></div>
    <div class="label">${esc(t.circle)}</div>
    <div class="people">${people.map(([role, p]) => {
      const c = p.loyalty < 40 ? '#ff4d4d' : p.loyalty > 70 ? '#38e08a' : '#f0b429';
      return `<div class="pr">
        <div class="pr-top"><span class="pn">${esc(p.name)}</span><span class="pl" style="color:${c}">${Math.round(p.loyalty)}</span></div>
        <div class="pr-role">${esc(t[ROLE_KEY[role]])} · ${esc(t.loyalty)}</div>
        <div class="pr-track"><div class="pr-fill" style="width:${Math.max(0, Math.min(100, p.loyalty))}%;background:${c}"></div></div>
      </div>`;
    }).join('')}</div>` : '';

  return `<div>
    <div class="label">${esc(t.netWorth)}</div>
    <div class="nwbig" id="nw" style="color:${nwColor}">${esc(fmtMoney(view.nw))}${d ? delta(d.netWorth) : ''}</div>
    ${spark(g.history, nwColor)}
    <div class="sep"></div>
    ${row(t.cash, g.cash, d && d.cash)}
    ${row(t.revenue, g.revenue, d && d.revenue)}
    ${row(t.company, view.value, d && d.value)}
    ${row(t.debt, g.debt, d && d.debt, true)}
    ${row(t.profit, view.profit)}
    <div class="sep"></div>
    <div class="mini-grid">
      <div><span class="label">${esc(t.equity)}</span><b>${g.equity.toFixed(0)}%</b></div>
      <div><span class="label">${esc(t.team)}</span><b>${g.teamSize}</b></div>
      <div><span class="label">${esc(t.margin)}</span><b>${(g.margin * 100).toFixed(0)}%</b></div>
      <div><span class="label">${esc(t.runway)}</span><b style="color:${view.runway < 2 ? '#ff4d4d' : '#c9d4e0'}">${view.runway === Infinity ? '∞' : `${view.runway.toFixed(1)} ${esc(t.quarters)}`}</b></div>
    </div>
    ${circle}
    <div class="sep"></div>
    ${meter(t.reputation, g.rep)}
    ${meter(t.morale, g.morale)}
    ${meter(t.influence, g.influence)}
    ${meter(t.stress, g.stress, true)}
    <div class="foot">${esc(t.autosaved)} ✓</div>
  </div>`;
}

function decisionPanel() {
  const t = T();
  const card = currentCard(S.game);
  if (!card) return '';
  const opts = visibleOptions(card, S.game);
  return `<div class="dec">
    <div class="tagline">
      <span class="tag ${card.interrupt ? 'alert' : ''}">${esc(card.interrupt ? t.interrupt : t.decision)}</span>
      <span class="code">#${esc(card.id.toUpperCase().replace(/_/g, '-'))}</span>
    </div>
    <h2>${esc(tx(card.title))}</h2>
    <p class="body">${esc(tx(card.body))}</p>
    <div class="opts">${opts.map((o, i) => `
      <button class="opt" data-act="pick" data-i="${i}">
        <span class="key">${i + 1}</span>
        <span class="txt">
          <span class="lab">${esc(o.label[S.lang])}
            ${o.risk ? `<em class="risk">${esc(t.risky)} ${Math.round(o.risk.p * 100)}%</em>` : ''}
            ${o.end ? `<em class="fin">${o.end === 'sold' ? esc(t.sold) : '✦'}</em>` : ''}
          </span>
          <span class="hint">${esc(o.hint[S.lang])}</span>
        </span>
      </button>`).join('')}</div>
    <div class="kbd">${esc(t.hint)}</div>
  </div>`;
}

function outcomePanel(view) {
  const t = T();
  const g = S.game;
  const o = S.outcome;
  if (!o) return '';
  const yr = g.yearReport;
  const annual = yr ? `
    <div class="annual">
      <div class="an-top"><span class="an-tag">${esc(t.yearClosed)}</span><span class="an-year">${esc(t.year)} ${yr.year}</span></div>
      <div class="an-grid">
        <div><span class="label">${esc(t.annualRevenue)}</span><b>${esc(fmtMoney(yr.revenue))}${yr.revenueGrowth !== null ? ` <em style="color:${yr.revenueGrowth >= 0 ? '#38e08a' : '#ff6b6b'}">${esc(fmtPct(yr.revenueGrowth, 0))}</em>` : ''}</b></div>
        <div><span class="label">${esc(t.annualProfit)}</span><b style="color:${yr.profit >= 0 ? '#38e08a' : '#ff6b6b'}">${esc(fmtMoney(yr.profit))}</b></div>
        <div><span class="label">${esc(t.nwGain)}</span><b style="color:${yr.nwGain >= 0 ? '#38e08a' : '#ff6b6b'}">${esc(fmtMoney(yr.nwGain))}</b></div>
        <div><span class="label">${esc(t.headcount)}</span><b>${yr.teamSize}</b></div>
        <div><span class="label">${esc(t.rivalsAlive)}</span><b>${yr.rivals}</b></div>
      </div>
    </div>` : '';
  const tier = g.tierUp ? `
    <div class="tierup"><div class="tl">${esc(t.tierUp)}</div>
    <div class="tv">${esc(t.level)} ${g.tierUp.level} — ${esc(g.tierUp.name[S.lang])} ${esc(g.tierUp.suffix)}</div></div>` : '';
  const rep = o.report ? `
    <div class="report">
      <div class="label">${esc(t.quarterReport)}</div>
      <div class="rgrid">
        <div><span class="label">${esc(t.profit)}</span><b style="color:${o.report.profit >= 0 ? '#38e08a' : '#ff6b6b'}">${esc(fmtMoney(o.report.profit))}</b></div>
        <div><span class="label">${esc(t.growth)}</span><b style="color:${o.report.growth >= 0 ? '#38e08a' : '#ff6b6b'}">${esc(fmtPct(o.report.growth))}</b></div>
        <div><span class="label">${esc(t.economy)}</span><b style="color:${view.eco.color}">${esc(view.eco.name[S.lang])}</b></div>
      </div>
    </div>` : '';

  return `<div class="out">
    <div class="tagline">
      <span class="tag ${o.tone}">${esc(t.consequence)}</span>
      <span class="code">${esc(t.year)} ${g.year} · ${esc(t.quarter)}${g.quarter}</span>
    </div>
    ${o.texts.map((x, i) => `<p class="${i === 0 ? 'lead' : 'follow'}">${esc(x[S.lang])}</p>`).join('')}
    ${tier}
    ${annual}
    ${rep}
    <button class="btn primary go" data-act="next">${esc(g.status === 'over' ? t.gameOver : t.next)} →</button>
  </div>`;
}

function marketPanel(view) {
  const t = T();
  const g = S.game;
  const rivals = g.rivals.filter((r) => r.alive).sort((a, b) => b.value - a.value);
  return `<div>
    <div class="label">${esc(t.economy)}</div>
    <div class="eco" style="border-color:${view.eco.color}">
      <div class="eco-name" style="color:${view.eco.color}">${esc(view.eco.name[S.lang])}</div>
      <div class="eco-rows">
        <span>${S.lang === 'sq' ? 'kërkesa' : 'demand'} <b>${(view.eco.demand * 100).toFixed(0)}%</b></span>
        <span>${S.lang === 'sq' ? 'interesi' : 'rates'} <b>${(view.eco.rate * 100).toFixed(1)}%</b></span>
        <span>${S.lang === 'sq' ? 'kapitali' : 'capital'} <b>${view.eco.capital.toFixed(2)}x</b></span>
      </div>
    </div>
    <div class="sep"></div>
    <div class="label">${esc(t.rivals)}</div>
    <div class="rivals">
      <div class="rv me"><span class="rn">${esc(g.name)}</span><span class="rvv">${esc(fmtMoney(view.value))}</span></div>
      ${rivals.map((r) => `<div class="rv">
        <span class="rn">${esc(r.name)}<em>${r.ceo ? `${esc(r.ceo)} · ` : ''}${esc(r.traitName[S.lang])}</em></span>
        <span class="rvv" style="color:${r.value > view.value ? '#ff6b6b' : '#7b8b9c'}">${esc(fmtMoney(r.value))}</span>
      </div>`).join('')}
    </div>
    <div class="sep"></div>
    <div class="label">${esc(t.news)}</div>
    <div class="feed">${g.log.slice(0, 14).map((l) => `
      <div class="ln ${l.type}"><span class="stamp">Y${l.y}Q${l.q}</span><span>${esc(l.text[S.lang])}</span></div>`).join('')}
    </div>
  </div>`;
}

function playScreen() {
  const t = T();
  const g = S.game;
  const view = {
    nw: netWorth(g), tier: tierOf(netWorth(g)), value: companyValue(g),
    profit: quarterProfit(g), runway: runway(g), eco: PHASES[g.economy.phase],
    ind: industryById(g.industry),
  };
  const modal = S.confirm ? `
    <div class="modal"><div class="modal-box">
      <p>${esc(t.confirmAbandon)}</p>
      <div class="modal-actions">
        <button class="btn danger" data-act="abandon">${esc(t.yes)}</button>
        <button class="btn" data-act="cancel">${esc(t.no)}</button>
      </div>
    </div></div>` : '';
  return `<div class="app">
    ${header(view)}
    <div class="grid">
      <aside class="panel stats">${statsPanel(view)}</aside>
      <main class="panel stage">${S.phase === 'play' ? decisionPanel() : outcomePanel(view)}</main>
      <aside class="panel market">${marketPanel(view)}</aside>
    </div>
    ${modal}
  </div>`;
}

function overScreen() {
  const t = T();
  const e = S.game.ending;
  const stat = (label, value, accent) => `<div class="st"><span class="label">${esc(label)}</span>
    <b style="color:${accent ? '#38e08a' : '#eef3f8'}">${esc(value)}</b></div>`;
  return `<div class="over">
    <div class="ttl">${esc(e.title[S.lang])}</div>
    <p class="overtxt">${esc(e.text[S.lang])}</p>
    <div class="grid2">
      ${stat(t.finalScore, e.score.toLocaleString('de-DE'), true)}
      ${stat(t.netWorth, fmtMoney(e.netWorth))}
      ${stat(t.peak, fmtMoney(e.peak))}
      ${stat(t.yearsPlayed, e.years.toFixed(1))}
      ${stat(t.level, e.level)}
      ${stat(t.rank, `${e.rank[S.lang]} ${e.suffix}`)}
    </div>
    ${S.hof.length ? `<div class="label hl">${esc(t.hof)}</div>
      <table class="hof"><tbody>${S.hof.map((h, i) => `
        <tr class="${h.at === S.lastRun ? 'mine' : ''}"><td class="rk">${String(i + 1).padStart(2, '0')}</td>
        <td>${esc(h.name)}</td><td class="dim">${esc(h.rank[S.lang])} ${esc(h.suffix)}</td>
        <td class="dim">${esc(ENDINGS[h.ending] ? ENDINGS[h.ending].title[S.lang] : h.ending)}</td>
        <td class="num">${esc(h.score.toLocaleString('de-DE'))}</td></tr>`).join('')}</tbody></table>` : ''}
    <button class="btn primary big" data-act="again">${esc(t.playAgain)}</button>
  </div>`;
}

/* ------------------------------------------------------------------- render */

// `top` is passed whenever a new scene is dealt, so a phone always opens the
// next decision at the top of the screen instead of wherever the last tap left it.
function render(opts) {
  if (S.phase === 'menu') root.innerHTML = menuScreen();
  else if (S.phase === 'play' || S.phase === 'outcome') root.innerHTML = playScreen();
  else if (S.phase === 'over') root.innerHTML = overScreen();
  if (opts && opts.top) window.scrollTo(0, 0);
  animateNetWorth();
}

// The headline figure counts to its new value, the way a terminal ticks over.
function animateNetWorth() {
  const el = document.getElementById('nw');
  if (!el || !S.game) return;
  const target = netWorth(S.game);
  const from = S.prevNw;
  S.prevNw = target;
  if (Math.abs(target - from) < 1) return;
  const tail = el.querySelector('.delta');
  const tailHtml = tail ? tail.outerHTML : '';
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / 650);
    const eased = 1 - Math.pow(1 - p, 3);
    el.innerHTML = esc(fmtMoney(from + (target - from) * eased)) + tailHtml;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ------------------------------------------------------------------ actions */

function persistLang() { store.set('career.sim.lang', S.lang); }

const actions = {
  lang() { S.lang = S.lang === 'sq' ? 'en' : 'sq'; persistLang(); render(); },
  ind(el) { S.industry = el.dataset.id; render(); },
  start() {
    const input = document.getElementById('nm');
    S.name = input ? input.value : '';
    S.game = startGame({ name: S.name, industry: S.industry });
    S.prevNw = 0;
    S.outcome = null;
    S.phase = 'play';
    saveGame(S.game);
    cloud.push(S.game, S.hof);
    render({ top: true });
  },
  resume() {
    if (!S.saved) return;
    S.game = S.saved;
    S.prevNw = netWorth(S.game);
    S.phase = S.game.status === 'over' ? 'over' : 'play';
    render({ top: true });
  },
  pick(el) {
    if (S.phase !== 'play') return;
    const { state, outcome } = choose(S.game, Number(el.dataset.i));
    S.game = state;
    S.outcome = outcome;
    S.phase = 'outcome';
    saveGame(S.game);
    cloud.push(S.game, S.hof);
    render({ top: true });
  },
  next() {
    if (S.game.status === 'over') {
      const res = recordHof(S.game);
      S.hof = res.list;
      S.lastRun = res.at;
      clearGame();
      S.saved = null;
      S.phase = 'over';
      cloud.pushNow(null, S.hof);
    } else {
      S.outcome = null;
      S.phase = 'play';
    }
    render({ top: true });
  },
  quit() { S.confirm = true; render(); },
  cancel() { S.confirm = false; render(); },
  abandon() {
    clearGame();
    S.saved = null;
    S.game = null;
    S.outcome = null;
    S.confirm = false;
    S.phase = 'menu';
    cloud.pushNow(null, S.hof);
    render({ top: true });
  },
  again() { actions.abandon(); },
};

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el);
});

window.addEventListener('keydown', (e) => {
  if (S.phase === 'play' && S.game) {
    const card = currentCard(S.game);
    const n = parseInt(e.key, 10);
    if (card && n >= 1 && n <= visibleOptions(card, S.game).length) {
      actions.pick({ dataset: { i: String(n - 1) } });
    }
  } else if (S.phase === 'outcome' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    actions.next();
  }
});

/* --------------------------------------------------------------------- boot */

const cloud = createCloud();

function runBootSequence() {
  const lines = UI.sq.boot;
  let i = 0;
  root.innerHTML = bootScreen([]);
  const iv = setInterval(() => {
    i += 1;
    root.innerHTML = bootScreen(lines.slice(0, i));
    if (i >= lines.length) {
      clearInterval(iv);
      setTimeout(() => { S.phase = 'menu'; render({ top: true }); }, 420);
    }
  }, 260);
}

// A career moved forward on another device is adopted only while nothing is
// in progress here, so a running game is never yanked out from under a player.
function syncFromCloud() {
  cloud.pullNewer().then((body) => {
    if (!body) return;
    adoptRemote(body);
    if (S.game) return;
    S.saved = loadGame();
    S.hof = loadHof();
    if (S.phase === 'menu') render();
  });
}

function start(hotData) {
  const savedLang = store.get('career.sim.lang');
  if (savedLang === 'en' || savedLang === 'sq') S.lang = savedLang;

  if (hotData && hotData.game) {
    Object.assign(S, hotData);
    S.prevNw = netWorth(S.game);
    render();
  } else {
    S.saved = loadGame();
    S.hof = loadHof();
    runBootSequence();
  }
  syncFromCloud();
}

hotBoot(start, () => ({
  lang: S.lang, phase: S.phase, game: S.game, outcome: S.outcome,
  hof: S.hof, industry: S.industry, name: S.name, lastRun: S.lastRun,
}));
