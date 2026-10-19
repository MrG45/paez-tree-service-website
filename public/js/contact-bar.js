(() => {
  'use strict';

  const bar = document.querySelector('.pz-sticky-bar');
  const heroActions = document.querySelector('.pz-hero-cta');
  if (!bar || !heroActions) return;
  const header = document.querySelector('.pz-header');
  const quote = document.getElementById('quote');
  const form = document.getElementById('pzQuoteForm');
  const burger = document.getElementById('pzBurger');
  let scheduled = false;

  const update = () => {
    scheduled = false;
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop || 0;
    const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
    const headerBottom = Math.max(viewportTop, header?.getBoundingClientRect().bottom || 0);
    const heroPassed = heroActions.getBoundingClientRect().bottom <= headerBottom;
    const quoteBounds = quote?.getBoundingClientRect();
    const quoteVisible = quoteBounds && quoteBounds.bottom > headerBottom
      && quoteBounds.top < viewportBottom;
    const busy = burger?.getAttribute('aria-expanded') === 'true'
      || document.body.classList.contains('pz-form-editing')
      || form?.contains(document.activeElement);

    // Fixed controls add no space to the page. Keep them out of the way while
    // the main estimate actions, the form or the navigation already serve it.
    bar.hidden = !heroPassed || Boolean(quoteVisible) || Boolean(busy);
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('paez:header-change', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('load', schedule);
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener('loadingdone', schedule);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(schedule);
    [header, heroActions, quote, document.body].filter(Boolean).forEach((element) => observer.observe(element));
  }
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (burger) observer.observe(burger, { attributes: true, attributeFilter: ['aria-expanded'] });
  }
  // Scroll/resize stay authoritative even when observer APIs are unavailable.
  burger?.addEventListener('click', schedule);
  document.getElementById('pzMobileMenu')?.addEventListener('click', schedule);
  document.addEventListener('keydown', schedule);
  update();
})();
