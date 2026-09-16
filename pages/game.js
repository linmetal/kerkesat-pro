import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UI } from '../lib/game/i18n';
import {
  ENDINGS, INDUSTRIES, industryById, PHASES, netWorth, companyValue, quarterProfit,
  quarterOpex, runway, fmtMoney, fmtPct, tierOf,
} from '../lib/game/engine';
import {
  startGame, choose, currentCard, saveGame, loadGame, clearGame, loadHof, recordHof,
} from '../lib/game/play';
import { visibleOptions, resolve } from '../lib/game/cards';
import { Num, Spark, Meter, Delta } from '../components/GameBits';

const money = (v) => fmtMoney(v);

export default function Game() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState('sq');
  const [phase, setPhase] = useState('boot');       // boot | menu | play | outcome | over
  const [game, setGame] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [hof, setHof] = useState([]);
  const [saved, setSaved] = useState(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('tech');
  const [bootLines, setBootLines] = useState([]);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const T = UI[lang];

  // ------------------------------------------------------------- boot sequence
  useEffect(() => {
    setMounted(true);
    try {
      const l = window.localStorage.getItem('career.sim.lang');
      if (l === 'en' || l === 'sq') setLang(l);
    } catch (e) { /* ignore */ }
    setSaved(loadGame());
    setHof(loadHof());
    const lines = UI.sq.boot;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setBootLines(lines.slice(0, i));
      if (i >= lines.length) {
        clearInterval(iv);
        setTimeout(() => setPhase('menu'), 420);
      }
    }, 260);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { window.localStorage.setItem('career.sim.lang', lang); } catch (e) { /* ignore */ }
  }, [lang, mounted]);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  // A new screen always starts at the top, however far the last one scrolled.
  useEffect(() => {
    if (phase === 'menu' || phase === 'over') window.scrollTo(0, 0);
  }, [phase]);

  // ------------------------------------------------------------------ actions
  const begin = useCallback(() => {
    const s = startGame({ name, industry });
    setGame(s);
    setOutcome(null);
    setPhase('play');
  }, [name, industry]);

  const resume = useCallback(() => {
    if (!saved) return;
    setGame(saved);
    setPhase(saved.status === 'over' ? 'over' : 'play');
  }, [saved]);

  const decide = useCallback((index) => {
    if (!game || phase !== 'play') return;
    const { state, outcome: out } = choose(game, index);
    setGame(state);
    setOutcome(out);
    setPhase('outcome');
  }, [game, phase]);

  const proceed = useCallback(() => {
    if (!game) return;
    if (game.status === 'over') {
      const { list, at } = recordHof(game);
      setHof(list);
      setLastRun(at);
      clearGame();
      setSaved(null);
      setPhase('over');
    } else {
      setOutcome(null);
      setPhase('play');
    }
  }, [game]);

  const abandon = useCallback(() => {
    clearGame();
    setSaved(null);
    setGame(null);
    setOutcome(null);
    setConfirmQuit(false);
    setPhase('menu');
  }, []);

  // --------------------------------------------------------------- shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (phase === 'play' && game) {
        const card = currentCard(game);
        const opts = card ? visibleOptions(card, game) : [];
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= opts.length) decide(n - 1);
      } else if (phase === 'outcome' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        proceed();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, game, decide, proceed]);

  // ------------------------------------------------------------------ derived
  const view = useMemo(() => {
    if (!game) return null;
    const nw = netWorth(game);
    const tier = tierOf(nw);
    const rw = runway(game);
    return {
      nw, tier,
      value: companyValue(game),
      profit: quarterProfit(game),
      opex: quarterOpex(game),
      runway: rw,
      eco: PHASES[game.economy.phase],
      ind: industryById(game.industry),
    };
  }, [game]);

  const tx = (field) => {
    const o = resolve(field, game);
    return o ? o[lang] : '';
  };

  if (!mounted) return <div className="preload" />;

  return (
    <>
      <Head>
        <title>{lang === 'sq' ? 'Perandori · Simulator Karriere' : 'Empire · Career Simulator'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content={lang === 'sq'
            ? 'Simulator karriere biznesi: vendime, rivalë, cikle ekonomike dhe nivele pa fund.'
            : 'Business career simulator: decisions, rivals, economic cycles and endless levels.'}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="term">
        {phase === 'boot' && (
          <div className="boot">
            {bootLines.map((l, i) => <div key={i} className="bootline">{'> '}{l}</div>)}
            <div className="cursor">_</div>
          </div>
        )}

        {phase === 'menu' && (
          <Menu
            T={T} lang={lang} setLang={setLang} name={name} setName={setName}
            industry={industry} setIndustry={setIndustry} begin={begin}
            saved={saved} resume={resume} hof={hof}
          />
        )}

        {(phase === 'play' || phase === 'outcome') && game && view && (
          <div className="app">
            <Header
              T={T} lang={lang} setLang={setLang} game={game} view={view}
              onQuit={() => setConfirmQuit(true)}
            />

            <div className="grid">
              <aside className="panel stats">
                <Stats T={T} game={game} view={view} lang={lang} outcome={outcome} />
              </aside>

              <main className="panel stage">
                {phase === 'play' ? (
                  <Decision T={T} game={game} tx={tx} decide={decide} lang={lang} />
                ) : (
                  <Outcome T={T} game={game} outcome={outcome} lang={lang} proceed={proceed} view={view} />
                )}
              </main>

              <aside className="panel market">
                <Market T={T} game={game} view={view} lang={lang} />
              </aside>
            </div>

            {confirmQuit && (
              <div className="modal">
                <div className="modal-box">
                  <p>{T.confirmAbandon}</p>
                  <div className="modal-actions">
                    <button className="btn danger" onClick={abandon}>{T.yes}</button>
                    <button className="btn" onClick={() => setConfirmQuit(false)}>{T.no}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'over' && game && (
          <Over T={T} game={game} lang={lang} hof={hof} lastRun={lastRun} again={abandon} />
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body, #__next { height: 100%; margin: 0; background: #05070a; }
        body {
          font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          color: #c9d4e0; -webkit-font-smoothing: antialiased;
        }
        .preload { min-height: 100vh; background: #05070a; }
        .term {
          min-height: 100vh;
          background:
            radial-gradient(1100px 600px at 50% -10%, rgba(56, 224, 138, 0.06), transparent 70%),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px),
            #05070a;
        }
        .boot { padding: 18vh 8vw; font-size: 13px; color: #38e08a; letter-spacing: 0.06em; }
        .bootline { animation: fade 0.3s ease; margin-bottom: 8px; }
        .cursor { display: inline-block; animation: blink 1s steps(1) infinite; color: #38e08a; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; } }

        .app { max-width: 1400px; margin: 0 auto; padding: 0 14px 40px; }
        .grid {
          display: grid; grid-template-columns: 272px minmax(0, 1fr) 292px;
          gap: 14px; align-items: start;
        }
        .panel {
          background: linear-gradient(180deg, #0a0f15, #080c11);
          border: 1px solid #16202b; padding: 16px;
        }
        .stage { min-height: 520px; display: flex; flex-direction: column; }

        .btn {
          font: inherit; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          background: #0d141c; color: #c9d4e0; border: 1px solid #22303e;
          padding: 9px 16px; cursor: pointer; transition: all 0.15s ease;
        }
        .btn:hover { border-color: #38e08a; color: #38e08a; }
        .btn.primary { background: #38e08a; color: #04160c; border-color: #38e08a; font-weight: 600; }
        .btn.primary:hover { background: #4df09b; color: #04160c; }
        .btn.danger:hover { border-color: #ff4d4d; color: #ff4d4d; }

        .label { font-size: 9.5px; letter-spacing: 0.16em; color: #5d6b7a; text-transform: uppercase; }
        .sep { height: 1px; background: #16202b; margin: 14px 0; }

        .modal {
          position: fixed; inset: 0; background: rgba(2, 4, 7, 0.86);
          display: flex; align-items: center; justify-content: center; z-index: 40;
        }
        .modal-box { background: #0a0f15; border: 1px solid #22303e; padding: 26px; max-width: 420px; }
        .modal-box p { font-size: 13px; line-height: 1.7; margin: 0 0 20px; }
        .modal-actions { display: flex; gap: 10px; }

        @media (max-width: 1020px) {
          .grid { grid-template-columns: 1fr; }
          .stage { min-height: 0; order: -1; }
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------- menu */

function Menu({ T, lang, setLang, name, setName, industry, setIndustry, begin, saved, resume, hof }) {
  return (
    <div className="menu">
      <button className="lang" onClick={() => setLang(lang === 'sq' ? 'en' : 'sq')}>{T.lang}</button>
      <div className="brand">
        <div className="logo">{lang === 'sq' ? 'PERANDORI' : 'EMPIRE'}</div>
        <div className="tag">{T.tagline}</div>
      </div>

      {saved && saved.status !== 'over' && (
        <button className="btn primary wide" onClick={resume}>
          {T.continue} — {saved.name} · {T.year} {saved.year} · {T.level} {saved.level}
        </button>
      )}

      <div className="block">
        <div className="label">{T.yourName}</div>
        <input
          className="input" value={name} maxLength={22}
          placeholder={T.namePlaceholder} onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="block">
        <div className="label">{T.pickIndustry}</div>
        <div className="inds">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.id}
              className={`ind ${industry === ind.id ? 'on' : ''}`}
              onClick={() => setIndustry(ind.id)}
            >
              <div className="ind-top">
                <span className="icon">{ind.icon}</span>
                <span className="ind-name">{ind.name[lang]}</span>
              </div>
              <p>{ind.blurb[lang]}</p>
              <div className="ind-stats">
                <span>{lang === 'sq' ? 'kapital' : 'capital'} {fmtMoney(ind.cash)}</span>
                <span>{lang === 'sq' ? 'marzh' : 'margin'} {(ind.margin * 100).toFixed(0)}%</span>
                <span>{lang === 'sq' ? 'paqëndrueshmëri' : 'volatility'} {ind.volatility.toFixed(1)}x</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="btn primary wide big" onClick={begin}>{T.startBtn}</button>

      {hof.length > 0 && (
        <div className="block">
          <div className="label">{T.hof}</div>
          <table className="hof">
            <tbody>
              {hof.slice(0, 6).map((h, i) => (
                <tr key={h.at}>
                  <td className="rk">{String(i + 1).padStart(2, '0')}</td>
                  <td>{h.name}</td>
                  <td className="dim">{h.rank[lang]} {h.suffix}</td>
                  <td className="num">{fmtMoney(h.peak)}</td>
                  <td className="dim">{h.years}y</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .menu { max-width: 820px; margin: 0 auto; padding: 56px 18px 80px; animation: fade 0.5s ease; }
        .lang {
          position: fixed; top: 16px; right: 16px; font: inherit; font-size: 10px;
          letter-spacing: 0.14em; background: #0d141c; color: #6b7a8b;
          border: 1px solid #22303e; padding: 6px 12px; cursor: pointer;
        }
        .lang:hover { color: #38e08a; border-color: #38e08a; }
        .brand { margin-bottom: 38px; }
        .logo {
          font-size: clamp(30px, 7vw, 54px); font-weight: 600; letter-spacing: 0.22em;
          color: #eef3f8; line-height: 1;
        }
        .tag { font-size: 10px; letter-spacing: 0.2em; color: #5d6b7a; margin-top: 12px; }
        .block { margin: 26px 0; }
        .label { font-size: 9.5px; letter-spacing: 0.16em; color: #5d6b7a; text-transform: uppercase; margin-bottom: 10px; }
        .input {
          font: inherit; width: 100%; background: #0a0f15; border: 1px solid #22303e;
          color: #eef3f8; padding: 12px 14px; font-size: 14px;
        }
        .input:focus { outline: none; border-color: #38e08a; }
        .inds { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
        .ind {
          font: inherit; text-align: left; background: #0a0f15; border: 1px solid #16202b;
          color: #c9d4e0; padding: 14px; cursor: pointer; transition: all 0.18s ease;
        }
        .ind:hover { border-color: #2c3f52; transform: translateY(-2px); }
        .ind.on { border-color: #38e08a; background: #0b1710; }
        .ind-top { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
        .icon { color: #38e08a; font-size: 15px; }
        .ind-name { font-size: 13px; letter-spacing: 0.06em; color: #eef3f8; }
        .ind p { font-size: 11.5px; line-height: 1.65; color: #7b8b9c; margin: 0 0 10px; }
        .ind-stats { display: flex; flex-wrap: wrap; gap: 10px; font-size: 9.5px; color: #4f5d6c; letter-spacing: 0.06em; }
        .wide { width: 100%; }
        .big { padding: 16px; font-size: 12px; letter-spacing: 0.2em; }
        .hof { width: 100%; border-collapse: collapse; font-size: 11px; }
        .hof td { padding: 7px 8px; border-bottom: 1px solid #101820; }
        .rk { color: #38e08a; }
        .dim { color: #5d6b7a; }
        .num { text-align: right; color: #eef3f8; }
      `}</style>
    </div>
  );
}

/* ----------------------------------------------------------------- header */

function Header({ T, lang, setLang, game, view, onQuit }) {
  const warn = [];
  if (view.runway !== Infinity && view.runway < 2) warn.push(T.bankruptWarn);
  if (game.stress > 78) warn.push(T.stressWarn);
  if (game.rep < 18) warn.push(T.repWarn);

  return (
    <header className="hd">
      <div className="hd-main">
        <div className="who">
          <span className="nm">{game.name}</span>
          <span className="dot">·</span>
          <span className="ind">{view.ind.icon} {view.ind.name[lang]}</span>
        </div>
        <div className="clock">
          <span>{T.year} <b>{game.year}</b></span>
          <span className="dot">·</span>
          <span>{T.quarter}<b>{game.quarter}</b></span>
          <span className="dot">·</span>
          <span className="lvl">{T.level} <b>{view.tier.level}</b> — {view.tier.name[lang]} {view.tier.suffix}</span>
        </div>
        <div className="tools">
          <span className="eco" style={{ color: view.eco.color }}>● {view.eco.name[lang]}</span>
          <button className="mini" onClick={() => setLang(lang === 'sq' ? 'en' : 'sq')}>{T.lang}</button>
          <button className="mini" onClick={onQuit}>{T.abandon}</button>
        </div>
      </div>
      {warn.length > 0 && (
        <div className="warn">{warn.map((w, i) => <span key={i}>⚠ {w}</span>)}</div>
      )}
      <style jsx>{`
        .hd { padding: 16px 2px 14px; }
        .hd-main {
          display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center;
          justify-content: space-between; border-bottom: 1px solid #16202b; padding-bottom: 12px;
        }
        .nm { color: #eef3f8; font-size: 13px; letter-spacing: 0.1em; }
        .ind { color: #7b8b9c; font-size: 11px; }
        .dot { color: #2c3f52; margin: 0 8px; }
        .clock { font-size: 11px; color: #7b8b9c; letter-spacing: 0.08em; }
        .clock b { color: #eef3f8; font-weight: 500; }
        .lvl { color: #38e08a; }
        .lvl b { color: #38e08a; }
        .tools { display: flex; align-items: center; gap: 10px; }
        .eco { font-size: 10px; letter-spacing: 0.14em; }
        .mini {
          font: inherit; font-size: 9.5px; letter-spacing: 0.14em; background: transparent;
          color: #5d6b7a; border: 1px solid #22303e; padding: 5px 10px; cursor: pointer;
        }
        .mini:hover { color: #ff4d4d; border-color: #ff4d4d; }
        .warn {
          display: flex; flex-wrap: wrap; gap: 16px; padding: 8px 0 0;
          font-size: 10px; letter-spacing: 0.1em; color: #f0b429;
        }
      `}</style>
    </header>
  );
}

/* ------------------------------------------------------------------ stats */

function Stats({ T, game, view, lang, outcome }) {
  const d = outcome ? outcome.deltas : null;
  const nwColor = view.nw >= 0 ? '#38e08a' : '#ff4d4d';
  return (
    <div>
      <div className="label">{T.netWorth}</div>
      <div className="big" style={{ color: nwColor }}>
        <Num value={view.nw} format={money} />
        {d && <Delta value={d.netWorth} format={money} />}
      </div>
      <Spark data={game.history} color={nwColor} />

      <div className="sep" />
      <Row label={T.cash} value={game.cash} delta={d && d.cash} />
      <Row label={T.revenue} value={game.revenue} delta={d && d.revenue} />
      <Row label={T.company} value={view.value} delta={d && d.value} />
      <Row label={T.debt} value={game.debt} delta={d && d.debt} invert />
      <Row label={T.profit} value={view.profit} />

      <div className="sep" />
      <div className="mini-grid">
        <div><span className="label">{T.equity}</span><b>{game.equity.toFixed(0)}%</b></div>
        <div><span className="label">{T.team}</span><b>{game.teamSize}</b></div>
        <div><span className="label">{T.margin}</span><b>{(game.margin * 100).toFixed(0)}%</b></div>
        <div>
          <span className="label">{T.runway}</span>
          <b style={{ color: view.runway < 2 ? '#ff4d4d' : '#c9d4e0' }}>
            {view.runway === Infinity ? '∞' : `${view.runway.toFixed(1)} ${T.quarters}`}
          </b>
        </div>
      </div>

      <Circle T={T} game={game} />

      <div className="sep" />
      <Meter label={T.reputation} value={game.rep} />
      <Meter label={T.morale} value={game.morale} />
      <Meter label={T.influence} value={game.influence} />
      <Meter label={T.stress} value={game.stress} invert />

      <div className="foot">{T.autosaved} ✓</div>
      <style jsx>{`
        .big { font-size: 25px; letter-spacing: 0.02em; margin: 6px 0 10px; }
        .mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 10px; }
        .mini-grid div { display: flex; flex-direction: column; gap: 3px; }
        .mini-grid b { font-size: 13px; font-weight: 500; color: #eef3f8; }
        .foot { margin-top: 16px; font-size: 9px; letter-spacing: 0.12em; color: #33404d; }
      `}</style>
    </div>
  );
}

const ROLE_KEY = { cofounder: 'roleCofounder', mentor: 'roleMentor', hand: 'roleHand' };

// The handful of names a career is actually remembered through.
function Circle({ T, game }) {
  const people = Object.entries(game.people || {}).filter(([role]) => ROLE_KEY[role]);
  if (!people.length) return null;
  return (
    <>
      <div className="sep" />
      <div className="label">{T.circle}</div>
      <div className="people">
        {people.map(([role, p]) => (
          <div className="pr" key={role}>
            <div className="pr-top">
              <span className="pn">{p.name}</span>
              <span className="pl" style={{ color: p.loyalty < 40 ? '#ff6b6b' : p.loyalty > 70 ? '#38e08a' : '#f0b429' }}>
                {Math.round(p.loyalty)}
              </span>
            </div>
            <div className="pr-role">{T[ROLE_KEY[role]]} · {T.loyalty}</div>
            <div className="pr-track">
              <div
                className="pr-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, p.loyalty))}%`,
                  background: p.loyalty < 40 ? '#ff4d4d' : p.loyalty > 70 ? '#38e08a' : '#f0b429',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .people { display: flex; flex-direction: column; gap: 11px; margin-top: 8px; }
        .pr-top { display: flex; justify-content: space-between; align-items: baseline; }
        .pn { font-size: 12px; color: #eef3f8; }
        .pl { font-size: 11px; }
        .pr-role { font-size: 9px; letter-spacing: 0.1em; color: #4f5d6c; margin: 3px 0 5px; }
        .pr-track { height: 3px; background: #131b24; }
        .pr-fill { height: 100%; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>
    </>
  );
}

function Row({ label, value, delta, invert }) {
  const color = value < 0 ? '#ff6b6b' : invert && value > 0 ? '#f0b429' : '#eef3f8';
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span className="v" style={{ color }}>
        <Num value={value} format={money} />
        {delta ? <Delta value={invert ? -delta : delta} format={money} /> : null}
      </span>
      <style jsx>{`
        .row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; gap: 10px; }
        .v { font-size: 12.5px; }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- decision */

function Decision({ T, game, tx, decide, lang }) {
  const card = currentCard(game);
  if (!card) return null;
  const opts = visibleOptions(card, game);
  return (
    <div className="dec">
      <div className="tagline">
        <span className={card.interrupt ? 'tag alert' : 'tag'}>
          {card.interrupt ? T.interrupt : T.decision}
        </span>
        <span className="code">#{card.id.toUpperCase().replace(/_/g, '-')}</span>
      </div>

      <h2>{tx(card.title)}</h2>
      <p className="body">{tx(card.body)}</p>

      <div className="opts">
        {opts.map((o, i) => (
          <button key={i} className="opt" onClick={() => decide(i)}>
            <span className="key">{i + 1}</span>
            <span className="txt">
              <span className="lab">
                {o.label[lang]}
                {o.risk && <em className="risk">{T.risky} {Math.round(o.risk.p * 100)}%</em>}
                {o.end && <em className="fin">{o.end === 'sold' ? T.sold : '✦'}</em>}
              </span>
              <span className="hint">{o.hint[lang]}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="kbd">{T.hint}</div>

      <style jsx>{`
        .dec { animation: fade 0.35s ease; display: flex; flex-direction: column; flex: 1; }
        .tagline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .tag {
          font-size: 9px; letter-spacing: 0.22em; color: #04160c; background: #38e08a;
          padding: 4px 10px;
        }
        .tag.alert { background: #ff4d4d; color: #180404; animation: pulse 1.6s ease infinite; }
        @keyframes pulse { 50% { opacity: 0.55; } }
        .code { font-size: 9px; letter-spacing: 0.14em; color: #2c3f52; }
        h2 {
          font-size: clamp(19px, 2.6vw, 27px); font-weight: 500; color: #eef3f8;
          margin: 0 0 14px; letter-spacing: 0.01em; line-height: 1.3;
        }
        .body { font-size: 14px; line-height: 1.85; color: #93a3b4; margin: 0 0 26px; max-width: 62ch; }
        .opts { display: flex; flex-direction: column; gap: 9px; }
        .opt {
          font: inherit; display: flex; gap: 14px; align-items: flex-start; text-align: left;
          background: #0a0f15; border: 1px solid #16202b; color: #c9d4e0;
          padding: 14px 16px; cursor: pointer; transition: all 0.16s ease;
        }
        .opt:hover { border-color: #38e08a; background: #0b1710; transform: translateX(3px); }
        .key {
          flex: 0 0 auto; width: 20px; height: 20px; display: grid; place-items: center;
          border: 1px solid #22303e; font-size: 10px; color: #5d6b7a;
        }
        .opt:hover .key { border-color: #38e08a; color: #38e08a; }
        .txt { display: flex; flex-direction: column; gap: 5px; }
        .lab { font-size: 13.5px; color: #eef3f8; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .hint { font-size: 11px; color: #6b7a8b; line-height: 1.6; }
        .risk {
          font-style: normal; font-size: 9px; letter-spacing: 0.12em; color: #f0b429;
          border: 1px solid #4a3a12; padding: 2px 6px;
        }
        .fin {
          font-style: normal; font-size: 9px; letter-spacing: 0.12em; color: #4dabf7;
          border: 1px solid #143050; padding: 2px 6px;
        }
        .kbd { margin-top: auto; padding-top: 22px; font-size: 9px; letter-spacing: 0.14em; color: #33404d; }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------- outcome */

function Outcome({ T, game, outcome, lang, proceed, view }) {
  if (!outcome) return null;
  const r = outcome.report;
  return (
    <div className="out">
      <div className="tagline">
        <span className={`tag ${outcome.tone}`}>{T.consequence}</span>
        <span className="code">{T.year} {game.year} · {T.quarter}{game.quarter}</span>
      </div>

      {outcome.texts.map((t, i) => (
        <p key={i} className={i === 0 ? 'lead' : 'follow'}>{t[lang]}</p>
      ))}

      {game.tierUp && (
        <div className="tierup">
          <div className="tl">{T.tierUp}</div>
          <div className="tv">
            {T.level} {game.tierUp.level} — {game.tierUp.name[lang]} {game.tierUp.suffix}
          </div>
        </div>
      )}

      {game.yearReport && (
        <div className="annual">
          <div className="an-top">
            <span className="an-tag">{T.yearClosed}</span>
            <span className="an-year">{T.year} {game.yearReport.year}</span>
          </div>
          <div className="an-grid">
            <div>
              <span className="label">{T.annualRevenue}</span>
              <b>{fmtMoney(game.yearReport.revenue)}
                {game.yearReport.revenueGrowth !== null && (
                  <em style={{ color: game.yearReport.revenueGrowth >= 0 ? '#38e08a' : '#ff6b6b' }}>
                    {' '}{fmtPct(game.yearReport.revenueGrowth, 0)}
                  </em>
                )}
              </b>
            </div>
            <div>
              <span className="label">{T.annualProfit}</span>
              <b style={{ color: game.yearReport.profit >= 0 ? '#38e08a' : '#ff6b6b' }}>
                {fmtMoney(game.yearReport.profit)}
              </b>
            </div>
            <div>
              <span className="label">{T.nwGain}</span>
              <b style={{ color: game.yearReport.nwGain >= 0 ? '#38e08a' : '#ff6b6b' }}>
                {fmtMoney(game.yearReport.nwGain)}
              </b>
            </div>
            <div><span className="label">{T.headcount}</span><b>{game.yearReport.teamSize}</b></div>
            <div><span className="label">{T.rivalsAlive}</span><b>{game.yearReport.rivals}</b></div>
          </div>
        </div>
      )}

      {r && (
        <div className="report">
          <div className="label">{T.quarterReport}</div>
          <div className="rgrid">
            <div><span className="label">{T.profit}</span>
              <b style={{ color: r.profit >= 0 ? '#38e08a' : '#ff6b6b' }}>{fmtMoney(r.profit)}</b></div>
            <div><span className="label">{T.growth}</span>
              <b style={{ color: r.growth >= 0 ? '#38e08a' : '#ff6b6b' }}>{fmtPct(r.growth)}</b></div>
            <div><span className="label">{T.economy}</span>
              <b style={{ color: view.eco.color }}>{view.eco.name[lang]}</b></div>
          </div>
        </div>
      )}

      <button className="btn primary go" onClick={proceed}>
        {game.status === 'over' ? T.gameOver : T.next} →
      </button>

      <style jsx>{`
        .out { animation: fade 0.35s ease; display: flex; flex-direction: column; flex: 1; }
        .tagline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
        .tag { font-size: 9px; letter-spacing: 0.22em; padding: 4px 10px; background: #22303e; color: #c9d4e0; }
        .tag.good { background: #38e08a; color: #04160c; }
        .tag.bad { background: #ff4d4d; color: #180404; }
        .code { font-size: 9px; letter-spacing: 0.14em; color: #2c3f52; }
        .lead { font-size: 15.5px; line-height: 1.95; color: #eef3f8; margin: 0 0 18px; max-width: 62ch; }
        .follow {
          font-size: 14px; line-height: 1.9; color: #93a3b4; margin: 0 0 18px; max-width: 62ch;
          border-left: 2px solid #22303e; padding-left: 16px;
        }
        .tierup {
          border: 1px solid #38e08a; background: #0b1710; padding: 14px 16px; margin: 6px 0 20px;
          animation: fade 0.5s ease;
        }
        .tl { font-size: 9px; letter-spacing: 0.22em; color: #38e08a; margin-bottom: 6px; }
        .tv { font-size: 16px; color: #eef3f8; letter-spacing: 0.04em; }
        .annual {
          border: 1px solid #22303e; background: #090e14; padding: 14px 16px; margin: 4px 0 20px;
          animation: fade 0.5s ease;
        }
        .an-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .an-tag { font-size: 9px; letter-spacing: 0.22em; color: #4dabf7; }
        .an-year { font-size: 9px; letter-spacing: 0.14em; color: #2c3f52; }
        .an-grid { display: flex; flex-wrap: wrap; gap: 18px 26px; }
        .an-grid div { display: flex; flex-direction: column; gap: 4px; }
        .an-grid b { font-size: 13px; font-weight: 500; color: #eef3f8; }
        .an-grid em { font-style: normal; font-size: 10px; }
        .report { border-top: 1px solid #16202b; padding-top: 16px; margin-top: auto; }
        .rgrid { display: flex; flex-wrap: wrap; gap: 26px; margin-top: 10px; }
        .rgrid div { display: flex; flex-direction: column; gap: 4px; }
        .rgrid b { font-size: 14px; font-weight: 500; }
        .go { margin-top: 22px; align-self: flex-start; padding: 13px 26px; letter-spacing: 0.18em; }
      `}</style>
    </div>
  );
}

/* ----------------------------------------------------------------- market */

function Market({ T, game, view, lang }) {
  const rivals = game.rivals.filter((r) => r.alive).sort((a, b) => b.value - a.value);
  const mine = view.value;
  return (
    <div>
      <div className="label">{T.economy}</div>
      <div className="eco" style={{ borderColor: view.eco.color }}>
        <div className="eco-name" style={{ color: view.eco.color }}>{view.eco.name[lang]}</div>
        <div className="eco-rows">
          <span>{lang === 'sq' ? 'kërkesa' : 'demand'} <b>{(view.eco.demand * 100).toFixed(0)}%</b></span>
          <span>{lang === 'sq' ? 'interesi' : 'rates'} <b>{(view.eco.rate * 100).toFixed(1)}%</b></span>
          <span>{lang === 'sq' ? 'kapitali' : 'capital'} <b>{view.eco.capital.toFixed(2)}x</b></span>
        </div>
      </div>

      <div className="sep" />
      <div className="label">{T.rivals}</div>
      <div className="rivals">
        <div className="rv me">
          <span className="rn">{game.name}</span>
          <span className="rvv">{fmtMoney(mine)}</span>
        </div>
        {rivals.map((r) => (
          <div className="rv" key={r.id || r.name}>
            <span className="rn">{r.name}<em>{r.ceo ? `${r.ceo} · ` : ''}{r.traitName[lang]}</em></span>
            <span className="rvv" style={{ color: r.value > mine ? '#ff6b6b' : '#7b8b9c' }}>
              {fmtMoney(r.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="sep" />
      <div className="label">{T.news}</div>
      <div className="feed">
        {game.log.slice(0, 14).map((l, i) => (
          <div className={`ln ${l.type}`} key={i}>
            <span className="stamp">Y{l.y}Q{l.q}</span>
            <span>{l.text[lang]}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .eco { border: 1px solid; padding: 11px 12px; margin-top: 8px; background: #0a0f15; }
        .eco-name { font-size: 13px; letter-spacing: 0.16em; margin-bottom: 8px; }
        .eco-rows { display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: #5d6b7a; }
        .eco-rows b { color: #c9d4e0; font-weight: 500; }
        .rivals { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
        .rv {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          font-size: 11px; padding: 6px 8px; background: #0a0f15; border-left: 2px solid #22303e;
        }
        .rv.me { border-left-color: #38e08a; }
        .rv.me .rn { color: #38e08a; }
        .rn { color: #c9d4e0; display: flex; flex-direction: column; gap: 2px; }
        .rn em { font-style: normal; font-size: 9px; color: #4f5d6c; letter-spacing: 0.08em; }
        .rvv { color: #eef3f8; white-space: nowrap; }
        .feed { display: flex; flex-direction: column; gap: 9px; margin-top: 8px; max-height: 340px; overflow-y: auto; }
        .ln { font-size: 10.5px; line-height: 1.65; color: #7b8b9c; display: flex; gap: 8px; }
        .stamp { color: #33404d; flex: 0 0 auto; }
        .ln.good { color: #7ee2ab; }
        .ln.bad { color: #ff9a9a; }
        .ln.econ { color: #9fc6f0; }
        .ln.rival { color: #e0c27e; }
        .feed::-webkit-scrollbar { width: 3px; }
        .feed::-webkit-scrollbar-thumb { background: #22303e; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------- over */

function Over({ T, game, lang, hof, lastRun, again }) {
  const e = game.ending;
  return (
    <div className="over">
      <div className="ttl">{e.title[lang]}</div>
      <p className="txt">{e.text[lang]}</p>

      <div className="grid">
        <Stat label={T.finalScore} value={e.score.toLocaleString('de-DE')} accent />
        <Stat label={T.netWorth} value={fmtMoney(e.netWorth)} />
        <Stat label={T.peak} value={fmtMoney(e.peak)} />
        <Stat label={T.yearsPlayed} value={e.years.toFixed(1)} />
        <Stat label={T.level} value={e.level} />
        <Stat label={T.rank} value={`${e.rank[lang]} ${e.suffix}`} />
      </div>

      {hof.length > 0 && (
        <>
          <div className="label hl">{T.hof}</div>
          <table className="hof">
            <tbody>
              {hof.map((h, i) => (
                <tr key={h.at} className={h.at === lastRun ? 'mine' : ''}>
                  <td className="rk">{String(i + 1).padStart(2, '0')}</td>
                  <td>{h.name}</td>
                  <td className="dim">{h.rank[lang]} {h.suffix}</td>
                  <td className="dim">{ENDINGS[h.ending] ? ENDINGS[h.ending].title[lang] : h.ending}</td>
                  <td className="num">{h.score.toLocaleString('de-DE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <button className="btn primary big" onClick={again}>{T.playAgain}</button>

      <style jsx>{`
        .over { max-width: 760px; margin: 0 auto; padding: 12vh 18px 80px; animation: fade 0.6s ease; }
        .ttl {
          font-size: clamp(26px, 6vw, 46px); letter-spacing: 0.16em; color: #ff4d4d;
          margin-bottom: 18px; font-weight: 600;
        }
        .txt { font-size: 15px; line-height: 1.95; color: #93a3b4; margin: 0 0 36px; max-width: 58ch; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: #16202b; }
        .hl { margin: 40px 0 12px; }
        .hof { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 36px; }
        .hof td { padding: 8px; border-bottom: 1px solid #101820; }
        .hof tr.mine td { color: #38e08a; }
        .rk { color: #38e08a; }
        .dim { color: #5d6b7a; }
        .num { text-align: right; color: #eef3f8; }
        .big { padding: 16px 34px; letter-spacing: 0.2em; }
      `}</style>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="st">
      <span className="label">{label}</span>
      <b style={{ color: accent ? '#38e08a' : '#eef3f8' }}>{value}</b>
      <style jsx>{`
        .st { background: #0a0f15; padding: 16px; display: flex; flex-direction: column; gap: 7px; }
        b { font-size: 17px; font-weight: 500; }
      `}</style>
    </div>
  );
}
