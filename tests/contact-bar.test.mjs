import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { Window } from 'happy-dom';

const script = await readFile(new URL('../public/js/contact-bar.js', import.meta.url), 'utf8');
const windows = [];
afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()));
});

function openPage({ heroBottom = 550, quoteTop = 900, quoteBottom = 1500, observers = true, hash = '' } = {}) {
  const window = new Window({
    url: `https://paez.test/${hash}`,
    settings: { enableJavaScriptEvaluation: true, suppressInsecureJavaScriptEnvironmentWarning: true },
  });
  windows.push(window);
  window.fetch = () => { throw new Error('Contact-bar tests must never submit requests'); };
  window.document.write(`
    <header class="pz-header"><a href="tel:7149269413">Call</a>
      <button id="pzBurger" aria-expanded="false">Menu</button><nav id="pzMobileMenu"></nav>
    </header>
    <div class="pz-hero-cta"><a href="#quote">Estimate</a></div>
    <div id="quote"><form id="pzQuoteForm"><input name="name" /></form></div>
    <nav class="pz-sticky-bar" hidden><a href="#quote">Free Estimate</a></nav>
  `);
  const bounds = { header: { bottom: 110 }, hero: { bottom: heroBottom }, quote: { top: quoteTop, bottom: quoteBottom } };
  window.innerHeight = 800;
  for (const [selector, key] of [['.pz-header', 'header'], ['.pz-hero-cta', 'hero'], ['#quote', 'quote']]) {
    window.document.querySelector(selector).getBoundingClientRect = () => bounds[key];
  }
  const frames = [];
  const resizeCallbacks = [];
  window.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  window.ResizeObserver = observers ? class {
    constructor(callback) { resizeCallbacks.push(callback); }
    observe() {}
  } : undefined;
  window.IntersectionObserver = undefined;
  if (!observers) window.MutationObserver = undefined;
  window.eval(script);
  const flush = () => frames.splice(0).forEach((callback) => callback());
  return {
    window, bounds, frames, flush,
    bar: window.document.querySelector('.pz-sticky-bar'),
    field: window.document.querySelector('input'),
    phone: window.document.querySelector('.pz-header a'),
    burger: window.document.querySelector('#pzBurger'),
    scroll() { window.dispatchEvent(new window.Event('scroll')); flush(); },
    resize() { window.dispatchEvent(new window.Event('resize')); flush(); },
    resizeContent() { resizeCallbacks.forEach((callback) => callback()); flush(); },
  };
}

test('contact bar stays hidden until the hero actions pass above the header', () => {
  const page = openPage();
  assert.equal(page.bar.hidden, true);
  page.bounds.hero.bottom = 111;
  page.scroll();
  assert.equal(page.bar.hidden, true);
  page.bounds.hero.bottom = 110;
  page.scroll();
  assert.equal(page.bar.hidden, false);
  page.bounds.hero.bottom = 300;
  page.scroll();
  assert.equal(page.bar.hidden, true);
});

test('contact bar leaves the entire visible estimate form unobstructed and returns after it', () => {
  const page = openPage({ heroBottom: 80 });
  assert.equal(page.bar.hidden, false);
  page.bounds.quote.top = 799;
  page.scroll();
  assert.equal(page.bar.hidden, true);
  page.bounds.quote.top = -500;
  page.bounds.quote.bottom = 111;
  page.scroll();
  assert.equal(page.bar.hidden, true);
  page.bounds.quote.bottom = 110;
  page.scroll();
  assert.equal(page.bar.hidden, false);
});

test('a direct link beyond the hero works immediately without IntersectionObserver', () => {
  const page = openPage({ heroBottom: -900, quoteTop: -800, quoteBottom: -100, hash: '#services' });
  assert.equal(page.bar.hidden, false);
});

test('focus and form-editing state suppress the bar even when the form is outside the viewport', async () => {
  const page = openPage({ heroBottom: -900, quoteTop: -800, quoteBottom: -100 });
  page.field.focus();
  page.flush();
  assert.equal(page.bar.hidden, true);
  assert.equal(page.window.document.activeElement, page.field);
  page.phone.focus();
  page.flush();
  assert.equal(page.bar.hidden, false);
  page.window.document.body.classList.add('pz-form-editing');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.bar.hidden, true);
  page.window.document.body.classList.remove('pz-form-editing');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.bar.hidden, false);
});

test('opening and closing navigation updates bar visibility without a scroll', async () => {
  const page = openPage({ heroBottom: 80 });
  page.burger.setAttribute('aria-expanded', 'true');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.bar.hidden, true);
  page.burger.setAttribute('aria-expanded', 'false');
  await new Promise((resolve) => setImmediate(resolve));
  page.flush();
  assert.equal(page.bar.hidden, false);
});

test('font/content layout changes re-evaluate the hero threshold', () => {
  const page = openPage({ heroBottom: 130 });
  assert.equal(page.bar.hidden, true);
  page.bounds.header.bottom = 140;
  page.resizeContent();
  assert.equal(page.bar.hidden, false);
  page.bounds.hero.bottom = 170;
  page.resizeContent();
  assert.equal(page.bar.hidden, true);
});

test('scroll and resize remain usable when observer APIs are unavailable', () => {
  const page = openPage({ observers: false });
  page.bounds.hero.bottom = 90;
  page.scroll();
  assert.equal(page.bar.hidden, false);
  page.bounds.quote.top = 700;
  page.resize();
  assert.equal(page.bar.hidden, true);
  page.bounds.quote.top = 900;
  page.burger.setAttribute('aria-expanded', 'true');
  page.burger.click();
  page.flush();
  assert.equal(page.bar.hidden, true);
  page.burger.setAttribute('aria-expanded', 'false');
  page.burger.click();
  page.flush();
  assert.equal(page.bar.hidden, false);
});

test('multiple scroll events batch into one animation frame', () => {
  const page = openPage();
  page.window.dispatchEvent(new page.window.Event('scroll'));
  page.window.dispatchEvent(new page.window.Event('scroll'));
  page.window.dispatchEvent(new page.window.Event('resize'));
  assert.equal(page.frames.length, 1);
  page.flush();
  assert.equal(page.frames.length, 0);
});
