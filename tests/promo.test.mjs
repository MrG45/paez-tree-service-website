import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { Window } from 'happy-dom';

// Isolated promo checks: no browser navigation, network requests or lead submissions.
const script = await readFile(new URL('../public/js/promo.js', import.meta.url), 'utf8');
const windows = [];
const keys = ['paez-promo-first-seen', 'paez-promo-dismissed', 'paez-promo-revealed', 'paez-promo-claimed'];

afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()));
});

function openPromo({ now = 100000, stored = {}, blockedStorage = false, locale = 'en', observers = true,
  heroBottom = 80, quoteTop = -500, quoteBottom = 80 } = {}) {
  const window = new Window({
    url: `https://paez.test/${locale === 'es' ? 'es/' : ''}`,
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
      enableJavaScriptEvaluation: true,
      suppressInsecureJavaScriptEnvironmentWarning: true,
    },
  });
  windows.push(window);
  window.fetch = () => { throw new Error('Promo tests must never make requests'); };
  window.document.write(`
    <a class="pz-brand" href="/">Paez Tree Service</a>
    <header class="pz-header"><a href="tel:7149269413">(714) 926-9413</a>
      <button id="pzBurger" aria-expanded="false">Menu</button>
      <nav id="pzMobileMenu"></nav>
    </header>
    <section class="pz-hero-copy"></section>
    <div id="quote"><div id="pzOfferApplied" hidden>Offer added</div>
      <form id="pzQuoteForm"><input name="name" /></form>
    </div>
    <section><h2>Tree services</h2><a data-promo-protect href="#quote">Choose a service</a></section>
    <div class="pz-promo" hidden>
      <a class="pz-promo-a" href="#quote">${locale === 'es' ? 'Obtener oferta' : 'Claim offer'}</a>
      <button type="button" data-promo-close>Close</button>
    </div>
  `);
  let clock = now;
  let nextId = 0;
  const timers = new Map();
  const frames = [];
  const resizeCallbacks = [];
  const headerBounds = { bottom: 120 };
  const bounds = {
    hero: { bottom: heroBottom }, quote: { top: quoteTop, bottom: quoteBottom },
    banner: { top: 128, bottom: 192, left: 16, right: 374 },
    heading: { top: 400, bottom: 440, left: 16, right: 374 },
    control: { top: 500, bottom: 550, left: 16, right: 374 },
  };
  window.innerHeight = 800;
  window.document.querySelector('.pz-header').getBoundingClientRect = () => headerBounds;
  for (const [selector, key] of [['.pz-hero-copy', 'hero'], ['#quote', 'quote'], ['.pz-promo', 'banner'],
    ['h2', 'heading'], ['[data-promo-protect]', 'control']]) {
    window.document.querySelector(selector).getBoundingClientRect = () => bounds[key];
  }
  window.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  window.ResizeObserver = observers ? class {
    constructor(callback) { resizeCallbacks.push(callback); }
    observe() {}
  } : undefined;
  if (!observers) window.MutationObserver = undefined;
  window.Date.now = () => clock;
  window.setTimeout = (callback, delay) => {
    const id = ++nextId;
    timers.set(id, { callback, due: clock + delay });
    return id;
  };
  window.clearTimeout = (id) => timers.delete(id);
  for (const [key, value] of Object.entries(stored)) window.sessionStorage.setItem(key, value);
  if (blockedStorage) {
    Object.defineProperty(window, 'sessionStorage', {
      get() { throw new window.DOMException('Storage is blocked', 'SecurityError'); },
    });
  }
  window.eval(script);
  return {
    window,
    promo: window.document.querySelector('.pz-promo'),
    close: window.document.querySelector('[data-promo-close]'),
    phone: window.document.querySelector('.pz-header a'),
    burger: window.document.querySelector('#pzBurger'),
    field: window.document.querySelector('input'),
    form: window.document.getElementById('pzQuoteForm'),
    offer: window.document.querySelector('.pz-promo-a'),
    offerNotice: window.document.getElementById('pzOfferApplied'),
    headerBounds,
    bounds,
    flush() { frames.splice(0).forEach((callback) => callback()); },
    scroll() { window.dispatchEvent(new window.Event('scroll')); frames.splice(0).forEach((callback) => callback()); },
    resizeHeader() { resizeCallbacks.forEach((callback) => callback()); },
    timers,
    advance(milliseconds) {
      clock += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.due <= clock) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
    session() {
      return Object.fromEntries(keys.map((key) => [key, window.sessionStorage.getItem(key)])
        .filter(([, value]) => value !== null));
    },
  };
}

test('promo stays hidden for fifteen seconds and reveals without taking focus', () => {
  const page = openPromo();
  page.phone.focus();
  assert.equal(page.promo.hidden, true);
  page.advance(14999);
  assert.equal(page.promo.hidden, true);
  page.advance(1);
  assert.equal(page.promo.hidden, false);
  assert.equal(page.promo.classList.contains('is-entering'), true);
  assert.equal(page.window.document.activeElement, page.phone);
  assert.equal(page.timers.size, 0);
});

test('switching languages continues the existing fifteen-second timer', () => {
  const en = openPromo();
  en.advance(8000);
  const es = openPromo({ now: 108000, stored: en.session(), locale: 'es' });
  es.advance(6999);
  assert.equal(es.promo.hidden, true);
  es.advance(1);
  assert.equal(es.promo.hidden, false);
});

test('the attention animation runs only once during a session', () => {
  const en = openPromo();
  en.advance(15000);
  en.promo.dispatchEvent(new en.window.Event('animationend'));
  assert.equal(en.promo.classList.contains('is-entering'), false);
  const es = openPromo({ now: 120000, stored: en.session(), locale: 'es' });
  assert.equal(es.promo.hidden, false);
  assert.equal(es.promo.classList.contains('is-entering'), false);
  assert.equal(es.timers.size, 0);
});

test('dismissal persists through language changes and returns keyboard focus to the phone', () => {
  const page = openPromo();
  page.advance(15000);
  page.close.focus();
  page.close.click();
  assert.equal(page.promo.hidden, true);
  assert.equal(page.window.document.activeElement, page.phone);
  const es = openPromo({ now: 120000, stored: page.session(), locale: 'es' });
  es.advance(60000);
  assert.equal(es.promo.hidden, true);
  assert.equal(es.timers.size, 0);
});

test('Escape dismisses the promo when a promo control has focus', () => {
  const page = openPromo();
  page.advance(15000);
  const offer = page.promo.querySelector('a');
  offer.focus();
  const event = new page.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  offer.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(page.promo.hidden, true);
  assert.equal(page.window.document.activeElement, page.phone);
});

test('blocked session storage preserves the local delay and dismissal', () => {
  const page = openPromo({ blockedStorage: true });
  assert.equal(page.promo.hidden, true);
  page.advance(15000);
  assert.equal(page.promo.hidden, false);
  page.close.click();
  assert.equal(page.promo.hidden, true);
});

test('invalid or future saved timestamps start a fresh delay', () => {
  for (const saved of ['not-a-number', '-1', '200000']) {
    const page = openPromo({ stored: { 'paez-promo-first-seen': saved } });
    page.advance(14999);
    assert.equal(page.promo.hidden, true);
    page.advance(1);
    assert.equal(page.promo.hidden, false);
  }
});

test('promo follows the actual sticky header as scrolling and layout change its bottom edge', () => {
  const page = openPromo();
  const offset = () => page.window.document.documentElement.style.getPropertyValue('--pz-header-bottom');
  assert.equal(offset(), '120px');
  page.headerBounds.bottom = 94.4;
  page.window.dispatchEvent(new page.window.Event('scroll'));
  page.flush();
  assert.equal(offset(), '95px');
  page.headerBounds.bottom = 142;
  page.resizeHeader();
  page.flush();
  assert.equal(offset(), '142px');
});

test('the delay can finish during form entry without interrupting it', () => {
  const page = openPromo();
  page.field.focus();
  page.advance(15000);
  assert.equal(page.promo.hidden, true);
  assert.equal(page.window.document.activeElement, page.field);
  assert.equal(page.session()['paez-promo-revealed'], undefined);
  page.phone.focus();
  page.flush();
  assert.equal(page.promo.hidden, false);
  assert.equal(page.promo.classList.contains('is-entering'), true);
});

test('menu state hides the promo and restoring it does not repeat the attention animation', async () => {
  const page = openPromo();
  page.advance(15000);
  page.burger.setAttribute('aria-expanded', 'true');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.promo.hidden, true);
  assert.equal(page.promo.classList.contains('is-entering'), false);
  page.burger.setAttribute('aria-expanded', 'false');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.promo.hidden, false);
  assert.equal(page.promo.classList.contains('is-entering'), false);
});

test('scroll, resize and menu events keep the promo usable without observer APIs', () => {
  const page = openPromo({ observers: false });
  page.advance(15000);
  page.headerBounds.bottom = 160;
  page.window.dispatchEvent(new page.window.Event('resize'));
  page.flush();
  assert.equal(page.window.document.documentElement.style.getPropertyValue('--pz-header-bottom'), '160px');
  page.burger.setAttribute('aria-expanded', 'true');
  page.burger.click();
  page.flush();
  assert.equal(page.promo.hidden, true);
  page.burger.setAttribute('aria-expanded', 'false');
  page.burger.click();
  page.flush();
  assert.equal(page.promo.hidden, false);
});

test('fifteen seconds makes the offer eligible but never covers the hero copy', () => {
  const page = openPromo({ heroBottom: 600 });
  page.advance(15000);
  assert.equal(page.promo.hidden, true);
  assert.equal(page.session()['paez-promo-revealed'], undefined);
  page.bounds.hero.bottom = 121;
  page.scroll();
  assert.equal(page.promo.hidden, true);
  page.bounds.hero.bottom = 120;
  page.scroll();
  assert.equal(page.promo.hidden, false);
  assert.equal(page.promo.classList.contains('is-entering'), true);
  page.bounds.hero.bottom = 500;
  page.scroll();
  assert.equal(page.promo.hidden, true);
});

test('the whole visible quote panel remains clear before, during and after form entry', () => {
  const page = openPromo({ quoteTop: 799, quoteBottom: 1500 });
  page.advance(15000);
  assert.equal(page.promo.hidden, true);
  page.bounds.quote.top = 800;
  page.scroll();
  assert.equal(page.promo.hidden, false);
  page.bounds.quote.top = -800;
  page.bounds.quote.bottom = 121;
  page.scroll();
  assert.equal(page.promo.hidden, true);
  page.bounds.quote.bottom = 120;
  page.scroll();
  assert.equal(page.promo.hidden, false);
});

test('offer stays visible as headings and service cards pass through its position in either language', () => {
  for (const locale of ['en', 'es']) {
    const page = openPromo({ locale });
    page.bounds.heading.top = 150;
    page.bounds.heading.bottom = 200;
    page.advance(15000);
    assert.equal(page.promo.hidden, false);
    assert.equal(page.promo.classList.contains('is-entering'), true);
    page.promo.dispatchEvent(new page.window.Event('animationend'));
    for (const top of [400, 200, 160, 128, 80, -100, 80, 160, 400]) {
      page.bounds.heading = { top, bottom: top + 50, left: 16, right: 374 };
      page.bounds.control = { top: top + 70, bottom: top + 450, left: 16, right: 374 };
      page.scroll();
      assert.equal(page.promo.hidden, false, `${locale}: banner disappeared at heading top ${top}`);
      assert.equal(page.promo.classList.contains('is-entering'), false);
    }
  }
});

test('scrolling a heading behind a focused offer keeps its controls visible and focused', () => {
  const page = openPromo();
  page.advance(15000);
  page.offer.focus();
  page.bounds.heading = { top: 160, bottom: 210, left: 50, right: 350 };
  page.scroll();
  assert.equal(page.promo.hidden, false);
  assert.equal(page.window.document.activeElement, page.offer);
  page.close.click();
  page.scroll();
  assert.equal(page.promo.hidden, true);
  assert.equal(page.window.document.activeElement, page.phone);
});

test('claiming records the offer, reveals confirmation, and leaves anchor focus to navigation', () => {
  const page = openPromo();
  let claimedEvents = 0;
  let headerFocused = false;
  page.phone.focus = () => { headerFocused = true; };
  page.window.document.addEventListener('paez:offer-claimed', () => { claimedEvents++; });
  page.advance(15000);
  page.offer.focus();
  const click = new page.window.MouseEvent('click', { button: 0, bubbles: true, cancelable: true });
  page.offer.dispatchEvent(click);
  assert.equal(click.defaultPrevented, false);
  assert.equal(headerFocused, false);
  assert.equal(page.promo.hidden, true);
  assert.equal(page.offerNotice.hidden, false);
  assert.equal(claimedEvents, 1);
  assert.equal(page.session()['paez-promo-claimed'], '1');
  assert.equal(page.session()['paez-promo-dismissed'], '1');
  page.scroll();
  assert.equal(page.promo.hidden, true);
});

test('a claimed offer and its notice survive reloads and language changes', () => {
  const en = openPromo();
  en.advance(15000);
  en.offer.click();
  for (const locale of ['en', 'es']) {
    const page = openPromo({ now: 120000, stored: en.session(), locale });
    assert.equal(page.offerNotice.hidden, false);
    assert.equal(page.promo.hidden, true);
    assert.equal(page.timers.size, 0);
  }
});

test('a restored claim keeps the offer dismissed even without a separate dismissal key', () => {
  const page = openPromo({ stored: { 'paez-promo-claimed': '1' } });
  assert.equal(page.offerNotice.hidden, false);
  page.advance(60000);
  assert.equal(page.promo.hidden, true);
  assert.equal(page.timers.size, 0);
});

test('modified or non-primary clicks do not claim the offer in the current page', () => {
  for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const page = openPromo();
    page.advance(15000);
    page.offer.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, ...modifiers }));
    assert.equal(page.offerNotice.hidden, true);
    assert.equal(page.promo.hidden, false);
    assert.equal(page.session()['paez-promo-claimed'], undefined);
  }
});

test('claiming still works when another navigation handler prevents the default anchor action', () => {
  const page = openPromo();
  page.advance(15000);
  const click = new page.window.MouseEvent('click', { button: 0, bubbles: true, cancelable: true });
  click.preventDefault();
  page.offer.dispatchEvent(click);
  assert.equal(page.offerNotice.hidden, false);
  assert.equal(page.session()['paez-promo-claimed'], '1');
});

test('claiming with blocked storage still dismisses locally and announces the offer', () => {
  const page = openPromo({ blockedStorage: true });
  let claimedEvents = 0;
  page.window.document.addEventListener('paez:offer-claimed', () => { claimedEvents++; });
  page.advance(15000);
  page.offer.click();
  assert.equal(page.promo.hidden, true);
  assert.equal(page.offerNotice.hidden, false);
  assert.equal(claimedEvents, 1);
  page.scroll();
  assert.equal(page.promo.hidden, true);
});

test('request state changes hide the offer without scrolling and a failed request permits it again', async () => {
  const page = openPromo();
  page.advance(15000);
  assert.equal(page.promo.hidden, false);
  page.form.setAttribute('aria-busy', 'true');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.promo.hidden, true);
  page.form.setAttribute('aria-busy', 'false');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.promo.hidden, false);
  assert.equal(page.promo.classList.contains('is-entering'), false);
  page.form.hidden = true;
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.promo.hidden, true);
  page.scroll();
  assert.equal(page.promo.hidden, true);
});

test('a pending request defers eligibility without consuming the first attention animation', async () => {
  const page = openPromo();
  page.form.setAttribute('aria-busy', 'true');
  page.advance(15000);
  assert.equal(page.promo.hidden, true);
  assert.equal(page.session()['paez-promo-revealed'], undefined);
  page.form.setAttribute('aria-busy', 'false');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.promo.hidden, false);
  assert.equal(page.promo.classList.contains('is-entering'), true);
});

test('pending and completed requests reject stale programmatic claim clicks immediately', () => {
  for (const state of ['pending', 'completed']) {
    const page = openPromo();
    let claimedEvents = 0;
    page.window.document.addEventListener('paez:offer-claimed', () => { claimedEvents++; });
    page.advance(15000);
    if (state === 'pending') page.form.setAttribute('aria-busy', 'true');
    else page.form.hidden = true;
    // Click before the mutation observer can hide the stale visible control.
    const click = new page.window.MouseEvent('click', { button: 0, bubbles: true, cancelable: true });
    page.offer.dispatchEvent(click);
    assert.equal(click.defaultPrevented, true);
    assert.equal(page.offerNotice.hidden, true);
    assert.equal(claimedEvents, 0);
    assert.equal(page.session()['paez-promo-claimed'], undefined);
    assert.equal(page.session()['paez-promo-dismissed'], undefined);
  }
});
