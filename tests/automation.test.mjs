import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Execute the exported n8n Code-node bodies with local fixtures only. These tests
// have no network functions, credentials, database access, or email transport.
const normalizer = await readFile(new URL('../automation/normalize-lead.js', import.meta.url), 'utf8');
const emailRenderer = await readFile(new URL('../automation/lead-email.js', import.meta.url), 'utf8');
const workflow = JSON.parse(await readFile(new URL('../automation/paez-lead-workflow.json', import.meta.url), 'utf8'));
const id = '550e8400-e29b-41d4-a716-446655440000';
const base = {
  lead_id: id,
  name: 'Ana Example',
  phone: '+1 (714) 555-0123',
  service: 'Tree Trimming',
  postal_code: '92806',
  form_version: '2',
  street_address: '123 Example Street',
  address_line2: 'Unit 4',
  city: 'Anaheim',
  state: 'CA',
  timeline: 'This week',
  contact_preference: 'Text',
  email: 'ana@example.com',
  language: 'es',
  details: 'Two trees near a fence.\nPlease text first.',
};

function normalize(overrides = {}, request = {}) {
  const input = { ...request, body: { ...base, ...overrides } };
  const result = runInNewContext(`(function () {\n${normalizer}\n})()`, {
    $input: { first: () => ({ json: input }) },
    $execution: { id: 'local-test-execution' },
  });
  return JSON.parse(JSON.stringify(result[0].json));
}

function render(overrides = {}) {
  const lead = { ...normalize(), receivedAt: '2026-10-17T20:30:00.000Z', ...overrides };
  const result = runInNewContext(`(function () {\n${emailRenderer}\n})()`, {
    $: (node) => {
      assert.equal(node, 'Validate Lead');
      return { first: () => ({ json: lead }) };
    },
  });
  return JSON.parse(JSON.stringify(result[0].json));
}

test('saved workflow matches tested code, logs each address field and keeps Paez notifications disabled', () => {
  const node = name => workflow.nodes.find(item => item.name === name);
  assert.equal(node('Validate Lead').parameters.jsCode, normalizer);
  assert.equal(node('Build LC Marketing Email').parameters.jsCode, emailRenderer);
  const columns = node('Save Lead').parameters.columns;
  for (const field of ['form_version', 'street_address', 'address_line2', 'city', 'state', 'property_address', 'tree_count', 'tree_height', 'discount_code']) {
    assert.equal(columns.value[field], `={{ $('Validate Lead').first().json.${field} }}`);
    assert.equal(columns.schema.find(item => item.id === field)?.type, 'string');
  }
  assert.equal(node('Notify LC Marketing').parameters.sendTo, 'mrmushmushow@gmail.com');
  assert.equal(workflow.paezNotificationsEnabled, false);
});

test('normalizer accepts modern Spanish leads and initializes durable delivery status', () => {
  const lead = normalize({ name: '  Ana Example  ', postal_code: '92806-1234' });
  assert.equal(lead.valid, true);
  assert.deepEqual(lead.errors, []);
  assert.equal(lead.name, 'Ana Example');
  assert.equal(lead.lead_id, id);
  assert.equal(lead.postal_code, '92806-1234');
  assert.equal(lead.language, 'es');
  assert.equal(lead.contact_preference, 'Text');
  assert.equal(lead.status, 'New');
  assert.equal(lead.email_status, 'pending');
  assert.equal(lead.gmail_message_id, '');
  assert.ok(Number.isFinite(Date.parse(lead.receivedAt)));
  assert.equal(lead.property_address, '123 Example Street, Unit 4, Anaheim, CA 92806-1234');
  assert.equal(JSON.parse(lead.raw_payload).street_address, '123 Example Street');
});

test('address forms require a complete bounded address and reject malformed fields', () => {
  for (const [key, value] of [
    ['street_address', ''], ['street_address', 'A'.repeat(161)], ['street_address', '123 Main\nInjected'],
    ['address_line2', 'A'.repeat(81)], ['address_line2', 'Unit\t2'],
    ['city', ''], ['city', 'A'.repeat(101)], ['city', 'Anaheim\nInjected'],
    ['state', ''], ['state', 'NV'], ['form_version', 'unknown']
  ]) {
    const lead = normalize({ [key]: value });
    assert.equal(lead.valid, false, `${key} must be rejected`);
    assert.ok(lead.errors.includes(key));
  }
  const lead = normalize({ street_address: '  123 Example Street  ', address_line2: '', city: '  Anaheim  ', state: 'ca' });
  assert.equal(lead.valid, true);
  assert.equal(lead.property_address, '123 Example Street, Anaheim, CA 92806');
});

test('legacy ZIP-only leads remain accepted but partial addresses must be completed', () => {
  const old = { form_version: '', street_address: '', address_line2: '', city: '', state: '' };
  assert.equal(normalize(old).valid, true);
  assert.equal(normalize(old).property_address, '');
  assert.equal(normalize({ ...old, street_address: '123 Example Street' }).valid, false);
  assert.equal(normalize({ ...old, form_version: '2' }).valid, false);
});

test('email map and driving links locate the property, retain unit text, and never use ZIP alone', () => {
  const email = render();
  assert.match(email.html, /Property location/);
  assert.match(email.html, /123 Example Street, Unit 4, Anaheim, CA 92806/);
  const map = new URL(email.html.match(/href="(https:\/\/www\.google\.com\/maps\/search\/[^\"]+)"/)[1].replaceAll('&amp;', '&'));
  const directions = new URL(email.html.match(/href="(https:\/\/www\.google\.com\/maps\/dir\/[^\"]+)"/)[1].replaceAll('&amp;', '&'));
  assert.equal(map.searchParams.get('api'), '1');
  assert.equal(map.searchParams.get('query'), '123 Example Street, Anaheim, CA 92806, USA');
  assert.equal(directions.searchParams.get('destination'), map.searchParams.get('query'));
  assert.equal(directions.searchParams.get('travelmode'), 'driving');
  assert.equal(directions.searchParams.has('origin'), false);
  assert.ok(email.html.indexOf('Property location') < email.html.indexOf('Job &amp; contact details'));
  const old = render({ street_address: '', address_line2: '', city: '', state: '' });
  assert.doesNotMatch(old.html, /google\.com\/maps/);
  assert.match(old.html, /full property address was not provided/);
});

test('address text cannot inject HTML or replace the Google Maps destination', () => {
  const street = '123 Main & " onclick="alert(1) <img src=x>';
  const email = render({ street_address: street, city: 'Santa Ana', address_line2: '<script>alert(1)</script>', map_url: 'javascript:alert(1)' });
  assert.doesNotMatch(email.html, /<img src=x>|<script>|href="javascript:|" onclick="/);
  assert.match(email.html, /&lt;script&gt;/);
  const map = new URL(email.html.match(/href="(https:\/\/www\.google\.com\/maps\/search\/[^\"]+)"/)[1].replaceAll('&amp;', '&'));
  assert.equal(map.hostname, 'www.google.com');
  assert.equal(map.searchParams.get('query'), street + ', Santa Ana, CA 92806, USA');
});

test('normalizer keeps legacy form compatibility without weakening modern ZIP validation', () => {
  const old = normalize({ lead_id: '', postal_code: '', timeline: '', contact_preference: '', email: '', form_version: '', street_address: '', address_line2: '', city: '', state: '' });
  assert.equal(old.valid, true);
  assert.equal(old.lead_id, 'legacy-local-test-execution');
  assert.equal(old.timeline, 'Flexible');
  assert.equal(old.contact_preference, 'Call');
  assert.ok(normalize({ postal_code: '' }).errors.includes('postal_code'));
  assert.ok(normalize({ lead_id: '', postal_code: 'invalid' }).errors.includes('postal_code'));
});

test('normalizer rejects honeypots and invalid canonical customer fields', () => {
  const cases = [
    ['website', 'https://spam.example', 'invalid_request'],
    ['name', 'A', 'name'],
    ['name', 'Name\r\nBcc:someone@example.com', 'name'],
    ['phone', 'abc', 'phone'],
    ['phone', '1111111111', 'phone'],
    ['phone', '714555012', 'phone'],
    ['phone', '++17145550123', 'phone'],
    ['phone', '714+5550123', 'phone'],
    ['postal_code', '9280', 'postal_code'],
    ['postal_code', '92806 1234', 'postal_code'],
    ['email', '<img>@example.com', 'email'],
    ['email', 'not-an-email', 'email'],
    ['service', 'Unlisted service', 'service'],
    ['timeline', 'Yesterday', 'timeline'],
    ['contact_preference', 'Email everyone', 'contact_preference'],
    ['lead_id', '550e8400-e29b-11d4-a716-446655440000', 'lead_id'],
  ];
  for (const [key, value, expected] of cases) {
    const lead = normalize({ [key]: value });
    assert.equal(lead.valid, false, `${key}=${value} must be rejected`);
    assert.ok(lead.errors.includes(expected), `must report ${expected}`);
  }
});

test('normalizer bounds metadata, strips sensitive URL parts, and ignores request secrets', () => {
  const lead = normalize({
    page_url: 'https://paez.test/es/?email=private@example.com#estimate',
    referrer: 'https://search.example/results?secret=do-not-store#fragment',
    utm_campaign: 'x'.repeat(250),
    utm_source: '  search  ',
    gclid: 'not-collected',
    cookie: 'not-collected',
    authorization: 'not-collected',
    client_ip: '192.0.2.40',
    source: 'forged-source',
  }, { headers: { authorization: 'Bearer secret', cookie: 'secret=1', 'x-forwarded-for': '192.0.2.40' } });
  assert.equal(lead.page_url, 'https://paez.test/es/');
  assert.equal(lead.referrer, 'https://search.example/results');
  assert.equal(lead.utm_campaign.length, 200);
  assert.equal(lead.utm_source, 'search');
  assert.equal(lead.source, 'website');
  const raw = JSON.parse(lead.raw_payload);
  for (const forbidden of ['headers', 'cookie', 'authorization', 'client_ip', 'gclid', 'status', 'email_status', 'receivedAt']) {
    assert.equal(Object.hasOwn(raw, forbidden), false, `${forbidden} should not be logged`);
  }
  assert.doesNotMatch(lead.raw_payload, /private@example|do-not-store|Bearer secret|192\.0\.2\.40/);
  assert.equal(raw.lead_id, id);
});

test('normalizer removes credential-bearing and non-web referrers', () => {
  for (const unsafe of ['https://name:password@example.com/path?secret=1', 'javascript:alert(1)', 'file:///private/path', 'not a URL']) {
    const lead = normalize({ page_url: unsafe, referrer: unsafe });
    assert.equal(lead.page_url, '');
    assert.equal(lead.referrer, '');
  }
});

test('normalizer accepts every offered service, timeline and contact preference', () => {
  for (const service of ['Tree Trimming', 'Tree Removal', 'Stump Removal', 'Palm Tree Service', 'HOA / Commercial', 'Emergency — call me ASAP']) {
    assert.equal(normalize({ service }).valid, true, service);
  }
  for (const timeline of ['Flexible', 'As soon as possible', 'This week', 'Within a month']) {
    assert.equal(normalize({ timeline }).valid, true, timeline);
  }
  for (const contact_preference of ['Call', 'Text']) {
    assert.equal(normalize({ contact_preference }).valid, true, contact_preference);
  }
});

test('email escapes untrusted text in HTML while preserving readable line breaks', () => {
  const payload = '<img src=x onerror="alert(1)"> & \'quoted\'';
  const email = render({
    name: payload,
    details: payload + '\nSecond line',
    page_url: payload,
    utm_campaign: payload,
    email: payload,
    phone: '+1 (714) 555-0123" onclick="alert(1)',
  });
  assert.doesNotMatch(email.html, /<img src=x|<script|href="tel:[^"]*" onclick=/);
  assert.match(email.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; &#39;quoted&#39;/);
  assert.match(email.html, /<br>Second line/);
  assert.match(email.html, /href="tel:\+171455501231"/);
  assert.equal(email.lead_id, id);
});

test('email gives LC Marketing useful contact, job, attribution and Pacific-time context', () => {
  const email = render({ utm_source: 'Google', utm_campaign: 'Tree trimming' });
  assert.match(email.html, /LC MARKETING/);
  assert.match(email.html, /Paez Tree Service/);
  assert.match(email.html, /Preferred contact: Text/);
  assert.match(email.html, /Spanish \/ Español/);
  assert.match(email.html, /Pacific/);
  assert.match(email.html, /ZIP code/);
  assert.match(email.html, /92806/);
  assert.match(email.html, /Google/);
  assert.match(email.html, /Not provided/);
  assert.match(email.html, /paez-leads/);
  assert.match(email.html, /Delivered to mrmushmushow@gmail\.com/);
  assert.doesNotMatch(email.html, /Delivered to paeztreeservices@gmail\.com/);
  assert.match(email.html, /href="tel:\+17145550123"/);
  assert.match(email.html, /href="sms:\+17145550123"/);
});

test('new project fields are validated, saved and shown without promising unverified discounts', () => {
  const lead = normalize({ tree_count: '2–3', tree_height: '30–50 ft', discount_code: ' web10 ' });
  assert.equal(lead.valid, true);
  assert.equal(lead.discount_code, 'WEB10');
  assert.equal(JSON.parse(lead.raw_payload).discount_code, 'WEB10');
  assert.equal(JSON.parse(lead.raw_payload).tree_count, '2–3');
  const email = render(lead);
  assert.match(email.html, /WEB10 — 10% discount requested/);
  assert.match(email.html, /Confirm eligibility/);
  assert.match(email.html, /2–3/);
  assert.match(email.html, /30–50 ft/);
  assert.match(render(normalize({ discount_code: 'other20' })).html, /OTHER20 — customer-entered code; verify/);
  assert.doesNotMatch(render(normalize({ discount_code: 'other20' })).html, /10% discount requested/);
  assert.equal(normalize({ service: 'Stump Removal', tree_height: 'Over 50 ft' }).tree_height, '');
  for (const [key, value] of [['tree_count', '1000'], ['tree_height', 'unknown'], ['discount_code', '<script>'], ['discount_code', 'a'.repeat(33)]]) {
    assert.ok(normalize({ [key]: value }).errors.includes(key));
  }
});

test('email contact links normalize US phone numbers and explain the SMS desktop fallback', () => {
  for (const phone of ['7145550123', '(714) 555-0123', '1-714-555-0123', '+1 (714) 555-0123']) {
    const email = render({ phone });
    assert.match(email.html, /href="sms:\+17145550123"/);
    assert.match(email.html, /href="tel:\+17145550123"/);
    assert.match(email.html, /Text customer \(mobile\)/);
    assert.match(email.html, /copy the number above into your messaging app/);
  }
  assert.match(render({ phone: '+52 664 555 0123' }).html, /href="sms:\+526645550123"/);
});

test('email prioritizes emergencies and never lets a public name suppress follow-up', () => {
  const urgent = render({ service: 'Emergency — call me ASAP' });
  assert.match(urgent.subject, /^\[URGENT\]/);
  assert.match(urgent.html, /Urgent tree service request/);
  const testEmail = render({ name: 'LC Marketing TEST — integration' });
  assert.doesNotMatch(testEmail.subject, /^\[TEST\]/);
  assert.doesNotMatch(testEmail.html, /TEST ONLY|no customer follow-up needed/);
  assert.match(testEmail.html, /href="tel:/);
  assert.match(testEmail.html, /href="sms:/);
  const header = render({ name: 'A Name\r\nBcc:other@example.com' });
  assert.doesNotMatch(header.subject, /[\r\n]/);
});
