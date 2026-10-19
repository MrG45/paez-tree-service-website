/* Two-step estimate requests and explicit language handoff. */
(function () {
  'use strict';

  var language = document.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  var copy = language === 'es' ? {
    name: 'Escriba su nombre.',
    phone: 'Escriba un número de teléfono válido de 10 a 15 dígitos, incluyendo el código de área.',
    service: 'Seleccione el servicio que necesita.',
    postal_code: 'Escriba el código postal de la propiedad (5 dígitos o ZIP+4).',
    street_address: 'Escriba la calle y el número de la propiedad.',
    address_line2: 'Use hasta 80 caracteres en una sola línea para el departamento o unidad.',
    city: 'Escriba la ciudad donde se encuentra la propiedad.',
    state: 'El servicio se ofrece en California (CA).',
    email: 'Escriba un correo electrónico válido o deje este campo vacío.',
    discount_code: 'Use hasta 32 letras, números, guiones o guiones bajos para el código.',
    count: '¿Cuántos árboles?', stumps: '¿Cuántos tocones?', treesLabel: 'Árboles', stumpsLabel: 'Tocones',
    sending: 'Enviando…',
    submit: 'Solicitar mi cotización gratis →',
    invalid: 'Revise los campos indicados para continuar.',
    error: 'No pudimos confirmar su solicitud. Sus datos siguen aquí. Inténtelo de nuevo o llame al (714) 926-9413.',
    timeout: 'No recibimos la confirmación a tiempo. Sus datos siguen aquí. Puede intentar de nuevo o llamar al (714) 926-9413.',
    wait: 'Espere a que termine el envío antes de cambiar de idioma.',
    offer: 'Oferta del sitio web WEB10: descuento del 10% solicitado. Paez confirmará los detalles.',
    received: function (data) {
      return 'Gracias, ' + data.name.trim().split(/\s+/)[0] + '. Recibimos su solicitud. ' +
        (data.contact_preference === 'Text' ? 'Le enviaremos un mensaje de texto al ' : 'Le llamaremos al ') + data.phone.trim() + ' para coordinar su cotización.';
    }
  } : {
    name: 'Enter your name.',
    phone: 'Enter a valid phone number with 10 to 15 digits, including the area code.',
    service: 'Select the service you need.',
    postal_code: 'Enter the property ZIP code (5 digits or ZIP+4).',
    street_address: 'Enter the property street address, including the house number.',
    address_line2: 'Use up to 80 characters on one line for the apartment or unit.',
    city: 'Enter the city where the property is located.',
    state: 'Service is offered in California (CA).',
    email: 'Enter a valid email address or leave this field blank.',
    discount_code: 'Use up to 32 letters, numbers, hyphens or underscores for the code.',
    count: 'How many trees?', stumps: 'How many stumps?', treesLabel: 'Trees', stumpsLabel: 'Stumps',
    sending: 'Sending…',
    submit: 'Request my free estimate →',
    invalid: 'Please check the highlighted fields to continue.',
    error: 'We could not confirm your request. Your details are still here. Try again or call (714) 926-9413.',
    timeout: 'We did not receive confirmation in time. Your details are still here. You can try again or call (714) 926-9413.',
    wait: 'Please wait for your request to finish before switching languages.',
    offer: 'Website offer WEB10: 10% discount requested. Paez will confirm the details.',
    received: function (data) {
      return 'Thanks, ' + data.name.trim().split(/\s+/)[0] + '. We received your request and will ' +
        (data.contact_preference === 'Text' ? 'text you at ' : 'call you at ') + data.phone.trim() + ' to arrange your estimate.';
    }
  };

  var form = document.getElementById('pzQuoteForm');
  var status = document.getElementById('pzFormStatus');
  var success = document.getElementById('pzFormSuccess');
  var successMessage = document.getElementById('pzSuccessMessage');
  var submit = form && form.querySelector('[type="submit"]');
  var next = form && form.querySelector('[data-form-next]');
  var back = form && form.querySelector('[data-form-back]');
  var summary = document.getElementById('pzRequestSummary');
  var edit = form && form.querySelector('[data-summary-edit]');
  var offerNotice = document.getElementById('pzOfferApplied');
  var emergencyNote = document.getElementById('pzEmergencyNote');
  var pending = false;
  var sent = false;
  var step = 1;
  var leadId = '';
  var submittedAt = '';
  var handoffKey = 'paez-language-handoff';
  var restoredPosition;
  // These regions and their content have the same DOM order in both languages.
  var readingRegions = 'main > section, .pz-trust-band, footer';
  var readingAnchors = 'h1, h2, h3, p, .pz-card, .pz-trust-item, details, img, input:not([type="hidden"]), select, textarea, button';
  var offerClaimed = false;
  try { offerClaimed = sessionStorage.getItem('paez-promo-claimed') === '1'; } catch (_) { /* A claim event also works without storage. */ }
  var fieldNames = ['name', 'phone', 'service', 'tree_count', 'tree_height', 'postal_code', 'street_address', 'address_line2', 'city', 'state', 'timeline', 'property_type', 'contact_preference', 'email', 'discount_code', 'details', 'website'];
  var stepFields = { 1: ['service'], 2: ['name', 'phone', 'street_address', 'address_line2', 'city', 'state', 'postal_code', 'email', 'discount_code'] };
  var services = ['Tree Trimming', 'Tree Removal', 'Stump Removal', 'Palm Tree Service'];
  var legacyEmergency = 'Emergency — call me ASAP';
  var attribution = {};
  var query = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (name) {
    if (query.has(name)) attribution[name] = query.get(name).slice(0, 200);
  });

  function safeUrl(value) {
    if (!value) return '';
    try {
      var url = new URL(value);
      return /^https?:$/.test(url.protocol) ? (url.origin + url.pathname).slice(0, 1000) : '';
    } catch (_) { return ''; }
  }
  var referrer = safeUrl(document.referrer);

  function captureReadingPosition() {
    var position = { top: Math.max(0, window.scrollY || 0) };
    if (position.top < 2) return position;
    var header = document.querySelector('.pz-header');
    var readingLine = (header ? header.getBoundingClientRect().bottom : 0) + 24;
    var nearest = Infinity;
    Array.from(document.querySelectorAll(readingRegions)).forEach(function (region, index) {
      var bounds = region.getBoundingClientRect();
      if (!bounds.height) return;
      var distance = Math.max(bounds.top - readingLine, readingLine - bounds.bottom, 0);
      if (distance >= nearest) return;
      nearest = distance;
      position.region = index;
      position.offset = bounds.top;
      position.hash = region.id ? '#' + region.id : '';
    });
    nearest = Infinity;
    Array.from(document.querySelectorAll(readingRegions)).forEach(function (region, regionIndex) {
      Array.from(region.querySelectorAll(readingAnchors)).forEach(function (anchor, index) {
        var bounds = anchor.getBoundingClientRect();
        if (!bounds.height || !bounds.width || bounds.bottom <= readingLine || bounds.top >= window.innerHeight) return;
        // Prefer text beside a vertically centered image when both start at
        // nearly the same height; translated copy can move that image itself.
        var distance = Math.abs(bounds.top - readingLine) + (anchor.tagName === 'IMG' ? 24 : 0);
        if (distance >= nearest) return;
        nearest = distance;
        position.region = regionIndex;
        position.anchor = index;
        position.offset = bounds.top;
        position.hash = region.id ? '#' + region.id : '';
      });
    });
    return position;
  }

  function restoreReadingPosition(position) {
    if (!position || !Number.isFinite(position.top) || position.top < 0) return;
    var stopped = false;
    var previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    function restore() {
      if (stopped) return;
      var top = position.top;
      var region = Number.isInteger(position.region) && document.querySelectorAll(readingRegions)[position.region];
      var anchor = region && Number.isInteger(position.anchor) && region.querySelectorAll(readingAnchors)[position.anchor];
      var target = anchor || region;
      if (target && Number.isFinite(position.offset) && target.getBoundingClientRect().height) {
        // Preserve the same visible content, accounting for translated text wrapping.
        top = window.scrollY + target.getBoundingClientRect().top - position.offset;
      }
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'instant' });
    }
    function stop() {
      if (stopped) return;
      stopped = true;
      history.scrollRestoration = previousRestoration;
      window.removeEventListener('load', restore);
      ['wheel', 'touchstart', 'pointerdown', 'keydown', 'pagehide'].forEach(function (name) {
        window.removeEventListener(name, stop);
      });
      clearTimeout(timer);
    }
    // Font loading can change translated line lengths. Correct that once ready,
    // but never pull the page back after the visitor starts interacting again.
    ['wheel', 'touchstart', 'pointerdown', 'keydown', 'pagehide'].forEach(function (name) {
      window.addEventListener(name, stop, { passive: true });
    });
    window.addEventListener('load', restore);
    var timer = setTimeout(stop, 1500);
    restore();
    window.requestAnimationFrame(restore);
    if (document.fonts) document.fonts.ready.then(restore);
  }

  function values() {
    var result = {};
    fieldNames.forEach(function (name) {
      var field = form.elements.namedItem(name);
      result[name] = field ? field.value : '';
    });
    return result;
  }

  function controls(name) {
    return Array.from(form.querySelectorAll('[name="' + name + '"]'));
  }

  function setStatus(message, error) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', !!error);
  }

  function fieldError(name) {
    var value = form.elements.namedItem(name).value.trim();
    if (name === 'name') return value.length < 2 || value.length > 100 || /[\r\n]/.test(value) ? copy.name : '';
    if (name === 'phone') {
      var digits = value.replace(/\D/g, '');
      return !/^\+?[\d\s().-]+$/.test(value) || digits.length < 10 || digits.length > 15 || /^(\d)\1+$/.test(digits) ? copy.phone : '';
    }
    if (name === 'service') return services.indexOf(value) >= 0 ? '' : copy.service;
    if (name === 'postal_code') return /^\d{5}(?:-\d{4})?$/.test(value) ? '' : copy.postal_code;
    if (name === 'street_address') return value.length < 5 || value.length > 160 || /[\u0000-\u001f\u007f]/.test(value) ? copy.street_address : '';
    if (name === 'address_line2') return value.length > 80 || /[\u0000-\u001f\u007f]/.test(value) ? copy.address_line2 : '';
    if (name === 'city') return value.length < 2 || value.length > 100 || /[\u0000-\u001f\u007f]/.test(value) ? copy.city : '';
    if (name === 'state') return value === 'CA' ? '' : copy.state;
    if (name === 'email') return value && (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) || value.length > 254) ? copy.email : '';
    if (name === 'discount_code') return value && !/^[a-z0-9_-]{1,32}$/i.test(value) ? copy.discount_code : '';
    return '';
  }

  function validate(name) {
    var message = fieldError(name);
    var error = document.getElementById('pz-' + name + '-error');
    controls(name).forEach(function (field) {
      field.setCustomValidity(message);
      field.setAttribute('aria-invalid', String(!!message));
    });
    if (error) { error.textContent = message; error.hidden = !message; }
    return !message;
  }

  function validateStep(number) {
    var invalid = stepFields[number].filter(function (name) { return !validate(name); });
    if (invalid.length) {
      setStatus(copy.invalid, true);
      controls(invalid[0])[0].focus();
      return false;
    }
    setStatus('', false);
    return true;
  }

  function showStep(number, focus) {
    step = number === 2 ? 2 : 1;
    form.querySelectorAll('[data-form-step]').forEach(function (section) {
      section.hidden = Number(section.dataset.formStep) !== step;
    });
    form.querySelectorAll('[data-progress-step]').forEach(function (item) {
      var current = Number(item.dataset.progressStep) === step;
      if (current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-complete', Number(item.dataset.progressStep) < step);
    });
    if (step === 2) updateSummary();
    if (focus) document.getElementById('pz-step-' + step + '-title').focus();
  }

  function updateSummary() {
    if (!summary) return;
    updateTreeFields();
    var selectedService = form.querySelector('input[name="service"]:checked');
    var serviceLabel = selectedService && selectedService.closest('label').querySelector('strong');
    var timeline = form.elements.namedItem('timeline');
    var selectedTimeline = timeline.options[timeline.selectedIndex];
    var parts = {
      service: serviceLabel ? serviceLabel.textContent.trim() : '—',
      count: selectedLabel('tree_count'),
      height: selectedLabel('tree_height'),
      timeline: selectedTimeline ? selectedTimeline.textContent.trim() : '—'
    };
    Object.keys(parts).forEach(function (name) {
      var target = summary.querySelector('[data-summary-' + name + ']');
      // Values and translated labels are always inserted as plain text.
      if (target) target.textContent = parts[name];
    });
  }

  function selectedLabel(name) {
    var select = form.elements.namedItem(name);
    return select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent.trim() : '—';
  }

  function updateTreeFields() {
    var stumps = form.elements.namedItem('service').value === 'Stump Removal';
    form.querySelector('[data-tree-count-label]').textContent = stumps ? copy.stumps : copy.count;
    form.querySelector('[data-tree-height-field]').hidden = stumps;
    form.elements.namedItem('tree_height').disabled = stumps;
    summary.querySelector('[data-summary-count-label]').textContent = stumps ? copy.stumpsLabel : copy.treesLabel;
    summary.querySelector('[data-summary-height-row]').hidden = stumps;
  }

  function updateOffer() {
    var code = form && form.elements.namedItem('discount_code');
    offerClaimed = !!code && code.value.trim().toUpperCase() === 'WEB10';
    if (offerNotice) offerNotice.hidden = !offerClaimed;
    try { sessionStorage.setItem('paez-promo-claimed', offerClaimed ? '1' : '0'); } catch (_) { /* Optional session state. */ }
  }

  document.addEventListener('paez:offer-claimed', function () {
    if (!form || pending || sent) return;
    form.elements.namedItem('discount_code').value = 'WEB10';
    validate('discount_code');
    updateOffer();
  });

  function updateEmergency() {
    if (emergencyNote) emergencyNote.hidden = form.elements.namedItem('timeline').value !== 'Emergency';
  }

  function applyServiceIntent(value) {
    // Older service links and drafts describe a property or urgency. Preserve
    // that context without inventing an actual tree service for the visitor.
    if (value === 'HOA / Commercial') {
      form.elements.namedItem('property_type').value = value;
    } else if (value === legacyEmergency) {
      form.elements.namedItem('timeline').value = 'Emergency';
    } else if (services.indexOf(value) >= 0) {
      controls('service').forEach(function (radio) { radio.checked = radio.value === value; });
    } else return false;
    return true;
  }

  function showSuccess(data, focus) {
    sent = true;
    form.hidden = true;
    success.hidden = false;
    // User-supplied values are only inserted as plain text.
    if (successMessage) successMessage.textContent = copy.received(data);
    document.body.classList.remove('pz-form-editing');
    if (focus) success.focus();
  }

  function createLeadId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    // Older secure browsers expose getRandomValues but not randomUUID.
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes, function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  if (form && success) {
    if (offerClaimed) form.elements.namedItem('discount_code').value = 'WEB10';
    // Keep contact information only during an explicit language change, and
    // consume it immediately. Browsers with storage blocked still work.
    try {
      var handoff = JSON.parse(sessionStorage.getItem(handoffKey) || 'null');
      sessionStorage.removeItem(handoffKey);
      if (handoff && handoff.to === language && handoff.expires > Date.now() && handoff.values) {
        restoredPosition = handoff.position;
        fieldNames.forEach(function (name) {
          var field = form.elements.namedItem(name);
          var max = name === 'details' ? 2000 : name === 'email' ? 254 : name === 'street_address' ? 160 : (name === 'name' || name === 'city') ? 100 : 80;
          if (field && typeof handoff.values[name] === 'string') field.value = handoff.values[name].slice(0, max);
        });
        applyServiceIntent(handoff.values.service);
        if (typeof handoff.leadId === 'string' && /^[a-f0-9-]{36}$/i.test(handoff.leadId)) leadId = handoff.leadId;
        if (typeof handoff.submittedAt === 'string') submittedAt = handoff.submittedAt;
        if (handoff.attribution && typeof handoff.attribution === 'object') {
          ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (name) {
            if (typeof handoff.attribution[name] === 'string') attribution[name] = handoff.attribution[name].slice(0, 200);
          });
        }
        if (typeof handoff.referrer === 'string') referrer = safeUrl(handoff.referrer);
        if (handoff.offerClaimed === true && typeof handoff.values.discount_code !== 'string') form.elements.namedItem('discount_code').value = 'WEB10';
        showStep(!handoff.sent && services.indexOf(form.elements.namedItem('service').value) < 0 ? 1 : handoff.step, false);
        if (handoff.sent) showSuccess(values(), false);
      }
    } catch (_) { /* Storage availability never blocks a request. */ }

    updateEmergency();
    updateTreeFields();
    updateOffer();
    controls('discount_code').forEach(function (field) {
      field.addEventListener('input', updateOffer);
      field.addEventListener('change', function () { field.value = field.value.trim().toUpperCase(); updateOffer(); });
    });
    controls('timeline').forEach(function (field) {
      field.addEventListener('input', updateEmergency);
      field.addEventListener('change', updateEmergency);
    });
    ['service', 'tree_count', 'tree_height', 'timeline'].forEach(function (name) {
      controls(name).forEach(function (field) {
        field.addEventListener('input', updateSummary);
        field.addEventListener('change', updateSummary);
      });
    });
    stepFields[1].concat(stepFields[2]).forEach(function (name) {
      controls(name).forEach(function (field) {
        function revalidate() {
          if (field.getAttribute('aria-invalid') === 'true') validate(name);
          if (name === 'service') updateEmergency();
        }
        field.addEventListener('input', revalidate);
        field.addEventListener('change', revalidate);
      });
    });

    next.addEventListener('click', function () {
      if (!pending && !sent && validateStep(1)) showStep(2, true);
    });
    function editProject() {
      if (pending || sent) return;
      setStatus('', false);
      showStep(1, true);
    }
    back.addEventListener('click', editProject);
    if (edit) edit.addEventListener('click', editProject);

    document.querySelectorAll('[data-service-select]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (pending || sent) { event.preventDefault(); return; }
        var value = link.dataset.serviceSelect;
        if (!applyServiceIntent(value)) return;
        // A property or urgency shortcut starts a project without selecting a
        // tree service. Wait for Next before flagging a fresh empty choice.
        if (services.indexOf(form.elements.namedItem('service').value) >= 0) validate('service');
        updateEmergency();
        updateSummary();
        editProject();
        // Keep the link's native #quote navigation and browser history behavior.
      });
    });

    form.addEventListener('focusin', function () { document.body.classList.add('pz-form-editing'); });
    form.addEventListener('focusout', function (event) {
      if (!form.contains(event.relatedTarget)) document.body.classList.remove('pz-form-editing');
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (pending || sent) return;
      if (step === 1) {
        if (validateStep(1)) showStep(2, true);
        return;
      }
      // Recheck earlier details if a restored draft is incomplete.
      if (stepFields[1].some(function (name) { return !!fieldError(name); })) {
        showStep(1, false);
        validateStep(1);
        return;
      }
      if (!validateStep(2)) return;

      pending = true;
      form.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      back.disabled = true;
      if (edit) edit.disabled = true;
      submit.textContent = copy.sending;
      setStatus(copy.sending, false);
      var data = values();
      fieldNames.forEach(function (name) { data[name] = data[name].trim(); });
      data.discount_code = data.discount_code.toUpperCase();
      if (data.service === 'Stump Removal') data.tree_height = '';
      // The published workflow accepts four timeline values and routes urgent
      // notifications using its legacy Emergency service. Keep that contract,
      // while storing the visitor's specific service and property in details.
      // Build this from the draft on each attempt so retries cannot duplicate it.
      var context = [];
      if (data.timeline === 'Emergency') {
        context.push('Requested service: ' + data.service);
        context.push('Urgency: Emergency — urgent hazard');
        data.service = legacyEmergency;
        data.timeline = 'As soon as possible';
      }
      if (data.property_type) context.push('Property type: ' + data.property_type);
      delete data.property_type;
      if (context.length) data.details = context.join('\n') + (data.details ? '\n\n' + data.details : '');
      // Keep the draft unchanged so retries and language changes never add the
      // offer twice. The existing lead log and notification already retain details.
      if (data.discount_code === 'WEB10') data.details = copy.offer + (data.details ? '\n\n' + data.details : '');
      data.source = 'website';
      data.form_version = '2';
      data.language = language;
      data.page_url = safeUrl(location.href);
      data.referrer = referrer;
      data.browser_language = (navigator.language || '').slice(0, 32);
      data.viewport = window.innerWidth + 'x' + window.innerHeight;
      try { data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { data.timezone = ''; }
      Object.keys(attribution).forEach(function (name) { data[name] = attribution[name]; });
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 15000);
      try {
        if (!leadId) leadId = createLeadId();
        if (!submittedAt) submittedAt = new Date().toISOString();
        data.lead_id = leadId;
        data.submitted_at = submittedAt;
        var response = await fetch(form.action, {
          method: 'POST',
          body: new URLSearchParams(data),
          signal: controller.signal
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var confirmation = await response.json();
        // A generic 200 or HTML page is not proof the lead was recorded.
        if (confirmation.ok !== true || confirmation.lead_id !== leadId) throw new Error('Unconfirmed lead');
        setStatus('', false);
        showSuccess(data, true);
      } catch (error) {
        setStatus(error.name === 'AbortError' ? copy.timeout : copy.error, true);
      } finally {
        clearTimeout(timer);
        pending = false;
        form.setAttribute('aria-busy', 'false');
        submit.disabled = false;
        back.disabled = false;
        if (edit) edit.disabled = false;
        submit.textContent = copy.submit;
      }
    });
  }

  document.querySelectorAll('[data-language-link]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.dataset.lang === language) { event.preventDefault(); return; }
      if (pending) { event.preventDefault(); setStatus(copy.wait, false); return; }
      var position = captureReadingPosition();
      var target = new URL(link.href, location.href);
      // If storage is blocked, the current region is still a better fallback
      // than a stale fragment left behind by a previous navigation click.
      target.hash = position.hash || '';
      if (form) {
        try {
          sessionStorage.setItem(handoffKey, JSON.stringify({
            to: link.dataset.lang,
            expires: Date.now() + 60000,
            position: position,
            values: values(),
            step: step,
            sent: sent,
            leadId: leadId,
            submittedAt: submittedAt,
            offerClaimed: offerClaimed,
            attribution: attribution,
            referrer: referrer
          }));
          // A fragment would let native anchor scrolling override restoration.
          target.hash = '';
        } catch (_) { /* The destination still works without browser storage. */ }
      }
      link.href = target.href;
    });
  });
  restoreReadingPosition(restoredPosition);
})();
