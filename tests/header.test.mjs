import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { Window } from 'happy-dom';

const script = await readFile(new URL('../public/js/header.js', import.meta.url), 'utf8');
const windows = [];
afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()));
});

function openPage({ scrollY = 0, reducedMotion = false, hasHeader = true, mediaQueries = true } = {}) {
  const window = new Window({
    url: 'https://paez.test/',
    settings: { enableJavaScriptEvaluation: true, suppressInsecureJavaScriptEnvironmentWarning: true },
  });
  windows.push(window);
  window.fetch = () => { throw new Error('Header tests must never make requests'); };
  if (hasHeader) window.document.write('<header class="pz-header"></header><main>Tree care</main>');
  const header = window.document.querySelector('.pz-header');
  let position = scrollY;
  Object.defineProperty(window, 'scrollY', { get: () => position, configurable: true });
  const motion = new window.EventTarget();
  motion.matches = reducedMotion;
  window.matchMedia = mediaQueries ? () => motion : undefined;
  const frames = [];
  let frameId = 0;
  window.requestAnimationFrame = (callback) => { frames.push(callback); return ++frameId; };
  const changes = [];
  window.document.addEventListener('paez:header-change', (event) => {
    changes.push({ ...event.detail, style: header?.style.getPropertyValue('--pz-header-progress'),
      renderedState: header?.dataset.headerState });
  });
  window.eval(script);
  return {
    window, header, frames, changes,
    flushFrames: () => frames.splice(0).forEach((callback) => callback()),
    setPosition: (value) => { position = value; },
    scroll: (value) => { position = value; window.dispatchEvent(new window.Event('scroll')); },
    setReducedMotion: (value) => { motion.matches = value; motion.dispatchEvent(new window.Event('change')); },
    progress: () => Number(header.style.getPropertyValue('--pz-header-progress')),
  };
}

test('the initial header follows restored scroll before its first animation frame', () => {
  const top = openPage();
  assert.equal(top.header.dataset.headerState, 'floating');
  assert.equal(top.progress(), 0);
  assert.equal(top.frames.length, 0);
  const restored = openPage({ scrollY: 600 });
  assert.equal(restored.header.dataset.headerState, 'docked');
  assert.equal(restored.progress(), 1);
  assert.equal(restored.frames.length, 0);
});

test('scroll smoothly docks and reverses with no separate animation or layout changes', () => {
  const page = openPage();
  const readAt = (position) => { page.scroll(position); page.flushFrames(); return page.progress(); };
  assert.equal(readAt(16), 0);
  assert.equal(readAt(42), 0.1563);
  assert.equal(page.header.dataset.headerState, 'transitioning');
  assert.equal(readAt(68), 0.5);
  assert.equal(readAt(94), 0.8438);
  assert.equal(readAt(120), 1);
  assert.equal(page.header.dataset.headerState, 'docked');
  assert.equal(readAt(68), 0.5);
  assert.equal(readAt(-20), 0);
  assert.equal(page.header.dataset.headerState, 'floating');
  assert.equal(page.window.document.querySelector('main').getAttribute('style'), null);
});

test('multiple scroll events share one frame and use the latest position', () => {
  const page = openPage();
  page.scroll(24);
  page.scroll(68);
  page.scroll(120);
  assert.equal(page.frames.length, 1);
  assert.equal(page.progress(), 0);
  page.flushFrames();
  assert.equal(page.progress(), 1);
  assert.equal(page.changes.length, 2);
  page.scroll(200);
  page.flushFrames();
  assert.equal(page.changes.length, 2, 'unchanged geometry does not notify consumers repeatedly');
});

test('geometry notifications see the already-updated style and state', () => {
  const page = openPage();
  page.scroll(68);
  page.flushFrames();
  assert.deepEqual(page.changes.at(-1), {
    progress: 0.5, state: 'transitioning', style: '0.5', renderedState: 'transitioning',
  });
});

test('pageshow and load handle browsers that restore scroll after script initialization', () => {
  const page = openPage();
  page.setPosition(800);
  page.window.dispatchEvent(new page.window.Event('pageshow'));
  page.flushFrames();
  assert.equal(page.progress(), 1);
  page.setPosition(0);
  page.window.dispatchEvent(new page.window.Event('load'));
  page.flushFrames();
  assert.equal(page.progress(), 0);
});

test('reduced motion stays docked and responds to preference changes', () => {
  const page = openPage({ reducedMotion: true });
  assert.equal(page.progress(), 1);
  page.scroll(68);
  page.flushFrames();
  assert.equal(page.progress(), 1);
  page.setReducedMotion(false);
  page.flushFrames();
  assert.equal(page.progress(), 0.5);
  page.setReducedMotion(true);
  page.flushFrames();
  assert.equal(page.progress(), 1);
});

test('missing headers and unavailable media queries degrade safely', () => {
  const empty = openPage({ hasHeader: false });
  empty.scroll(100);
  assert.equal(empty.frames.length, 0);
  const fallback = openPage({ mediaQueries: false, scrollY: 120 });
  assert.equal(fallback.progress(), 1);
});
