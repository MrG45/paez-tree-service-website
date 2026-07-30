<?php
/**
 * Paez Tree Service theme functions.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function paez_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'custom-logo' );
	register_nav_menus( array( 'primary' => __( 'Primary Menu', 'paez-tree-service' ) ) );
}
add_action( 'after_setup_theme', 'paez_theme_setup' );

function paez_theme_assets() {
	wp_enqueue_style(
		'paez-fonts',
		'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'paez-style', get_stylesheet_uri(), array( 'paez-fonts' ), '1.0.0' );
	wp_enqueue_script( 'paez-main', get_template_directory_uri() . '/js/main.js', array(), '1.0.0', true );
}
add_action( 'wp_enqueue_scripts', 'paez_theme_assets' );
