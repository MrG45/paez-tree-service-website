/* Paez Tree Service — theme interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('pzBurger');
  var mobileMenu = document.getElementById('pzMobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.contains('pz-mm-open');
      if (open) {
        mobileMenu.classList.remove('pz-mm-open');
      } else {
        mobileMenu.classList.add('pz-mm-open');
      }
      burger.setAttribute('aria-expanded', String(!open));
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('pz-mm-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Before / After slider ---------- */
  var ba = document.getElementById('pzBa');
  var baClip = document.getElementById('pzBaClip');
  var baHandle = document.getElementById('pzBaHandle');
  if (ba && baClip && baHandle) {
    ba.addEventListener('input', function () {
      var v = +ba.value;
      baClip.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      baHandle.style.left = v + '%';
    });
  }

  /* ---------- Gallery + Lightbox ---------- */
  var photos = [
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230701_070358-1024x768.jpg', alt: 'Full tree removal job', caption: 'No job too big — full tree removals. Safe, controlled takedown of large trees in tight spots.', date: 'Jul 2023' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2025/06/20250604_145900-768x1024.jpg', alt: 'Trimming a tree with precision', caption: 'Trimming with precision & safety — careful pruning to keep trees healthy and shaped.', date: 'Jun 2025' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230509_080630-768x1024.jpg', alt: 'Crew on the job, fully equipped', caption: 'On the job, fully equipped — the right crew and gear for every project.', date: 'Jul 2023' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2025/06/20250327_084710-768x1024.jpg', alt: 'Working safely at height', caption: 'Safety is our top priority — proper rigging and technique on every climb.', date: 'Mar 2025' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230623_085627-768x1024.jpg', alt: 'The right crew and equipment', caption: 'The right crew & equipment to get the job done right the first time.', date: 'Jun 2023' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2023/07/Clean-Up-Your-Property.jpg', alt: 'Property cleaned up after the job', caption: 'Full cleanup & haul-away — we leave your property spotless when we are done.', date: 'Jul 2023' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2023/07/Let-The-Beauty-Of-Your-Property-Shine.jpg', alt: 'Beautifully maintained property', caption: 'Letting a property shine — well-kept trees that lift the whole yard.', date: 'Jul 2023' },
    { src: 'https://www.paeztreeservice.com/wp-content/uploads/2023/07/Dont-Let-A-Dead-Tree-Ruin-Your-Property.jpg', alt: 'Dead and hazardous tree removal', caption: 'Dead & hazardous tree removal — removing risks before they cause damage.', date: 'Jul 2023' }
  ];
  var tplUri = window.PZ_TPL_URI || '';
  var gallery = document.getElementById('pzGallery');
  var lightbox = document.getElementById('pzLightbox');
  var lbThumbs = document.getElementById('pzLbThumbs');
  var lbFeed = document.getElementById('pzLbFeed');
  var lbClose = document.getElementById('pzLbClose');
  var activeIdx = 0;

  if (gallery) {
    photos.slice(0, 6).forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'pz-gitem';
      d.style.cssText = 'border-radius:12px; overflow:hidden; position:relative; box-shadow:0 12px 30px rgba(0,0,0,.32); cursor:pointer';
      d.innerHTML =
        '<img src="' + p.src + '" alt="' + p.alt + '" loading="lazy" style="width:100%; aspect-ratio:4/3; object-fit:cover; height:auto; display:block">' +
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
      t.innerHTML = '<img src="' + p.src + '" alt="' + p.alt + '" loading="lazy" style="width:100%; height:82px; object-fit:cover; display:block">';
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
          '<span style="font-size:12.5px; color:#5f6b60; font-weight:600; flex:none">' + p.date + '</span>' +
        '</div>' +
        '<img src="' + p.src + '" alt="' + p.alt + '" style="width:100%; border-radius:10px; display:block; box-shadow:0 12px 30px rgba(15,26,19,.14)">' +
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
