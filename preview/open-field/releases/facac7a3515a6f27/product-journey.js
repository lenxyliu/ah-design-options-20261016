const PRODUCT_COUNT = 4;
const TRANSITION_START = 0.9;
const GESTURE_NAVIGATION_DELAY = 750;
const TAB_TURN_DURATION = 1000;
const WHEEL_SETTLE_DELAY = 100;
const WHEEL_SETTLE_DURATION = 220;
const WHEEL_SETTLE_MIN_DURATION = 120;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const interactiveSelector = 'a,button,input,textarea,select,summary,dialog,[role="button"],[role="tab"],[contenteditable=""],[contenteditable="true"],[data-journey-no-swipe]';

/**
 * Sample the four native-scroll segments without introducing an animation clock.
 * The first 90% of each segment is a reading pause; its final 10% carries the
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
  let navigationFrame = 0;
  let navigationDirection = 0;
  let heldInput = false;
  let wheelSettleTimer = 0;
  let wheelSettleDirection = 0;
  let wheelScrollOrigin = 0;
  let wheelDidScroll = false;
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
    cancelNavigation();
    const target = clamp(Math.round(Number(index) || 0), 0, PRODUCT_COUNT - 1);
    const { top, travel } = measure();
    const behavior = options.behavior || (reduced() ? 'auto' : 'smooth');
    // Enter a little way into the segment so rounding and browser scroll
    // restoration cannot leave a tab sitting on the previous product boundary.
    const local = Number.isFinite(options.local) ? clamp(options.local, .01, TRANSITION_START - .01) : .12;
    const destination = top + travel * ((target + local) / PRODUCT_COUNT);
    const from = read();
    if (behavior !== 'smooth' || reduced() || !from.active || Math.abs(target - from.position) < .001) {
      window.scrollTo({ top: destination, behavior });
      return read();
    }
    // A tab is one deliberate horizontal turn, not a fast pass through the
    // vertical reading pauses. Invert the scroll curve so copy and sculpture
    // still use the real scroll sample, including after an interruption.
    const duration = (options.duration || TAB_TURN_DURATION) + Math.max(0, Math.abs(target - from.position) - 1) * 180;
    navigationDirection = Math.sign(target - from.position);
    let started;
    function turn(time) {
      navigationFrame = 0;
      if (disposed) return;
      started ??= time;
      const progress = clamp((time - started) / duration, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const position = from.position + (target - from.position) * eased;
      const index = Math.min(PRODUCT_COUNT - 1, Math.floor(position));
      const blend = clamp(position - index, 0, 1);
      const inverse = .5 - Math.sin(Math.asin(1 - 2 * blend) / 3);
      const global = (index + TRANSITION_START + (1 - TRANSITION_START) * inverse) / PRODUCT_COUNT;
      window.scrollTo({ top: progress === 1 ? destination : top + travel * global, behavior: 'instant' });
      read();
      if (progress < 1) navigationFrame = window.requestAnimationFrame(turn);
      else navigationDirection = 0;
    }
    navigationFrame = window.requestAnimationFrame(turn);
    return read();
  }

  function cancelNavigation() {
    if (navigationFrame) window.cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
    navigationDirection = 0;
    clearTimeout(wheelSettleTimer);
    wheelSettleTimer = 0;
    wheelSettleDirection = 0;
    wheelDidScroll = false;
  }
  function queueWheelSettle() {
    clearTimeout(wheelSettleTimer);
    wheelSettleTimer = 0;
    // Keep the pending direction while a pointer/touch owns the page. Release
    // will re-arm this same unfinished handoff instead of abandoning it.
    if (heldInput || mouseDrag || touch) return;
    wheelSettleTimer = setTimeout(() => {
      wheelSettleTimer = 0;
      const direction = wheelSettleDirection;
      const moved = wheelDidScroll;
      if (heldInput || mouseDrag || touch) return;
      wheelSettleDirection = 0;
      wheelDidScroll = false;
      if (!direction || !moved || disposed || navigationFrame) return;
      if (typeof document !== 'undefined' && document.querySelector?.('dialog[open]')) return;
      const current = read();
      if (!current.active || Math.abs(current.position - Math.round(current.position)) < .001) return;
      // A stopped wheel must leave a full page to read. Finish the small
      // remaining handoff in its input direction, then start the next reading
      // interval near its edge. No timer advances a stable reading screen.
      const target = direction > 0 ? Math.ceil(current.position) : Math.floor(current.position);
      const duration = Math.max(WHEEL_SETTLE_MIN_DURATION, WHEEL_SETTLE_DURATION * Math.abs(target - current.position));
      goTo(target, { duration, local: direction > 0 ? .02 : TRANSITION_START - .02 });
    }, WHEEL_SETTLE_DELAY);
  }
  function onNativeScroll() {
    if (wheelSettleDirection && !navigationFrame) {
      if (Math.abs(window.scrollY - wheelScrollOrigin) > .1) wheelDidScroll = true;
      queueWheelSettle();
    }
  }
  function interruptNavigation(event) {
    // Horizontal trackpad momentum is part of its current gesture. Native
    // vertical scrolling, a new pointer action, or a key takes over at once.
    if (event.type === 'wheel' && Math.abs(event.deltaX) <= 18 && Math.abs(event.deltaY) <= .1) return;
    if (event.type === 'wheel' && Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.6) {
      // A few pixels of cross-axis trackpad noise are not a new gesture. Only
      // clear a vertical settle when the stage can really act on this swipe.
      if (Math.abs(event.deltaX) <= 18 || isInteractive(event.target)
        || (typeof stage.contains === 'function' && !stage.contains(event.target))) return;
      const current = read();
      const next = current.selectedIndex + (event.deltaX > 0 ? 1 : -1);
      if (!current.active || next < 0 || next >= PRODUCT_COUNT) return;
      clearTimeout(wheelSettleTimer);
      wheelSettleTimer = 0;
      wheelSettleDirection = 0;
      wheelDidScroll = false;
      return;
    }
    let keyboardDirection = 0;
    if (event.type === 'keydown') {
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) keyboardDirection = -1;
      else if (['ArrowDown', 'PageDown', 'End'].includes(event.key)) keyboardDirection = 1;
      else if (event.key === ' ') keyboardDirection = event.shiftKey ? -1 : 1;
      else return; // Tab, modifiers and body left/right arrows do not own scroll.
      if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]')) return;
    }
    if (event.type === 'pointerdown' || event.type === 'touchstart') {
      if (event.type === 'pointerdown' && (event.isPrimary === false || (event.button !== undefined && event.button !== 0))) return;
      const direction = wheelSettleDirection || navigationDirection;
      const moved = wheelDidScroll || Boolean(navigationFrame);
      cancelNavigation();
      heldInput = true;
      const current = read();
      if (direction && moved && current.active && Math.abs(current.position - Math.round(current.position)) >= .001) {
        wheelSettleDirection = direction;
        wheelDidScroll = true;
        wheelScrollOrigin = window.scrollY;
      }
      return;
    }
    cancelNavigation();
    if ((event.type === 'wheel' && Math.abs(event.deltaY) > .1) || keyboardDirection) {
      wheelScrollOrigin = window.scrollY;
      wheelSettleDirection = keyboardDirection || (event.deltaY > 0 ? 1 : -1);
      queueWheelSettle();
    }
  }
  function releaseInput(event) {
    if (event.type === 'touchend' && event.touches?.length) return;
    if (event.type.startsWith('pointer') || event.type === 'lostpointercapture') clearMouseDrag();
    if (event.type.startsWith('touch')) touch = null;
    heldInput = false;
    if (!disposed && !navigationFrame && wheelSettleDirection && wheelDidScroll) queueWheelSettle();
  }
  function releaseLostInput() {
    clearMouseDrag();
    touch = null;
    heldInput = false;
    if (!disposed && !navigationFrame && wheelSettleDirection && wheelDidScroll) queueWheelSettle();
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
  for (const type of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
    window.addEventListener(type, interruptNavigation, { capture: true, passive: true });
  }
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'touchend', 'touchcancel']) {
    window.addEventListener(type, releaseInput, { passive: true });
  }
  window.addEventListener('blur', releaseLostInput, { passive: true });

  return {
    read,
    goTo,
    resize() { cancelNavigation(); return read(); },
    dispose() {
      disposed = true;
      cancelNavigation();
      touch = null;
      heldInput = false;
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
      for (const type of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
        window.removeEventListener(type, interruptNavigation, { capture: true });
      }
      window.removeEventListener('scroll', onNativeScroll);
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'touchend', 'touchcancel']) window.removeEventListener(type, releaseInput);
      window.removeEventListener('blur', releaseLostInput);
    },
  };
}
