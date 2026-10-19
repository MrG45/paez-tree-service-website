/* Dock the floating header as the page scrolls, without moving page content. */
(() => {
  'use strict';

  const header = document.querySelector('.pz-header');
  if (!header) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let frame;
  let lastProgress;

  const render = () => {
    frame = undefined;
    const distance = Math.max(0, Math.min(1, ((window.scrollY || 0) - 16) / 104));
    // Smoothstep eases both ends while remaining directly tied to scroll.
    const progress = reducedMotion?.matches ? 1
      : Number((distance * distance * (3 - 2 * distance)).toFixed(4));
    if (progress === lastProgress) return;
    lastProgress = progress;
    const state = progress === 0 ? 'floating' : progress === 1 ? 'docked' : 'transitioning';
    header.style.setProperty('--pz-header-progress', String(progress));
    header.dataset.headerState = state;
    // Consumers can read the new geometry in this same animation frame.
    document.dispatchEvent(new CustomEvent('paez:header-change', { detail: { progress, state } }));
  };
  const schedule = () => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(render);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('load', schedule);
  reducedMotion?.addEventListener('change', schedule);
  // Use an already-restored scroll position before the first paint, and check
  // again on pageshow/load for browsers that restore it later.
  render();
})();
