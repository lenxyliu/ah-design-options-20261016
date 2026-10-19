const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = (value) => value * value * (3 - 2 * value);
const EPSILON = 1e-7;

/**
 * Bridge a discontinuous native-scroll sample only at the presentation layer.
 * The owner supplies one RAF timestamp and uses the returned position for copy,
 * sculpture and labels. This controller neither owns a RAF nor touches scroll.
 * Normal small samples (including the existing tab turn) pass through directly.
 */
export function createProductPresentation({ duration = 280, jumpThreshold = .18, maxFrameGap = 120 } = {}) {
  duration = Number.isFinite(duration) && duration > 0 ? duration : 280;
  jumpThreshold = Number.isFinite(jumpThreshold) && jumpThreshold > 0 ? jumpThreshold : .18;
  maxFrameGap = Number.isFinite(maxFrameGap) && maxFrameGap > 0 ? maxFrameGap : 120;
  let position = 0;
  let targetPosition = 0;
  let handledTarget = 0;
  let lastTime = null;
  let initialized = false;
  let suspended = false;
  let animation = null;

  const bound = (value) => clamp(Number.isFinite(value) ? value : 0, 0, 3);

  function read() {
    return {
      position,
      targetPosition,
      settled: !animation && Math.abs(position - targetPosition) < EPSILON,
      animating: Boolean(animation),
      progress: animation ? clamp(animation.elapsed / duration, 0, 1) : 1,
      paused: suspended
    };
  }

  function reset(value = 0, timestamp = lastTime) {
    position = targetPosition = handledTarget = bound(value);
    lastTime = Number.isFinite(timestamp) ? timestamp : lastTime;
    animation = null;
    initialized = true;
    suspended = false;
    return read();
  }

  function advance(elapsed) {
    if (!animation) return;
    animation.elapsed = Math.min(duration, animation.elapsed + elapsed);
    const progress = animation.elapsed / duration;
    position = animation.from + (animation.to - animation.from) * smooth(progress);
    if (progress >= 1) {
      position = animation.to;
      animation = null;
    }
  }

  function tick(target, timestamp, { snap = false, reduced = false, paused = false, hidden = false } = {}) {
    const next = bound(target);
    const now = Number.isFinite(timestamp) ? Math.max(lastTime ?? timestamp, timestamp) : (lastTime ?? 0);
    if (!initialized || snap || reduced) return reset(next, now);
    targetPosition = next;
    if (paused || hidden) {
      // Ignore hidden time rather than completing the turn in the background.
      lastTime = now;
      suspended = true;
      return read();
    }
    const gap = lastTime === null || suspended ? 0 : now - lastTime;
    lastTime = now;
    suspended = false;
    // A stopped RAF is also a pause; the next visible frame must not jump ahead.
    advance(gap > maxFrameGap ? 0 : gap);
    const targetChanged = Math.abs(next - handledTarget) > EPSILON;
    if (targetChanged) {
      const jump = Math.abs(next - handledTarget);
      const remaining = next - position;
      const reverses = animation && (animation.to - position) * remaining < 0;
      if (Math.abs(remaining) < EPSILON) {
        position = next;
        animation = null;
      } else if (jump > jumpThreshold || reverses) {
        // A new deliberate destination starts at the pose actually on screen.
        animation = { from: position, to: next, elapsed: 0 };
      } else if (animation) {
        // Small updates keep the original end time instead of perpetually
        // restarting the bridge while the native-scroll target is still moving.
        animation.to = next;
      } else {
        position = next;
      }
      handledTarget = next;
    }
    return read();
  }

  return { tick, reset, read };
}
