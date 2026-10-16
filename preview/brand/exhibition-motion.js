import { sampleDepthJourney } from './depth-timeline.js';
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const interactive = 'a,button,input,textarea,select,label,summary,[contenteditable],[role="button"],[role="link"]';

/** A continuous exhibition driven by the browser's native vertical scroll. */
export function createExhibition({ viewport, rail, runway, chapters = [], onChapter = () => {}, onProgress = () => {} }) {
  if (!viewport || !rail || !runway) throw new Error('createExhibition requires viewport, rail and runway');

  const sections = Array.from(chapters);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const original = {
    railTransform: rail.style.transform,
    runwayHeight: runway.style.height,
    speed: root.style.getPropertyValue('--rail-speed'),
    reducedClass: document.body.classList.contains('is-reduced-motion'),
  };
  // Immersive product worlds own their transforms. Scroll only supplies their phase.
  const parallax = Array.from(rail.querySelectorAll('[data-parallax]')).filter(element => !(
    element.classList.contains('product-art') && element.classList.contains('immersive-art')
  )).map(element => ({
    element, transform: element.style.transform, left: 0, width: 0,
  }));
  const sceneProperties = ['--scene-phase', '--scene-focus', '--copy-opacity', '--scene-entry', '--scene-exit', '--scene-travel', '--scene-tilt', '--depth-hold', '--depth-copy'];
  const scenes = sections.map((element, index) => ({ element, index }))
    .filter(({ element }) => element.classList.contains('product-chapter'))
    .map(scene => ({ ...scene, original: sceneProperties.map(property => scene.element.style.getPropertyValue(property)) }));
  const addedTabIndex = new Set();
  let reduced = motion.matches;
  let disposed = false;
  let frameId = 0;
  let resizeFrame = 0;
  let lastTime = 0;
  let current = 0;
  let target = 0;
  let max = 0;
  let origin = 0;
  let width = 1;
  let metrics = [];
  let activeIndex = -1;
  let lastChapterProgress = -1;
  let drag = null;
  let suppressClickUntil = 0;
  let programmaticFocus = false;

  function stopDrag() {
    if (drag && viewport.hasPointerCapture?.(drag.id)) viewport.releasePointerCapture(drag.id);
    drag = null;
    viewport.classList.remove('is-dragging');
  }

  function request() {
    if (!frameId && !disposed && !document.hidden) frameId = requestAnimationFrame(draw);
  }

  function readScroll() {
    target = reduced ? window.scrollY : clamp(window.scrollY - origin, 0, max);
    request();
  }

  function chapterAt(center) {
    let index = 0;
    let nearest = Infinity;
    metrics.forEach((item, candidate) => {
      const distance = center < item.left ? item.left - center : center > item.right ? center - item.right : 0;
      if (distance < nearest) { index = candidate; nearest = distance; }
    });
    return index;
  }

  function notifyChapter(index, progress) {
    if (!sections[index]) return;
    if (index !== activeIndex || Math.abs(progress - lastChapterProgress) > .001) {
      activeIndex = index;
      lastChapterProgress = progress;
      onChapter({ id: sections[index].dataset.chapter, index, progress });
    }
  }

  function render() {
    scenes.forEach(({ element, index }) => {
      const phase = reduced ? 0 : clamp((current - (metrics[index]?.left || 0) + width * .055) / width, -1.2, 1.4);
      const focus = reduced ? 1 : 1 - smoothstep(.4, 1.25, Math.abs(phase - .2));
      const copyOpacity = reduced ? 1 : smoothstep(-.18, -.01, phase) * (1 - smoothstep(.48, .88, phase));
      element.style.setProperty('--scene-phase', phase.toFixed(4));
      element.style.setProperty('--scene-focus', focus.toFixed(4));
      element.style.setProperty('--copy-opacity', copyOpacity.toFixed(4));
      element.style.setProperty('--scene-entry', (reduced ? 1 : smoothstep(-.85, 0, phase)).toFixed(4));
      element.style.setProperty('--scene-exit', (reduced ? 0 : smoothstep(.65, 1.4, phase)).toFixed(4));
      element.style.setProperty('--scene-travel', (reduced ? 0 : clamp(phase, 0, 1.4)).toFixed(4));
      element.style.setProperty('--scene-tilt', (reduced ? 0 : clamp(phase - .2, -1, 1)).toFixed(4));
      const travel = current - (metrics[index]?.left || 0) + width * .055;
      const depthProgress = travel / Math.max(1, metrics[index]?.width || width);
      element.style.setProperty('--depth-hold', (reduced ? 0 : Math.max(0, travel)).toFixed(3));
      element.style.setProperty('--depth-copy', (reduced ? 1 : smoothstep(-.12, 0, depthProgress) * (1 - smoothstep(.08, .18, depthProgress))).toFixed(4));
    });
    if (reduced) {
      rail.style.transform = original.railTransform;
      parallax.forEach(item => { item.element.style.transform = item.transform; });
      const pageMax = Math.max(0, root.scrollHeight - window.innerHeight);
      const center = window.innerHeight / 2;
      let index = 0;
      let nearest = Infinity;
      sections.forEach((section, candidate) => {
        const rect = section.getBoundingClientRect();
        const distance = center < rect.top ? rect.top - center : center > rect.bottom ? center - rect.bottom : 0;
        if (distance < nearest) { index = candidate; nearest = distance; }
      });
      const rect = sections[index]?.getBoundingClientRect();
      notifyChapter(index, rect ? clamp((center - rect.top) / Math.max(1, rect.height)) : 0);
      onProgress({ progress: pageMax ? clamp(window.scrollY / pageMax) : 0, current: window.scrollY, max: pageMax, depth: sampleDepthJourney(current, width, [], true) });
      return;
    }

    rail.style.transform = `translate3d(${-current.toFixed(3)}px,0,0)`;
    const center = current + width / 2;
    parallax.forEach(item => {
      const distance = clamp((item.left + item.width / 2 - center) / (width + item.width) * 2, -1, 1);
      // Only media receives this depth cue; text remains sharp and stationary within its chapter.
      item.element.style.transform = `${item.transform ? item.transform + ' ' : ''}perspective(1800px) translateZ(${-Math.abs(distance) * 16}px) rotateY(${-distance * 2.2}deg)`;
    });
    // A chapter becomes current after it reaches the reading area on the left.
    // The centered probe selected the next product while the intro was still dominant.
    const probe = current + width * .24;
    const index = chapterAt(probe);
    const section = metrics[index];
    const local = section ? clamp((probe - section.left) / Math.max(1, section.right - section.left)) : 0;
    notifyChapter(index, local);
    onProgress({ progress: max ? current / max : 0, current, max, depth: sampleDepthJourney(current, width, scenes.map(scene => metrics[scene.index]), false) });
  }

  function draw(time) {
    frameId = 0;
    if (disposed || document.hidden) return;
    const dt = Math.min(.05, Math.max(.001, (time - (lastTime || time - 16.67)) / 1000));
    lastTime = time;
    const previous = current;
    current = reduced ? target : current + (target - current) * (1 - Math.exp(-dt * 13));
    if (Math.abs(current - target) < .035) current = target;
    const speed = reduced ? 0 : Math.min(1, Math.abs(current - previous) / dt / 2200);
    root.style.setProperty('--rail-speed', speed.toFixed(4));
    render();
    if (!reduced && current !== target) request();
    else root.style.setProperty('--rail-speed', '0');
  }

  function measure(preserve = true) {
    if (disposed) return;
    const oldProgress = max ? clamp((window.scrollY - origin) / max) : 0;
    width = Math.max(1, viewport.clientWidth || window.innerWidth);
    parallax.forEach(item => { item.element.style.transform = item.transform; });
    const railRect = rail.getBoundingClientRect();
    metrics = sections.map(section => {
      const rect = section.getBoundingClientRect();
      const left = rect.left - railRect.left;
      return { left, right: left + rect.width, width: rect.width };
    });
    parallax.forEach(item => {
      const rect = item.element.getBoundingClientRect();
      item.left = rect.left - railRect.left;
      item.width = rect.width;
    });
    max = reduced ? 0 : Math.max(0, rail.scrollWidth - width);
    runway.style.height = reduced ? '0px' : `${max + window.innerHeight}px`;
    origin = runway.getBoundingClientRect().top + window.scrollY;
    if (reduced) current = target = window.scrollY;
    else {
      target = preserve ? oldProgress * max : clamp(window.scrollY - origin, 0, max);
      current = target;
      if (preserve) window.scrollTo({ top: origin + target, behavior: 'instant' });
    }
    lastTime = 0;
    request();
  }

  function refresh() { measure(true); }

  function scheduleRefresh() {
    if (!resizeFrame && !disposed) resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; refresh(); });
  }

  function focusSection(section) {
    if (!section.hasAttribute('tabindex')) { section.tabIndex = -1; addedTabIndex.add(section); }
    programmaticFocus = true;
    try { section.focus({ preventScroll: true }); }
    finally { programmaticFocus = false; }
  }

  function jumpTo(id, { focus = false } = {}) {
    const index = sections.findIndex(section => section.dataset.chapter === String(id));
    if (disposed || index < 0) return false;
    const section = sections[index];
    if (reduced) section.scrollIntoView({ block: 'start', behavior: 'instant' });
    else {
      target = clamp((metrics[index]?.left || 0) - (index ? width * .055 : 0), 0, max);
      window.scrollTo({ top: origin + target, behavior: 'instant' });
      request();
    }
    if (focus) focusSection(section);
    return true;
  }

  function keydown(event) {
    if (event.target !== viewport && event.target !== rail) return;
    if (event.altKey || event.ctrlKey || event.metaKey || !sections.length) return;
    let index = Math.max(0, activeIndex);
    if (event.key === 'ArrowRight') index++;
    else if (event.key === 'ArrowLeft') index--;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = sections.length - 1;
    else return;
    event.preventDefault();
    // Keep focus on the exhibition controller so consecutive arrows keep working.
    jumpTo(sections[clamp(index, 0, sections.length - 1)].dataset.chapter);
  }

  function pointerdown(event) {
    if (reduced || event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest(interactive)) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: window.scrollY, locked: false };
  }

  function pointermove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (event.buttons !== 1) { stopDrag(); return; }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.locked) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { stopDrag(); return; }
      if (Math.abs(dx) < 5) return;
      drag.locked = true;
      viewport.setPointerCapture?.(drag.id);
      viewport.classList.add('is-dragging');
    }
    event.preventDefault();
    target = clamp(drag.scroll - dx - origin, 0, max);
    window.scrollTo({ top: origin + target, behavior: 'instant' });
    request();
  }

  function pointerup(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.locked) suppressClickUntil = performance.now() + 80;
    stopDrag();
  }

  function click(event) {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
  }

  function wheel(event) {
    if (reduced || !max || event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.2 || !event.deltaX) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    window.scrollBy({ top: event.deltaX * unit, behavior: 'instant' });
    readScroll();
  }

  function focusin(event) {
    if (programmaticFocus || reduced || event.target === rail || event.target === viewport) return;
    const section = sections.find(item => item.contains(event.target));
    if (!section) return;
    const rect = event.target.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    if (rect.left < bounds.left || rect.right > bounds.right) {
      jumpTo(section.dataset.chapter);
      current = target;
      // Native focus scrolling must not add a second horizontal offset to the rail.
      viewport.scrollLeft = 0;
      rail.scrollLeft = 0;
      render();
    }
  }

  function visibility() {
    if (document.hidden) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      lastTime = 0;
      stopDrag();
      root.style.setProperty('--rail-speed', '0');
    } else readScroll();
  }

  function motionChange() {
    const index = Math.max(0, activeIndex);
    reduced = motion.matches;
    document.body.classList.toggle('is-reduced-motion', reduced);
    stopDrag();
    // Let the CSS switch layouts before measuring the new scroll geometry.
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      measure(false);
      if (sections[index]) jumpTo(sections[index].dataset.chapter);
    });
  }

  document.body.classList.toggle('is-reduced-motion', reduced);
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', scheduleRefresh, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  viewport.addEventListener('keydown', keydown);
  viewport.addEventListener('pointerdown', pointerdown);
  viewport.addEventListener('pointermove', pointermove);
  viewport.addEventListener('pointerup', pointerup);
  viewport.addEventListener('pointercancel', pointerup);
  viewport.addEventListener('lostpointercapture', pointerup);
  viewport.addEventListener('click', click, true);
  viewport.addEventListener('wheel', wheel, { passive: false });
  viewport.addEventListener('focusin', focusin);
  rail.addEventListener('load', scheduleRefresh, true);
  if (motion.addEventListener) motion.addEventListener('change', motionChange);
  else motion.addListener?.(motionChange);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleRefresh) : null;
  observer?.observe(viewport);
  observer?.observe(rail);
  measure(false);
  document.fonts?.ready?.then(() => { if (!disposed) scheduleRefresh(); });

  return {
    jumpTo,
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      stopDrag();
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', scheduleRefresh);
      document.removeEventListener('visibilitychange', visibility);
      viewport.removeEventListener('keydown', keydown);
      viewport.removeEventListener('pointerdown', pointerdown);
      viewport.removeEventListener('pointermove', pointermove);
      viewport.removeEventListener('pointerup', pointerup);
      viewport.removeEventListener('pointercancel', pointerup);
      viewport.removeEventListener('lostpointercapture', pointerup);
      viewport.removeEventListener('click', click, true);
      viewport.removeEventListener('wheel', wheel);
      viewport.removeEventListener('focusin', focusin);
      rail.removeEventListener('load', scheduleRefresh, true);
      if (motion.removeEventListener) motion.removeEventListener('change', motionChange);
      else motion.removeListener?.(motionChange);
      rail.style.transform = original.railTransform;
      runway.style.height = original.runwayHeight;
      parallax.forEach(item => { item.element.style.transform = item.transform; });
      scenes.forEach(({ element, original: values }) => sceneProperties.forEach((property, index) => {
        if (values[index]) element.style.setProperty(property, values[index]);
        else element.style.removeProperty(property);
      }));
      addedTabIndex.forEach(section => { if (section.getAttribute('tabindex') === '-1') section.removeAttribute('tabindex'); });
      document.body.classList.toggle('is-reduced-motion', original.reducedClass);
      if (original.speed) root.style.setProperty('--rail-speed', original.speed);
      else root.style.removeProperty('--rail-speed');
    },
  };
}
