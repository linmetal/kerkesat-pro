// Core simulation for the business career game.
// Everything here is pure data + pure functions so a state object can be
// serialized to localStorage and resumed exactly where it left off.

const T = (sq, en) => ({ sq, en });

// ---------------------------------------------------------------- industries

export const INDUSTRIES = [
  {
    id: 'tech',
    name: T('Teknologji', 'Technology'),
    blurb: T('Marzhe të egra, rritje eksponenciale, por tregu të harron për një natë.',
             'Brutal margins, exponential growth, but the market forgets you overnight.'),
    icon: '◈',
    cash: 14000, margin: 0.72, costPerHead: 54000, multiple: 9, volatility: 1.5,
    rep: 18, influence: 8,
  },
  {
    id: 'food',
    name: T('Ushqim & Pije', 'Food & Beverage'),
    blurb: T('Para në dorë çdo ditë, marzhe të holla, çdo gabim ndihet menjëherë.',
             'Cash every single day, thin margins, every mistake shows up instantly.'),
    icon: '◉',
    cash: 11000, margin: 0.31, costPerHead: 24000, multiple: 3, volatility: 0.8,
    rep: 26, influence: 10,
  },
  {
    id: 'retail',
    name: T('Modë & Retail', 'Fashion & Retail'),
    blurb: T('Ti nuk shet produkt, shet identitet. Reputacioni është inventari yt i vërtetë.',
             'You do not sell product, you sell identity. Reputation is your real inventory.'),
    icon: '◆',
    cash: 12000, margin: 0.48, costPerHead: 28000, multiple: 4, volatility: 1.1,
    rep: 30, influence: 14,
  },
  {
    id: 'finance',
    name: T('Financë & Investime', 'Finance & Investing'),
    blurb: T('Paratë e të tjerëve janë arma jote. Edhe litari yt.',
             "Other people's money is your weapon. And your rope."),
    icon: '▲',
    cash: 18000, margin: 0.62, costPerHead: 68000, multiple: 6, volatility: 1.8,
    rep: 14, influence: 22,
  },
];

export const industryById = (id) => INDUSTRIES.find((i) => i.id === id) || INDUSTRIES[0];

// --------------------------------------------------------------------- tiers

export const TIERS = [
  { min: 0,            name: T('Fillestar', 'Rookie') },
  { min: 25000,        name: T('Sipërmarrës', 'Hustler') },
  { min: 120000,       name: T('Themelues', 'Founder') },
  { min: 600000,       name: T('Operator', 'Operator') },
  { min: 2500000,      name: T('Drejtues', 'Executive') },
  { min: 12000000,     name: T('Lider Tregu', 'Market Leader') },
  { min: 60000000,     name: T('Magnat', 'Magnate') },
  { min: 300000000,    name: T('Industrialist', 'Industrialist') },
  { min: 1200000000,   name: T('Perandor', 'Tycoon') },
  { min: 6000000000,   name: T('Miliarder Global', 'Global Billionaire') },
  { min: 30000000000,  name: T('Legjendë', 'Legend') },
  { min: 150000000000, name: T('Mit', 'Myth') },
];

const ROMAN = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Levels never stop: past the last tier each 10x adds a numeral.
export function tierOf(netWorth) {
  const nw = Math.max(0, netWorth);
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) if (nw >= TIERS[i].min) idx = i;
  const last = TIERS.length - 1;
  if (idx < last) return { level: idx + 1, name: TIERS[idx].name, suffix: '' };
  const over = Math.floor(Math.log10(Math.max(1, nw / TIERS[last].min)));
  return {
    level: last + 1 + over,
    name: TIERS[last].name,
    suffix: ROMAN[Math.min(over, ROMAN.length - 1)],
  };
}

export const tierIndex = (s) => tierOf(netWorth(s)).level - 1;

// ------------------------------------------------------------------- economy

export const PHASES = {
  boom:      { id: 'boom',      name: T('BUM', 'BOOM'),            demand: 1.24, growth: 0.028, rate: 0.045, capital: 1.45, color: '#38e08a' },
  stable:    { id: 'stable',    name: T('STABILE', 'STABLE'),      demand: 1.00, growth: 0.014, rate: 0.062, capital: 1.00, color: '#d7dce3' },
  slowdown:  { id: 'slowdown',  name: T('NGADALËSIM', 'SLOWDOWN'), demand: 0.86, growth: 0.003, rate: 0.085, capital: 0.68, color: '#f0b429' },
  crisis:    { id: 'crisis',    name: T('KRIZË', 'CRISIS'),        demand: 0.63, growth: -0.022, rate: 0.125, capital: 0.32, color: '#ff4d4d' },
  recovery:  { id: 'recovery',  name: T('RIMËKËMBJE', 'RECOVERY'), demand: 0.95, growth: 0.021, rate: 0.052, capital: 1.12, color: '#4dabf7' },
};

const TRANSITIONS = {
  boom:     [['boom', 0.62], ['slowdown', 0.26], ['stable', 0.09], ['crisis', 0.03]],
  stable:   [['stable', 0.58], ['boom', 0.18], ['slowdown', 0.20], ['crisis', 0.04]],
  slowdown: [['slowdown', 0.48], ['crisis', 0.24], ['stable', 0.20], ['recovery', 0.08]],
  crisis:   [['crisis', 0.46], ['recovery', 0.42], ['slowdown', 0.12]],
  recovery: [['recovery', 0.40], ['stable', 0.40], ['boom', 0.18], ['slowdown', 0.02]],
};

// --------------------------------------------------------------------- rivals

const RIVAL_NAMES = [
  'Halcyon Group', 'Nortek Holdings', 'Vela & Co.', 'Kastrati Ventures', 'Orion Partners',
  'Blue Meridian', 'Saxon Industries', 'Adriatik Capital', 'Norvex', 'Lumen Trading',
  'Iron Harbor', 'Solaris Works', 'Ardent Labs', 'Tenpoint Corp', 'Marrow & Sons',
];

const RIVAL_TRAITS = [
  { id: 'aggressive', name: T('agresiv', 'aggressive'), growth: 0.055, aggro: 0.9 },
  { id: 'patient',    name: T('i durueshëm', 'patient'), growth: 0.032, aggro: 0.35 },
  { id: 'reckless',   name: T('i pamatur', 'reckless'),  growth: 0.075, aggro: 0.7 },
  { id: 'entrenched', name: T('i rrënjosur', 'entrenched'), growth: 0.022, aggro: 0.5 },
];

// ----------------------------------------------------------------------- rng

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Advances the seeded stream stored on the state, so saves replay identically.
export function rand(s) {
  s.rngState = (s.rngState + 0x9E3779B9) | 0;
  return mulberry32(s.rngState)();
}
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length) % arr.length];

// ------------------------------------------------------------------ formulas

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Cash "unit": scales with company size so a decision stays meaningful at
// every level of the game, from a 6k garage bet to a 600M acquisition.
export const U = (s) => Math.max(6000, 0.08 * s.revenue + 0.03 * Math.max(0, s.cash));
// Revenue "unit": what one solid new line of business is worth right now.
// Damped at scale — a new product line moves a 10M company far more than a 10B one.
export const RU = (s) => Math.max(24000, 0.22 * s.revenue * damp(s));

// Gravity of size. Everything that multiplies revenue gets harder the bigger
// you are, which is what keeps an endless career from turning into a straight
// line to infinity.
export function damp(s) {
  const over = Math.log10(Math.max(1, s.revenue) / 5e6);
  return over <= 0 ? 1 : 1 / (1 + over * 0.85);
}

export function companyValue(s) {
  const eco = PHASES[s.economy.phase];
  const repFactor = 0.7 + s.rep / 200;
  const ecoFactor = 0.8 + 0.4 * eco.capital;
  // Nobody pays a full industry multiple for an unproven business. The market
  // pays for a track record, so small revenue trades at a fraction of it.
  const maturity = clamp(0.22 + 0.39 * Math.log10(Math.max(1, s.revenue / 25000)), 0.22, 1);
  return Math.max(0, s.revenue * s.multiple * maturity * s.valuationBoost * repFactor * ecoFactor);
}

export function netWorth(s) {
  return s.cash + (s.equity / 100) * companyValue(s) - s.debt;
}

export function quarterOpex(s) {
  const staff = Math.max(0, s.teamSize - 1) * (s.costPerHead / 4);
  return staff + s.personalBurn / 4 + s.fixedCost / 4;
}

export function quarterProfit(s) {
  const eco = PHASES[s.economy.phase];
  const demand = eco.demand * (1 + (s.rep - 50) / 250);
  const gross = (s.revenue / 4) * demand * s.margin;
  const interest = s.debt * (eco.rate / 4);
  return gross - quarterOpex(s) - interest;
}

export function runway(s) {
  const p = quarterProfit(s);
  if (p >= 0) return Infinity;
  return Math.max(0, s.cash / -p);
}

// ------------------------------------------------------------------- effects

export function applyFx(s, fx) {
  if (!fx) return;
  if (fx.cash) s.cash += fx.cash;
  if (fx.cashU) s.cash += fx.cashU * U(s);
  if (fx.revU) s.revenue = Math.max(0, s.revenue + fx.revU * RU(s));
  if (fx.revMult) {
    const d = fx.revMult >= 1 ? damp(s) : 1; // losses always land in full
    s.revenue = Math.max(0, s.revenue * (1 + (fx.revMult - 1) * d));
  }
  if (fx.marginAdd) s.margin = clamp(s.margin + fx.marginAdd, 0.05, 0.92);
  if (fx.marginMult) s.margin = clamp(s.margin * fx.marginMult, 0.05, 0.92);
  if (fx.team) s.teamSize = Math.max(1, Math.round(s.teamSize + fx.team));
  if (fx.teamMult) s.teamSize = Math.max(1, Math.round(s.teamSize * fx.teamMult));
  if (fx.rep) s.rep = clamp(s.rep + fx.rep, 0, 100);
  if (fx.morale) s.morale = clamp(s.morale + fx.morale, 0, 100);
  if (fx.influence) s.influence = clamp(s.influence + fx.influence, 0, 100);
  if (fx.stress) s.stress = clamp(s.stress + fx.stress, 0, 100);
  if (fx.equity) s.equity = clamp(s.equity + fx.equity, 0, 100);
  if (fx.debtU) s.debt = Math.max(0, s.debt + fx.debtU * U(s));
  if (fx.debtClear) s.debt = Math.max(0, s.debt * (1 - fx.debtClear));
  if (fx.valuation) s.valuationBoost = clamp(s.valuationBoost * fx.valuation, 0.2, 3.5);
  if (fx.multipleAdd) s.multiple = Math.max(1, s.multiple + fx.multipleAdd);
  if (fx.costMult) s.costPerHead *= fx.costMult;
  if (fx.fixedCostU) s.fixedCost = Math.max(0, s.fixedCost + fx.fixedCostU * U(s));
  if (fx.set) Object.assign(s.flags, fx.set);
}

// --------------------------------------------------------------------- state

export function newGame({ name, industry, seed }) {
  const ind = industryById(industry);
  const s = {
    v: 1,
    seed: seed || Math.floor(Math.random() * 1e9),
    name: (name || '').trim() || 'Anon',
    industry: ind.id,
    year: 1,
    quarter: 1,
    cash: ind.cash,
    revenue: 0,
    margin: ind.margin,
    costPerHead: ind.costPerHead,
    personalBurn: 12000,
    fixedCost: 0,
    multiple: ind.multiple,
    volatility: ind.volatility,
    valuationBoost: 1,
    teamSize: 1,
    rep: ind.rep,
    morale: 72,
    influence: ind.influence,
    stress: 18,
    equity: 100,
    debt: 0,
    peak: 0,
    history: [],
    flags: {},
    seen: {},
    rivals: [],
    economy: { phase: 'stable', since: 0 },
    rivalSeq: 0,
    log: [],
    status: 'playing',
    ending: null,
    level: 1,
  };
  s.rngState = s.seed;
  for (let i = 0; i < 3; i++) s.rivals.push(makeRival(s, i));
  s.history.push(netWorth(s));
  pushLog(s, 'story', T(
    `${s.name} hap derën e parë. ${ind.name.sq}. Askush nuk e di ende emrin tënd.`,
    `${s.name} opens the first door. ${ind.name.en}. Nobody knows your name yet.`
  ));
  return s;
}

function makeRival(s, i) {
  const trait = RIVAL_TRAITS[Math.floor(rand(s) * RIVAL_TRAITS.length)];
  const free = RIVAL_NAMES.filter((n) => !s.rivals.some((r) => r.name === n));
  s.rivalSeq = (s.rivalSeq || 0) + 1;
  return {
    id: s.rivalSeq,
    name: free.length ? pick(s, free) : `${pick(s, RIVAL_NAMES)} ${s.rivalSeq}`,
    trait: trait.id,
    traitName: trait.name,
    growth: trait.growth,
    aggro: trait.aggro,
    value: 60000 + rand(s) * 340000,
    alive: true,
  };
}

export function pushLog(s, type, text) {
  s.log.unshift({ type, y: s.year, q: s.quarter, text });
  if (s.log.length > 60) s.log.pop();
}

// --------------------------------------------------------------- quarter tick

export function advanceQuarter(s) {
  const before = tierOf(netWorth(s)).level;

  // --- economy transition
  s.economy.since += 1;
  if (s.economy.since >= 2 + Math.floor(rand(s) * 4)) {
    const table = TRANSITIONS[s.economy.phase];
    let r = rand(s);
    let next = s.economy.phase;
    for (const [phase, p] of table) { if (r < p) { next = phase; break; } r -= p; }
    if (next !== s.economy.phase) {
      s.economy = { phase: next, since: 0 };
      pushLog(s, 'econ', T(
        `Tregu kalon në fazën ${PHASES[next].name.sq}. Rregullat sapo ndryshuan.`,
        `The market shifts into ${PHASES[next].name.en}. The rules just changed.`
      ));
    } else s.economy.since = 0;
  }
  const eco = PHASES[s.economy.phase];

  // --- financial result
  const profit = quarterProfit(s);
  s.cash += profit;
  s.lastProfit = profit;

  // --- organic growth / decay
  const rivalPressure = rivalShare(s) * 0.035;
  const teamEffect = Math.min(0.055, 0.005 * Math.sqrt(s.teamSize) * (s.morale / 70));
  const repEffect = (s.rep - 50) / 1200;
  const infEffect = s.influence / 3000;
  const noise = (rand(s) - 0.5) * 0.02 * s.volatility;
  const sizeDrag = s.revenue > 2e6 ? 0.017 * Math.log10(s.revenue / 2e6) : 0;
  let g = 0.008 + eco.growth + teamEffect + repEffect + infEffect - rivalPressure - sizeDrag + noise;
  if (s.morale < 30) g -= 0.03;
  if (s.stress > 80) g -= 0.02;
  s.revenue = Math.max(0, s.revenue * (1 + g));
  s.lastGrowth = g;

  // --- human cost
  s.stress = clamp(s.stress + (g > 0.05 ? 1.8 : 0.6) - (s.morale > 75 ? 1.4 : 0), 0, 100);
  s.morale = clamp(s.morale + (profit > 0 ? 0.8 : -1.6) - (s.stress > 70 ? 1.2 : 0), 0, 100);
  s.rep = clamp(s.rep + (s.revenue > 0 && profit > 0 ? 0.5 : -0.3), 0, 100);

  // --- rivals move
  tickRivals(s, eco);

  // --- emergency financing before declaring bankruptcy
  if (s.cash < 0) {
    // Even a pre-revenue founder has a personal credit line; the market only
    // shuts the tap once your name is worthless.
    const personalLine = s.rep > 18 ? U(s) * 1.8 : 0;
    const capacity = Math.max(personalLine, s.revenue * 1.2 * (s.rep / 60) * eco.capital);
    if (s.debt < capacity && s.rep > 12) {
      const need = -s.cash + quarterOpex(s);
      s.debt += need;
      s.cash += need;
      s.rep = clamp(s.rep - 3, 0, 100);
      pushLog(s, 'bad', T(
        `Banka mbulon vrimën me ${fmtMoney(need)} borxh. Interesi ${(eco.rate * 100).toFixed(1)}%.`,
        `The bank plugs the hole with ${fmtMoney(need)} of debt. Interest ${(eco.rate * 100).toFixed(1)}%.`
      ));
    }
  }

  // --- morale collapse
  if (s.morale <= 8 && s.teamSize > 2) {
    const lost = Math.floor(s.teamSize * 0.45);
    s.teamSize -= lost;
    s.morale = 34;
    s.revenue *= 0.86;
    pushLog(s, 'bad', T(
      `${lost} njerëz largohen njëherësh. Ekipi thyhet në mes.`,
      `${lost} people walk out at once. The team breaks in half.`
    ));
  }

  // --- clock
  s.quarter += 1;
  if (s.quarter > 4) { s.quarter = 1; s.year += 1; }

  const nw = netWorth(s);
  s.peak = Math.max(s.peak, nw);
  s.history.push(nw);
  if (s.history.length > 160) s.history.shift();

  const after = tierOf(nw).level;
  s.level = after;
  if (after > before) {
    const tr = tierOf(nw);
    s.tierUp = { level: after, name: tr.name, suffix: tr.suffix };
    pushLog(s, 'good', T(
      `NIVEL ${after} — ${tr.name.sq} ${tr.suffix}. Tregu të sheh ndryshe tani.`,
      `LEVEL ${after} — ${tr.name.en} ${tr.suffix}. The market sees you differently now.`
    ));
  } else s.tierUp = null;

  checkEndings(s);
  return s;
}

function rivalShare(s) {
  const mine = companyValue(s) + 1;
  const theirs = s.rivals.filter((r) => r.alive).reduce((a, r) => a + r.value, 0);
  return theirs / (theirs + mine);
}

function tickRivals(s, eco) {
  s.rivals.forEach((r) => {
    if (!r.alive) return;
    const shock = (rand(s) - 0.45) * 0.08;
    r.value *= 1 + r.growth * (eco.demand - 0.15) + shock + eco.growth;
    if (r.value < 20000 || (eco.id === 'crisis' && rand(s) < 0.05 * r.aggro)) {
      r.alive = false;
      pushLog(s, 'rival', T(
        `${r.name} shembet. Tregu i tyre mbetet i lirë.`,
        `${r.name} collapses. Their market is up for grabs.`
      ));
      s.revenue *= 1.06;
    }
  });
  const alive = s.rivals.filter((r) => r.alive).length;
  if (alive < 3 && rand(s) < 0.18) {
    const nr = makeRival(s, alive);
    nr.value = Math.max(nr.value, companyValue(s) * (0.3 + rand(s) * 0.6));
    s.rivals.push(nr);
    pushLog(s, 'rival', T(
      `${nr.name} hyn në treg, i financuar mirë dhe ${nr.traitName.sq}.`,
      `${nr.name} enters the market, well funded and ${nr.traitName.en}.`
    ));
  }
  s.rivals = s.rivals.filter((r) => r.alive).slice(-5);
}

// ------------------------------------------------------------------- endings

export const ENDINGS = {
  bankrupt: {
    title: T('FALIMENTIM', 'BANKRUPTCY'),
    text: T('Llogaria u mbyll nga banka. Mobiljet u shitën në ankand. Emri yt mbeti në një dosje gjyqi.',
            'The bank froze the account. The furniture went to auction. Your name stayed in a court file.'),
  },
  burnout: {
    title: T('SHKRIRJE', 'BURNOUT'),
    text: T('Trupi tha ndal para se tregu ta thoshte. Kompania vazhdoi pa ty — dhe kjo është pjesa më e rëndë.',
            'Your body said stop before the market did. The company carried on without you — that is the hard part.'),
  },
  disgrace: {
    title: T('TURPËRIM PUBLIK', 'PUBLIC DISGRACE'),
    text: T('Askush nuk të kthen telefonatat. Në këtë lojë, reputacioni ishte kapitali i vetëm që nuk blihej.',
            'Nobody returns your calls. In this game, reputation was the one kind of capital you could not buy.'),
  },
  sold: {
    title: T('DALJE E ARTË', 'GOLDEN EXIT'),
    text: T('Nënshkrove dhe dole. Disa e quajnë fitore, disa dorëzim. Numrat janë numra.',
            'You signed and walked away. Some call it a win, some a surrender. Numbers are numbers.'),
  },
  retired: {
    title: T('TËRHEQJE ME NDERIME', 'RETIRED IN HONOUR'),
    text: T('Ia dorëzove timonin dikujt tjetër ndërsa ishe ende në krye. Pak e bëjnë këtë.',
            'You handed over the wheel while still on top. Very few manage that.'),
  },
};

function end(s, key, extra) {
  s.status = 'over';
  const tr = tierOf(netWorth(s));
  s.ending = {
    key,
    title: ENDINGS[key].title,
    text: extra || ENDINGS[key].text,
    netWorth: netWorth(s),
    peak: s.peak,
    years: s.year - 1 + (s.quarter - 1) / 4,
    level: tr.level,
    rank: tr.name,
    suffix: tr.suffix,
    score: Math.round(Math.max(0, s.peak) / 1000 + (s.year * 250) + tr.level * 5000 + s.rep * 400 + s.influence * 300),
  };
  pushLog(s, 'bad', T(`FUND: ${s.ending.title.sq}`, `END: ${s.ending.title.en}`));
}

export function checkEndings(s) {
  if (s.status !== 'playing') return s;
  // Bankruptcy is only declared once the hole is real and nobody will fund it.
  if (s.cash < -U(s) * 0.6) return end(s, 'bankrupt'), s;
  if (s.stress >= 100) return end(s, 'burnout'), s;
  if (s.rep <= 0) return end(s, 'disgrace'), s;
  return s;
}

export function endCareer(s, key, text) { end(s, key, text); return s; }

// ------------------------------------------------------------------ formatting

export function fmtMoney(n) {
  const neg = n < 0;
  const v = Math.abs(n);
  let out;
  if (v >= 1e12) out = (v / 1e12).toFixed(2) + 'T';
  else if (v >= 1e9) out = (v / 1e9).toFixed(2) + 'B';
  else if (v >= 1e6) out = (v / 1e6).toFixed(2) + 'M';
  else if (v >= 1e3) out = (v / 1e3).toFixed(1) + 'K';
  else out = v.toFixed(0);
  return (neg ? '-€' : '€') + out;
}

export function fmtPct(n, digits = 1) {
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(digits) + '%';
}
