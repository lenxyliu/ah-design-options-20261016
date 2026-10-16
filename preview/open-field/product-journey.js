const PRODUCT_COUNT = 4;
const TRANSITION_START = 0.6;
const GESTURE_NAVIGATION_DELAY = 750;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const interactiveSelector = 'a,button,input,textarea,select,summary,dialog,[role="button"],[role="tab"],[contenteditable=""],[contenteditable="true"],[data-journey-no-swipe]';

/**
 * Sample the four native-scroll segments without introducing an animation clock.
 * The first 60% of each segment is a reading pause; its final 40% carries the
 * sculpture and copy continuously to the next product. Smoothstep gives both
 * ends zero velocity, and sampling the same scroll position always gives the
 * same result, including when the reader stops or scrolls backwards.
 */
export function sampleJourneyPosition(progress) {
  const global = clamp(Number(progress) || 0, 0, 1);
  const index = Math.min(PRODUCT_COUNT - 1, Math.floor(global * PRODUCT_COUNT));
  const local = clamp(global * PRODUCT_COUNT - index, 0, 1);
  const fromIndex = index;
  const toIndex = Math.min(PRODUCT_COUNT - 1, index + 1);
  const transition = toIndex === fromIndex ? 0 : clamp((local - TRANSITION_START) / (1 - TRANSITION_START), 0, 1);
  const blend = transition * transition * (3 - 2 * transition);
  const position = fromIndex + (toIndex - fromIndex) * blend;
  // Segment progress remains tied to floor(global * 4). Selection and gestures
  // follow the nearest visible product, including either side of a transition.
  const selectedIndex = Math.round(position);
  return { index, local, global, position, fromIndex, toIndex, blend, selectedIndex };
}

/**
 * A native-scroll product journey. The owner calls read() from its scroll frame
 * and resize() after layout changes; this module never intercepts vertical scroll.
 */
export function createProductJourney({ section, stage, onIndex, onProgress, reduced = () => false }) {
  if (!section || !stage) throw new TypeError('Product journey needs a section and stage.');

  let disposed = false;
  let notifiedIndex = null;
  let touch = null;
  let mouseDrag = null;
  let wheelHandled = false;
  let wheelReset = 0;
  let navigationLockedUntil = 0;
  let state = { ...sampleJourneyPosition(0), active: false };

  function measure() {
    const rect = section.getBoundingClientRect();
    const stageHeight = Math.max(1, stage.getBoundingClientRect().height || stage.offsetHeight || window.innerHeight);
    const top = rect.top + window.scrollY;
    const travel = Math.max(0, rect.height - stageHeight);
    return { rect, stageHeight, top, travel };
  }

  function read() {
    if (disposed) return { ...state };
    const { rect, stageHeight, top, travel } = measure();
    const offset = window.scrollY - top;
    const global = travel > 0 ? clamp(offset / travel, 0, 1) : (offset >= 0 ? 1 : 0);
    const active = rect.top <= 100 && rect.bottom > stageHeight * 0.8;
    state = { ...sampleJourneyPosition(global), active };

    // Continuous rendering is authoritative; the discrete callback only updates
    // selection, labels and accessibility after that frame's position is known.
    onProgress?.({ ...state });

    // Reading the header or another section must not reset a chosen product.
    if (active && state.selectedIndex !== notifiedIndex) {
      notifiedIndex = state.selectedIndex;
      onIndex?.(state.selectedIndex);
    }
    return { ...state };
  }

  function goTo(index, options = {}) {
    if (disposed) return { ...state };
    const target = clamp(Math.round(Number(index) || 0), 0, PRODUCT_COUNT - 1);
    const { top, travel } = measure();
    const behavior = options.behavior || (reduced() ? 'auto' : 'smooth');
    // Enter a little way into the segment so rounding and browser scroll
    // restoration cannot leave a tab sitting on the previous product boundary.
    window.scrollTo({ top: top + travel * ((target + 0.12) / PRODUCT_COUNT), behavior });
    return read();
  }

  function isInteractive(target) {
    return target instanceof Element && Boolean(target.closest(interactiveSelector));
  }

  function navigationLocked() {
    return Date.now() < navigationLockedUntil;
  }

  function navigateFromGesture(index) {
    // A native drag may also produce wheel or touch events. Give all gesture
    // sources one shared window, while keeping direct goTo() calls available.
    navigationLockedUntil = Date.now() + GESTURE_NAVIGATION_DELAY;
    goTo(index);
  }

  function onTouchStart(event) {
    touch = null;
    if (disposed || event.touches.length !== 1 || isInteractive(event.target) || !read().active) return;
    const point = event.touches[0];
    touch = { id: point.identifier, x: point.clientX, y: point.clientY, handled: false };
  }

  function onTouchMove(event) {
    if (!touch || touch.handled || event.touches.length !== 1) return;
    const point = [...event.touches].find(item => item.identifier === touch.id);
    if (!point) return;
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    touch.handled = true;
    const current = read();
    if (!current.active) return;
    if (navigationLocked()) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    const next = current.selectedIndex + (dx < 0 ? 1 : -1);
    if (next < 0 || next >= PRODUCT_COUNT) return;
    if (event.cancelable) event.preventDefault();
    navigateFromGesture(next);
  }

  function onTouchEnd() {
    touch = null;
  }

  function clearMouseDrag() {
    const pointerId = mouseDrag?.id;
    mouseDrag = null;
    if (pointerId !== undefined && stage.hasPointerCapture?.(pointerId)) stage.releasePointerCapture(pointerId);
  }

  function onPointerDown(event) {
    if (disposed || navigationLocked() || event.pointerType !== 'mouse' || event.button !== 0 || event.isPrimary === false) return;
    if (isInteractive(event.target) || (event.target instanceof Element && event.target.closest('.product-intro'))) return;
    if (!read().active) return;
    clearMouseDrag();
    mouseDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture?.(event.pointerId);
  }

  function onPointerUp(event) {
    if (!mouseDrag || event.pointerId !== mouseDrag.id) return;
    const dx = event.clientX - mouseDrag.x;
    const dy = event.clientY - mouseDrag.y;
    clearMouseDrag();
    if (Math.abs(dx) <= 60 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    const current = read();
    if (!current.active) return;
    if (navigationLocked()) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    const next = current.selectedIndex + (dx < 0 ? 1 : -1);
    if (next < 0 || next >= PRODUCT_COUNT) return;
    navigateFromGesture(next);
  }

  function onPointerCancel(event) {
    if (mouseDrag && event.pointerId === mouseDrag.id) clearMouseDrag();
  }

  function onWheel(event) {
    if (disposed || isInteractive(event.target)) return;
    const dx = event.deltaX;
    if (Math.abs(dx) <= 18 || Math.abs(dx) <= Math.abs(event.deltaY) * 1.6) return;
    const current = read();
    if (!current.active) return;
    clearTimeout(wheelReset);
    wheelReset = setTimeout(() => { wheelHandled = false; }, 220);
    if (navigationLocked()) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    const next = current.selectedIndex + (dx > 0 ? 1 : -1);
    if (next < 0 || next >= PRODUCT_COUNT) return;

    if (event.cancelable) event.preventDefault();
    // Trackpad momentum belongs to the same horizontal gesture.
    if (wheelHandled) return;
    wheelHandled = true;
    navigateFromGesture(next);
  }

  stage.addEventListener('touchstart', onTouchStart, { passive: true });
  stage.addEventListener('touchmove', onTouchMove, { passive: false });
  stage.addEventListener('touchend', onTouchEnd, { passive: true });
  stage.addEventListener('touchcancel', onTouchEnd, { passive: true });
  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerCancel);
  stage.addEventListener('lostpointercapture', onPointerCancel);

  return {
    read,
    goTo,
    resize: read,
    dispose() {
      disposed = true;
      touch = null;
      navigationLockedUntil = 0;
      clearMouseDrag();
      clearTimeout(wheelReset);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      stage.removeEventListener('lostpointercapture', onPointerCancel);
    },
  };
}
