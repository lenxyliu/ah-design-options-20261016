/** A single cursor, scoped to the sculpture's interactive area. */
export function createPointerFollower({ enabled = () => true, getArtBounds = () => null } = {}) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const follower = document.createElement('div');
  follower.className = 'art-pointer';
  follower.setAttribute('aria-hidden', 'true');
  follower.innerHTML = '<span class="pointer-cue"><svg viewBox="0 0 24 12" fill="none" aria-hidden="true"><path class="cursor-outline" d="M2 6H22 M6 2L2 6L6 10 M18 2L22 6L18 10"/><path d="M2 6H22 M6 2L2 6L6 10 M18 2L22 6L18 10"/></svg></span>';
  follower.style.display = 'none';
  document.body.append(follower);

  let owner = null, hasMouse = false, pressed = false, frame = 0, lastTime = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0, color = '';
  const interactive = 'a,button,input,select,textarea,summary,[role="button"],[role="tab"],[contenteditable=""],[contenteditable="true"]';
  const allowed = () => finePointer.matches && enabled() && !document.hidden && !document.body.classList.contains('dialog-open');

  function deactivate() {
    // Remove both sides synchronously: a fading custom cursor would briefly
    // overlap the restored native cursor at this boundary.
    follower.style.display = 'none';
    follower.classList.remove('is-visible', 'is-pressed');
    owner?.classList.remove('is-custom-cursor');
    owner = null; lastTime = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function hide() {
    deactivate(); hasMouse = false; pressed = false;
  }

  function tick(time) {
    frame = 0;
    if (!allowed()) { hide(); return; }
    if (!owner || !hasMouse) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .06) : 1 / 60;
    lastTime = time;
    const ease = 1 - Math.exp(-dt * 38);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    const settled = Math.hypot(targetX - x, targetY - y) < .1;
    if (settled) { x = targetX; y = targetY; }
    follower.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (!settled) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  function refresh() {
    if (!allowed()) { hide(); return; }
    if (!hasMouse) { deactivate(); return; }
    const target = document.elementFromPoint(targetX, targetY);
    if (!target || target.closest(interactive)) { deactivate(); return; }
    let nextOwner = target.closest('.art-interaction');
    if (!nextOwner) {
      const stage = target.closest('.product-stage'), bounds = getArtBounds();
      if (stage && bounds && targetX >= bounds.left && targetX <= bounds.right
        && targetY >= bounds.top && targetY <= bounds.bottom) nextOwner = stage;
    }
    if (!nextOwner) { deactivate(); return; }
    if (owner !== nextOwner) {
      deactivate(); owner = nextOwner;
      // The first frame is exactly under the pointer, including re-entry.
      x = targetX; y = targetY;
      follower.style.transform = `translate3d(${x}px,${y}px,0)`;
      owner.classList.add('is-custom-cursor');
      follower.classList.add('is-visible');
      follower.style.display = 'block';
    }
    const product = target.closest('.products');
    const nextColor = product ? getComputedStyle(product).getPropertyValue('--accent').trim() : '#3159f5';
    if (nextColor !== color) { color = nextColor; follower.style.setProperty('--cursor-color', color); }
    follower.classList.toggle('is-pressed', pressed);
    if (!frame && Math.hypot(targetX - x, targetY - y) >= .1) frame = requestAnimationFrame(tick);
  }

  function onPointer(event) {
    if (event.pointerType !== 'mouse' || !allowed()) { hide(); return; }
    targetX = event.clientX; targetY = event.clientY; hasMouse = true;
    pressed = Boolean(event.buttons & 1);
    refresh();
  }
  document.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerover', onPointer, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    if (event.button === 0) { pressed = true; refresh(); }
  }, { passive: true });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    document.addEventListener(event, event => {
      if (event.pointerType && event.pointerType !== 'mouse') { hide(); return; }
      pressed = false; refresh();
    }, { passive: true });
  }
  document.addEventListener('pointerout', event => {
    if (owner && (!(event.relatedTarget instanceof Node) || !owner.contains(event.relatedTarget)
      || event.relatedTarget.closest?.(interactive))) deactivate();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  finePointer.addEventListener('change', refresh);
  return { refresh, hide };
}
