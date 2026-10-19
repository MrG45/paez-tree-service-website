# Paez Tree Service website

Static Astro website with US English (`/`, `en-US`) and Mexican Spanish (`/es/`, `es-MX`) pages. The header flag shows the language to switch to: Mexico for Spanish and the US for English. Form payloads and route keys remain `en` / `es` for the existing automation.

Flag artwork is locally hosted from [flag-icons](https://github.com/lipis/flag-icons), with its MIT license in `public/assets/flags/LICENSE.txt`. The Mexico flag uses a small WebP derivative for display; its SVG source is retained alongside it.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev -- --background --host 127.0.0.1
```

The preview runs at `http://127.0.0.1:4321/`. Use `npm run dev -- status`,
`npm run dev -- logs`, and `npm run dev -- stop` to manage it.

```sh
npm test       # Build both languages and run isolated interaction tests
npm run build # Static deployable output in dist/
npm run images:optimize # Regenerate compressed variants from the original photos
```

## Editing

- `src/components/Home.astro`: shared page content, hero and bottom contact bar.
- `src/components/Header.astro`: floating/docked header, flag with EN/ES text, navigation and mobile layout.
- `src/components/QuoteForm.astro`: two-step estimate form, service choices, field labels and scoped form styles.
- `src/components/Faq.astro`: native FAQ disclosures, English/Spanish answers and scoped styles.
- `src/components/OptimizedImage.astro`: responsive AVIF/WebP pictures with intrinsic dimensions and native lazy loading.
- `src/i18n.ts`: Spanish translations of static page copy.
- `src/pages/index.astro` and `src/pages/es/index.astro`: language routes.
- `public/js/main.js`: translated photo/review content and gallery/menu behavior.
- `public/js/site.js`: service preselection, request summary, offer context, two-step validation, attribution, confirmed submission and language handoff.
- `public/js/header.js`: scroll-driven header transition and reduced-motion behavior.
- `public/js/promo.js`: contextual promotion eligible after 15 seconds, with session dismissal and offer handoff.
- `public/js/contact-bar.js`: contextual bottom contact bar that stays clear of the hero, form and mobile menu.
- `public/js/navigation.js`: skip/section focus handoff and measured sticky-header clearance.
- `public/style.css`: shared responsive styling.
- `public/fonts.css` and `public/assets/fonts/`: self-hosted Barlow faces, font licenses and source manifest.
- `scripts/optimize-images.mjs`: repeatable asset generation using Sharp; original photos remain in place.
- `public/assets/optimized/manifest.json`: source and generated-image dimensions and byte sizes.
- `automation/`: current n8n workflow snapshot and the validation/email Code node sources.

Language links preserve the current section and temporarily carry form details
through session storage. The handoff expires after one minute and is removed on
arrival. The explicit language URL controls the selected language; both pages
render translated content without JavaScript.

## Loading performance

The hero uses a preloaded AVIF selected at mobile, tablet and desktop breakpoints,
with WebP fallback. Its image is 59,455 bytes on mobile and 172,759 on desktop,
down from 605,392 bytes. Service cards, the featured comparison, team photo and
decorative section photos use native lazy loading. Fixed dimensions retain their
existing layout space. Six gallery previews use resized variants; the lightbox
still opens the original photographs.

Brand marks are resized lossless WebP. Fonts use local WOFF2 files with
`font-display: swap`, preserving all existing weights and English/Spanish
characters. Two first-screen font faces are preloaded. No Google Fonts stylesheet
or connection is needed at runtime; font binary sizes themselves are unchanged.

The production asset audit found 3,753,358 bytes in the previous immediately
referenced image set. The replacement mobile hero plus all brand marks total
113,609 bytes with AVIF, or 147,524 with WebP. Other photos load as the visitor
approaches them, according to the browser's lazy-loading threshold. These are
asset-byte measurements, not measured network transfer, Core Web Vitals or a
Lighthouse score. Check actual loading times and host caching after deployment.

Conversion tracking was deferred at the owner's request on October 17, 2026.
No analytics library, event transport or tracking workflow was enabled. The
unreviewed instrumentation draft is saved outside the website under
`../Reports/Website/2026-10-17/tracking-deferred/` for a later pass.

## Project proof, FAQ and service area

The before-and-after section follows Services, with an accurately captioned
backyard tree removal and an estimate link that selects Tree Removal. Comparison
sliders support keyboard input with a visible focus outline. Existing gallery
tabs and photo lightbox remain available.

Six native FAQ disclosures cover estimates, property types, trimming/removal,
cleanup, request details and urgent work. They work without JavaScript and are
translated at build time. The new service-area section names the documented
coverage (Anaheim and Orange County), asks for a city or ZIP to confirm the
property, and labels the map as the Anaheim location. No unverified city list
or service radius has been added.

## Quote form

Step one offers four actual services: tree trimming, tree removal, stump removal
and palm tree service. Property ZIP and timing are separate fields; Emergency is
a timing choice and exposes immediate phone help. Step two asks for name, phone,
preferred contact method and the service property's street address and city.
California is prefilled; the ZIP from step one completes the address. Apartment,
unit or suite, property type, email and job details are optional. Address fields
have persistent English/Mexican Spanish labels and browser address autofill hints.
Both languages preserve the same canonical values, form step and details during
an explicit language switch.

Actual-service cards select the corresponding service without clearing contact
details. HOA/commercial shortcuts set property context, and emergency shortcuts
set timing; both still require the visitor to choose an actual tree service.
For the existing n8n schema, Emergency timing submits the legacy
`Emergency — call me ASAP` service and `As soon as possible` timing, retaining
the actual service and urgency in details. Optional property type also goes into
details rather than adding a workflow field. The editable draft stays unchanged.

Step two summarizes the project and provides an Edit action. Claimed offers are
shown in the quote and prepended once to the outgoing job details, so the existing
n8n log and branded email receive the context without a workflow change. The
visitor's original textarea remains unchanged, including after retries.

The offer becomes eligible after 15 seconds, then waits until the hero copy,
quote, headings and marked controls are clear. It hides during submission and
after success. The copy asks about the 10% offer; its expiration and conditions
still need business confirmation. No recurring “this week only” claim is shown.

The short review beside the form is attributed to Huy Tran, December 14, 2025,
and linked to the [Yelp source](https://www.yelp.com/biz/paez-tree-service-anaheim).
The Spanish excerpt is labeled as a translation. Aggregate rating numbers have
been replaced with review links rather than presenting an unverified live score.

The form posts URL-encoded data to
`https://n8n.srv1351927.hstgr.cloud/webhook/paez-quote`. Along with the form fields,
it sends a retry-stable UUID (`lead_id`), language, browser language, time zone,
viewport, submission time, page/referrer paths and the five standard UTM fields.
URL query strings and fragments are stripped. The customer supplies the service
address explicitly; browser geolocation, cookies and IP addresses are not
collected by the form or copied into the lead table.

Success requires JSON `{ "ok": true, "lead_id": "matching-request-UUID" }`.
Errors and timeouts retain the draft. Client checks are repeated by n8n.

## n8n workflow and notification status

The October 18 form update is published as version
`a8178481-0458-4f61-bda2-4042ede3276b`. The project step asks for tree/stump count
and approximate height (hidden for stump removal); ZIP is required only in the
contact step's property-address block. The paper-style project summary shows
service, count, height and timing, with an Edit project action.

Claiming the website offer fills the optional `discount_code` field with `WEB10`.
Customers can enter, replace or remove a code. WEB10 is a 10% discount request,
subject to Paez confirming eligibility, and appears prominently in the email.
Tree count, height and discount code have dedicated lead-log columns and also
appear in the accepted-fields JSON. Drafts and retries preserve these fields in
English and Mexican Spanish. Other entered codes are logged for manual review.

Email call/text links normalize US numbers to `+1` format. The text action is
labeled for mobile and includes a visible number and manual-copy fallback;
opening an SMS composer still depends on the mail client and messaging app.
No SMS is sent automatically. Paez notifications remain disabled: the Gmail
node sends only to `mrmushmushow@gmail.com`.

n8n simulation `591` passed with database, webhook responses and Gmail pinned
to sample outputs. Validation and email rendering ran normally; no real lead
or email was created. Local automated tests also mock every form request.
Browser checks confirmed the actual promo click fills WEB10, the Spanish form
and HTML email preview fit 320 CSS pixels without horizontal overflow, and
stump removal hides tree height. Screenshots and a simulated email preview are
saved in `../Reports/Website/2026-10-18/`.

The October 17 address update is published as version
`4708e9e8-213c-46d3-aeba-7d78e180b7eb`. New requests send `form_version=2` and
require a complete service address on the client and in n8n. Address fields and
the assembled `property_address` have dedicated columns in `paez-leads` and are
also retained in the accepted-fields snapshot. Older deployed forms remain
accepted during rollout; an incomplete address on those leads is clearly labeled
in the email and does not produce a misleading ZIP-only property map.

The LC Marketing email shows a prominent property-location card with the full
address and **View map** / **Get directions** buttons. URLs follow Google's
[Maps URLs specification](https://developers.google.com/maps/documentation/urls/get-started)
and are built from encoded address fields, not user-provided links. Unit details
stay visible in the email but are omitted from the map search. Directions use
the recipient's chosen starting point. These are links, not embedded map images,
as requested. No address is automatically sent to a geocoder or map-image API.

LC Marketing's owner confirmed yellow, black and white. The notification uses
`#FECE00` sampled from the supplied logo, a black header, white content and black
text on yellow actions. The unchanged source logo and palette notes are saved in
`automation/brand/`. The branding correction is published as n8n version
`44fc7f06-1ce8-4398-9003-53c6661e9914`. Desktop and mobile previews were checked
locally; no emails were sent during this branding pass.

[Paez - Lead Capture](https://n8n.srv1351927.hstgr.cloud/workflow/2EiOESirvx7fpD1s)
is active in Giovanni Carrillo's personal n8n project. It saves accepted leads in
the existing `paez-leads` data table before confirming receipt, then sends an
LC Marketing branded HTML notification and records the email status/message ID.
The table includes the job/contact fields, attribution and an accepted-fields
JSON snapshot. Storage failures return 503; invalid requests return 400. Email
errors are recorded as `failed` after the configured retry. Inspect these rows
in n8n if a notification is missing.
Every submitted name receives the normal contact actions. A name typed into the
public form cannot mark the notification as a test or suppress follow-up.

**Paez notifications are disabled at the owner's request.** The only current
recipient is `mrmushmushow@gmail.com`. To enable Paez later, add
`paeztreeservices@gmail.com` to the Gmail node's **Send To**, update the footer
in `Build LC Marketing Email`, and publish the workflow. Keep test notifications
restricted to LC Marketing.

The workflow recognizes sequential retries by `lead_id` and acknowledges the
existing row without sending another email. The data table has no unique-key
constraint, so simultaneous duplicate requests are not guaranteed exactly once.
The previous simple form payload remains accepted for compatibility.

The pre-upgrade draft and active workflow are backed up outside the repository in
`../Reports/Website/2026-10-17/n8n-before-upgrade.json`.

## Verification

`npm test` builds English and Spanish and runs 111 isolated checks covering form
steps, validation, translation handoff, timeouts, retry identity, promotion timing,
header-aware positioning, offer claims, service preselection, summary editing,
keyboard navigation, contextual contact controls, metadata minimization and safe
email rendering. Coverage includes separate service/urgency/property context,
legacy draft handoff and compatibility with the existing n8n normalizer.
Automated requests are mocked.

The address pass verifies required fields, optional units, complete address
logging, language handoff, retries, URL encoding, HTML escaping and the saved
workflow's recipient and field mappings. n8n test execution `589` succeeded with
webhook, database operations, responses and Gmail pinned to simulated outputs;
the validation and email-rendering nodes ran normally. No lead rows or emails
were created by that test. Browser review covered the English form at 1440 pixels,
Spanish at 320 pixels, switching with address values retained, and the email
layout at 320 and 1000 pixels, without horizontal overflow. The website remains
local; the updated n8n workflow is published and ready for it.

The desktop/laptop cleanup reduces the header height, aligns its controls with
the hero grid, removes the photo's hard left edge and repeated hero trust copy,
and makes the first form step compact. Gold action buttons now share pill styling;
service hints use clearer type and ZIP placeholders explicitly show an example.
English and Spanish were checked responsively from 320 to 1920 CSS pixels,
including the tighter tablet header breakpoints. This cleanup sent no form
submissions or emails and made no n8n changes. Paez notifications remain disabled
and conversion tracking remains deferred.

The content pass was checked in both languages at 320, 390, 768 and 1440 pixels
without horizontal overflow. Browser checks cover FAQ Enter/Space controls,
comparison keyboard input and gallery tabs, project-to-estimate preselection,
language handoff, section focus and the mobile map/contact layout. Published
n8n recipients were checked read-only; only LC Marketing remains enabled.

On October 17, 2026, two clearly labeled real test notifications were sent only to
LC Marketing: a workflow test and a browser submission after switching English
to Spanish. Both were logged and marked sent. A repeat of the first request
reused its existing row without another email. No test email was sent to Paez.

## Current follow-ups

- Finish launch metadata (canonical URLs, sitemap and business structured data)
  once the intended production domain is confirmed.
- Confirm the promotion's expiration and business-approved terms.
- Enable Paez notifications when authorized and recheck a submission from the
  final deployed domain. The webhook currently allows cross-origin form requests.

No deployment is triggered by the local build or tests.
