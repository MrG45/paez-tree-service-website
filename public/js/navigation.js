/* Preserve native fragment navigation while handing keyboard focus to its destination. */
(() => {
  'use strict';

  const header = document.querySelector('.pz-header');
  let frame;
  let focusTimer;

  const updateOffset = () => {
    frame = undefined;
    const bounds = header?.getBoundingClientRect();
    // The floating header has a top gap; its full visible bottom edge is the
    // clearance needed by native fragment navigation, including mid-transition.
    const bottom = Math.max(0, (bounds?.top || 0) + (bounds?.height || 0));
    document.documentElement.style.setProperty('--pz-scroll-offset', `${Math.ceil(bottom) + 16}px`);
  };
  const scheduleOffset = () => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(updateOffset);
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href]');
    // Service cards manage their own selection, form step and focus.
    if (!link || link.hasAttribute('download') || link.hasAttribute('data-service-select')) return;
    if (link.target && link.target.toLowerCase() !== '_self') return;
    let url;
    let destination;
    try {
      url = new URL(link.href, window.location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      destination = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    } catch { return; }
    if (!destination) return;

    // Menu link handlers have already closed the menu by this point. Measure
    // before the browser's default scroll so the destination clears the header.
    updateOffset();
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      if (event.defaultPrevented || !destination.isConnected) return;
      const target = destination.matches('h1,h2,h3,h4,h5,h6,[tabindex],a[href],button,input,select,textarea')
        ? destination
        : destination.querySelector('h1,h2,h3,h4,h5,h6') || destination;
      if (!target.matches('a[href],button,input,select,textarea,[tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, 0);
    // Deliberately leave default navigation alone: the hash, Back button and
    // reduced-motion CSS keep their normal browser behavior.
  });

  window.addEventListener('resize', scheduleOffset, { passive: true });
  window.addEventListener('load', scheduleOffset);
  window.addEventListener('pageshow', scheduleOffset);
  document.addEventListener('paez:header-change', updateOffset);
  document.fonts?.ready.then(scheduleOffset);
  document.fonts?.addEventListener('loadingdone', scheduleOffset);
  if (header && typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleOffset).observe(header);
  updateOffset();
})();
