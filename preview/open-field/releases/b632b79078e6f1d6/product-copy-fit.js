const RAIL_GAP = 22;
const MOBILE_ART_SPACE = 72;
const MIN_READABLE_SLOT = 112;

/** Fit all persistent copy layers together, only when their layout changes. */
export function createProductCopyFit({ stage, host, layers, tabs, lang, onLayout }) {
  const originalTabIndex = host.getAttribute('tabindex');
  const originalDescription = host.getAttribute('aria-describedby');
  const hint = document.createElement('p');
  hint.id = 'product-copy-scroll-hint';
  hint.className = 'product-copy-scroll-hint';
  hint.textContent = lang === 'en' ? 'Scroll to read the full introduction ↓' : '向下滚动，查看完整介绍 ↓';
  hint.hidden = true;
  host.append(hint);
  let pending = 0;
  let disposed = false;

  function resetScroll() {
    host.scrollTop = 0;
    host.scrollLeft = 0;
  }

  function restoreAttribute(name, value) {
    if (value === null) host.removeAttribute(name);
    else host.setAttribute(name, value);
  }

  function measure() {
    const top = host.getBoundingClientRect().top;
    const railTop = tabs.getBoundingClientRect().top;
    const naturalHeight = Math.max(...layers.map(layer => layer.getBoundingClientRect().height));
    return { available: railTop - top, naturalHeight };
  }

  function fit() {
    pending = 0;
    if (disposed) return;
    stage.classList.add('is-copy-measuring');
    stage.classList.remove('is-copy-compact', 'is-copy-scrollable');
    host.style.removeProperty('--copy-slot-height');
    hint.hidden = true;
    restoreAttribute('tabindex', originalTabIndex);
    restoreAttribute('aria-describedby', originalDescription);
    resetScroll();

    let bounds = measure();
    if (bounds.naturalHeight + RAIL_GAP > bounds.available) {
      stage.classList.add('is-copy-compact');
      bounds = measure();
    }
    if (bounds.naturalHeight + RAIL_GAP > bounds.available) {
      // Mobile sculpture layout already reads host.bottom. Keep a small real
      // model slot when space permits, rather than letting it cover the copy.
      const artSpace = innerWidth <= 800
        ? Math.min(MOBILE_ART_SPACE, Math.max(0, bounds.available - RAIL_GAP - MIN_READABLE_SLOT))
        : 0;
      const slotHeight = Math.max(1, Math.floor(bounds.available - RAIL_GAP - artSpace));
      host.style.setProperty('--copy-slot-height', `${slotHeight}px`);
      stage.classList.add('is-copy-scrollable');
      hint.hidden = false;
      host.tabIndex = 0;
      host.setAttribute('aria-describedby', [originalDescription, hint.id].filter(Boolean).join(' '));
    }
    stage.dataset.copyLayout = stage.classList.contains('is-copy-scrollable') ? 'scroll'
      : stage.classList.contains('is-copy-compact') ? 'compact' : 'normal';
    // Flush the chosen geometry while transitions are disabled. The site's
    // reduced-motion rule otherwise introduces tiny transitions on all text.
    host.getBoundingClientRect();
    stage.classList.remove('is-copy-measuring');
    onLayout?.();
  }

  function schedule() {
    if (!disposed && !pending) pending = requestAnimationFrame(fit);
  }

  const observer = new ResizeObserver(schedule);
  observer.observe(stage);
  observer.observe(tabs);
  addEventListener('resize', schedule, { passive: true });
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener('loadingdone', schedule);
  schedule();

  return {
    resetScroll,
    resize: schedule,
    dispose() {
      disposed = true;
      cancelAnimationFrame(pending);
      observer.disconnect();
      removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', schedule);
    }
  };
}
