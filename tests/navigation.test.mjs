import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { Window } from 'happy-dom';

const script = await readFile(new URL('../public/js/navigation.js', import.meta.url), 'utf8');
const themeScript = await readFile(new URL('../public/js/main.js', import.meta.url), 'utf8');
const windows = [];
afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()));
});

function openPage({ url = 'https://paez.test/', observers = true } = {}) {
  const window = new Window({ url, settings: { enableJavaScriptEvaluation: true, suppressInsecureJavaScriptEnvironmentWarning: true } });
  windows.push(window);
  window.fetch = () => { throw new Error('Navigation tests must never submit requests'); };
  // happy-dom follows synthetic anchor clicks; prevent all navigation in this
  // fixture while still testing whether our listener cancels the default event.
  window.open = () => null;
  window.document.write(`
    <header class="pz-header"><a href="#main" id="skip">Skip to content</a>
      <a href="#services" id="menu">Services</a><a href="#quote" id="estimate">Estimate</a></header>
    <main id="main" tabindex="-1"><h1>Paez</h1>
      <section id="services"><h2>Tree services</h2><a id="service-card" data-service-select="Tree Removal" href="#quote">Removal</a></section>
      <section id="quote" tabindex="-1" aria-labelledby="quote-title"><h2 id="quote-title">Estimate</h2><input name="name"></section>
      <div id="fallback">Extra details</div><section id="área"><h2>Área</h2></section>
    </main>
  `);
  let headerHeight = 104;
  let headerTop = 0;
  window.document.querySelector('.pz-header').getBoundingClientRect = () => ({ top: headerTop, height: headerHeight });
  const timers = [];
  const frames = [];
  const resizeCallbacks = [];
  window.setTimeout = (callback) => { timers.push(callback); return timers.length; };
  window.clearTimeout = (id) => { if (id) timers[id - 1] = undefined; };
  window.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  window.ResizeObserver = observers ? class { constructor(callback) { resizeCallbacks.push(callback); } observe() {} } : undefined;
  window.eval(script);
  const element = (selector) => window.document.querySelector(selector);
  function activate(link, options = {}) {
    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options });
    link.dispatchEvent(event);
    return event;
  }
  return {
    window, element, activate, timers, frames,
    flushFocus: () => timers.splice(0).forEach((callback) => callback?.()),
    flushFrames: () => frames.splice(0).forEach((callback) => callback()),
    setHeaderHeight: (height) => { headerHeight = height; },
    setHeaderTop: (top) => { headerTop = top; },
    observeResize: () => resizeCallbacks.forEach((callback) => callback()),
    offset: () => window.document.documentElement.style.getPropertyValue('--pz-scroll-offset'),
  };
}

test('skip link transfers focus without canceling the native anchor or adding a tab stop', () => {
  const page = openPage();
  const target = page.element('#main');
  let focusOptions;
  const focus = target.focus.bind(target);
  target.focus = (options) => { focusOptions = options; focus(options); };
  const event = page.activate(page.element('#skip'));
  assert.equal(event.defaultPrevented, false);
  page.flushFocus();
  assert.equal(page.window.document.activeElement, target);
  assert.equal(focusOptions.preventScroll, true);
  assert.equal(target.tabIndex, -1);
});

test('section anchors focus their headings and estimate anchors focus the named form region', () => {
  const page = openPage();
  page.activate(page.element('#menu'));
  page.flushFocus();
  assert.equal(page.window.document.activeElement, page.element('#services h2'));
  assert.equal(page.element('#services h2').tabIndex, -1);
  page.activate(page.element('#estimate'));
  page.flushFocus();
  assert.equal(page.window.document.activeElement, page.element('#quote'));
  assert.notEqual(page.window.document.activeElement, page.element('input'));
});

test('header size changes and a closing mobile menu update the fragment scroll clearance', () => {
  const page = openPage();
  assert.equal(page.offset(), '120px');
  page.setHeaderHeight(109.5);
  page.observeResize();
  page.flushFrames();
  assert.equal(page.offset(), '126px');
  page.setHeaderHeight(400);
  page.observeResize();
  page.flushFrames();
  page.element('#menu').addEventListener('click', () => page.setHeaderHeight(104));
  page.activate(page.element('#menu'));
  assert.equal(page.offset(), '120px');
});

test('the persistent header estimate closes the mobile menu before native quote navigation', () => {
  for (const url of ['https://paez.test/', 'https://paez.test/es/']) {
    const page = openPage({ url });
    const header = page.element('.pz-header');
    header.insertAdjacentHTML('beforeend', '<button id="pzBurger" aria-expanded="false" aria-controls="pzMobileMenu">Menu</button><nav id="pzMobileMenu" style="display:none"><a href="#services">Services</a></nav>');
    const menu = page.element('#pzMobileMenu');
    const burger = page.element('#pzBurger');
    const estimate = page.element('#estimate');
    estimate.classList.add('pz-header-estimate');
    header.getBoundingClientRect = () => ({ top: 16, height: menu.style.display === 'flex' ? 434 : 122 });
    page.window.eval(themeScript);

    burger.click();
    page.observeResize();
    page.flushFrames();
    assert.equal(burger.getAttribute('aria-expanded'), 'true');
    assert.equal(menu.style.display, 'flex');
    assert.equal(page.offset(), '466px');

    estimate.focus();
    const event = page.activate(estimate);
    assert.equal(event.defaultPrevented, false, 'quote navigation retains its native hash behavior');
    assert.equal(burger.getAttribute('aria-expanded'), 'false');
    assert.equal(menu.style.display, 'none');
    assert.equal(page.offset(), '154px', 'clearance uses the closed header before native scrolling');
    page.flushFocus();
    assert.equal(page.window.document.activeElement, page.element('#quote'));
  }
});

test('telephone, external, alternate-page and new-tab links do not receive focus interception', () => {
  const page = openPage();
  const link = page.element('#estimate');
  for (const href of ['tel:7149269413', 'https://other.test/#quote', '/es/#quote', '/?source=other#quote', '#missing', '#%ZZ']) {
    link.setAttribute('href', href);
    page.activate(link);
    assert.equal(page.timers.length, 0, href);
  }
  link.setAttribute('href', '#quote');
  link.setAttribute('target', '_blank');
  page.activate(link);
  assert.equal(page.timers.length, 0);
  link.removeAttribute('target');
  link.setAttribute('download', 'page');
  page.activate(link);
  assert.equal(page.timers.length, 0);
});

test('floating header transitions update native anchor clearance including the top gap', () => {
  const page = openPage();
  page.setHeaderTop(23.5);
  page.window.document.dispatchEvent(new page.window.CustomEvent('paez:header-change'));
  assert.equal(page.offset(), '144px');
  page.setHeaderHeight(400);
  page.element('#menu').addEventListener('click', () => page.setHeaderHeight(96));
  const event = page.activate(page.element('#menu'));
  assert.equal(event.defaultPrevented, false);
  assert.equal(page.offset(), '136px', 'closed menu size is used before native navigation');
  page.flushFocus();
  assert.equal(page.window.document.activeElement, page.element('#services h2'));
  page.setHeaderTop(0);
  page.window.document.dispatchEvent(new page.window.CustomEvent('paez:header-change'));
  assert.equal(page.offset(), '112px');
});

test('modified clicks and service-card selection retain their own behavior', () => {
  const page = openPage();
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    page.activate(page.element('#estimate'), options);
  }
  page.activate(page.element('#service-card'));
  assert.equal(page.timers.length, 0);
});

test('other handlers can prevent a focus handoff before or after this listener', () => {
  const page = openPage();
  const link = page.element('#estimate');
  link.addEventListener('click', (event) => event.preventDefault(), { once: true });
  page.activate(link);
  assert.equal(page.timers.length, 0);
  page.window.document.addEventListener('click', (event) => event.preventDefault(), { once: true });
  page.activate(link);
  page.flushFocus();
  assert.notEqual(page.window.document.activeElement, page.element('#quote'));
});

test('encoded anchors and destinations without headings remain usable on Spanish pages', () => {
  const page = openPage({ url: 'https://paez.test/es/' });
  const link = page.element('#estimate');
  link.href = '#%C3%A1rea';
  page.activate(link);
  page.flushFocus();
  assert.equal(page.window.document.activeElement, page.element('#área h2'));
  link.href = '#fallback';
  page.activate(link);
  page.flushFocus();
  assert.equal(page.window.document.activeElement, page.element('#fallback'));
  assert.equal(page.element('#fallback').tabIndex, -1);
});

test('resize fallback updates clearance without observer support', () => {
  const page = openPage({ observers: false });
  page.setHeaderHeight(150);
  page.window.dispatchEvent(new page.window.Event('resize'));
  page.flushFrames();
  assert.equal(page.offset(), '166px');
});
