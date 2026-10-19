// n8n Code node: validate the public form and minimize stored request metadata.
const input = $input.first().json;
const body = input.body && typeof input.body === 'object' ? input.body : {};
const text = (key, max = 200) => typeof body[key] === 'string' ? body[key].trim().slice(0, max) : '';
const services = ['Tree Trimming', 'Tree Removal', 'Stump Removal', 'Palm Tree Service', 'HOA / Commercial', 'Emergency — call me ASAP'];
const name = text('name', 100), phone = text('phone', 40), service = text('service', 80);
const email = text('email', 254), postal_code = text('postal_code', 10);
// Version 2 requires a complete service address. Older deployed forms remain
// accepted during rollout; never turn their ZIP alone into a property map.
const form_version = text('form_version', 10);
const street_address = text('street_address', 161), address_line2 = text('address_line2', 81);
const city = text('city', 101), state = text('state', 3).toUpperCase();
const addressRequired = form_version === '2' || Boolean(street_address || address_line2 || city || state);
const requestedId = text('lead_id', 80), modern = Boolean(requestedId);
const errors = [];
const tree_count = text('tree_count', 40);
const requestedHeight = text('tree_height', 40);
const tree_height = service === 'Stump Removal' ? '' : requestedHeight;
const discount_code = text('discount_code', 33).toUpperCase();
if (!['', 'Not sure', '1', '2–3', '4–6', '7+'].includes(tree_count)) errors.push('tree_count');
if (!['', 'Not sure', 'Under 15 ft', '15–30 ft', '30–50 ft', 'Over 50 ft'].includes(tree_height)) errors.push('tree_height');
if (discount_code && !/^[A-Z0-9_-]{1,32}$/.test(discount_code)) errors.push('discount_code');
if (text('website', 500)) errors.push('invalid_request');
if (name.length < 2 || /[\r\n]/.test(name)) errors.push('name');
const digits = phone.replace(/\D/g, '');
if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 10 || digits.length > 15 || /^(\d)\1+$/.test(digits)) errors.push('phone');
if (!services.includes(service)) errors.push('service');
if ((modern || postal_code) && !/^\d{5}(?:-\d{4})?$/.test(postal_code)) errors.push('postal_code');
if (form_version && form_version !== '2') errors.push('form_version');
if (addressRequired) {
  if (street_address.length < 5 || street_address.length > 160 || /[\u0000-\u001f\u007f]/.test(street_address)) errors.push('street_address');
  if (address_line2.length > 80 || /[\u0000-\u001f\u007f]/.test(address_line2)) errors.push('address_line2');
  if (city.length < 2 || city.length > 100 || /[\u0000-\u001f\u007f]/.test(city)) errors.push('city');
  if (state !== 'CA') errors.push('state');
  if (!/^\d{5}(?:-\d{4})?$/.test(postal_code) && !errors.includes('postal_code')) errors.push('postal_code');
}
if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) errors.push('email');
if (modern && !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestedId)) errors.push('lead_id');
const timeline = text('timeline', 80) || 'Flexible';
if (!['Flexible', 'As soon as possible', 'This week', 'Within a month'].includes(timeline)) errors.push('timeline');
const contact_preference = text('contact_preference', 10) || 'Call';
if (!['Call', 'Text'].includes(contact_preference)) errors.push('contact_preference');
// URL query strings can contain unrelated personal information. Never retain them.
function safeUrl(value) {
  const match = value.match(/^(https?:\/\/[^/?#\s]+)([^?#\s]*)/i);
  return match && !match[1].includes('@') ? (match[1] + match[2]).slice(0, 1000) : '';
}
const lead = {
  name, phone, service, email, postal_code, timeline, contact_preference,
  form_version, street_address, address_line2, city, state, tree_count, tree_height, discount_code,
  property_address: street_address && city && state && postal_code
    ? [street_address, address_line2, city + ', ' + state + ' ' + postal_code].filter(Boolean).join(', ') : '',
  details: text('details', 3000),
  language: text('language', 5) === 'es' ? 'es' : 'en',
  lead_id: modern ? requestedId.toLowerCase() : 'legacy-' + $execution.id,
  receivedAt: new Date().toISOString(), source: 'website',
  page_url: safeUrl(text('page_url', 1200)), referrer: safeUrl(text('referrer', 1200)),
  browser_language: text('browser_language', 40), timezone: text('timezone', 100),
  viewport: text('viewport', 30), submitted_at: text('submitted_at', 40),
  status: 'New', email_status: 'pending', email_sent_at: '', gmail_message_id: '', email_error: ''
};
for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) lead[key] = text(key, 200);
// Preserve only the accepted form fields, never cookies, authorization headers or IP addresses.
lead.raw_payload = JSON.stringify(Object.fromEntries(Object.keys(lead).filter(k => !['status','email_status','email_sent_at','gmail_message_id','email_error','receivedAt'].includes(k)).map(k => [k, lead[k]])));
return [{json: { ...lead, valid: errors.length === 0, errors }}];
