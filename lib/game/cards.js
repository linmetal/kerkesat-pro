// Deck assembly + selection. The engine asks for "the next scene" and this
// decides which card earns the moment: interrupts first, then a weighted draw
// from everything legal for the player's stage, industry, flags and finances.

import EARLY from './cards.early';
import MID from './cards.mid';
import LATE from './cards.late';
import INTERRUPTS from './cards.interrupts';
import { tierIndex, rand } from './engine';

export const DECK = [...EARLY, ...MID, ...LATE];
export const ALL_CARDS = [...DECK, ...INTERRUPTS];

export const cardById = (id) => ALL_CARDS.find((c) => c.id === id);

// Text fields may be plain {sq,en} or a function of state.
export const resolve = (field, s) => (typeof field === 'function' ? field(s) : field);

function legal(card, s) {
  const stage = tierIndex(s);
  if (card.industry && card.industry !== s.industry) return false;
  if (card.stage && (stage < card.stage[0] || stage > card.stage[1])) return false;
  if (card.once && s.seen[card.id]) return false;
  if (card.req && !card.req(s)) return false;
  const last = s.seen[card.id];
  if (!card.once && typeof last === 'number') {
    const now = (s.year - 1) * 4 + s.quarter;
    if (now - last < (card.cooldown || 5)) return false;
  }
  return true;
}

export function nextCard(s) {
  // The opening two beats are authored, not drawn: every career starts with
  // where the money came from and what actually shipped.
  const opening = ['first_capital', 'first_product'];
  for (const id of opening) {
    const c = cardById(id);
    if (c && legal(c, s)) return c;
  }

  const fired = INTERRUPTS.filter((c) => legal(c, s) && c.trigger(s))
    .sort((a, b) => b.priority - a.priority);
  if (fired.length && rand(s) < 0.92) return fired[0];

  const pool = DECK.filter((c) => legal(c, s));
  if (!pool.length) return DECK.filter((c) => !c.industry && (!c.once || !s.seen[c.id]))[0] || DECK[0];

  const total = pool.reduce((a, c) => a + (c.weight || 5), 0);
  let r = rand(s) * total;
  for (const c of pool) {
    r -= c.weight || 5;
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

// Options can hide themselves when they make no sense for the current state.
export const visibleOptions = (card, s) => card.opts.filter((o) => !o.req || o.req(s));
