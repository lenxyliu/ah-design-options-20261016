/**
 * Local camera route through one product world. The next world begins 7,000
 * units farther down the corridor, so the endpoints join without a cut.
 * All values are world units; this module has no DOM or renderer dependency.
 */
export const DEPTH_WORLD_SPACING = 7000;

const clamp01 = value => {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : Math.min(1, Math.max(0, number));
};

// Each key is [progress, camera x/y/z, look-at x/y/z, vertical field of view].
// The leftward arc is a real passage around the hero's left edge. The camera
// clears the entrance module before moving sideways, then recenters for the
// open outcome portal. The last look-at points toward the next world's hero.
const route = [
  [0,    -120, 60,  2200, 380,  0,  -900, 28],
  [.16,  -160, 80,  1150, 380, 40, -1500, 29],
  [.30,  -140, 85,   300, 320, 40, -1900, 34],
  [.40,  -220, 110, -180, 200, 50, -2600, 39],
  [.50,  -650, 125, -800,-150, 60, -3100, 44],
  [.58,  -620, 100,-1400, 100, 40, -3500, 43],
  [.68,   100, 85, -2200, 300, 40, -4200, 39],
  [.80,   140, 60, -3300, 380,  0, -5100, 35],
  [.90,    20, 60, -4100, 380,  0, -6600, 30],
  [1,     -120, 60,-4800, 380,  0, -7900, 28],
];

/** Monotone cubic tangents avoid overshoot near the solid hero surface. */
function tangents(keys, column) {
  const slopes = keys.slice(1).map((key, i) => (key[column] - keys[i][column]) / (key[0] - keys[i][0]));
  return keys.map((key, i) => {
    if (i === 0) return slopes[0];
    if (i === keys.length - 1) return slopes.at(-1);
    const before = slopes[i - 1];
    const after = slopes[i];
    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) return 0;
    const hBefore = key[0] - keys[i - 1][0];
    const hAfter = keys[i + 1][0] - key[0];
    const w1 = 2 * hAfter + hBefore;
    const w2 = hAfter + 2 * hBefore;
    return (w1 + w2) / (w1 / before + w2 / after);
  });
}

const routeTangents = Array.from({ length: 7 }, (_, index) => tangents(route, index + 1));
// Matching endpoint velocities make the complete chain C1 continuous too.
// Pure forward motion continues through the join; sideways motion and zoom
// settle before the next entry composition begins.
routeTangents.forEach((values, index) => {
  const velocity = index === 2 || index === 5 ? -7000 : 0;
  values[0] = velocity;
  values[values.length - 1] = velocity;
});

/** Samples a C1 continuous, bounded cubic route at a normalized progress. */
export function sampleCameraRoute(progress) {
  const p = clamp01(progress);
  let index = route.findIndex((key, i) => i < route.length - 1 && p <= route[i + 1][0]);
  if (index < 0) index = route.length - 2;
  const a = route[index];
  const b = route[index + 1];
  const span = b[0] - a[0];
  const t = (p - a[0]) / span;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return Array.from({ length: 7 }, (_, column) => (
    h00 * a[column + 1]
    + h10 * span * routeTangents[column][index]
    + h01 * b[column + 1]
    + h11 * span * routeTangents[column][index + 1]
  ));
}

/**
 * @param {number} index Product index, from 0 through 3.
 * @param {number} progress Local chapter progress, clamped to 0..1.
 * @param {{mobile?: boolean}} options
 * @returns {{position: number[], target: number[], fov: number}}
 */
export function sampleDepthCamera(index, progress, { mobile = false } = {}) {
  const p = clamp01(progress);
  const sample = sampleCameraRoute(p);
  const product = Number.isFinite(index) ? ((Math.trunc(index) % 4) + 4) % 4 : 0;
  // Subtle vertical changes distinguish worlds, while every product preserves
  // the same passage and endpoint. sin² also gives zero boundary velocity.
  const envelope = Math.sin(Math.PI * p) ** 2;
  const lift = [0, 24, -16, 12][product] * envelope;
  return {
    position: [sample[0], sample[1] + lift, sample[2]],
    target: [sample[3], sample[4] + lift * .35, sample[5]],
    fov: mobile ? 52 + (sample[6] - 28) * .5 : sample[6],
  };
}
