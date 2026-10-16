const clamp = value => Math.max(0, Math.min(1, value));
const ease = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Scroll distance through one continuous chain of physical product environments. */
export function sampleDepthJourney(current, width, products, reduced = false) {
  if (reduced || !products.length) return { index: 0, progress: 0, opacity: 0, reduced };
  const lead = width * .055;
  const first = products[0].left - lead;
  const last = products.at(-1);
  const finish = last.left + last.width - lead;
  let index = products.findIndex(item => current < item.left + item.width - lead);
  if (index < 0) index = products.length - 1;
  const item = products[index];
  return {
    index,
    progress: clamp((current - item.left + lead) / Math.max(1, item.width)),
    opacity: ease(first - width * .55, first, current) * (1 - ease(finish - width * .5, finish + width * .1, current)),
    reduced: false,
  };
}
