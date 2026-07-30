<?php
/**
 * Paez Tree Service theme functions.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

// Theme setup
function paez_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'custom-logo' );
	register_nav_menus( array( 'primary' => __( 'Primary Menu', 'paez-tree-service' ) ) );
}
add_action( 'after_setup_theme', 'paez_theme_setup' );

// Enqueue assets
function paez_theme_assets() {
	wp_enqueue_style(
		'paez-fonts',
		'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'paez-style', get_stylesheet_uri(), array( 'paez-fonts' ), '1.1.0' );
	wp_enqueue_script( 'paez-main', get_template_directory_uri() . '/js/main.js', array(), '1.1.0', true );
}
add_action( 'wp_enqueue_scripts', 'paez_theme_assets' );

// Fix robots.txt — remove the LiteSpeed Googlebot block
function paez_robots_txt( $output, $public ) {
	if ( '0' === $public ) {
		return "Disallow: /\n";
	}
	$output = "User-agent: *\n";
	$output .= "Allow: /\n";
	$output .= "\n";
	$output .= "Sitemap: " . get_site_url() . "/wp-sitemap.xml\n";
	return $output;
}
add_filter( 'robots_txt', 'paez_robots_txt', 999, 2 );

// Add SEO meta tags to head
function paez_seo_meta() {
	$site_name = get_bloginfo( 'name' );
	$tagline   = get_bloginfo( 'description' );
	$url       = get_site_url();
	$logo_url  = 'https://www.paeztreeservice.com/wp-content/uploads/2025/06/Paez-Tree-Service-Logo-2-1.gif';
	?>
	<meta name="description" content="<?php echo esc_attr( $tagline ); ?>">
	<link rel="canonical" href="<?php echo esc_url( $url ); ?>">

	<!-- Open Graph -->
	<meta property="og:title" content="<?php echo esc_attr( $site_name ); ?>">
	<meta property="og:description" content="<?php echo esc_attr( $tagline ); ?>">
	<meta property="og:url" content="<?php echo esc_url( $url ); ?>">
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="<?php echo esc_attr( $site_name ); ?>">
	<meta property="og:image" content="<?php echo esc_url( $logo_url ); ?>">
	<meta property="og:image:width" content="1000">
	<meta property="og:image:height" content="697">
	<meta property="og:locale" content="en_US">

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:title" content="<?php echo esc_attr( $site_name ); ?>">
	<meta name="twitter:description" content="<?php echo esc_attr( $tagline ); ?>">
	<meta name="twitter:image" content="<?php echo esc_url( $logo_url ); ?>">
	<?php
}
add_action( 'wp_head', 'paez_seo_meta', 1 );

// Add JSON-LD structured data
function paez_json_ld() {
	$site_name = get_bloginfo( 'name' );
	$url       = get_site_url();
	$logo_url  = 'https://www.paeztreeservice.com/wp-content/uploads/2025/06/Paez-Tree-Service-Logo-2-1.gif';
	?>
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		"name": "Paez Tree Service",
		"image": "<?php echo esc_url( $logo_url ); ?>",
		"url": "<?php echo esc_url( $url ); ?>",
		"telephone": "(714) 928-9413",
		"email": "paeztreeservices@gmail.com",
		"description": "<?php echo esc_attr( get_bloginfo( 'description' ) ); ?>",
		"address": {
			"@type": "PostalAddress",
			"streetAddress": "1705 S State College Blvd",
			"addressLocality": "Anaheim",
			"addressRegion": "CA",
			"postalCode": "92806",
			"addressCountry": "US"
		},
		"geo": {
			"@type": "GeoCoordinates",
			"latitude": 33.8275,
			"longitude": -117.9564
		},
		"openingHours": "Mo-Su 00:00-23:59",
		"priceRange": "$$",
		"areaServed": [
			{"@type": "City", "name": "Anaheim"},
			{"@type": "City", "name": "Orange County"}
		],
		"hasOfferCatalog": {
			"@type": "OfferCatalog",
			"name": "Tree Services",
			"itemListElement": [
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Tree Trimming"}},
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Tree Removal"}},
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Stump Removal"}},
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Palm Tree Service"}},
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "HOA Tree Work"}},
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Commercial Tree Work"}},
				{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Emergency Tree Service"}}
			]
		},
		"aggregateRating": {
			"@type": "AggregateRating",
			"ratingValue": "5.0",
			"bestRating": "5",
			"ratingCount": "89",
			"reviewCount": "89"
		},
		"sameAs": [
			"https://www.yelp.com/biz/paez-tree-service-anaheim"
		]
	}
	</script>
	<?php
}
add_action( 'wp_footer', 'paez_json_ld' );

// Handle quote form submissions
function paez_handle_quote() {
	$name    = isset( $_POST['name'] )    ? sanitize_text_field( $_POST['name'] )    : '';
	$phone   = isset( $_POST['phone'] )   ? sanitize_text_field( $_POST['phone'] )   : '';
	$email   = isset( $_POST['email'] )   ? sanitize_email( $_POST['email'] )        : '';
	$service = isset( $_POST['service'] ) ? sanitize_text_field( $_POST['service'] ) : '';

	if ( empty( $name ) || empty( $phone ) ) {
		wp_redirect( home_url( '/#quote' ) );
		exit;
	}

	$to      = 'paeztreeservices@gmail.com';
	$subject = 'New Quote Request — Paez Tree Service';
	$message = "Name: $name\nPhone: $phone\nEmail: $email\nService: $service\n\nSubmitted via paeztreeservice.com";
	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

	wp_mail( $to, $subject, $message, $headers );

	wp_redirect( home_url( '/?quote=sent#quote' ) );
	exit;
}
add_action( 'admin_post_paez_quote', 'paez_handle_quote' );
add_action( 'admin_post_nopriv_paez_quote', 'paez_handle_quote' );