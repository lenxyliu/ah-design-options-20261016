/** One liquid-metal pointer across the page; native input remains untouched. */
export function createPointerFollower({ enabled = () => true, getArtBounds = () => null } = {}) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const surface = document.createElement('div');
  surface.className = 'pointer-surface';
  surface.setAttribute('aria-hidden', 'true');
  surface.style.pointerEvents = 'none';
  surface.style.display = 'none';
  const follower = document.createElement('div');
  follower.className = 'art-pointer';
  follower.setAttribute('aria-hidden', 'true');
  follower.style.pointerEvents = 'none';
  follower.innerHTML = '<span class="pointer-lens"></span>';
  follower.style.display = 'none';
  document.body.append(surface, follower);

  let active = false, hasMouse = false, pressed = false, frame = 0, lastTime = 0;
  let targetX = 0, targetY = 0, lastInputTime = 0, lastMoveTime = 0;
  let inputVX = 0, inputVY = 0, vx = 0, vy = 0;
  let speed = 0, energy = 0, shape = 0, shapeVelocity = 0, angle = 0, curve = 0;
  let lightX = 36, lightY = 25, flow = 0, hover = false, overArt = false, color = '';
  const interactive = 'a,button,summary,[role="button"],[role="tab"],input';
  const nativeInput = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[data-native-cursor],iframe,object,embed';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const wrapAngle = value => ((value + 180) % 360 + 360) % 360 - 180;
  const hasSelection = () => {
    const selection = document.getSelection?.();
    return Boolean(selection && selection.rangeCount && !selection.isCollapsed);
  };
  const allowed = () => finePointer.matches && enabled() && !document.hidden
    && !document.body.classList.contains('dialog-open') && !hasSelection();

  function paintPosition() {
    // Hotspot is always the real mouse position, including links and dragging.
    follower.style.transform = `translate3d(${targetX}px,${targetY}px,0)`;
    root.style.setProperty('--cursor-x', `${targetX.toFixed(2)}px`);
    root.style.setProperty('--cursor-y', `${targetY.toFixed(2)}px`);
    root.style.setProperty('--cursor-xp', `${(clamp(targetX / Math.max(1, innerWidth)) * 100).toFixed(3)}%`);
    root.style.setProperty('--cursor-yp', `${(clamp(targetY / Math.max(1, innerHeight)) * 100).toFixed(3)}%`);
  }

  function paintDynamics() {
    const stretch = 1 + shape * .55;
    root.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    root.style.setProperty('--cursor-speed', clamp(speed / 900).toFixed(4));
    root.style.setProperty('--cursor-energy', energy.toFixed(4));
    root.style.setProperty('--cursor-stretch', stretch.toFixed(5));
    root.style.setProperty('--cursor-squash', (1 / stretch).toFixed(5));
    root.style.setProperty('--cursor-curve', curve.toFixed(4));
    root.style.setProperty('--cursor-light-x', `${lightX.toFixed(3)}%`);
    root.style.setProperty('--cursor-light-y', `${lightY.toFixed(3)}%`);
    // No dormant sheen remains behind the content after motion ends.
    surface.style.display = active && energy > .002 ? 'block' : 'none';
  }

  function paintContext() {
    root.style.setProperty('--cursor-hover', hover ? '1' : '0');
    root.style.setProperty('--cursor-pressed', pressed ? '1' : '0');
    root.style.setProperty('--cursor-art', overArt ? '1' : '0');
    follower.classList.toggle('is-interactive', hover);
    follower.classList.toggle('is-over-art', overArt);
    follower.classList.toggle('is-pressed', pressed);
    follower.classList.toggle('is-dragging', pressed && overArt);
  }

  function resetDynamics(resetAngle = true) {
    inputVX = inputVY = vx = vy = speed = energy = shape = shapeVelocity = curve = flow = 0;
    lightX = 36; lightY = 25;
    if (resetAngle) angle = 0;
    paintDynamics();
  }

  function moving() {
    return Math.hypot(inputVX, inputVY) > 1 || speed > 1 || energy > .002
      || shape > .001 || Math.abs(shapeVelocity) > .02 || Math.abs(curve) > .003
      || Math.abs(lightX - 36) > .05 || Math.abs(lightY - 25) > .05;
  }

  function deactivate() {
    // Native and custom cursors change in the same task, without a fade.
    follower.style.display = 'none';
    surface.style.display = 'none';
    root.classList.remove('has-custom-pointer');
    follower.classList.remove('is-visible', 'is-interactive', 'is-over-art', 'is-pressed', 'is-dragging');
    active = false; hover = false; overArt = false; lastTime = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    root.style.setProperty('--cursor-hover', '0');
    root.style.setProperty('--cursor-pressed', '0');
    root.style.setProperty('--cursor-art', '0');
    resetDynamics();
  }

  function hide() {
    deactivate(); hasMouse = false; pressed = false;
    lastInputTime = lastMoveTime = 0;
  }

  function tick(time) {
    frame = 0;
    if (!allowed()) { hide(); return; }
    if (!active || !hasMouse) return;
    const dt = lastTime ? clamp((time - lastTime) / 1000, .001, .06) : 1 / 60;
    lastTime = time;
    const age = Math.max(0, (time - lastMoveTime) / 1000);
    if (age >= .36) {
      // A deliberate upper bound also covers a very fast final input sample.
      resetDynamics(false); lastTime = 0; return;
    }
    const damping = Math.exp(-Math.max(0, age - .018) * 42);
    const ease = 1 - Math.exp(-dt * 30);
    vx += (inputVX * damping - vx) * ease;
    vy += (inputVY * damping - vy) * ease;
    speed = Math.hypot(vx, vy);
    const motion = clamp((speed - 24) / 876);
    if (speed > 20) {
      const direction = Math.atan2(vy, vx) * 180 / Math.PI;
      const previous = angle;
      angle = wrapAngle(angle + wrapAngle(direction - angle) * (1 - Math.exp(-dt * 26)));
      const turn = clamp(wrapAngle(angle - previous) / Math.max(.001, dt) / 480, -1, 1);
      curve += (turn * motion - curve) * (1 - Math.exp(-dt * 18));
    } else curve += -curve * (1 - Math.exp(-dt * 24));
    const steps = Math.ceil(dt / (1 / 120)), step = dt / steps;
    for (let i = 0; i < steps; i++) {
      shapeVelocity += ((motion - shape) * 1600 - shapeVelocity * 64) * step;
      shape += shapeVelocity * step;
      if (shape < 0) { shape = 0; shapeVelocity = Math.max(0, shapeVelocity); }
      if (shape > 1) { shape = 1; shapeVelocity = Math.min(0, shapeVelocity); }
    }
    energy += (motion - energy) * (1 - Math.exp(-dt * (motion > energy ? 25 : 18)));
    energy = clamp(energy);
    flow += dt * energy * 3.6;
    const radians = angle * Math.PI / 180;
    const nextLightX = 36 + (-Math.cos(radians) * 11 + Math.sin(flow) * 6) * energy + curve * 3;
    const nextLightY = 25 + (-Math.sin(radians) * 9 + Math.cos(flow * .83) * 5) * energy;
    const lightEase = 1 - Math.exp(-dt * 18);
    lightX += (nextLightX - lightX) * lightEase;
    lightY += (nextLightY - lightY) * lightEase;
    paintDynamics();
    // The last measured input decays above; do not keep a clock running at rest.
    if (moving()) frame = requestAnimationFrame(tick);
    else { resetDynamics(false); lastTime = 0; }
  }

  function refresh() {
    if (!allowed()) { hide(); return; }
    if (!hasMouse) { deactivate(); return; }
    const target = document.elementFromPoint(targetX, targetY);
    const editing = document.activeElement?.closest?.(nativeInput);
    if (!target || target.closest(nativeInput) || editing) { hide(); return; }
    if (!active) {
      active = true; resetDynamics(); paintPosition();
      root.classList.add('has-custom-pointer');
      follower.classList.add('is-visible');
      follower.style.display = 'block';
    }
    hover = Boolean(target.closest(interactive));
    const stage = target.closest('.product-stage'), bounds = getArtBounds();
    overArt = Boolean(target.closest('.art-interaction') || (stage && bounds
      && targetX >= bounds.left && targetX <= bounds.right && targetY >= bounds.top && targetY <= bounds.bottom));
    const product = target.closest('.products');
    const nextColor = product ? getComputedStyle(product).getPropertyValue('--accent').trim() : '#3159f5';
    if (nextColor !== color) { color = nextColor; root.style.setProperty('--cursor-color', color); }
    paintPosition(); paintContext();
    if (!frame && moving()) frame = requestAnimationFrame(tick);
  }

  function onPointer(event) {
    if (event.pointerType !== 'mouse' || !allowed()) { hide(); return; }
    const now = performance.now();
    const dx = event.clientX - targetX, dy = event.clientY - targetY;
    if (active && hasMouse && Math.hypot(dx, dy) > .01) {
      const dt = clamp((now - lastInputTime) / 1000, .002, .06);
      inputVX = clamp(dx / dt, -16000, 16000);
      inputVY = clamp(dy / dt, -16000, 16000);
      lastMoveTime = now;
    }
    targetX = event.clientX; targetY = event.clientY;
    lastInputTime = now;
    if (!hasMouse) lastMoveTime = now;
    hasMouse = true; pressed = Boolean(event.buttons & 1);
    refresh();
  }

  document.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerover', onPointer, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    if (event.button === 0) { pressed = true; refresh(); }
  }, { passive: true });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    document.addEventListener(type, event => {
      if (event.pointerType && event.pointerType !== 'mouse') { hide(); return; }
      pressed = false; refresh();
    }, { passive: true });
  }
  document.addEventListener('pointerout', event => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || next.closest?.(nativeInput)) hide();
  }, { passive: true });
  root.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  document.addEventListener('selectionchange', refresh);
  document.addEventListener('focusin', refresh);
  finePointer.addEventListener('change', refresh);
  resetDynamics();
  root.style.setProperty('--cursor-hover', '0');
  root.style.setProperty('--cursor-pressed', '0');
  root.style.setProperty('--cursor-art', '0');
  return { refresh, hide };
}
