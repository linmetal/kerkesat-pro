// One seeded stream for the whole simulation. Every random draw advances the
// counter stored on the state, so a saved career replays exactly as it was.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rand(s) {
  s.rngState = (s.rngState + 0x9E3779B9) | 0;
  return mulberry32(s.rngState)();
}

export const pickOne = (s, arr) => arr[Math.floor(rand(s) * arr.length) % arr.length];
