import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';

// Exercise the rendered pages and the browser script together. Every request is
// intercepted locally; these tests must never submit a real quote request.
const pages = {
  en: await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  es: await readFile(new URL('../dist/es/index.html', import.meta.url), 'utf8'),
};
const script = await readFile(new URL('../dist/js/site.js', import.meta.url), 'utf8');
const normalizer = await readFile(new URL('../automation/normalize-lead.js', import.meta.url), 'utf8');
const handoffKey = 'paez-language-handoff';
const windows = [];

afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()));
});

function openPage(locale = 'en', { handoff, fetch, hash = '', search = '', beforeScript } = {}) {
  const window = new Window({
    url: `https://paez.test/${locale === 'es' ? 'es/' : ''}${search}${hash}`,
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
      disableIframePageLoading: true,
      enableJavaScriptEvaluation: true,
      // Only the checked-in site script is evaluated; external scripts are disabled.
      suppressInsecureJavaScriptEnvironmentWarning: true,
    },
  });
  windows.push(window);
  const requests = [];
  window.fetch = async (...args) => {
    requests.push(args);
    if (fetch) return fetch(...args);
    throw new Error('Unexpected quote request in test');
  };
  // Avoid executing unrelated inline scripts while retaining the real DOM.
  window.document.write(pages[locale].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
  // happy-dom 21 omits the RadioNodeList setter and returns null for an empty
  // selection. Match the browser standard so language restoration can be tested:
  // https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#radionodelist
  const radioPrototype = Object.getPrototypeOf(window.document.querySelector('#pzQuoteForm').elements.namedItem('service'));
  if (!Object.getOwnPropertyDescriptor(radioPrototype, 'value')?.set) {
    Object.defineProperty(radioPrototype, 'value', {
      configurable: true,
      get() { return Array.from(this).find((node) => node.type === 'radio' && node.checked)?.value ?? ''; },
      set(value) {
        const selected = Array.from(this).find((node) => node.type === 'radio' && node.value === String(value));
        if (selected) selected.checked = true;
      },
    });
  }
  if (handoff) window.sessionStorage.setItem(handoffKey, handoff);
  if (beforeScript) beforeScript(window);
  window.eval(script);
  const document = window.document;
  const form = document.querySelector('#pzQuoteForm');
  assert.ok(form, `${locale} page contains the quote form`);
  return {
    window,
    document,
    form,
    requests,
    field: (name) => form.elements.namedItem(name),
    status: document.querySelector('#pzFormStatus'),
    success: document.querySelector('#pzFormSuccess'),
    successMessage: document.querySelector('#pzSuccessMessage'),
    button: form.querySelector('[type="submit"]'),
    next: form.querySelector('[data-form-next]'),
    back: form.querySelector('[data-form-back]'),
    step: (number) => form.querySelector(`[data-form-step="${number}"]`),
  };
}

function setField(page, name, value) {
  const radios = page.form.querySelectorAll(`input[type="radio"][name="${name}"]`);
  if (radios.length) {
    for (const radio of radios) radio.checked = radio.value === value;
  } else {
    page.field(name).value = value;
  }
}

function fill(page, overrides = {}) {
  const values = {
    name: 'Ana Test',
    phone: '+1 (714) 555-0123',
    service: 'Tree Removal',
    postal_code: '92806',
    street_address: '123 Example Street',
    address_line2: '',
    city: 'Anaheim',
    state: 'CA',
    timeline: 'This week',
    contact_preference: 'Call',
    email: '',
    details: 'A test request that never leaves this process.',
    ...overrides,
  };
  for (const [name, value] of Object.entries(values)) setField(page, name, value);
  if (!page.step(1).hidden) page.next.click();
  return values;
}

function acceptedResponse(request) {
  const leadId = new URLSearchParams(request.body.toString()).get('lead_id');
  return { ok: true, status: 200, json: async () => ({ ok: true, lead_id: leadId }) };
}

const acceptRequest = async (_url, request) => acceptedResponse(request);

function submit(page) {
  page.form.dispatchEvent(new page.window.Event('submit', { bubbles: true, cancelable: true }));
}

async function settle() {
  await new Promise(setImmediate);
  await new Promise(setImmediate);
}

function clickLanguage(page, locale) {
  const link = page.document.querySelector(`[data-language-link][data-lang="${locale}"]`);
  assert.ok(link, `${locale} language control exists`);
  let preventedByApp;
  link.addEventListener('click', (event) => {
    preventedByApp = event.defaultPrevented;
    event.preventDefault(); // Test the handoff without navigating the DOM window.
  }, { once: true });
  link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  return { link, preventedByApp };
}

function clickService(page, link, options = {}) {
  let preventedByApp;
  link.addEventListener('click', (event) => {
    preventedByApp = event.defaultPrevented;
    event.preventDefault(); // Keep the test page local instead of following #quote.
  }, { once: true });
  link.dispatchEvent(new page.window.MouseEvent('click', {
    bubbles: true, cancelable: true, button: 0, ...options,
  }));
  return preventedByApp;
}

function claimOffer(page) {
  page.document.dispatchEvent(new page.window.CustomEvent('paez:offer-claimed'));
}

test('service links preselect a tree service or property context in either language and preserve the draft', () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale);
    const draft = fill(page, { email: 'ana@example.test', contact_preference: 'Text' });
    const links = Array.from(page.document.querySelectorAll('[data-service-select]'));
    assert.ok(links.length >= 5, `${locale} service cards carry selection intent`);
    for (const link of links) {
      assert.equal(link.getAttribute('href'), '#quote');
      assert.equal(clickService(page, link), false, 'native anchor navigation is retained');
      if (link.dataset.serviceSelect === 'HOA / Commercial') {
        assert.equal(page.field('property_type').value, 'HOA / Commercial');
      } else if (link.dataset.serviceSelect === 'Emergency — call me ASAP') {
        assert.equal(page.field('timeline').value, 'Emergency');
      } else assert.equal(page.field('service').value, link.dataset.serviceSelect);
      assert.equal(page.form.querySelectorAll('input[name="service"]:checked').length, 1);
      assert.equal(page.field('postal_code').value, draft.postal_code);
      for (const name of ['name', 'phone', 'email', 'details', 'contact_preference']) {
        assert.equal(page.field(name).value, draft[name], `${name} survives a service-card choice`);
      }
      assert.equal(page.step(1).hidden, false);
      assert.equal(page.step(2).hidden, true);
      assert.equal(page.document.activeElement.id, 'pz-step-1-title');
      assert.equal(page.document.getElementById('pzEmergencyNote').hidden,
        page.field('timeline').value !== 'Emergency');
      page.next.click();
    }
    assert.equal(page.requests.length, 0);
  }
});

test('modified service-link clicks leave the current draft and step untouched', () => {
  const page = openPage();
  fill(page);
  const link = Array.from(page.document.querySelectorAll('[data-service-select]'))
    .find((item) => item.dataset.serviceSelect !== 'Tree Removal');
  assert.ok(link);
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    assert.equal(clickService(page, link, options), false);
    assert.equal(page.field('service').value, 'Tree Removal');
    assert.equal(page.step(2).hidden, false);
  }
});

test('fresh property shortcuts wait for Next before flagging the missing tree service', () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale);
    const link = page.document.querySelector('[data-service-select="HOA / Commercial"]');
    clickService(page, link);
    assert.equal(page.field('service').value, '');
    assert.equal(page.field('property_type').value, 'HOA / Commercial');
    assert.equal(page.document.getElementById('pz-service-error').hidden, true);
    for (const radio of page.form.querySelectorAll('input[name="service"]')) {
      assert.equal(radio.hasAttribute('aria-invalid'), false);
    }
    setField(page, 'postal_code', '92806');
    page.next.click();
    assert.equal(page.step(1).hidden, false);
    assert.equal(page.document.getElementById('pz-service-error').hidden, false);
    for (const radio of page.form.querySelectorAll('input[name="service"]')) {
      assert.equal(radio.getAttribute('aria-invalid'), 'true');
    }
    assert.equal(page.requests.length, 0);
  }
});

test('context shortcuts preserve existing service errors until an actual service is chosen', () => {
  const page = openPage();
  setField(page, 'postal_code', '92806');
  page.next.click();
  const error = page.document.getElementById('pz-service-error');
  clickService(page, page.document.querySelector('[data-service-select="HOA / Commercial"]'));
  assert.equal(error.hidden, false);
  assert.equal(page.form.querySelector('input[name="service"]').getAttribute('aria-invalid'), 'true');
  clickService(page, page.document.querySelector('[data-service-select="Tree Removal"]'));
  assert.equal(error.hidden, true);
  assert.equal(page.field('service').value, 'Tree Removal');
  assert.equal(page.field('property_type').value, 'HOA / Commercial');
  page.next.click();
  assert.equal(page.step(2).hidden, false);
  assert.equal(page.requests.length, 0);
});

test('legacy property and emergency drafts restore context and require an actual service', () => {
  for (const locale of ['en', 'es']) {
    for (const legacyService of ['HOA / Commercial', 'Emergency — call me ASAP']) {
      const page = openPage(locale, { handoff: JSON.stringify({
        to: locale, expires: Date.now() + 60000, step: 2,
        values: { service: legacyService, postal_code: '92806', timeline: 'Flexible', name: 'Ana Test' },
      }) });
      assert.equal(page.field('service').value, '');
      assert.equal(page.field('name').value, 'Ana Test');
      assert.equal(page.field('postal_code').value, '92806');
      assert.equal(page.step(1).hidden, false);
      if (legacyService === 'HOA / Commercial') assert.equal(page.field('property_type').value, legacyService);
      else {
        assert.equal(page.field('timeline').value, 'Emergency');
        assert.equal(page.document.getElementById('pzEmergencyNote').hidden, false);
      }
      page.next.click();
      assert.equal(page.step(1).hidden, false);
      assert.equal(page.requests.length, 0);
    }
  }
});

test('urgent service, property and retry identity survive language handoff with backend-compatible payloads', async () => {
  const en = openPage('en', { fetch: async () => { throw new TypeError('Response lost'); } });
  const draft = fill(en, { service: 'Tree Removal', timeline: 'Emergency', property_type: 'HOA / Commercial' });
  submit(en);
  await settle();
  const first = new URLSearchParams(en.requests[0][1].body.toString());
  assert.equal(first.get('service'), 'Emergency — call me ASAP');
  assert.equal(first.get('timeline'), 'As soon as possible');
  assert.equal(first.has('property_type'), false, 'new context uses the existing details field');
  assert.equal(first.get('details'), 'Requested service: Tree Removal\nUrgency: Emergency — urgent hazard\nProperty type: HOA / Commercial\n\n' + draft.details);
  const normalized = runInNewContext(`(function () {\n${normalizer}\n})()`, {
    $input: { first: () => ({ json: { body: Object.fromEntries(first) } }) },
    $execution: { id: 'local-test-execution' },
  })[0].json;
  assert.equal(normalized.valid, true, 'the existing n8n normalizer accepts the actual browser payload');
  assert.equal(normalized.details, first.get('details'));
  assert.equal(en.field('service').value, 'Tree Removal');
  assert.equal(en.field('timeline').value, 'Emergency');
  assert.equal(en.field('details').value, draft.details);
  clickLanguage(en, 'es');
  const es = openPage('es', { handoff: en.window.sessionStorage.getItem(handoffKey), fetch: acceptRequest });
  assert.equal(es.field('service').value, 'Tree Removal');
  assert.equal(es.field('property_type').value, 'HOA / Commercial');
  assert.equal(es.field('timeline').value, 'Emergency');
  assert.equal(es.step(2).hidden, false);
  assert.equal(es.document.getElementById('pzEmergencyNote').hidden, false);
  assert.equal(es.document.querySelector('[data-summary-service]').textContent, 'Talar un árbol');
  assert.equal(es.document.querySelector('[data-summary-timeline]').textContent, 'Emergencia — peligro inmediato');
  submit(es);
  await settle();
  const second = new URLSearchParams(es.requests[0][1].body.toString());
  assert.equal(second.get('lead_id'), first.get('lead_id'));
  assert.equal(second.get('submitted_at'), first.get('submitted_at'));
  assert.equal(second.get('details'), first.get('details'), 'context is not duplicated on retry');
  assert.equal(second.get('service'), first.get('service'));
  assert.equal(second.get('timeline'), first.get('timeline'));
  assert.equal(es.success.hidden, false);
});

test('property context reaches existing lead details without changing a normal service', async () => {
  const page = openPage('es', { fetch: acceptRequest });
  fill(page, { property_type: 'Home', details: '' });
  submit(page);
  await settle();
  const body = new URLSearchParams(page.requests[0][1].body.toString());
  assert.equal(body.get('service'), 'Tree Removal');
  assert.equal(body.get('details'), 'Property type: Home');
  assert.equal(page.field('details').value, '');
});

test('request summary uses translated labels and edit retains contact details', () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale);
    const draft = fill(page, { service: 'Palm Tree Service', timeline: 'Within a month' });
    const summary = page.document.querySelector('#pzRequestSummary');
    assert.ok(summary);
    assert.equal(summary.closest('[data-form-step]').dataset.formStep, '2');
    const summaryText = (name) => summary.querySelector(`[data-summary-${name}]`).textContent;
    assert.equal(summaryText('service'), locale === 'es' ? 'Cuidar palmeras' : 'Palm tree care');
    assert.equal(summaryText('count'), locale === 'es' ? 'No estoy seguro' : 'Not sure');
    assert.equal(summaryText('timeline'), locale === 'es' ? 'Dentro de un mes' : 'Within a month');
    const edit = page.form.querySelector('[data-summary-edit]');
    assert.equal(edit.type, 'button');
    edit.click();
    assert.equal(page.step(1).hidden, false);
    assert.equal(page.document.activeElement.id, 'pz-step-1-title');
    setField(page, 'service', 'Tree Trimming');
    setField(page, 'tree_count', '2–3');
    setField(page, 'timeline', 'This week');
    page.next.click();
    assert.equal(summaryText('service'), locale === 'es' ? 'Podar árboles' : 'Trim & prune');
    assert.equal(summaryText('count'), '2–3');
    assert.equal(summaryText('timeline'), locale === 'es' ? 'Esta semana' : 'This week');
    for (const name of ['name', 'phone', 'email', 'details', 'contact_preference']) {
      assert.equal(page.field(name).value, draft[name]);
    }
    assert.equal(page.requests.length, 0);
  }
});

test('pending and completed requests ignore service selection and summary edits', async () => {
  let resolveRequest;
  const page = openPage('en', { fetch: () => new Promise((resolve) => { resolveRequest = resolve; }) });
  fill(page);
  const edit = page.form.querySelector('[data-summary-edit]');
  const link = Array.from(page.document.querySelectorAll('[data-service-select]'))
    .find((item) => item.dataset.serviceSelect !== 'Tree Removal');
  submit(page);
  assert.equal(edit.disabled, true);
  assert.equal(clickService(page, link), true);
  edit.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true }));
  assert.equal(page.step(2).hidden, false);
  assert.equal(page.field('service').value, 'Tree Removal');
  resolveRequest(acceptedResponse(page.requests[0][1]));
  await settle();
  assert.equal(page.success.hidden, false);
  assert.equal(clickService(page, link), true);
  edit.click();
  page.back.click();
  page.next.click();
  assert.equal(page.form.hidden, true);
  assert.equal(page.step(2).hidden, false);
  assert.equal(page.field('service').value, 'Tree Removal');
  assert.equal(page.requests.length, 1);
});

test('claimed offers enter localized lead details once per retry without changing the draft', async () => {
  for (const locale of ['en', 'es']) {
    let attempts = 0;
    const page = openPage(locale, {
      fetch: async (url, request) => {
        if (++attempts === 1) throw new TypeError('Response lost');
        return acceptRequest(url, request);
      },
    });
    const draft = fill(page);
    claimOffer(page);
    claimOffer(page);
    assert.equal(page.document.querySelector('#pzOfferApplied').hidden, false);
    submit(page);
    await settle();
    assert.equal(page.form.querySelector('[data-summary-edit]').disabled, false);
    assert.equal(page.field('details').value, draft.details);
    submit(page);
    await settle();
    const bodies = page.requests.map(([, request]) => new URLSearchParams(request.body.toString()));
    const offer = locale === 'es'
      ? 'Oferta del sitio web WEB10: descuento del 10% solicitado. Paez confirmará los detalles.'
      : 'Website offer WEB10: 10% discount requested. Paez will confirm the details.';
    assert.equal(bodies.length, 2);
    assert.equal(bodies[0].get('details'), `${offer}\n\n${draft.details}`);
    assert.equal(bodies[1].get('details'), bodies[0].get('details'));
    assert.equal(bodies[1].get('lead_id'), bodies[0].get('lead_id'));
    assert.equal(bodies[1].get('submitted_at'), bodies[0].get('submitted_at'));
    assert.equal(page.field('details').value, draft.details);
  }
});

test('a stored offer and its language handoff restore notice, summary, and a single translated offer', async () => {
  const en = openPage('en', {
    beforeScript: (window) => window.sessionStorage.setItem('paez-promo-claimed', '1'),
  });
  const draft = fill(en, { details: '' });
  assert.equal(en.document.querySelector('#pzOfferApplied').hidden, false);
  clickLanguage(en, 'es');
  const handoff = en.window.sessionStorage.getItem(handoffKey);
  assert.equal(JSON.parse(handoff).offerClaimed, true);
  assert.equal(JSON.parse(handoff).values.details, '');
  const es = openPage('es', { handoff, fetch: acceptRequest });
  assert.equal(es.document.querySelector('#pzOfferApplied').hidden, false);
  assert.equal(es.step(2).hidden, false);
  assert.equal(es.document.querySelector('[data-summary-service]').textContent, 'Talar un árbol');
  assert.equal(es.field('postal_code').value, draft.postal_code);
  assert.equal(es.field('discount_code').value, 'WEB10');
  assert.equal(es.document.querySelector('[data-summary-timeline]').textContent, 'Esta semana');
  submit(es);
  await settle();
  const details = new URLSearchParams(es.requests[0][1].body.toString()).get('details');
  assert.equal(details, 'Oferta del sitio web WEB10: descuento del 10% solicitado. Paez confirmará los detalles.');
  assert.equal(es.field('details').value, '');
});

test('an offer claim still reaches the lead when browser storage is blocked', async () => {
  const page = openPage('en', {
    beforeScript: (window) => {
      Object.defineProperty(window, 'sessionStorage', {
        get() { throw new window.DOMException('Storage is blocked', 'SecurityError'); },
      });
    },
    fetch: acceptRequest,
  });
  fill(page, { details: '' });
  claimOffer(page);
  assert.equal(page.document.querySelector('#pzOfferApplied').hidden, false);
  submit(page);
  await settle();
  assert.equal(new URLSearchParams(page.requests[0][1].body.toString()).get('details'),
    'Website offer WEB10: 10% discount requested. Paez will confirm the details.');
  assert.equal(page.success.hidden, false);
});

test('property address is required in both languages without lengthening the first step', async () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale, { fetch: acceptRequest });
    fill(page, { street_address: '', city: '' });
    assert.equal(page.step(2).hidden, false);
    assert.ok(page.step(2).contains(page.field('street_address')));
    submit(page);
    await settle();
    assert.equal(page.requests.length, 0);
    assert.equal(page.document.activeElement.id, 'pz-street_address');
    assert.match(page.document.querySelector('#pz-street_address-error').textContent, locale === 'es' ? /calle/ : /street/);
    setField(page, 'street_address', '123 Example Street');
    page.field('street_address').dispatchEvent(new page.window.Event('input', { bubbles: true }));
    assert.equal(page.field('street_address').getAttribute('aria-invalid'), 'false');
    submit(page);
    assert.equal(page.document.activeElement.id, 'pz-city');
    assert.equal(page.requests.length, 0);
    setField(page, 'city', 'Anaheim');
    submit(page);
    await settle();
    assert.equal(page.requests.length, 1);
    const body = Object.fromEntries(new URLSearchParams(page.requests[0][1].body.toString()));
    assert.equal(body.form_version, '2');
    assert.equal(body.street_address, '123 Example Street');
    assert.equal(body.city, 'Anaheim');
    assert.equal(body.state, 'CA');
    assert.equal(body.address_line2, '');
    const lead = runInNewContext(`(function () {\n${normalizer}\n})()`, {
      $input: { first: () => ({ json: { body } }) }, $execution: { id: 'local-address-test' },
    })[0].json;
    assert.equal(lead.valid, true);
    assert.equal(lead.property_address, '123 Example Street, Anaheim, CA 92806');
  }
});

test('full address survives language changes, project edits and failed request retry', async () => {
  const en = openPage('en');
  const address = '123 ' + 'Long Example Street '.repeat(5);
  fill(en, { street_address: address, address_line2: 'Unit 7B', city: 'Santa Ana' });
  clickLanguage(en, 'es');
  const es = openPage('es', { handoff: en.window.sessionStorage.getItem(handoffKey), fetch: async () => ({ ok: false, status: 503 }) });
  assert.equal(es.field('street_address').value, address);
  assert.equal(es.field('address_line2').value, 'Unit 7B');
  assert.equal(es.field('city').value, 'Santa Ana');
  es.back.click();
  es.next.click();
  submit(es);
  await settle();
  submit(es);
  await settle();
  assert.equal(es.requests.length, 2);
  const first = new URLSearchParams(es.requests[0][1].body.toString());
  const retry = new URLSearchParams(es.requests[1][1].body.toString());
  for (const key of ['lead_id', 'street_address', 'address_line2', 'city', 'state', 'postal_code']) assert.equal(retry.get(key), first.get(key));
  assert.equal(first.get('street_address'), address.trim());
  assert.equal(es.field('street_address').value, address);
});

test('older drafts ask for missing address before any request is sent', async () => {
  const handoff = JSON.stringify({ to: 'es', expires: Date.now() + 60000, step: 2, values: { service: 'Tree Removal', postal_code: '92806', name: 'Ana Test', phone: '7145550123' } });
  const page = openPage('es', { handoff });
  assert.equal(page.field('state').value, 'CA');
  submit(page);
  await settle();
  assert.equal(page.requests.length, 0);
  assert.equal(page.document.activeElement.id, 'pz-street_address');
});

test('both built languages have persistent field labels and accessible feedback', () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale);
    assert.equal(page.document.documentElement.lang, locale === 'es' ? 'es-MX' : 'en-US');
    for (const name of ['name', 'phone', 'postal_code', 'street_address', 'address_line2', 'city', 'state', 'timeline', 'property_type', 'email', 'details']) {
      const field = page.field(name);
      const label = page.document.querySelector(`label[for="${field.id}"]`);
      assert.ok(label?.textContent.trim(), `${locale} ${name} has a visible label`);
      if (['name', 'phone', 'postal_code', 'street_address', 'city', 'state'].includes(name)) {
        assert.equal(field.required, true);
        assert.equal(field.getAttribute('aria-describedby'), `pz-${name}-error`);
        assert.ok(page.document.getElementById(`pz-${name}-error`));
      }
    }
    for (const radio of page.form.querySelectorAll('input[name="service"]')) {
      assert.ok(page.document.querySelector(`label[for="${radio.id}"]`)?.textContent.trim());
      assert.equal(radio.required, true);
      assert.equal(radio.getAttribute('aria-describedby'), 'pz-service-error');
    }
    assert.equal(page.field('email').required, false);
    assert.equal(page.status.getAttribute('aria-live'), 'polite');
    assert.equal(page.success.hidden, true);
    assert.equal(page.field('language').value, locale);
  }
});

test('English and Spanish service labels keep identical canonical submission values', () => {
  const en = openPage('en');
  const es = openPage('es');
  const options = (page) => Array.from(page.form.querySelectorAll('input[name="service"]'));
  assert.deepEqual(options(en).map((option) => option.value), options(es).map((option) => option.value));
  assert.equal(options(en).length, 4);
  assert.notEqual(options(en)[1].closest('label').textContent, options(es)[1].closest('label').textContent);
});

test('the service step validates before contact details and never submits early', async () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale);
    assert.equal(page.step(1).hidden, false);
    assert.equal(page.step(2).hidden, true);
    page.next.click();
    assert.equal(page.step(1).hidden, false);
    assert.equal(page.document.getElementById('pz-service-error').hidden, false);
    assert.equal(page.document.activeElement, page.form.querySelector('input[name="service"]'));
    setField(page, 'service', 'Tree Trimming');
    assert.equal(page.field('postal_code').closest('[data-form-step]').dataset.formStep, '2');
    submit(page); // Pressing Enter on step one advances to contact details only.
    await settle();
    assert.equal(page.step(1).hidden, true);
    assert.equal(page.step(2).hidden, false);
    assert.equal(page.form.querySelector('[data-progress-step="2"]').getAttribute('aria-current'), 'step');
    assert.equal(page.requests.length, 0);
    setField(page, 'name', 'María Test');
    setField(page, 'postal_code', '92806-1234');
    page.back.click();
    assert.equal(page.step(1).hidden, false);
    assert.equal(page.field('name').value, 'María Test');
    assert.equal(page.field('service').value, 'Tree Trimming');
    assert.equal(page.field('postal_code').value, '92806-1234');
  }
});

test('ZIP is validated with the full address in contact details, not in the project step', async () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale, { fetch: acceptRequest });
    fill(page, { postal_code: '' });
    assert.equal(page.step(2).hidden, false);
    assert.ok(page.field('postal_code').closest('.pz-property-address'));
    for (const zip of ['', '9280', 'abcde', '92806-invalid']) {
      setField(page, 'postal_code', zip);
      submit(page);
      await settle();
      assert.equal(page.requests.length, 0);
      assert.equal(page.step(2).hidden, false);
      assert.equal(page.document.activeElement, page.field('postal_code'));
    }
    setField(page, 'postal_code', '92806-1234');
    submit(page);
    await settle();
    assert.equal(page.success.hidden, false);
  }
});

test('tree sizes and manual discount survive language changes and reach the workflow', async () => {
  const en = openPage();
  fill(en, { tree_count: '4–6', tree_height: 'Over 50 ft', discount_code: 'web10' });
  clickLanguage(en, 'es');
  const es = openPage('es', { handoff: en.window.sessionStorage.getItem(handoffKey), fetch: acceptRequest });
  assert.equal(es.document.querySelector('[data-summary-count]').textContent, '4–6');
  assert.equal(es.document.querySelector('[data-summary-height]').textContent, 'Más de 50 pies');
  assert.equal(es.document.querySelector('#pzOfferApplied').hidden, false);
  submit(es);
  await settle();
  const body = Object.fromEntries(new URLSearchParams(es.requests[0][1].body.toString()));
  const lead = runInNewContext(`(function () {${normalizer}})()`, { $input: { first: () => ({ json: { body } }) }, $execution: { id: 'test' } })[0].json;
  assert.equal(lead.valid, true);
  assert.equal(lead.tree_count, '4–6');
  assert.equal(lead.tree_height, 'Over 50 ft');
  assert.equal(lead.discount_code, 'WEB10');
});

test('claim autofills WEB10 but removing or replacing the code removes the offer', async () => {
  for (const replacement of ['', 'OTHER20']) {
    const page = openPage('en', { fetch: acceptRequest });
    fill(page);
    claimOffer(page);
    assert.equal(page.field('discount_code').value, 'WEB10');
    setField(page, 'discount_code', replacement);
    page.field('discount_code').dispatchEvent(new page.window.Event('input', { bubbles: true }));
    assert.equal(page.document.querySelector('#pzOfferApplied').hidden, true);
    assert.equal(page.window.sessionStorage.getItem('paez-promo-claimed'), '0');
    clickLanguage(page, 'es');
    const es = openPage('es', { handoff: page.window.sessionStorage.getItem(handoffKey), fetch: acceptRequest });
    assert.equal(es.field('discount_code').value, replacement);
    assert.equal(es.document.querySelector('#pzOfferApplied').hidden, true);
    submit(es);
    await settle();
    const body = new URLSearchParams(es.requests[0][1].body.toString());
    assert.equal(body.get('discount_code'), replacement);
    assert.doesNotMatch(body.get('details'), /WEB10|10%/);
  }
});

test('stump requests keep the count and omit irrelevant tree height', async () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale, { fetch: acceptRequest });
    fill(page, { service: 'Stump Removal', tree_count: '2–3', tree_height: 'Over 50 ft' });
    assert.equal(page.field('tree_height').disabled, true);
    assert.equal(page.document.querySelector('[data-summary-height-row]').hidden, true);
    assert.equal(page.document.querySelector('[data-summary-count-label]').textContent, locale === 'es' ? 'Tocones' : 'Stumps');
    submit(page);
    await settle();
    const body = new URLSearchParams(page.requests[0][1].body.toString());
    assert.equal(body.get('tree_count'), '2–3');
    assert.equal(body.get('tree_height'), '');
  }
});

test('emergency timing exposes immediate phone help in either step and each language', () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale);
    const note = page.document.getElementById('pzEmergencyNote');
    assert.equal(note.hidden, true);
    setField(page, 'timeline', 'Emergency');
    page.field('timeline').dispatchEvent(new page.window.Event('change', { bubbles: true }));
    assert.equal(note.hidden, false);
    assert.equal(note.querySelector('a').getAttribute('href'), 'tel:7149269413');
    fill(page, { timeline: 'Emergency' });
    assert.equal(note.closest('[data-form-step]'), null, 'urgent advice remains visible in contact step');
    assert.equal(note.hidden, false);
    setField(page, 'timeline', 'Flexible');
    page.field('timeline').dispatchEvent(new page.window.Event('change', { bubbles: true }));
    assert.equal(note.hidden, true);
  }
});

test('optional email can be blank but an invalid supplied address prevents sending', async () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale, { fetch: acceptRequest });
    fill(page, { email: 'not-an-email' });
    submit(page);
    await settle();
    assert.equal(page.requests.length, 0);
    assert.equal(page.field('email').getAttribute('aria-invalid'), 'true');
    assert.equal(page.document.activeElement, page.field('email'));
    setField(page, 'email', '');
    page.field('email').dispatchEvent(new page.window.Event('input', { bubbles: true }));
    submit(page);
    await settle();
    assert.equal(page.requests.length, 1);
    assert.equal(page.success.hidden, false);
  }
});

test('attribution allows campaign tags while removing URL queries and fragments', async () => {
  const campaign = 'x'.repeat(250);
  const page = openPage('en', {
    search: `?utm_source=google&utm_medium=cpc&utm_campaign=${campaign}&email=private%40example.test&token=secret`,
    hash: '#quote',
    beforeScript: (window) => {
      Object.defineProperty(window.document, 'referrer', {
        value: 'https://search.example/results?token=private&email=private%40example.test#secret',
      });
    },
    fetch: acceptRequest,
  });
  fill(page);
  submit(page);
  await settle();
  const body = new URLSearchParams(page.requests[0][1].body.toString());
  assert.equal(body.get('page_url'), 'https://paez.test/');
  assert.equal(body.get('referrer'), 'https://search.example/results');
  assert.equal(body.get('utm_source'), 'google');
  assert.equal(body.get('utm_medium'), 'cpc');
  assert.equal(body.get('utm_campaign'), 'x'.repeat(200));
  assert.equal(body.has('token'), false);
  assert.equal(body.toString().includes('private'), false);
  assert.ok(body.get('submitted_at'));
});

test('HTTP 200 is insufficient without a true acknowledgment for this lead', async () => {
  for (const acknowledgment of [null, {}, { ok: true }, { ok: false, lead_id: 'different' }, { ok: 'true', lead_id: 'different' }, { ok: true, lead_id: 'different' }]) {
    const page = openPage('en', {
      fetch: async () => ({ ok: true, status: 200, json: async () => acknowledgment }),
    });
    fill(page);
    submit(page);
    await settle();
    assert.equal(page.requests.length, 1);
    assert.equal(page.form.hidden, false, `does not accept ${JSON.stringify(acknowledgment)}`);
    assert.equal(page.success.hidden, true);
    assert.equal(page.status.classList.contains('is-error'), true);
    assert.equal(page.field('name').value, 'Ana Test');
  }
});

test('retrying after a lost response preserves the UUID and submission time', async () => {
  let attempts = 0;
  const page = openPage('en', {
    fetch: async (url, request) => {
      if (++attempts === 1) throw new TypeError('Response lost after server received it');
      return acceptRequest(url, request);
    },
  });
  fill(page);
  submit(page);
  await settle();
  assert.equal(page.success.hidden, true);
  submit(page);
  await settle();
  assert.equal(page.requests.length, 2);
  const first = new URLSearchParams(page.requests[0][1].body.toString());
  const second = new URLSearchParams(page.requests[1][1].body.toString());
  assert.match(first.get('lead_id'), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(second.get('lead_id'), first.get('lead_id'));
  assert.equal(second.get('submitted_at'), first.get('submitted_at'));
  assert.equal(page.success.hidden, false);
});

test('language handoff preserves an unconfirmed lead identity and original attribution', async () => {
  const en = openPage('en', {
    search: '?utm_source=google&utm_campaign=trees',
    hash: '#quote',
    fetch: async () => { throw new TypeError('Response lost'); },
  });
  fill(en, { contact_preference: 'Text', email: 'ana@example.test' });
  submit(en);
  await settle();
  const first = new URLSearchParams(en.requests[0][1].body.toString());
  clickLanguage(en, 'es');
  const es = openPage('es', {
    handoff: en.window.sessionStorage.getItem(handoffKey), hash: '#quote', fetch: acceptRequest,
  });
  assert.equal(es.step(2).hidden, false);
  assert.equal(es.field('contact_preference').value, 'Text');
  assert.equal(es.field('email').value, 'ana@example.test');
  submit(es);
  await settle();
  const second = new URLSearchParams(es.requests[0][1].body.toString());
  assert.equal(second.get('lead_id'), first.get('lead_id'));
  assert.equal(second.get('submitted_at'), first.get('submitted_at'));
  assert.equal(second.get('utm_source'), 'google');
  assert.equal(second.get('utm_campaign'), 'trees');
  assert.equal(second.get('language'), 'es');
  assert.equal(es.success.hidden, false);
});

test('invalid, blank, and whitespace phone numbers never send a request', async () => {
  for (const locale of ['en', 'es']) {
    for (const phone of ['abc', '', '   ', '714555012', '0000000000']) {
      const page = openPage(locale);
      fill(page, { phone });
      submit(page);
      await settle();
      assert.equal(page.requests.length, 0, `${locale}: rejected ${JSON.stringify(phone)}`);
      assert.equal(page.field('phone').getAttribute('aria-invalid'), 'true');
      const error = page.document.getElementById('pz-phone-error');
      assert.equal(error.hidden, false);
      assert.match(error.textContent, locale === 'es' ? /teléfono válido/ : /valid phone number/);
      assert.equal(page.document.activeElement, page.field('phone'));
      assert.equal(page.form.hidden, false);
      assert.equal(page.success.hidden, true);
    }
  }
});

test('correcting a rejected phone clears its error and permits submission', async () => {
  const page = openPage('en', { fetch: acceptRequest });
  fill(page, { phone: 'abc' });
  submit(page);
  page.field('phone').value = '(714) 555-0123';
  page.field('phone').dispatchEvent(new page.window.Event('input', { bubbles: true }));
  assert.equal(page.field('phone').getAttribute('aria-invalid'), 'false');
  assert.equal(page.document.getElementById('pz-phone-error').hidden, true);
  submit(page);
  await settle();
  assert.equal(page.requests.length, 1);
  assert.equal(page.success.hidden, false);
});

test('valid Spanish submissions send the selected canonical service and language', async () => {
  const page = openPage('es', { fetch: acceptRequest });
  fill(page, { name: ' Ana Test ', phone: ' +1 (714) 555-0123 ' });
  submit(page);
  await settle();
  assert.equal(page.requests.length, 1);
  const [url, request] = page.requests[0];
  assert.equal(url, page.form.action);
  assert.equal(request.method, 'POST');
  const body = new URLSearchParams(request.body.toString());
  assert.equal(body.get('name'), 'Ana Test');
  assert.equal(body.get('phone'), '+1 (714) 555-0123');
  assert.equal(body.get('service'), 'Tree Removal');
  assert.equal(body.get('language'), 'es');
  assert.equal(body.get('source'), 'website');
  assert.equal(body.get('postal_code'), '92806');
  assert.equal(body.get('timeline'), 'This week');
  assert.equal(body.get('contact_preference'), 'Call');
  assert.equal(body.get('email'), '');
  assert.match(body.get('lead_id'), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(page.form.hidden, true);
  assert.equal(page.success.hidden, false);
  assert.match(page.successMessage.textContent, /^Gracias, Ana\./);
  assert.equal(page.document.activeElement, page.success);
});

test('HTTP and network failures retain the draft and show a translated retry message', async () => {
  for (const fetch of [async () => ({ ok: false, status: 503 }), async () => { throw new TypeError('Network unavailable'); }]) {
    const page = openPage('es', { fetch });
    const draft = fill(page);
    submit(page);
    await settle();
    assert.equal(page.requests.length, 1);
    assert.equal(page.form.hidden, false);
    assert.equal(page.success.hidden, true);
    assert.equal(page.button.disabled, false);
    assert.equal(page.form.getAttribute('aria-busy'), 'false');
    assert.match(page.status.textContent, /No pudimos confirmar su solicitud/);
    assert.equal(page.status.classList.contains('is-error'), true);
    for (const [name, value] of Object.entries(draft)) assert.equal(page.field(name).value, value);
  }
});

test('timed-out requests abort, retain the draft, and offer retry or call without automatically resending', async () => {
  for (const locale of ['en', 'es']) {
    const page = openPage(locale, {
      fetch: (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('Request aborted'), { name: 'AbortError' }));
        }, { once: true });
      }),
    });
    const timers = new Map();
    let nextTimer = 0;
    page.window.setTimeout = (callback, delay) => {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    };
    page.window.clearTimeout = (id) => timers.delete(id);
    const draft = fill(page);
    submit(page);
    assert.equal(page.requests.length, 1);
    assert.equal(page.requests[0][1].signal.aborted, false);
    assert.equal(timers.size, 1);
    const timeout = [...timers.values()][0];
    assert.equal(timeout.delay, 15000);
    timeout.callback();
    await settle();
    assert.equal(page.requests[0][1].signal.aborted, true);
    assert.equal(page.requests.length, 1);
    assert.equal(timers.size, 0, 'timeout is cleared and no retry is scheduled');
    assert.equal(page.form.hidden, false);
    assert.equal(page.success.hidden, true);
    assert.equal(page.button.disabled, false);
    assert.equal(page.form.getAttribute('aria-busy'), 'false');
    assert.equal(page.status.classList.contains('is-error'), true);
    assert.match(page.status.textContent, locale === 'es'
      ? /No recibimos la confirmación a tiempo/
      : /We did not receive confirmation in time/);
    assert.match(page.status.textContent, locale === 'es'
      ? /intentar de nuevo o llamar al \(714\) 926-9413/
      : /try again or call \(714\) 926-9413/);
    for (const [name, value] of Object.entries(draft)) assert.equal(page.field(name).value, value);
  }
});

test('success displays submitted names as text and prevents a second submission', async () => {
  const page = openPage('en', { fetch: acceptRequest });
  fill(page, { name: '<img/src=x/onerror=alert(1)>' });
  submit(page);
  await settle();
  assert.match(page.successMessage.textContent, /^Thanks, <img\/src=x\/onerror=alert\(1\)>\./);
  assert.equal(page.successMessage.querySelector('img'), null);
  submit(page);
  await settle();
  assert.equal(page.requests.length, 1);
});

test('switching language preserves the full draft exactly once without a stale fragment', () => {
  const en = openPage('en', { hash: '#quote' });
  const draft = fill(en, { name: 'María Test', details: 'Two trees / dos árboles.' });
  const { link, preventedByApp } = clickLanguage(en, 'es');
  assert.equal(preventedByApp, false);
  assert.equal(new URL(link.href).pathname, '/es/');
  assert.equal(new URL(link.href).hash, '');
  const handoff = en.window.sessionStorage.getItem(handoffKey);
  assert.ok(handoff);
  const es = openPage('es', { handoff });
  for (const [name, value] of Object.entries(draft)) assert.equal(es.field(name).value, value);
  assert.equal(es.window.sessionStorage.getItem(handoffKey), null);
  assert.equal(es.form.hidden, false);
  assert.equal(es.success.hidden, true);
  assert.equal(es.step(1).hidden, true);
  assert.equal(es.step(2).hidden, false);
  assert.equal(en.requests.length + es.requests.length, 0);
  const back = clickLanguage(es, 'en');
  assert.equal(new URL(back.link.href).pathname, '/');
  assert.equal(new URL(back.link.href).hash, '');
});

test('a successful request remains successful after switching to Spanish', async () => {
  const en = openPage('en', { fetch: acceptRequest });
  fill(en);
  submit(en);
  await settle();
  clickLanguage(en, 'es');
  const es = openPage('es', { handoff: en.window.sessionStorage.getItem(handoffKey) });
  assert.equal(es.form.hidden, true);
  assert.equal(es.success.hidden, false);
  assert.match(es.successMessage.textContent, /^Gracias, Ana\./);
  submit(es);
  await settle();
  assert.equal(es.requests.length, 0);
});

test('expired language handoffs cannot restore old details or a stale success state', async () => {
  const page = openPage('es', {
    handoff: JSON.stringify({
      to: 'es',
      expires: Date.now() - 1000,
      values: { name: 'Old Visitor', phone: '(714) 555-0100', service: 'Tree Removal', details: 'Old request' },
      sent: true,
    }),
    fetch: acceptRequest,
  });
  assert.equal(page.field('name').value, '');
  assert.equal(page.field('phone').value, '');
  assert.equal(page.field('details').value, '');
  assert.equal(page.form.hidden, false);
  assert.equal(page.success.hidden, true);
  assert.equal(page.window.sessionStorage.getItem(handoffKey), null);
  fill(page);
  submit(page);
  await settle();
  assert.equal(page.requests.length, 1);
  assert.equal(page.success.hidden, false);
});

test('unavailable session storage does not block language navigation or quote submission', async () => {
  const page = openPage('en', {
    hash: '#quote',
    beforeScript: (window) => {
      Object.defineProperty(window, 'sessionStorage', {
        get() { throw new window.DOMException('Storage is blocked', 'SecurityError'); },
      });
    },
    fetch: acceptRequest,
  });
  fill(page);
  const { link, preventedByApp } = clickLanguage(page, 'es');
  assert.equal(preventedByApp, false);
  assert.equal(new URL(link.href).pathname, '/es/');
  assert.equal(new URL(link.href).hash, '');
  submit(page);
  await settle();
  assert.equal(page.requests.length, 1);
  assert.equal(page.success.hidden, false);
});

test('pending requests block duplicate sends and language navigation until resolved', async () => {
  let resolveRequest;
  const response = new Promise((resolve) => { resolveRequest = resolve; });
  const page = openPage('en', { fetch: () => response });
  fill(page);
  submit(page);
  submit(page);
  assert.equal(page.requests.length, 1);
  assert.equal(page.button.disabled, true);
  assert.equal(page.form.getAttribute('aria-busy'), 'true');
  assert.match(page.status.textContent, /Sending/);
  const { preventedByApp } = clickLanguage(page, 'es');
  assert.equal(preventedByApp, true);
  assert.equal(page.window.sessionStorage.getItem(handoffKey), null);
  assert.match(page.status.textContent, /wait for your request to finish/);
  resolveRequest(acceptedResponse(page.requests[0][1]));
  await settle();
  assert.equal(page.success.hidden, false);
  assert.equal(page.form.getAttribute('aria-busy'), 'false');
  assert.equal(clickLanguage(page, 'es').preventedByApp, false);
});

// Model document coordinates independently of the scroll-restoration code.
function readingLayout(window, { y = 0, sectionTop = 2000, headingTop = 2200, imageTop } = {}) {
  const calls = [];
  const frames = [];
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
  window.scrollTo = (options) => { calls.push(options); y = options.top; };
  window.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  window.history.scrollRestoration = 'auto';
  const bounds = (top, height) => ({ top: top - y, bottom: top - y + height, height, width: 600, left: 0, right: 600 });
  window.document.querySelector('#about').getBoundingClientRect = () => bounds(sectionTop, 1000);
  window.document.querySelector('#about h2').getBoundingClientRect = () => bounds(headingTop, 80);
  if (Number.isFinite(imageTop)) window.document.querySelector('#about img').getBoundingClientRect = () => bounds(imageTop, 400);
  return { calls, y: () => y, flush: () => frames.splice(0).forEach((callback) => callback()), shift: (amount) => { sectionTop += amount; headingTop += amount; } };
}

test('switching languages at the top ignores an old #about hash in both directions', () => {
  for (const from of ['en', 'es']) {
    const to = from === 'en' ? 'es' : 'en';
    const page = openPage(from, { hash: '#about', beforeScript: (window) => readingLayout(window) });
    const { link } = clickLanguage(page, to);
    assert.equal(new URL(link.href).hash, '');
    const handoff = page.window.sessionStorage.getItem(handoffKey);
    assert.equal(JSON.parse(handoff).position.top, 0);
    let destination;
    openPage(to, { handoff, beforeScript: (window) => { destination = readingLayout(window, { y: 700 }); } });
    assert.equal(destination.y(), 0);
    assert.equal(destination.calls[0].behavior, 'instant');
  }
});

test('language switching keeps the same visible heading despite translated content heights', () => {
  for (const from of ['en', 'es']) {
    const to = from === 'en' ? 'es' : 'en';
    const page = openPage(from, { hash: '#services', beforeScript: (window) => readingLayout(window, { y: 2100, imageTop: 2198 }) });
    clickLanguage(page, to);
    let destination;
    const translated = openPage(to, {
      handoff: page.window.sessionStorage.getItem(handoffKey),
      beforeScript: (window) => { destination = readingLayout(window, { sectionTop: 2600, headingTop: 2800, imageTop: 2843 }); },
    });
    assert.equal(destination.y(), 2700);
    assert.equal(translated.document.querySelector('#about h2').getBoundingClientRect().top, 100);
    destination.flush();
    assert.equal(destination.y(), 2700, 'a second restoration does not add the offset twice');
    assert.equal(translated.window.sessionStorage.getItem(handoffKey), null);
    assert.equal(page.requests.length + translated.requests.length, 0);
  }
});

test('late layout correction stops as soon as the visitor interacts', () => {
  const source = openPage('en', { beforeScript: (window) => readingLayout(window, { y: 2100 }) });
  clickLanguage(source, 'es');
  let layout;
  const page = openPage('es', {
    handoff: source.window.sessionStorage.getItem(handoffKey),
    beforeScript: (window) => { layout = readingLayout(window, { sectionTop: 2600, headingTop: 2800 }); },
  });
  layout.shift(75);
  page.window.dispatchEvent(new page.window.Event('load'));
  assert.equal(layout.y(), 2775, 'font/image layout changes retain the visible heading');
  page.window.dispatchEvent(new page.window.Event('wheel'));
  layout.shift(300);
  const count = layout.calls.length;
  page.window.dispatchEvent(new page.window.Event('load'));
  layout.flush();
  assert.equal(layout.calls.length, count, 'late callbacks cannot undo the visitor’s scroll');
  assert.equal(page.window.history.scrollRestoration, 'auto');
});

test('a section boundary preserves the visible heading rather than empty space above it', () => {
  const source = openPage('en', { beforeScript: (window) => {
    readingLayout(window, { y: 1892, headingTop: 2117 });
    window.document.querySelector('.pz-header').getBoundingClientRect = () => ({ bottom: 76 });
    window.document.querySelector('#about').previousElementSibling.getBoundingClientRect = () => ({ top: -592, bottom: 108, height: 700, width: 600 });
  } });
  clickLanguage(source, 'es');
  let layout;
  const target = openPage('es', {
    handoff: source.window.sessionStorage.getItem(handoffKey),
    beforeScript: (window) => { layout = readingLayout(window, { sectionTop: 2300, headingTop: 2417 }); },
  });
  assert.equal(layout.y(), 2192);
  assert.equal(target.document.querySelector('#about h2').getBoundingClientRect().top, 225);
});

test('blocked storage uses the current reading section instead of a stale hash', () => {
  const page = openPage('en', { hash: '#services', beforeScript: (window) => {
    readingLayout(window, { y: 2100 });
    Object.defineProperty(window, 'sessionStorage', { get() { throw new window.DOMException('Blocked', 'SecurityError'); } });
  } });
  assert.equal(new URL(clickLanguage(page, 'es').link.href).hash, '#about');
});

test('expired or wrong-language handoffs never reposition the page', () => {
  for (const details of [{ to: 'en', expires: Date.now() + 60000 }, { to: 'es', expires: Date.now() - 1 }]) {
    let layout;
    openPage('es', {
      handoff: JSON.stringify({ ...details, position: { top: 3000 }, values: {} }),
      beforeScript: (window) => { layout = readingLayout(window); },
    });
    assert.equal(layout.calls.length, 0);
  }
});

test('opening the other language in a new tab leaves normal link behavior and stores no draft', () => {
  const page = openPage('en', { hash: '#about' });
  const link = page.document.querySelector('[data-language-link]');
  let prevented;
  link.addEventListener('click', (event) => { prevented = event.defaultPrevented; event.preventDefault(); }, { once: true });
  link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }));
  assert.equal(prevented, false);
  assert.equal(page.window.sessionStorage.getItem(handoffKey), null);
});
