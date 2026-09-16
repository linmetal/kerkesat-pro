// Optional cloud sync for the published page.
//
// The game is fully playable on browser storage alone; when the page is opened
// somewhere that grants the `db` capability, the save and the hall of fame are
// mirrored server-side as well, so a career started on a phone can be finished
// on a laptop. Every path here is optional and swallowed on failure: if the
// capability is missing, denied or slow, the game simply stays local.

import { KEYS } from '../lib/game/play';

const DOC = 'save/current';
const STAMP = 'career.sim.cloudAt';
const DEBOUNCE = 4000;

const read = (k, d) => { try { return window.localStorage.getItem(k) || d; } catch (e) { return d; } };
const write = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

export function createCloud() {
  let db = null;
  let pending = null;
  let timer = null;
  let writing = false;

  const ready = (async () => {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return null;
      db = await window.claude.use('db');
    } catch (e) {
      db = null;
    }
    return db;
  })();

  async function flush() {
    if (writing || !pending || !db) return;
    writing = true;
    const body = pending;
    pending = null;
    try {
      await db.doc(DOC).set(body);
      write(STAMP, String(body.savedAt));
    } catch (e) {
      // A read-only viewer, or the write was refused. Local storage still has it.
    }
    writing = false;
    if (pending) flush();
  }

  return {
    // Resolves the remote state only when it is newer than what this device
    // last wrote, i.e. when another device moved the career forward.
    async pullNewer() {
      const d = await ready;
      if (!d) return null;
      let snap;
      try { snap = await d.doc(DOC).get(); } catch (e) { return null; }
      if (!snap || !snap.exists) return null;
      const body = snap.data();
      if (!body || !body.savedAt) return null;
      const mine = Number(read(STAMP, '0')) || 0;
      if (body.savedAt <= mine) return null;
      write(STAMP, String(body.savedAt));
      return body;
    },

    // Coalesces a burst of turns into one write.
    push(save, hof) {
      pending = { save: save || null, hof: hof || [], savedAt: Date.now() };
      clearTimeout(timer);
      timer = setTimeout(() => { ready.then(flush); }, DEBOUNCE);
    },

    // Called when a career ends: get the result out without waiting.
    pushNow(save, hof) {
      pending = { save: save || null, hof: hof || [], savedAt: Date.now() };
      clearTimeout(timer);
      ready.then(flush);
    },
  };
}

// Adopts a remote career into this device's local storage.
export function adoptRemote(body) {
  if (body.save) write(KEYS.save, JSON.stringify(body.save));
  else { try { window.localStorage.removeItem(KEYS.save); } catch (e) { /* ignore */ } }
  if (body.hof) write(KEYS.hof, JSON.stringify(body.hof));
}

// Carries the live scene across a republish, so a player mid-decision is not
// dropped back to the menu when a new version ships.
export function hotBoot(start, snapshot) {
  const hot = window.claude && window.claude.hot;
  try {
    if (hot && typeof hot.snapshot === 'function') hot.snapshot(snapshot);
  } catch (e) { /* ignore */ }
  if (hot && typeof hot.ready === 'function') hot.ready(start);
  else start((hot && hot.data) || {});
}
