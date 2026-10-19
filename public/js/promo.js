(() => {
  'use strict';

  const promo = document.querySelector('.pz-promo');
  if (!promo) return;
  const header = document.querySelector('.pz-header');
  const hero = document.querySelector('.pz-hero-copy');
  const quote = document.getElementById('quote');
  const form = document.getElementById('pzQuoteForm');
  const burger = document.getElementById('pzBurger');
  const offerNotice = document.getElementById('pzOfferApplied');

  // A language change keeps the same visit timer and dismissed state.
  const firstSeenKey = 'paez-promo-first-seen';
  const dismissedKey = 'paez-promo-dismissed';
  const revealedKey = 'paez-promo-revealed';
  const claimedKey = 'paez-promo-claimed';
  const delay = 15000;
  const now = Date.now();
  let firstSeen = now;
  let dismissed = false;
  let alreadyRevealed = false;
  let claimed = false;
  const save = (key, value) => {
    try { sessionStorage.setItem(key, value); } catch { /* Storage may be blocked. */ }
  };
  try {
    const previous = Number(sessionStorage.getItem(firstSeenKey));
    if (Number.isFinite(previous) && previous > 0 && previous <= now) firstSeen = previous;
    dismissed = sessionStorage.getItem(dismissedKey) === '1';
    alreadyRevealed = sessionStorage.getItem(revealedKey) === '1';
    claimed = sessionStorage.getItem(claimedKey) === '1';
  } catch { /* The banner still works within this page when storage is unavailable. */ }
  save(firstSeenKey, String(firstSeen));
  if (claimed && offerNotice) offerNotice.hidden = false;
  promo.hidden = true;
  if (dismissed || claimed) return;

  let timer;
  let ready = false;
  let scheduled = false;
  const requestLocked = () => form?.getAttribute('aria-busy') === 'true' || form?.hidden;
  const update = () => {
    scheduled = false;
    // Follow the floating header's actual lower edge, including its scroll morph.
    const viewportTop = window.visualViewport?.offsetTop || 0;
    const viewportBottom = viewportTop + (window.visualViewport?.height || window.innerHeight);
    const bottom = Math.max(viewportTop, header?.getBoundingClientRect().bottom || 0);
    document.documentElement.style.setProperty('--pz-header-bottom', `${Math.ceil(bottom)}px`);
    const heroPassed = hero && hero.getBoundingClientRect().bottom <= bottom;
    const quoteRect = quote?.getBoundingClientRect();
    const quoteVisible = quoteRect && quoteRect.bottom > bottom && quoteRect.top < viewportBottom;
    const busy = burger?.getAttribute('aria-expanded') === 'true'
      || document.body.classList.contains('pz-form-editing')
      || form?.contains(document.activeElement)
      || requestLocked();
    // Keep the offer stable while browsing sections. Per-element collision
    // checks made it disappear and reappear as every heading/card passed by.
    // The hero, estimate form and open menu still take priority.
    const visible = ready && !dismissed && !busy && heroPassed && !quoteVisible;
    promo.hidden = !visible;
    if (!visible) {
      promo.classList.remove('is-entering');
      return;
    }
    // Draw attention once per visit; never steal keyboard focus.
    if (!alreadyRevealed) promo.classList.add('is-entering');
    alreadyRevealed = true;
    save(revealedKey, '1');
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };
  const reveal = () => {
    ready = true;
    update();
  };
  const dismiss = (restoreFocus = true) => {
    dismissed = true;
    clearTimeout(timer);
    const hadFocus = promo.contains(document.activeElement);
    promo.hidden = true;
    save(dismissedKey, '1');
    if (restoreFocus && hadFocus) {
      const next = document.querySelector('.pz-header a[href^="tel:"]') || document.querySelector('.pz-header-brand, .pz-brand');
      next?.focus({ preventScroll: true });
    }
  };
  promo.querySelector('[data-promo-close]')?.addEventListener('click', () => dismiss());
  promo.querySelector('.pz-promo-a')?.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // The request payload is already captured while sending or after success.
    if (requestLocked()) {
      event.preventDefault();
      return;
    }
    claimed = true;
    save(claimedKey, '1');
    if (offerNotice) offerNotice.hidden = false;
    dismiss(false);
    document.dispatchEvent(new CustomEvent('paez:offer-claimed'));
  });
  promo.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    }
  });
  promo.addEventListener('animationend', (event) => {
    if (event.target === promo) promo.classList.remove('is-entering');
  });
  window.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('paez:header-change', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('load', schedule);
  window.addEventListener('hashchange', schedule);
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener('loadingdone', schedule);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(schedule);
    [header, hero, quote, document.body].filter(Boolean).forEach((element) => observer.observe(element));
  }
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (burger) observer.observe(burger, { attributes: true, attributeFilter: ['aria-expanded'] });
    if (form) observer.observe(form, { attributes: true, attributeFilter: ['aria-busy', 'hidden'] });
  }
  // Click/key events also support environments without resize/mutation observers.
  burger?.addEventListener('click', schedule);
  document.getElementById('pzMobileMenu')?.addEventListener('click', schedule);
  document.addEventListener('keydown', schedule);
  update();
  const remaining = Math.max(0, delay - (now - firstSeen));
  if (remaining === 0) reveal();
  else timer = setTimeout(reveal, remaining);
})();
