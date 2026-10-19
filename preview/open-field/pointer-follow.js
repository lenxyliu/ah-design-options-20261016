/** A quiet companion to the native pointer; never captures input. */
export function createPointerFollower({ enabled = () => true, getArtBounds = () => null } = {}) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const follower = document.createElement('div');
  follower.className = 'pointer-follower';
  follower.setAttribute('aria-hidden', 'true');
  follower.innerHTML = '<span class="pointer-dot"></span><span class="pointer-cue"><svg viewBox="0 0 24 12" fill="none" aria-hidden="true"><path d="M2 6H22 M6 2L2 6L6 10 M18 2L22 6L18 10"/></svg></span>';
  document.body.append(follower);

  let active = false, pressed = false, frame = 0, lastTime = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let magneticOwner = null, magneticArrow = null;
  let color = '';
  const offset = 12;
  const allowed = () => finePointer.matches && enabled() && !document.hidden && !document.body.classList.contains('dialog-open');

  function resetMagnet() {
    if (magneticArrow) {
      magneticArrow.style.setProperty('--pointer-shift-x', '0px');
      magneticArrow.style.setProperty('--pointer-shift-y', '0px');
    }
    magneticOwner = magneticArrow = null;
  }

  function updateMagnet(target) {
    const owner = target?.closest('.round-link');
    const arrow = owner?.querySelector('.round-arrow');
    if (!arrow || pressed) { resetMagnet(); return; }
    if (arrow !== magneticArrow) {
      resetMagnet(); magneticOwner = owner; magneticArrow = arrow;
    }
    const bounds = owner.getBoundingClientRect();
    let dx = (targetX - (bounds.left + bounds.width / 2)) * .12;
    let dy = (targetY - (bounds.top + bounds.height / 2)) * .12;
    const distance = Math.hypot(dx, dy);
    // Leave a rounding margin so the two CSS values stay within 3px together.
    if (distance > 2.99) { dx *= 2.99 / distance; dy *= 2.99 / distance; }
    arrow.style.setProperty('--pointer-shift-x', `${dx.toFixed(2)}px`);
    arrow.style.setProperty('--pointer-shift-y', `${dy.toFixed(2)}px`);
  }

  function hide() {
    active = false; pressed = false; lastTime = 0;
    follower.classList.remove('is-visible', 'is-pressed', 'is-interactive', 'is-over-art');
    follower.style.setProperty('--pointer-stretch', '4px');
    resetMagnet();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function refresh() {
    if (!allowed()) { hide(); return; }
    if (!active) return;
    const target = document.elementFromPoint(targetX, targetY);
    if (!target) { hide(); return; }
    const product = target?.closest('.products');
    const nextColor = product ? getComputedStyle(product).getPropertyValue('--accent').trim() : '#3159f5';
    if (nextColor !== color) { color = nextColor; follower.style.setProperty('--cursor-color', color); }
    const interactive = Boolean(target.closest('a,button,input,select,textarea,summary,[role="button"],[role="tab"],[contenteditable=""],[contenteditable="true"]'));
    const bounds = getArtBounds();
    const overProductArt = Boolean(target.closest('.product-stage') && bounds && targetX >= bounds.left && targetX <= bounds.right && targetY >= bounds.top && targetY <= bounds.bottom);
    const overArt = !interactive && (Boolean(target.closest('.art-interaction')) || overProductArt);
    follower.classList.toggle('is-visible', !interactive);
    follower.classList.toggle('is-interactive', interactive);
    follower.classList.toggle('is-over-art', overArt);
    follower.classList.toggle('is-pressed', pressed);
    updateMagnet(target);
  }

  function tick(time) {
    frame = 0;
    if (!active || !allowed()) { hide(); return; }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .06) : 1 / 60;
    lastTime = time;
    const ease = 1 - Math.exp(-dt * 23);
    const oldX = x, oldY = y;
    x += (targetX + offset - x) * ease;
    y += (targetY + offset - y) * ease;
    const settled = Math.hypot(targetX + offset - x, targetY + offset - y) < .15;
    if (settled) { x = targetX + offset; y = targetY + offset; }
    const dx = x - oldX, dy = y - oldY, speed = Math.hypot(dx, dy) / Math.max(dt, .001);
    follower.style.setProperty('--pointer-stretch', `${settled ? 4 : Math.min(10, 4 + speed * .015).toFixed(2)}px`);
    if (speed > 1) follower.style.setProperty('--pointer-angle', `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
    follower.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (!settled) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !allowed()) { hide(); return; }
    targetX = event.clientX; targetY = event.clientY;
    pressed = Boolean(event.buttons & 1);
    if (!active) {
      x = targetX + offset; y = targetY + offset; active = true;
      follower.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
    refresh();
    if (!frame) frame = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    if (event.button === 0) { pressed = true; refresh(); }
  }, { passive: true });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    document.addEventListener(event, () => { pressed = false; refresh(); }, { passive: true });
  }
  document.addEventListener('pointerout', event => {
    if (magneticOwner && !(event.relatedTarget instanceof Node && magneticOwner.contains(event.relatedTarget))) resetMagnet();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  finePointer.addEventListener('change', refresh);
  return { refresh, hide };
}
