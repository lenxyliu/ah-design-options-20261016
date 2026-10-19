/** A quiet companion to the native pointer; never captures input. */
export function createPointerFollower({ enabled = () => true } = {}) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const follower = document.createElement('div');
  follower.className = 'pointer-follower';
  follower.setAttribute('aria-hidden', 'true');
  follower.innerHTML = '<span class="pointer-glow"></span><span class="pointer-ring"></span>';
  document.body.append(follower);

  let active = false, pressed = false, frame = 0, lastTime = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const allowed = () => finePointer.matches && enabled() && !document.hidden && !document.body.classList.contains('dialog-open');

  function hide() {
    active = false; pressed = false; lastTime = 0;
    follower.classList.remove('is-visible', 'is-pressed');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function refresh() {
    if (!allowed()) { hide(); return; }
    if (!active) return;
    const target = document.elementFromPoint(targetX, targetY);
    const product = target?.closest('.products');
    follower.style.setProperty('--cursor-color', product ? getComputedStyle(product).getPropertyValue('--accent') : '#3159f5');
    follower.classList.toggle('is-interactive', Boolean(target?.closest('a,button,input,select,textarea,[role="tab"]')));
    follower.classList.toggle('is-over-art', Boolean(target?.closest('.art-interaction,.product-stage')));
    follower.classList.toggle('is-pressed', pressed);
  }

  function tick(time) {
    frame = 0;
    if (!active || !allowed()) { hide(); return; }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .06) : 1 / 60;
    lastTime = time;
    const ease = 1 - Math.exp(-dt * 23);
    x += (targetX + 8 - x) * ease;
    y += (targetY + 8 - y) * ease;
    const settled = Math.hypot(targetX + 8 - x, targetY + 8 - y) < .15;
    if (settled) { x = targetX + 8; y = targetY + 8; }
    follower.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (!settled) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !allowed()) { hide(); return; }
    targetX = event.clientX; targetY = event.clientY;
    pressed = Boolean(event.buttons & 1);
    if (!active) {
      x = targetX + 8; y = targetY + 8; active = true;
      follower.style.transform = `translate3d(${x}px,${y}px,0)`;
      follower.classList.add('is-visible');
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
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  finePointer.addEventListener('change', refresh);
  return { refresh, hide };
}
