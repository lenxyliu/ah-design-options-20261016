/**
 * Scroll-scrubbed acting for the scene's IP character. This is a reversible
 * timeline: no elapsed time, event history, timers or random state are used.
 * The renderer places anchor on the ground and lets scene geometry occlude it.
 */
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const normalized = value => {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : clamp(number);
};
const smoothstep = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

// NDC anchors were checked against the actual opaque product geometry. Staying
// left through the hero avoids a long disappearance; the center becomes clear
// after the workbench. SkillHub needs an extra detour around its connector.
const commonAnchors = [
  [0, -.60], [.22, -.60], [.38, -.45], [.50, .10],
  [.65, 0], [.90, 0], [1, -.60],
];
const skillAnchors = [
  [0, -.60], [.22, -.60], [.34, -.86], [.40, -.86],
  [.50, .10], [.65, 0], [.90, 0], [1, -.60],
];

function createTrack(anchors) {
  const slopes = anchors.slice(1).map((key, i) => (key[1] - anchors[i][1]) / (key[0] - anchors[i][0]));
  const tangents = anchors.map((key, i) => {
    if (i === 0 || i === anchors.length - 1) return 0;
    const a = slopes[i - 1];
    const b = slopes[i];
    if (!a || !b || Math.sign(a) !== Math.sign(b)) return 0;
    const before = key[0] - anchors[i - 1][0];
    const after = anchors[i + 1][0] - key[0];
    const w1 = 2 * after + before;
    const w2 = after + 2 * before;
    return (w1 + w2) / (w1 / a + w2 / b);
  });
  return { anchors, tangents };
}
const tracks = [createTrack(commonAnchors), createTrack(skillAnchors)];

function sampleAnchor(product, p) {
  const { anchors, tangents } = tracks[product === 2 ? 1 : 0];
  let index = anchors.findIndex((_, i) => i < anchors.length - 1 && p <= anchors[i + 1][0]);
  if (index < 0) index = anchors.length - 2;
  const a = anchors[index];
  const b = anchors[index + 1];
  const span = b[0] - a[0];
  const t = (p - a[0]) / span;
  const t2 = t * t;
  const t3 = t2 * t;
  const m0 = tangents[index];
  const m1 = tangents[index + 1];
  const x = (2 * t3 - 3 * t2 + 1) * a[1]
    + (t3 - 2 * t2 + t) * span * m0
    + (-2 * t3 + 3 * t2) * b[1]
    + (t3 - t2) * span * m1;
  const velocity = ((6 * t2 - 6 * t) * a[1]
    + (3 * t2 - 4 * t + 1) * span * m0
    + (-6 * t2 + 6 * t) * b[1]
    + (3 * t2 - 2 * t) * span * m1) / span;
  return { x, velocity };
}

// An activation envelope, rather than a chip's travel coordinate. Individual
// chip paths should use chapter progress so a fading pulse never reverses them.
const pulse = (enter, peakStart, peakEnd, leave, p) => (
  smoothstep(enter, peakStart, p) * (1 - smoothstep(peakEnd, leave, p))
);

/**
 * @param {number} index Product index (SkillHub follows its connector detour).
 * @param {number} progress Normalized chapter progress, clamped to 0..1.
 * @returns {{anchor:number[],height:number,poseWeights:{greeting:number,dispatch:number,completed:number},lean:number,stepLift:number,handoff:number,arrival:number}}
 * height/stepLift are world units; lean is radians; pulses and weights are0..1.
 */
export function sampleHallChoreography(index, progress, { mobile = false, reduced = false } = {}) {
  const p = normalized(progress);
  const height = mobile ? 400 : 450;
  const mobileScale = mobile ? .9 : 1;
  if (reduced) {
    return {
      anchor: [-.60 * mobileScale, -.94],
      height,
      poseWeights: { greeting: 1, dispatch: 0, completed: 0 },
      lean: 0,
      stepLift: 0,
      handoff: 0,
      arrival: 0,
    };
  }

  const product = Number.isFinite(index) ? ((Math.trunc(index) % 4) + 4) % 4 : 0;
  const { x, velocity } = sampleAnchor(product, p);
  const dispatch = smoothstep(.10, .22, p);
  const completed = smoothstep(.72, .85, p);
  const home = smoothstep(.94, 1, p);
  const walking = smoothstep(.25, 5, Math.abs(velocity));
  // A fixed stride phase retraces exactly when the reader scrolls backward.
  // Its envelope vanishes at stations, leaving the feet grounded and still.
  const stride = Math.sin(Math.PI * 12 * p) ** 2;
  // The narrow phone view brings the floor-bound character into the near
  // foreground during the hero pass. Its feet briefly leave the frame while
  // the upper body remains visible; the route and both join poses stay fixed.
  const foreground = mobile ? smoothstep(.15, .24, p) * (1 - smoothstep(.37, .48, p)) : 0;
  return {
    anchor: [x * mobileScale, -.94 - foreground * .41],
    height,
    poseWeights: {
      greeting: (1 - dispatch) * (1 - home) + home,
      dispatch: dispatch * (1 - completed) * (1 - home),
      completed: dispatch * completed * (1 - home),
    },
    lean: clamp(velocity * .006, -.045, .045),
    stepLift: stride * walking * (mobile ? 8 : 10),
    handoff: pulse(.18, .245, .30, .38, p),
    arrival: pulse(.67, .73, .80, .86, p),
  };
}
