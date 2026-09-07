/* Paez Tree Service — theme interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('pzBurger');
  var mobileMenu = document.getElementById('pzMobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.style.display === 'flex';
      mobileMenu.style.display = open ? 'none' : 'flex';
      burger.setAttribute('aria-expanded', String(!open));
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.style.display = 'none';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Before / After compare sliders ----------
     Works on any element marked [data-cmp] that contains a [data-cmp-clip]
     wrapper, a [data-cmp-handle] bar and a range input [data-cmp-range]. */
  function initCompare(root) {
    if (!root || root.getAttribute('data-cmp-ready')) return;
    var range = root.querySelector('[data-cmp-range]');
    var clip = root.querySelector('[data-cmp-clip]');
    var handle = root.querySelector('[data-cmp-handle]');
    if (!range || !clip || !handle) return;
    root.setAttribute('data-cmp-ready', '1');
    range.addEventListener('input', function () {
      var v = +range.value;
      clip.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      handle.style.left = v + '%';
    });
  }
  function initComparesIn(scope) {
    (scope || document).querySelectorAll('[data-cmp]').forEach(initCompare);
  }
  initComparesIn(document);

  /* ---------- Gallery + Lightbox ---------- */
  /* Photos live in the theme at /assets/gallery (full size) and
     /assets/gallery/thumb (small, used for the lightbox rail).
     To add or remove a photo, drop both sizes in and edit this list. */
  var tplUri = window.PZ_TPL_URI || '';
  var galleryBase = tplUri + '/assets/gallery/';
  var photos = [
    { file: 'paez-01-climber-cutting-trunk.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Safety is our top priority &mdash; proper rigging and technique on every climb.' },
    { file: 'paez-02-crane-palm-removal-apartment.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'No job too big &mdash; safe, controlled takedowns in tight spots.' },
    { file: 'paez-03-stump-grinder-operator.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'Stump grinding &mdash; taken below grade and cleaned up.' },
    { file: 'paez-04-paez-tree-service-crew.jpg', alt: 'The Paez Tree Service crew in Anaheim, CA', caption: 'The crew behind every job &mdash; experienced, careful and on time.' },
    { file: 'paez-05-large-tree-removal-over-pool.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'On the job across Anaheim and Orange County.' },
    { file: 'paez-06-trimmed-trees-modern-building.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'Full cleanup and haul-away &mdash; we leave your property spotless.' },
    { file: 'paez-07-bucket-truck-and-chipper-on-site.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'Licensed, bonded and insured &mdash; with the equipment to back it up.' },
    { file: 'paez-08-aerial-crane-tree-removal.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'The right equipment for large trees near homes and power lines.' },
    { file: 'paez-09-log-rounds-and-trucks-on-site.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'Cones out, tarps down &mdash; we protect your property while we work.' },
    { file: 'paez-10-crane-trimming-tall-tree.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'Crane and bucket work with full traffic control in place.' },
    { file: 'paez-11-truck-fleet-lineup.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'Our own trucks, chippers and grinders on every job.' },
    { file: 'paez-12-poolside-cleared-and-cleaned.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'Letting a property shine &mdash; well-kept trees lift the whole yard.' },
    { file: 'paez-13-crane-removal-between-buildings.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'No job too big &mdash; safe, controlled takedowns in tight spots.' },
    { file: 'paez-14-crane-tree-removal-over-garage.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'The right equipment for large trees near homes and power lines.' },
    { file: 'paez-15-tall-palm-crane-removal.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'Crane and bucket work with full traffic control in place.' },
    { file: 'paez-16-palm-crown-hillside-view.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Palm trimming and skinning &mdash; clean, healthy crowns.' },
    { file: 'paez-17-two-branded-trucks-and-chipper.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'The right crew and equipment to get the job done right the first time.' },
    { file: 'paez-18-three-tall-palms-trimmed.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Tall palm work handled safely from the crown down.' },
    { file: 'paez-19-tarp-protection-under-carport.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'A full removal handled start to finish, cleanup included.' },
    { file: 'paez-20-front-yard-trimmed-and-planted.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'The finished result &mdash; clean lines, clear space, no debris.' },
    { file: 'paez-21-poolside-cypress-hedge-shaped.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'Full cleanup and haul-away &mdash; we leave your property spotless.' },
    { file: 'paez-22-stump-grinding-in-lawn.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'No stump left behind &mdash; ground out and hauled away.' },
    { file: 'paez-23-truck-loaded-with-log-rounds.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Full cleanup and haul-away &mdash; chipped and gone the same day.' },
    { file: 'paez-24-backyard-trees-shaped.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'Letting a property shine &mdash; well-kept trees lift the whole yard.' },
    { file: 'paez-25-front-yard-stump-grinding.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'Stumps ground flush so you can replant or re-sod.' },
    { file: 'paez-26-row-of-palms-trimmed.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Fan and date palms trimmed or removed to order.' },
    { file: 'paez-27-crew-cutting-on-front-lawn.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'On the job across Anaheim and Orange County.' },
    { file: 'paez-28-chipper-and-crew-on-lawn.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'Cones out, tarps down &mdash; we protect your property while we work.' },
    { file: 'paez-29-branded-truck-and-chipper-street.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'Licensed, bonded and insured &mdash; with the equipment to back it up.' },
    { file: 'paez-30-stump-grinding-in-progress.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'Stump grinding &mdash; taken below grade and cleaned up.' },
    { file: 'paez-31-climber-in-tree-canopy.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Certified climbers reaching what a bucket truck can\'t.' },
    { file: 'paez-32-green-dump-truck.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'Our own trucks, chippers and grinders on every job.' },
    { file: 'paez-33-crane-and-trucks-traffic-control.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'A full removal handled start to finish, cleanup included.' },
    { file: 'paez-34-bucket-truck-in-palm-crown.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Palm trimming and skinning &mdash; clean, healthy crowns.' },
    { file: 'paez-35-bucket-truck-and-crew-cypress.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'No job too big &mdash; safe, controlled takedowns in tight spots.' },
    { file: 'paez-36-bucket-truck-large-tree-removal.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'The right equipment for large trees near homes and power lines.' },
    { file: 'paez-37-pool-area-cleared.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'The finished result &mdash; clean lines, clear space, no debris.' },
    { file: 'paez-38-owner-with-service-truck.jpg', alt: 'The Paez Tree Service crew in Anaheim, CA', caption: 'A local Anaheim team you can put your trees in the hands of.' },
    { file: 'paez-39-equipment-yard-bucket-chipper-dump.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'The right crew and equipment to get the job done right the first time.' },
    { file: 'paez-40-backyard-pool-and-palms.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'Full cleanup and haul-away &mdash; we leave your property spotless.' },
    { file: 'paez-41-palms-trimmed-at-estate.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Tall palm work handled safely from the crown down.' },
    { file: 'paez-42-climber-trimming-palm.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Precision cuts from up top, lowered down piece by piece.' },
    { file: 'paez-43-crane-removing-large-tree.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'Crane and bucket work with full traffic control in place.' },
    { file: 'paez-44-aerial-view-of-crew-and-trucks.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'On the job across Anaheim and Orange County.' },
    { file: 'paez-45-chipper-with-palm-fronds.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Brush chipped on site and logs loaded out. No mess left behind.' },
    { file: 'paez-46-crew-dump-truck-and-cones.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'Cones out, tarps down &mdash; we protect your property while we work.' },
    { file: 'paez-47-worker-carrying-palm-frond.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Fan and date palms trimmed or removed to order.' },
    { file: 'paez-48-skid-steer-and-bucket-truck.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'A full removal handled start to finish, cleanup included.' },
    { file: 'paez-49-crane-and-trucks-on-removal.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'No job too big &mdash; safe, controlled takedowns in tight spots.' },
    { file: 'paez-50-bucket-truck-tall-pine.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'The right equipment for large trees near homes and power lines.' },
    { file: 'paez-51-chipper-truck-loaded-fronds.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Everything hauled off so your property is left clean.' },
    { file: 'paez-52-bucket-truck-and-crew-at-house.jpg', alt: 'Paez Tree Service crane and bucket truck removing a large tree', caption: 'Crane and bucket work with full traffic control in place.' },
    { file: 'paez-53-climber-high-in-palm.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Safety is our top priority &mdash; proper rigging and technique on every climb.' },
    { file: 'paez-54-crew-tarp-and-dump-truck.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'On the job across Anaheim and Orange County.' },
    { file: 'paez-55-chipper-on-driveway.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'Licensed, bonded and insured &mdash; with the equipment to back it up.' },
    { file: 'paez-56-chipper-and-dump-truck-large-tree.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Full cleanup and haul-away &mdash; chipped and gone the same day.' },
    { file: 'paez-57-log-rounds-stacked-in-truck.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Brush chipped on site and logs loaded out. No mess left behind.' },
    { file: 'paez-58-crew-loading-stumps.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'Cones out, tarps down &mdash; we protect your property while we work.' },
    { file: 'paez-59-equipment-fleet-at-gate.jpg', alt: 'Paez Tree Service trucks, chipper and equipment on a job', caption: 'Our own trucks, chippers and grinders on every job.' },
    { file: 'paez-60-climber-on-trimmed-palm.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Certified climbers reaching what a bucket truck can\'t.' },
    { file: 'paez-61-palm-crowns-from-below.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Palm trimming and skinning &mdash; clean, healthy crowns.' },
    { file: 'paez-62-pool-and-yard-cleared.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'Letting a property shine &mdash; well-kept trees lift the whole yard.' },
    { file: 'paez-63-stump-grinder-in-back-yard.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'No stump left behind &mdash; ground out and hauled away.' },
    { file: 'paez-64-crew-member-with-chipper-and-dump.jpg', alt: 'The Paez Tree Service crew in Anaheim, CA', caption: 'Same crew, same standards, every single project.' },
    { file: 'paez-65-ground-stump-close-up.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'Stumps ground flush so you can replant or re-sod.' },
    { file: 'paez-66-worker-cutting-stump-on-planter.jpg', alt: 'Paez Tree Service crew working a tree removal job site', caption: 'A full removal handled start to finish, cleanup included.' },
    { file: 'paez-67-driveway-with-shaped-trees.jpg', alt: 'Property cleaned and trees shaped by Paez Tree Service', caption: 'The finished result &mdash; clean lines, clear space, no debris.' },
    { file: 'paez-68-climber-with-chainsaw-in-palm.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Precision cuts from up top, lowered down piece by piece.' },
    { file: 'paez-69-dump-truck-full-of-log-rounds.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Everything hauled off so your property is left clean.' },
    { file: 'paez-70-two-palms-trimmed-at-house.jpg', alt: 'Palm tree trimming by Paez Tree Service in Orange County', caption: 'Tall palm work handled safely from the crown down.' },
    { file: 'paez-71-freshly-cut-tree-stump.jpg', alt: 'Stump grinding by Paez Tree Service', caption: 'Stump grinding &mdash; taken below grade and cleaned up.' },
    { file: 'paez-72-chipper-and-brush-pile.jpg', alt: 'Brush chipping and debris haul-away by Paez Tree Service', caption: 'Full cleanup and haul-away &mdash; chipped and gone the same day.' },
    { file: 'paez-73-rigging-palm-trunk-sections.jpg', alt: 'Paez Tree Service climber rigging and cutting high in a tree', caption: 'Safety is our top priority &mdash; proper rigging and technique on every climb.' }
  ];
  function fullSrc(p) { return galleryBase + p.file; }
  function thumbSrc(p) { return galleryBase + 'thumb/' + p.file; }

  var gallery = document.getElementById('pzGallery');
  var lightbox = document.getElementById('pzLightbox');
  var lbThumbs = document.getElementById('pzLbThumbs');
  var lbFeed = document.getElementById('pzLbFeed');
  var lbClose = document.getElementById('pzLbClose');
  var lbCount = document.querySelector('.pz-lb-count');
  var activeIdx = 0;

  if (lbCount) lbCount.textContent = photos.length + ' photos from Paez Tree Service';

  if (gallery) {
    photos.slice(0, 6).forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'pz-gitem';
      d.style.cssText = 'border-radius:12px; overflow:hidden; position:relative; box-shadow:0 12px 30px rgba(0,0,0,.32); cursor:pointer';
      d.innerHTML =
        '<img src="' + fullSrc(p) + '" alt="' + p.alt + '" loading="lazy" style="width:100%; aspect-ratio:4/3; object-fit:cover; height:auto; display:block">' +
        '<span class="pz-gmag" style="position:absolute; top:12px; right:12px; width:34px; height:34px; border-radius:50%; background:rgba(8,40,22,.55); border:1px solid rgba(255,255,255,.25); color:#fff; display:flex; align-items:center; justify-content:center; font-size:15px">&#10530;</span>' +
        '<span style="position:absolute; left:0; right:0; bottom:0; padding:36px 16px 14px; background:linear-gradient(transparent, rgba(8,40,22,.92)); color:#fff; font-family:\'Barlow Semi Condensed\',sans-serif; font-weight:600; font-size:14px">' + p.caption + '</span>';
      d.addEventListener('click', function () { openLightbox(i); });
      gallery.appendChild(d);
    });
  }

  function buildLightbox() {
    if (!lbThumbs || !lbFeed || lbFeed.childNodes.length) return;
    photos.forEach(function (p, i) {
      var t = document.createElement('div');
      t.style.cssText = 'margin-bottom:10px; border-radius:8px; overflow:hidden; cursor:pointer; border:2px solid transparent; box-shadow:0 2px 8px rgba(15,26,19,.1)';
      t.setAttribute('data-thumb', i);
      t.innerHTML = '<img src="' + thumbSrc(p) + '" alt="' + p.alt + '" loading="lazy" style="width:100%; height:82px; object-fit:cover; display:block">';
      t.addEventListener('click', function () { scrollToPhoto(i); });
      lbThumbs.appendChild(t);

      var card = document.createElement('div');
      card.setAttribute('data-photo', i);
      card.style.cssText = 'max-width:660px; margin:0 auto 34px';
      card.innerHTML =
        '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px">' +
          '<span style="width:46px; height:46px; border-radius:50%; background:#124a28; color:#23a657; display:flex; align-items:center; justify-content:center; font-family:\'Barlow Condensed\',sans-serif; font-weight:800; font-size:17px; flex:none">PT</span>' +
          '<div style="flex:1; min-width:0">' +
            '<div style="font-weight:700; color:#0a3a1f; font-size:15px">Paez Tree Service</div>' +
            '<div style="display:flex; align-items:center; gap:7px; font-size:12.5px; color:#5f6b60">Anaheim, CA <img src="' + tplUri + '/assets/yelp-logo.png" alt="Yelp" style="height:12px; width:auto; display:block"></div>' +
          '</div>' +
        '</div>' +
        '<img src="' + fullSrc(p) + '" alt="' + p.alt + '" loading="lazy" style="width:100%; border-radius:10px; display:block; box-shadow:0 12px 30px rgba(15,26,19,.14)">' +
        '<div style="color:#d32323; font-size:14px; letter-spacing:1px; margin-top:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div>' +
        '<p style="color:#1b2620; font-size:15px; line-height:1.6; margin:7px 0 0">' + p.caption + '</p>';
      lbFeed.appendChild(card);
    });
    lbFeed.addEventListener('scroll', onFeedScroll, { passive: true });
  }

  function setActiveThumb(i) {
    activeIdx = i;
    if (!lbThumbs) return;
    lbThumbs.querySelectorAll('[data-thumb]').forEach(function (t, j) {
      t.style.borderColor = j === i ? '#0a3a1f' : 'transparent';
    });
  }

  function scrollToPhoto(i) {
    var card = lbFeed && lbFeed.querySelector('[data-photo="' + i + '"]');
    if (card) lbFeed.scrollTop = card.offsetTop - lbFeed.offsetTop - 16;
    setActiveThumb(i);
  }

  var scrRaf = 0;
  function onFeedScroll() {
    if (scrRaf) return;
    scrRaf = requestAnimationFrame(function () {
      scrRaf = 0;
      var cards = lbFeed.querySelectorAll('[data-photo]');
      var mark = lbFeed.scrollTop + lbFeed.clientHeight * 0.35;
      var idx = 0;
      for (var k = 0; k < cards.length; k++) {
        if (cards[k].offsetTop - lbFeed.offsetTop <= mark) idx = +cards[k].getAttribute('data-photo');
        else break;
      }
      if (idx !== activeIdx) setActiveThumb(idx);
    });
  }

  function openLightbox(i) {
    if (!lightbox) return;
    buildLightbox();
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { scrollToPhoto(i); });
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
  var viewAll = document.getElementById('pzViewGallery');
  if (viewAll) viewAll.addEventListener('click', function () { openLightbox(0); });
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }


  /* ---------- Before / After tab ---------- */
  /* Pairs live in the theme at /assets/before-after. Each entry needs a
     matching -before / -after photo shot from the same spot. */
  var baBase = tplUri + '/assets/before-after/';
  var baPairs = [
    { title: 'Backyard large tree removal', blurb: 'A mature tree overhanging the house and carport, taken down and hauled out.', before: 'ba-02-backyard-large-tree-removal-before.jpg', after: 'ba-02-backyard-large-tree-removal-after.jpg' },
    { title: 'Front yard pine removal', blurb: 'A full-height pine removed from a tight front yard, lawn left intact.', before: 'ba-03-front-yard-pine-removal-before.jpg', after: 'ba-03-front-yard-pine-removal-after.jpg' },
    { title: 'Side yard cypress removal', blurb: 'An overgrown cypress row along the wall cleared back to a clean walkway.', before: 'ba-04-side-yard-cypress-removal-before.jpg', after: 'ba-04-side-yard-cypress-removal-after.jpg' },
    { title: 'Front yard tree removal', blurb: 'A dead tree taken out of the front yard, hedge and lawn left untouched.', before: 'ba-05-front-yard-tree-removal-before.jpg', after: 'ba-05-front-yard-tree-removal-after.jpg' },
    { title: 'Front yard landscape clearing', blurb: 'Overgrown palms and shrubs cleared off the driveway and frontage.', before: 'ba-06-front-yard-landscape-clearing-before.jpg', after: 'ba-06-front-yard-landscape-clearing-after.jpg' },
    { title: 'Backyard clearing', blurb: 'A crowded backyard opened right up &mdash; seen from above, before and after.', before: 'ba-07-backyard-clearing-aerial-before.jpg', after: 'ba-07-backyard-clearing-aerial-after.jpg' },
    { title: 'Front yard olive tree removal', blurb: 'An olive tree removed cleanly from the front planter, no damage to the yard.', before: 'ba-08-front-yard-olive-tree-removal-before.jpg', after: 'ba-08-front-yard-olive-tree-removal-after.jpg' },
    { title: 'Garage-side cypress removal', blurb: 'Tall cypress crowding the garage removed, with full traffic control on the street.', before: 'ba-09-garage-side-cypress-removal-before.jpg', after: 'ba-09-garage-side-cypress-removal-after.jpg' },
    { title: 'Backyard tree trimming', blurb: 'A heavy backyard canopy thinned and shaped &mdash; light back in the yard.', before: 'ba-10-backyard-tree-trimming-before.jpg', after: 'ba-10-backyard-tree-trimming-after.jpg' },
    { title: 'Poolside tree removal', blurb: 'A large tree dropping into the pool removed, decking left clean.', before: 'ba-11-poolside-tree-removal-before.jpg', after: 'ba-11-poolside-tree-removal-after.jpg' },
    { title: 'Hillside backyard removal', blurb: 'Hillside growth cut back to reopen the slope behind the house.', before: 'ba-13-hillside-backyard-removal-before.jpg', after: 'ba-13-hillside-backyard-removal-after.jpg' }
  ];
  var baGrid = document.getElementById('pzBaGrid');

  function baCard(p) {
    return '<div class="pz-bacard" style="border-radius:12px; overflow:hidden; background:#0b3a20; border:1px solid rgba(255,255,255,.08); box-shadow:0 14px 34px rgba(0,0,0,.34)">' +
      '<div data-cmp style="position:relative; user-select:none">' +
        '<img src="' + baBase + p.after + '" alt="After &mdash; ' + p.title + '" loading="lazy" style="width:100%; aspect-ratio:4/5; object-fit:cover; display:block">' +
        '<div data-cmp-clip style="position:absolute; inset:0; clip-path:inset(0 50% 0 0); overflow:hidden">' +
          '<img src="' + baBase + p.before + '" alt="Before &mdash; ' + p.title + '" loading="lazy" style="width:100%; aspect-ratio:4/5; object-fit:cover; display:block">' +
        '</div>' +
        '<div style="position:absolute; top:12px; left:12px; background:rgba(8,40,22,.82); color:#fff; padding:5px 11px; border-radius:30px; font-family:\'Barlow Semi Condensed\',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:.08em; font-size:11.5px; pointer-events:none">Before</div>' +
        '<div style="position:absolute; top:12px; right:12px; background:rgba(232,161,58,.95); color:#241303; padding:5px 11px; border-radius:30px; font-family:\'Barlow Semi Condensed\',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:.08em; font-size:11.5px; pointer-events:none">After</div>' +
        '<div data-cmp-handle style="position:absolute; top:0; bottom:0; left:50%; width:3px; background:#fff; box-shadow:0 0 12px rgba(0,0,0,.5); pointer-events:none; transform:translateX(-1.5px)">' +
          '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:36px; height:36px; border-radius:50%; background:#fff; box-shadow:0 4px 14px rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; color:#0a3a1f; font-weight:700; font-size:14px">&#8646;</div>' +
        '</div>' +
        '<input type="range" data-cmp-range min="0" max="100" value="50" aria-label="Compare before and after: ' + p.title + '" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; margin:0; touch-action:pan-y">' +
      '</div>' +
      '<div style="padding:15px 17px 17px">' +
        '<div style="font-family:\'Barlow Condensed\',sans-serif; font-weight:700; font-size:20px; text-transform:uppercase; color:#fff; line-height:1.15">' + p.title + '</div>' +
        '<p style="color:#aebaa6; font-size:14px; line-height:1.55; margin:6px 0 0">' + p.blurb + '</p>' +
      '</div>' +
    '</div>';
  }

  function buildBaGrid() {
    if (!baGrid || baGrid.childNodes.length) return;
    baGrid.innerHTML = baPairs.map(baCard).join('');
    initComparesIn(baGrid);
  }

  /* ---------- Gallery tabs ---------- */
  var tabBtns = document.querySelectorAll('.pz-tab');
  var tabPanels = { work: document.getElementById('pzPanelWork'), ba: document.getElementById('pzPanelBa') };

  function selectTab(name) {
    if (name === 'ba') buildBaGrid();
    tabBtns.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', String(on));
      t.classList.toggle('is-on', on);
      t.tabIndex = on ? 0 : -1;
    });
    Object.keys(tabPanels).forEach(function (k) {
      if (tabPanels[k]) tabPanels[k].hidden = (k !== name);
    });
  }

  if (tabBtns.length) {
    tabBtns.forEach(function (t) {
      t.addEventListener('click', function () { selectTab(t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var list = Array.prototype.slice.call(tabBtns);
        var nxt = list[(list.indexOf(t) + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
        nxt.focus();
        selectTab(nxt.getAttribute('data-tab'));
      });
    });
    selectTab('work');
  }

  /* ---------- Reviews carousel ---------- */
  var reviews = [
    { name: 'Scott C.', city: 'Mission Viejo, CA', initials: 'SC', quote: '"His crew were very good at their jobs & cut 5 fifty-foot eucalyptus on a slope in a safe & expedited way. Everardo is the boss but he also cuts — he knows his stuff. Price is reasonable. Will hire again."' },
    { name: 'Blanca N.', city: 'Anaheim, CA', initials: 'BN', quote: '"Two trees against a cinderblock wall, removed in just a couple hours — debris gone, area cleaned. Great quote in person, explained their insurance and license. Respectful, safe and fast. Highly recommend."' },
    { name: 'Jonathan C.', city: 'Anaheim, CA', initials: 'JC', quote: '"I had a 30-year-old pine leaning toward the house. I called Paez to cut the whole tree and remove the stump. Thank you Paez and his 4-member crew — a wonderful job, and they cleaned the driveway and street, including my neighbor\'s area."' },
    { name: 'Jennifer A.', city: 'Orange County, CA', initials: 'JA', quote: '"They came on time and communicated throughout. Worked quick and did an awesome job! We tipped them, and Everardo actually called asking to return the overpayment. What an honest person! Would highly recommend."' },
    { name: 'Steven F.', city: 'Anaheim, CA', initials: 'SF', quote: '"A large eucalyptus fell in my yard and they took care of it the same day. Fair, fast, professional and clean work. This is my second time working with them and I highly recommend their services."' },
    { name: 'Mary Rose D.', city: 'Orange County, CA', initials: 'MD', quote: '"The transaction with Everardo was amazing — a very reasonable quote and the job done very well. Time efficient and the quality of work was superb. Will hire again on my next project."' },
    { name: 'Rosana T.', city: 'Riverside, CA', initials: 'RT', quote: '"Removed 5 old cypress trees and 2 large stumps. Very pleasant and did the job fast. Cleaned up all the mess and hauled it away. Good communication and worked with my schedule. Will use again."' },
    { name: 'Andrew M.', city: 'Anaheim, CA', initials: 'AM', quote: '"Everardo and his team were great! Using him again for another tree. Came on time, communicated throughout, worked quick and did an awesome job. Would highly recommend them."' },
    { name: 'M.C. S.', city: 'Orange County, CA', initials: 'MS', quote: '"I had 10 cypress trees topped and it was accomplished safely, efficiently and to my satisfaction. The guys worked well together and were friendly and helpful. The yard was raked and left cleaner than I had it."' },
    { name: 'David M.', city: 'Huntington Beach, CA', initials: 'DM', quote: '"Everardo and his team were fantastic. They removed 2 large palms with a crew and a crane, and left the backyard very clean with no debris or damage. I will definitely use them again!"' }
  ];
  var yelpUrl = 'https://www.yelp.com/biz/paez-tree-service-anaheim';
  var track = document.getElementById('pzCaroTrack');
  var dotsWrap = document.getElementById('pzCaroDots');
  var caro = document.getElementById('pzCaro');
  var caroIdx = 0, perView = 3, caroTimer = null;

  function perViewFor(w) { return w >= 980 ? 3 : w >= 620 ? 2 : 1; }
  function maxIdx() { return Math.max(0, reviews.length - perView); }

  function buildCarousel() {
    if (!track) return;
    track.innerHTML = '';
    reviews.forEach(function (r) {
      var item = document.createElement('div');
      var basis = (100 / perView).toFixed(4) + '%';
      item.style.cssText = 'flex:0 0 ' + basis + '; max-width:' + basis + '; padding:12px; box-sizing:border-box; display:flex';
      item.innerHTML =
        '<a href="' + yelpUrl + '" target="_blank" rel="noopener" class="pz-rcard" style="background:#fff; border-radius:8px; padding:30px 28px; box-shadow:0 8px 30px rgba(15,26,19,.08); display:flex; flex-direction:column; width:100%; text-decoration:none; color:inherit">' +
          '<div style="color:#d32323; font-size:17px; letter-spacing:2px; margin-bottom:14px">&#9733;&#9733;&#9733;&#9733;&#9733;</div>' +
          '<p style="color:#1b2620; font-size:15.5px; line-height:1.65; margin:0 0 20px; flex:1">' + r.quote + '</p>' +
          '<div style="display:flex; align-items:center; gap:12px; border-top:1px solid #e2dccc; padding-top:16px">' +
            '<span style="width:44px; height:44px; border-radius:50%; background:#124a28; color:#23a657; display:flex; align-items:center; justify-content:center; font-family:\'Barlow Condensed\',sans-serif; font-weight:800; font-size:19px; flex:none">' + r.initials + '</span>' +
            '<div style="flex:1; min-width:0"><div style="font-weight:700; color:#0a3a1f">' + r.name + '</div><div style="display:flex; align-items:center; gap:7px; font-size:13px; color:#5f6b60; margin-top:2px">' + r.city + ' <img src="' + tplUri + '/assets/yelp-logo.png" alt="Yelp" style="height:15px; width:auto; display:block"></div></div>' +
            '<span style="flex:none; align-self:center; font-size:12px; font-weight:700; color:#d32323; text-transform:uppercase; letter-spacing:.03em; white-space:nowrap">Read on Yelp &rarr;</span>' +
          '</div>' +
        '</a>';
      track.appendChild(item);
    });
    buildDots();
    update();
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (var i = 0; i <= maxIdx(); i++) {
      (function (i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to review ' + (i + 1));
        b.style.cssText = 'height:9px; border-radius:20px; border:none; padding:0; cursor:pointer; transition:width .3s ease, background .3s ease';
        b.addEventListener('click', function () { go(i); });
        dotsWrap.appendChild(b);
      })(i);
    }
  }

  function update() {
    if (!track) return;
    track.style.transform = 'translateX(-' + (caroIdx * (100 / perView)).toFixed(4) + '%)';
    if (dotsWrap) {
      Array.prototype.forEach.call(dotsWrap.children, function (b, i) {
        b.style.width = i === caroIdx ? '26px' : '9px';
        b.style.background = i === caroIdx ? '#9c5a26' : 'rgba(15,26,19,.18)';
      });
    }
  }

  function go(i) {
    var mx = maxIdx();
    caroIdx = i < 0 ? mx : (i > mx ? 0 : i);
    update();
  }
  function next() { go(caroIdx + 1); }
  function prev() { go(caroIdx - 1); }
  function startAuto() { stopAuto(); caroTimer = setInterval(next, 5200); }
  function stopAuto() { if (caroTimer) { clearInterval(caroTimer); caroTimer = null; } }

  if (track) {
    perView = perViewFor(window.innerWidth || 1200);
    buildCarousel();
    startAuto();
    var nextBtn = document.getElementById('pzCaroNext');
    var prevBtn = document.getElementById('pzCaroPrev');
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (caro) {
      caro.addEventListener('mouseenter', stopAuto);
      caro.addEventListener('mouseleave', startAuto);
    }
    window.addEventListener('resize', function () {
      var pv = perViewFor(window.innerWidth || 1200);
      if (pv !== perView) {
        perView = pv;
        caroIdx = Math.min(caroIdx, maxIdx());
        buildCarousel();
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rvEls = [];
  document.querySelectorAll('.pz-grid3 > *, .pz-trust > *, .pz-abullets > *').forEach(function (el) {
    el.classList.add('rv');
  });
  document.querySelectorAll('.pz-h2').forEach(function (el) { el.classList.add('rv', 'rv-rise'); });
  document.querySelectorAll('.pz-grid3, .pz-trust, .pz-abullets').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (el, i) {
      el.style.transitionDelay = Math.min(i, 6) * 80 + 'ms';
    });
  });
  rvEls = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    rvEls.forEach(function (el) { el.classList.add('rv-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('rv-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    rvEls.forEach(function (el) { io.observe(el); });
  }
})();
