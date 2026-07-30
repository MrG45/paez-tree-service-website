<?php
/**
 * Front page template — Paez Tree Service.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
$tpl = esc_url( get_template_directory_uri() );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700&display=swap"></noscript>
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?> style="font-family:'Barlow',system-ui,sans-serif; color:var(--ink); background:var(--paper); line-height:1.55; overflow-x:hidden">
<?php wp_body_open(); ?>

<!-- PROMO STRIP -->
<div class="pz-promo">
  <div class="pz-promo-inner">
    <span class="pz-promo-badge">10% OFF</span>
    <span class="pz-nowrap">All tree services &mdash; this week only</span>
    <span class="pz-promo-dot">&bull;</span>
    <a href="#quote" class="pz-promo-a" style="color:#fff; text-decoration:none; font-weight:700; white-space:nowrap; border-bottom:1px solid rgba(255,255,255,.55)">Claim offer &rarr;</a>
  </div>
</div>

<!-- UTILITY BAR -->
<div class="pz-util">
  <div class="pz-util-inner">
    <div class="pz-util-l">
      <span class="pz-util-item"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pz-flex-none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>1705 S State College Blvd, Anaheim, CA 92806</span>
      <span class="pz-ico-dot-tan"></span>
      <span class="pz-util-item"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pz-flex-none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>CA License #1089610</span>
    </div>
    <div class="pz-util-r">
      <a href="mailto:paeztreeservices@gmail.com" class="pz-util-a"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--tan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pz-flex-none"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>paeztreeservices@gmail.com</a>
      <span class="pz-util-badge"><span class="pz-ico-dot-green"></span>Open 24/7</span>
    </div>
  </div>
</div>

<!-- HEADER -->
<header class="pz-hdr">
  <div class="pz-hdr-inner">
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="pz-hdr-logo">
      <img class="pz-logo" src="https://www.paeztreeservice.com/wp-content/uploads/2025/06/Paez-Tree-Service-Logo-2-1.gif" alt="Paez Tree Service" fetchpriority="high">
      <span class="pz-loc">Anaheim<br>Orange County</span>
    </a>
    <div class="pz-hdr-r">
      <nav class="pz-nav pz-desk-nav">
        <a href="#services" class="pz-nav-a">Services</a>
        <a href="#reviews" class="pz-nav-a">Reviews</a>
        <a href="#work" class="pz-nav-a">Our Work</a>
        <a href="#about" class="pz-nav-a">About</a>
      </nav>
      <a href="tel:7149289413" class="pz-headphone pz-desk-nav">
        <span class="pz-ico-circle-sm">&#9742;</span>
        <span><span class="pz-fs-10 pz-ls-16 pz-c-leaf pz-ttu pz-fwb" style="display:block; line-height:1.3">Call 24/7</span><span class="pz-f-bc pz-fwb pz-fs-20" style="color:#fff; white-space:nowrap">(714) 928-9413</span></span>
      </a>
      <a href="#quote" class="pz-headcta h-bright-up">Free Estimate</a>
      <button type="button" id="pzBurger" class="pz-burger" aria-label="Menu" style="display:none; width:40px; height:40px; border:none; background:rgba(255,255,255,.08); border-radius:4px; cursor:pointer; flex:none; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:0">
        <span style="display:block; height:2.5px; background:#fff; border-radius:2px; width:20px"></span>
        <span style="display:block; height:2.5px; background:#fff; border-radius:2px; width:14px"></span>
        <span style="display:block; height:2.5px; background:#fff; border-radius:2px; width:20px"></span>
      </button>
    </div>
  </div>
</header>

<!-- MOBILE MENU -->
<nav id="pzMobileMenu" class="pz-mm">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px">
    <img src="<?php echo $tpl; ?>/assets/yelp-logo-white.png" alt="Yelp" style="height:18px; width:auto; display:block">
    <button type="button" id="pzMobileClose" aria-label="Close" style="width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.08); border:none; color:#fff; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center">&#10005;</button>
  </div>
  <a href="#services" class="pz-mm-a">Services</a>
  <a href="#reviews" class="pz-mm-a">Reviews</a>
  <a href="#work" class="pz-mm-a">Our Work</a>
  <a href="#about" class="pz-mm-a">About</a>
  <a href="tel:7149289413" class="pz-mm-phone">(714) 928-9413 <span class="pz-fs-12 pz-ls-12 pz-c-leaf pz-ttu pz-f-barlow pz-fwsb">24/7</span></a>
  <a href="#quote" class="pz-mm-cta">Get a Free Estimate</a>
</nav>

<!-- HERO -->
<section class="pz-hero">
  <div class="pz-hero-inner">
    <div class="pz-hero-content">
      <div class="pz-hero-badge"><span class="pz-ico-green-sm">&#10003;</span> Fully Insured &middot; Bonded &middot; Workers' Comp</div>
      <h1 class="pz-h1">Tree work done<br>safe, clean &amp; fast.</h1>
      <p class="pz-hero-sub">Anaheim's trusted tree service for trimming, removal, stumps and palms across all of Orange County. Free estimates, <span class="pz-c-f0b pz-fwb">24/7</span> emergency response, and every job fully cleaned up.</p>
      <div class="pz-hero-cta">
        <a href="#quote" class="pz-btn pz-btn-accent pz-btn-md h-bright-up2 pz-sh-lg">Get a Free Estimate &rarr;</a>
        <a href="tel:7149289413" class="pz-btn pz-btn-white pz-btn-md h-cream h-bright-up2">Call (714) 928-9413</a>
      </div>
      <div class="pz-hero-features">
        <div class="pz-hero-feat"><span class="pz-ico-badge"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>Fully Insured<br><span class="pz-fs-12 pz-c-ae6">For your protection</span></div>
        <div class="pz-hero-feat"><span class="pz-ico-badge"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/></svg></span>24/7 Emergency<br><span class="pz-fs-12 pz-c-ae6">We're here anytime</span></div>
        <div class="pz-hero-feat"><span class="pz-ico-badge"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 9,12 21,4"/><path d="M20 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5"/></svg></span>Cleanup Included<br><span class="pz-fs-12 pz-c-ae6">Left better than we found it</span></div>
        <div class="pz-hero-feat"><span class="pz-ico-badge"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>Local &amp; Trusted<br><span class="pz-fs-12 pz-c-ae6">Proudly serving OC</span></div>
      </div>
      <div class="pz-hero-rating">5.0 <span class="pz-hero-star">&#9733;&#9733;&#9733;&#9733;&#9733;</span> on <img src="<?php echo $tpl; ?>/assets/yelp-logo-white.png" alt="Yelp" style="height:16px; width:auto; display:block; margin-left:1px"></div>
      <div class="pz-hero-check pz-flex pz-gap-7" style="margin-top:6px"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>Same-day quotes &middot; Honest pricing &middot; No hidden fees</div>
    </div>

    <!-- QUOTE FORM -->
    <div class="pz-quote">
      <div class="pz-quote-glow"></div>
      <div class="pz-quote-rating"><span style="width:24px; height:24px; border-radius:50%; background:var(--leaf); color:#08301a; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex:none">&#9733;</span> 5.0 &middot; Same-day quotes &middot; Honest pricing &middot; No hidden fees</div>
      <h2 class="pz-quote-h2">Get a Free Estimate</h2>
      <p class="pz-quote-p">No obligation. We respond fast.</p>
      <form id="pzQuoteForm" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
        <input type="hidden" name="action" value="paez_quote">
        <div class="pz-quote-label">What do you need?</div>
        <label class="pz-quote-opt" style="color:#cdd5c9"><input type="radio" name="service" value="Tree Trimming" checked><span>Tree Trimming</span></label>
        <label class="pz-quote-opt" style="color:#cdd5c9"><input type="radio" name="service" value="Tree Removal"><span>Tree Removal</span></label>
        <label class="pz-quote-opt" style="color:#cdd5c9"><input type="radio" name="service" value="Stump Removal"><span>Stump Removal</span></label>
        <label class="pz-quote-opt" style="color:#cdd5c9"><input type="radio" name="service" value="Palm Tree Service"><span>Palm Tree Service</span></label>
        <label class="pz-quote-opt" style="color:#cdd5c9"><input type="radio" name="service" value="HOA / Commercial"><span>HOA / Commercial</span></label>
        <label class="pz-quote-opt" style="color:#cdd5c9"><input type="radio" name="service" value="Emergency"><span style="color:#f0b454; font-weight:700">Emergency &mdash; call me ASAP</span></label>
        <div class="pz-quote-row">
          <input type="text" name="name" placeholder="Your name" class="pz-in" style="flex:1; min-width:0" required>
        </div>
        <div class="pz-quote-row" style="margin-top:10px">
          <input type="tel" name="phone" placeholder="Phone number" class="pz-in" style="flex:1; min-width:0" required>
          <input type="email" name="email" placeholder="Email" class="pz-in" style="flex:1; min-width:0">
        </div>
        <button type="submit" class="pz-quote-submit h-bright-up2" style="margin-top:16px">Request My Quote &rarr;</button>
      </form>
      <div class="pz-quote-phone">Prefer to talk? Call <a href="tel:7149289413" style="color:#fff; font-weight:700; text-decoration:none">(714) 928-9413</a></div>
    </div>
  </div>
</section>

<!-- TRUST BADGES -->
<div class="pz-trust">
  <div class="pz-trust-item"><span class="pz-trust-ico">&#10003;</span><div class="pz-trust-title">Licensed</div><div class="pz-trust-sub">CA #1089610</div></div>
  <div class="pz-trust-item"><span class="pz-trust-ico">&#10003;</span><div class="pz-trust-title">Insured &amp; Bonded</div><div class="pz-trust-sub">Workers' comp covered</div></div>
  <div class="pz-trust-item"><span class="pz-trust-ico">&#9719;</span><div class="pz-trust-title">24/7 Emergency</div><div class="pz-trust-sub">Storm &amp; hazard response</div></div>
  <div class="pz-trust-item"><span class="pz-trust-ico">&#9733;</span><div class="pz-trust-title">5-Star Rated</div><div class="pz-trust-sub pz-inline-ac pz-gap-5 pz-ac-jc">Loved on <img src="<?php echo $tpl; ?>/assets/yelp-logo-white.png" alt="Yelp" style="height:13px; width:auto; display:block"></div></div>
</div>

<!-- SERVICES -->
<section id="services" class="pz-svc-section">
  <div class="pz-svc-section-inner">
    <div class="pz-svc-head">Our Services</div>
    <h2 class="pz-svc-h2">Everything your trees need</h2>
    <p class="pz-svc-sub">From routine trimming to full removals and emergency storm work — one crew, fully equipped, every job cleaned up.</p>
    <div class="pz-svc-grid">
      <a href="#quote" class="pz-svc-card pz-card"><img class="pz-svc-card-img pz-card-img" src="https://www.paeztreeservice.com/wp-content/uploads/2024/03/Tree-Trimming-Crop_result-scaled.webp" alt="Tree Trimming" loading="lazy"><div class="pz-svc-card-body"><h3 class="pz-svc-card-title">Tree Trimming</h3><p class="pz-svc-card-desc">Pruning, lacing &amp; thinning to keep trees healthy, shaped and safe from your roof and power lines.</p><span class="pz-svc-card-cta">Read more &rarr;</span></div></a>
      <a href="#quote" class="pz-svc-card pz-card"><img class="pz-svc-card-img pz-card-img" src="https://www.paeztreeservice.com/wp-content/uploads/2024/03/Tree-Removal-Crop_result.webp" alt="Tree Removal" loading="lazy"><div class="pz-svc-card-body"><h3 class="pz-svc-card-title">Tree Removal</h3><p class="pz-svc-card-desc">Safe, controlled removal of trees of any size &mdash; even tight spots against walls and property lines.</p><span class="pz-svc-card-cta">Read more &rarr;</span></div></a>
      <a href="#quote" class="pz-svc-card pz-card"><img class="pz-svc-card-img pz-card-img" src="https://www.paeztreeservice.com/wp-content/uploads/2024/03/Stump-Removal-Crop_result-scaled.webp" alt="Stump Removal" loading="lazy"><div class="pz-svc-card-body"><h3 class="pz-svc-card-title">Stump Removal</h3><p class="pz-svc-card-desc">Grinding and full removal to reclaim your yard, improve safety and stop regrowth and pests.</p><span class="pz-svc-card-cta">Read more &rarr;</span></div></a>
      <a href="#quote" class="pz-svc-card pz-card"><img class="pz-svc-card-img pz-card-img" src="https://www.paeztreeservice.com/wp-content/uploads/2024/03/Palm-Tree-Crop_result-1.webp" alt="Palm Tree Service" loading="lazy"><div class="pz-svc-card-body"><h3 class="pz-svc-card-title">Palm Tree Service</h3><p class="pz-svc-card-desc">Skinning, trimming and cleaning to keep palms healthy, tidy and free of fire prone dead fronds.</p><span class="pz-svc-card-cta">Read more &rarr;</span></div></a>
      <a href="#quote" class="pz-svc-card pz-card"><img class="pz-svc-card-img pz-card-img" src="https://www.paeztreeservice.com/wp-content/uploads/2024/03/HOA-Crop_result.webp" alt="HOA Tree Work" loading="lazy"><div class="pz-svc-card-body"><h3 class="pz-svc-card-title">HOA Tree Work</h3><p class="pz-svc-card-desc">Reliable, scheduled maintenance that keeps your community's trees safe, uniform and looking great.</p><span class="pz-svc-card-cta">Read more &rarr;</span></div></a>
      <a href="#quote" class="pz-svc-card pz-card"><img class="pz-svc-card-img pz-card-img" src="https://www.paeztreeservice.com/wp-content/uploads/2024/03/Commercial-Tree-Work-Crop_result-scaled.webp" alt="Commercial Tree Work" loading="lazy"><div class="pz-svc-card-body"><h3 class="pz-svc-card-title">Commercial Tree Work</h3><p class="pz-svc-card-desc">Professional crews and equipment for property managers, businesses and large scale grounds.</p><span class="pz-svc-card-cta">Read more &rarr;</span></div></a>
    </div>
  </div>
</section>
<!-- EMERGENCY -->
<section class="pz-emg">
  <div class="pz-emg-inner">
    <div style="flex:1; min-width:0">
      <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(210,100,50,.15); border:1px solid rgba(210,100,50,.4); color:#e8a13a; padding:6px 14px 6px 6px; border-radius:40px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-size:12px; margin-bottom:20px"><span style="width:22px; height:22px; border-radius:50%; background:#e8a13a; color:#062711; display:flex; align-items:center; justify-content:center; font-size:12px; flex:none">&#9888;</span>24/7 Emergency Response</div>
      <h2 class="pz-emg-h2">Storm damage?<br>Fallen tree?<br>We answer day or night.</h2>
      <p class="pz-emg-sub">A hazardous tree won't wait for business hours and neither do we. Call any time and our crew mobilizes fast to make your property safe.</p>
      <div class="pz-emg-points">
        <div class="pz-emg-point"><span style="color:var(--leaf); flex:none; font-size:18px">&#9889;</span>Rapid response, day or night</div>
        <div class="pz-emg-point"><span style="color:#e8a13a; flex:none; font-size:18px">&#9888;</span>Hazard &amp; storm damage removal</div>
        <div class="pz-emg-point"><span style="color:var(--leaf); flex:none; font-size:18px">&#10003;</span>Licensed, insured &amp; bonded</div>
      </div>
      <a href="tel:7149289413" class="pz-emg-btn h-bright-up2">&#9742; Call now &mdash; 24/7 (714) 928-9413</a>
      <div class="pz-emg-note">No answer? We call right back.</div>
    </div>
    <div style="flex:none; width:240px; text-align:center">
      <div style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:18px; text-transform:uppercase; color:var(--leaf); margin-bottom:6px">Owner led</div>
      <p style="font-size:14px; color:#cdd5c9; margin:0; line-height:1.4">Everardo cuts alongside his crew on every job</p>
    </div>
  </div>
</section>

<!-- ABOUT / WHY PAEZ -->
<section id="about" class="pz-about">
  <div class="pz-about-inner">
    <div class="pz-about-img-wrap">
      <img class="pz-about-img" src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230623_085627-1024x768.jpg" alt="Paez crew on the job" loading="lazy">
      <div class="pz-ownerbadge" style="position:absolute; bottom:14px; left:14px; background:rgba(10,58,31,.92); color:#fff; padding:10px 16px; border-radius:8px; max-width:240px">
        <div class="pz-ownerbadge-title">Everardo Paez</div>
        <div class="pz-ownerbadge-sub">Owner &mdash; on every job</div>
      </div>
    </div>
    <div class="pz-about-content">
      <div class="pz-svc-head" style="text-align:left">Why Paez Tree Service</div>
      <h2 class="pz-about-h2">Safety on every project<br>no matter the size</h2>
      <p class="pz-about-p">We specialize in tree work across Anaheim and Orange County, delivering quality, careful work and a spotless cleanup every time. Our team is ready to respond at a moment's notice for emergency tree services.</p>
      <div class="pz-abullets">
        <div class="pz-abullet"><span style="color:var(--leaf); flex:none; font-size:15px">&#9670;</span>Tree Removal &amp; Trimming</div>
        <div class="pz-abullet"><span style="color:var(--leaf); flex:none; font-size:15px">&#9670;</span>Stump Grinding</div>
        <div class="pz-abullet"><span style="color:var(--leaf); flex:none; font-size:15px">&#9670;</span>Hillside Cleaning</div>
        <div class="pz-abullet"><span style="color:var(--leaf); flex:none; font-size:15px">&#9670;</span>Pruning, Thinning &amp; Lacing</div>
        <div class="pz-abullet"><span style="color:var(--leaf); flex:none; font-size:15px">&#9670;</span>Palm Tree Care</div>
        <div class="pz-abullet"><span style="color:var(--leaf); flex:none; font-size:15px">&#9670;</span>24-Hour Emergency</div>
      </div>
      <div class="pz-about-guarantee">
        <div class="pz-about-guar-title">All work guaranteed</div>
        <p class="pz-about-guar-p">Fully insured, bonded &amp; covered by workers' comp. CA State License #1089610</p>
      </div>
    </div>
  </div>
</section>

<!-- RECENT WORK -->
<section id="work" class="pz-work">
  <div class="pz-work-inner">
    <div class="pz-svc-head">Recent Work</div>
    <h2 class="pz-svc-h2">See the work we do</h2>
    <p class="pz-svc-sub">Real jobs across Anaheim &amp; Orange County &mdash; removals, trimming, stumps and full cleanups.</p>

    <!-- Before/After -->
    <div class="pz-ba" style="margin-bottom:24px">
      <img src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/Let-The-Beauty-Of-Your-Property-Shine.jpg" alt="After — cleared and shaped" style="width:100%; height:100%; object-fit:cover; display:block; position:absolute; top:0; left:0">
      <img src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/Dont-Let-A-Dead-Tree-Ruin-Your-Property.jpg" alt="Before — overgrown and hazardous" style="width:100%; height:100%; object-fit:cover; display:block; position:absolute; top:0; left:0" id="pzBaAfter">
      <div class="pz-ba-label pz-ba-label-l">Before</div>
      <div class="pz-ba-label pz-ba-label-r">After</div>
      <div class="pz-ba-handle" id="pzBaHandle"></div>
      <div class="pz-ba-instruction">&#8646; Drag to compare &rarr;</div>
    </div>

    <!-- Gallery Grid -->
    <div class="pz-work-grid" id="pzGalleryGrid">
      <div class="pz-work-tile pz-gitem" style="cursor:pointer">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230701_070358-1024x768.jpg" alt="Full tree removal job" loading="lazy">
        <div class="pz-work-tag">No job too big &mdash; full tree removals.</div>
      </div>
      <div class="pz-work-tile pz-gitem" style="cursor:pointer">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2025/06/20250604_145900-768x1024.jpg" alt="Trimming with precision" loading="lazy">
        <div class="pz-work-tag">Trimming with precision &amp; safety.</div>
      </div>
      <div class="pz-work-tile pz-gitem" style="cursor:pointer">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230509_080630-768x1024.jpg" alt="Crew on the job" loading="lazy">
        <div class="pz-work-tag">On the job, fully equipped.</div>
      </div>
      <div class="pz-work-tile pz-gitem" style="cursor:pointer">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2025/06/20250327_084710-768x1024.jpg" alt="Working safely at height" loading="lazy">
        <div class="pz-work-tag">Safety is our top priority.</div>
      </div>
      <div class="pz-work-tile pz-gitem" style="cursor:pointer">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/20230623_085627-768x1024.jpg" alt="The right crew and equipment" loading="lazy">
        <div class="pz-work-tag">The right crew &amp; equipment.</div>
      </div>
      <div class="pz-work-tile pz-gitem" style="cursor:pointer">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2023/07/Clean-Up-Your-Property.jpg" alt="Property cleaned up" loading="lazy">
        <div class="pz-work-tag">Full cleanup &amp; haul-away.</div>
      </div>
    </div>
    <div class="pz-work-cta"><a href="https://www.paeztreeservice.com/gallery/" target="_blank" rel="noopener" class="h-bright-up2">View full gallery &rarr;</a></div>
  </div>
</section>

<!-- LIGHTBOX -->
<div id="pzLightbox" class="pz-lb">
  <div class="pz-lb-hdr">
    <div class="pz-lb-hdr-l">
      <img src="<?php echo $tpl; ?>/assets/yelp-logo.png" alt="Yelp" style="height:22px; width:auto; display:block">
      <span style="width:1px; height:24px; background:var(--line)"></span>
      <span class="pz-f-bc pz-fwb pz-fs-22 pz-ttu pz-c-forest" style="line-height:1">Photos</span>
      <span class="pz-lb-count pz-fs-13 pz-c-muted pz-fwsb">8 photos from Paez Tree Service</span>
    </div>
    <button type="button" id="pzLbClose" class="pz-lb-close" aria-label="Close">&#10005;</button>
  </div>
  <div class="pz-lb-body">
    <div class="pz-lb-thumbs" id="pzLbThumbs"></div>
    <div class="pz-lb-feed" id="pzLbFeed"></div>
  </div>
</div>

<!-- TESTIMONIALS -->
<section id="reviews" class="pz-reviews">
  <div class="pz-reviews-inner">
    <div class="pz-tac" style="margin-bottom:48px">
      <div class="pz-svc-head">Testimonials</div>
      <h2 class="pz-svc-h2">What our customers say</h2>
      <div class="pz-ac-jc" style="margin-top:18px">
        <a href="https://www.yelp.com/biz/paez-tree-service-anaheim" target="_blank" rel="noopener" class="pz-yelp-badge h-lift">
          <img src="<?php echo $tpl; ?>/assets/yelp-logo.png" alt="Yelp" style="height:28px; width:auto; display:block">
          <span style="width:1px; height:30px; background:var(--line)"></span>
          <div style="display:flex; flex-direction:column; align-items:flex-start; line-height:1.15">
            <span class="pz-yelp-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span class="pz-yelp-label">5.0 &middot; Verified reviews on Yelp</span>
          </div>
        </a>
      </div>
    </div>
    <div class="pz-caro" id="pzCaro">
      <div class="pz-caro-track"><div id="pzCaroTrack" style="display:flex; align-items:stretch; transition:transform .6s cubic-bezier(.4,0,.2,1); will-change:transform"></div></div>
      <button type="button" id="pzCaroPrev" class="pz-caro-arrow pz-arrow" aria-label="Previous review" style="left:-8px">&#8592;</button>
      <button type="button" id="pzCaroNext" class="pz-caro-arrow pz-arrow" aria-label="Next review" style="right:-8px">&#8594;</button>
      <div id="pzCaroDots" class="pz-ac-jc pz-gap-9" style="margin-top:22px"></div>
    </div>
    <div class="pz-tac" style="margin-top:38px">
      <a href="https://www.yelp.com/biz/paez-tree-service-anaheim" target="_blank" rel="noopener" class="h-bright" style="display:inline-flex; align-items:center; gap:10px; background:var(--yelp); color:#fff; font-weight:700; text-decoration:none; padding:14px 28px; border-radius:6px; text-transform:uppercase; letter-spacing:.04em; font-family:'Barlow Semi Condensed',sans-serif; font-size:15px; box-shadow:0 8px 20px rgba(211,35,35,.3)"><span class="pz-f-barlow pz-fwb pz-fs-18">Yelp</span> Read our reviews &rarr;</a>
    </div>
  </div>
</section>

<!-- CTA BANNER -->
<section class="pz-cta-banner">
  <div class="pz-cta-inner">
    <div>
      <h2 class="pz-cta-h2">Ready to tackle your trees?</h2>
      <p class="pz-cta-sub">Free estimates across Anaheim &amp; Orange County. 24/7 emergency service available.</p>
    </div>
    <div class="pz-cta-btns">
      <a href="#quote" class="pz-btn pz-btn-accent pz-btn-lg h-bright-up2 pz-sh-lg">Request a Quote</a>
      <a href="tel:7149289413" class="pz-btn pz-btn-white pz-btn-lg h-cream">Call (714) 928-9413</a>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section class="pz-contact">
  <div class="pz-contact-inner">
    <div class="pz-tac" style="margin-bottom:44px">
      <div class="pz-svc-head">Get in touch</div>
      <h2 class="pz-contact-h2" style="text-align:center">Let's talk about your trees</h2>
      <p class="pz-contact-sub" style="text-align:center">Free estimates across Anaheim &amp; Orange County. Call any time — we answer 24/7.</p>
    </div>
    <div class="pz-contact-wrap rv rv-rise">
      <div class="pz-map-panel">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d212122.2119478023!2d-117.9563943461932!3d33.8275470396391!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dcd7ac07d2851d%3A0xc474e8504ab3b629!2sPaez%20tree%20service!5e0!3m2!1sen!2sus!4v1689114466196!5m2!1sen!2sus" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Paez Tree Service on Google Maps"></iframe>
        <a href="https://maps.google.com/?q=Paez+Tree+Service,+1705+S+State+College+Blvd,+Anaheim,+CA+92806" target="_blank" rel="noopener" class="pz-map-btn h-cream"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Get Directions</a>
      </div>
      <div class="pz-contact-card">
        <div class="pz-contact-card-top">
          <div class="pz-contact-glow"></div>
          <div class="pz-contact-status"><span class="pz-ico-pulse"></span>Call us &mdash; open 24/7</div>
          <a href="tel:7149289413" class="pz-contact-phone">(714) 928-9413</a>
          <div class="pz-contact-note">Free estimates &middot; we answer day or night</div>
        </div>
        <div class="pz-contact-card-bot">
          <div class="pz-contact-row">
            <span class="pz-ico-square"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            <div class="pz-flex-1"><div class="pz-contact-label">Service Area</div><div class="pz-contact-value">1705 S State College Blvd, Anaheim, CA</div></div>
          </div>
          <div class="pz-contact-row">
            <span class="pz-ico-square"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg></span>
            <div class="pz-flex-1"><div class="pz-contact-label">Email</div><a href="mailto:paeztreeservices@gmail.com" class="pz-contact-email">paeztreeservices@gmail.com</a></div>
          </div>
          <div class="pz-contact-row-last">
            <span class="pz-ico-square"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
            <div class="pz-flex-1"><div class="pz-contact-label">Hours</div><div class="pz-contact-value">Open 24 hours &middot; 7 days a week</div></div>
          </div>
          <a href="#quote" class="pz-contact-cta h-bright-up2">Request a Free Estimate</a>
          <div class="pz-accepted">
            <span class="pz-accepted-tag-label">We accept</span>
            <span class="pz-accepted-tag">Visa</span>
            <span class="pz-accepted-tag">MC</span>
            <span class="pz-accepted-tag">Amex</span>
            <span class="pz-accepted-tag">Discover</span>
            <span class="pz-accepted-tag">Cash</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="pz-foot">
  <div class="pz-foot-inner">
    <div>
      <div style="margin-bottom:20px">
        <img src="https://www.paeztreeservice.com/wp-content/uploads/2025/06/Paez-Tree-Service-Logo-2-1.gif" alt="Paez Tree Service" style="height:96px; width:auto; display:block" loading="lazy">
      </div>
      <p style="font-size:14.5px; line-height:1.7; margin:0 0 16px; max-width:420px">Tree services across Anaheim &amp; Orange County — removal, trimming, hillside cleaning, stump grinding, pruning, thinning, lacing and more. We emphasize safety on every project, no matter the size.</p>
      <div class="pz-c-tan pz-fwb pz-fs-14">CA State License #1089610 &middot; 24-Hour Emergency Service</div>
    </div>
    <div>
      <div class="pz-foot-h3">Services</div>
      <div class="pz-foot-links">
        <a href="#services" class="pz-foot-a pz-fa">Tree Trimming</a>
        <a href="#services" class="pz-foot-a pz-fa">Tree Removal</a>
        <a href="#services" class="pz-foot-a pz-fa">Stump Removal</a>
        <a href="#services" class="pz-foot-a pz-fa">Palm Tree Service</a>
        <a href="#services" class="pz-foot-a pz-fa">HOA &amp; Commercial</a>
      </div>
    </div>
    <div>
      <div class="pz-foot-h3">Contact</div>
      <div class="pz-foot-links">
        <a href="tel:7149289413" class="pz-foot-phone">(714) 928-9413</a>
        <a href="mailto:paeztreeservices@gmail.com" class="pz-foot-a pz-fa">paeztreeservices@gmail.com</a>
        <span>1705 S State College Blvd<br>Anaheim, CA 92806</span>
        <a href="https://www.yelp.com/biz/paez-tree-service-anaheim" target="_blank" rel="noopener" class="pz-foot-yelp pz-c-tan pz-tdn pz-fwb">Find us on <img src="<?php echo $tpl; ?>/assets/yelp-logo-white.png" alt="Yelp" style="height:13px; width:auto; display:inline-block; vertical-align:middle; margin:0 2px"> &rarr;</a>
      </div>
    </div>
  </div>
  <div class="pz-foot-bar">
    <div class="pz-foot-bar-inner">
      <span>&copy; <?php echo esc_html( date( 'Y' ) ); ?> Paez Tree Service. All rights reserved.</span>
      <span>Licensed &middot; Insured &middot; Bonded &middot; Anaheim, CA</span>
    </div>
  </div>
</footer>

<script>window.PZ_TPL_URI = '<?php echo $tpl; ?>';</script>
<?php wp_footer(); ?>
</body>
</html>