// The people who stay. A career is remembered through the handful of names
// that keep showing up in it: the partner, the mentor, the right hand, and the
// rival who runs the company across the street.

const FIRST = [
  'Arben', 'Elira', 'Drin', 'Teuta', 'Genti', 'Rina', 'Besnik', 'Marsela',
  'Endrit', 'Lira', 'Fatos', 'Anila', 'Kreshnik', 'Vjosa', 'Erion', 'Blerta',
  'Sokol', 'Dafina', 'Ilir', 'Ana', 'Valon', 'Sara', 'Gëzim', 'Nora',
];

const LAST = [
  'Hoxha', 'Krasniqi', 'Berisha', 'Shala', 'Gashi', 'Leka', 'Dervishi',
  'Rexha', 'Bajrami', 'Zeka', 'Nushi', 'Kola', 'Prifti', 'Maloku', 'Vata',
];

import { rand } from './rng';

export const ROLES = {
  cofounder: { sq: 'bashkëthemelues', en: 'co-founder' },
  mentor:    { sq: 'mentor', en: 'mentor' },
  hand:      { sq: 'dora e djathtë', en: 'right hand' },
};

// Draws from the seeded stream so a save always rebuilds the same cast.
export function makePerson(s, role, opts = {}) {
  const r = () => rand(s);
  const used = [
    ...Object.values(s.people || {}).map((p) => p && p.name),
    ...(s.rivals || []).map((v) => v.ceo),
  ];
  const names = used.filter(Boolean);
  const takenFirst = names.map((n) => n.split(' ')[0]);
  const takenLast = names.map((n) => n.split(' ').pop());
  let name = '';
  for (let i = 0; i < 20; i++) {
    const first = FIRST[Math.floor(r() * FIRST.length)];
    const last = LAST[Math.floor(r() * LAST.length)];
    name = `${first} ${last}`;
    if (!takenFirst.includes(first) && !takenLast.includes(last)) break;
  }
  return {
    role,
    name,
    loyalty: Math.round(opts.loyalty != null ? opts.loyalty : 55 + r() * 25),
    since: s.year,
    ...opts,
  };
}

export const personName = (s, role) => (s.people && s.people[role] ? s.people[role].name : '');
export const hasPerson = (s, role) => !!(s.people && s.people[role]);
export const loyaltyOf = (s, role) => (s.people && s.people[role] ? s.people[role].loyalty : 0);
