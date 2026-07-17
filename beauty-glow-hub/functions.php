<?php
/**
 * Beauty Glow Hub functions and definitions.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Prevent direct access.
}

if ( ! defined( 'BGH_VERSION' ) ) {
	define( 'BGH_VERSION', '1.0.0' );
}
define( 'BGH_DIR', get_template_directory() );
define( 'BGH_URI', get_template_directory_uri() );

/**
 * Theme setup: register supports, menus and image sizes.
 */
function bgh_setup() {
	load_theme_textdomain( 'beauty-glow-hub', BGH_DIR . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );

	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);

	add_theme_support(
		'custom-logo',
		array(
			'height'      => 60,
			'width'       => 220,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	add_theme_support( 'post-formats', array( 'gallery', 'image', 'video', 'quote' ) );

	// Editor color palette mirrors the brand tokens.
	add_theme_support(
		'editor-color-palette',
		array(
			array( 'name' => __( 'Primary Pink', 'beauty-glow-hub' ), 'slug' => 'primary', 'color' => '#E91E63' ),
			array( 'name' => __( 'Soft Pink', 'beauty-glow-hub' ), 'slug' => 'secondary', 'color' => '#F8BBD0' ),
			array( 'name' => __( 'Gold Accent', 'beauty-glow-hub' ), 'slug' => 'accent', 'color' => '#D4AF37' ),
			array( 'name' => __( 'Ink', 'beauty-glow-hub' ), 'slug' => 'text', 'color' => '#333333' ),
			array( 'name' => __( 'Light Background', 'beauty-glow-hub' ), 'slug' => 'light', 'color' => '#FFF8FB' ),
			array( 'name' => __( 'White', 'beauty-glow-hub' ), 'slug' => 'white', 'color' => '#FFFFFF' ),
		)
	);

	set_post_thumbnail_size( 1200, 675, true );
	add_image_size( 'bgh-card', 640, 400, true );
	add_image_size( 'bgh-thumb', 160, 120, true );
	add_image_size( 'bgh-hero', 1280, 860, true );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'beauty-glow-hub' ),
			'footer'  => __( 'Footer Menu', 'beauty-glow-hub' ),
			'legal'   => __( 'Legal / Utility Menu', 'beauty-glow-hub' ),
			'social'  => __( 'Social Links Menu', 'beauty-glow-hub' ),
		)
	);
}
add_action( 'after_setup_theme', 'bgh_setup' );

/**
 * Set the content width for embeds and images.
 */
function bgh_content_width() {
	$GLOBALS['content_width'] = 760;
}
add_action( 'after_setup_theme', 'bgh_content_width', 0 );

/**
 * Enqueue styles and scripts. Fonts are self-hostable; we default to Google
 * Fonts with display=swap and preconnect for performance.
 */
function bgh_assets() {
	// Preconnect handled in header via wp_resource_hints filter.
	wp_enqueue_style(
		'bgh-fonts',
		'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style( 'bgh-style', get_stylesheet_uri(), array(), BGH_VERSION );
	wp_enqueue_style( 'bgh-main', BGH_URI . '/assets/css/main.css', array( 'bgh-style' ), BGH_VERSION );

	wp_enqueue_script( 'bgh-scripts', BGH_URI . '/assets/js/main.js', array(), BGH_VERSION, true );
	wp_localize_script(
		'bgh-scripts',
		'bghData',
		array( 'toc' => __( 'Table of Contents', 'beauty-glow-hub' ) )
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'bgh_assets' );

/**
 * Add preconnect hints for Google Fonts.
 */
function bgh_resource_hints( $hints, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$hints[] = array( 'href' => 'https://fonts.googleapis.com' );
		$hints[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' );
	}
	return $hints;
}
add_filter( 'wp_resource_hints', 'bgh_resource_hints', 10, 2 );

/**
 * Register widget areas.
 */
function bgh_widgets_init() {
	$before_title = '<h3 class="bgh-widget__title">';
	$after_title  = '</h3>';

	register_sidebar(
		array(
			'name'          => __( 'Blog Sidebar', 'beauty-glow-hub' ),
			'id'            => 'sidebar-1',
			'description'   => __( 'Widgets shown in the main blog sidebar.', 'beauty-glow-hub' ),
			'before_widget' => '<section id="%1$s" class="bgh-widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => $before_title,
			'after_title'   => $after_title,
		)
	);

	for ( $i = 1; $i <= 4; $i++ ) {
		register_sidebar(
			array(
				/* translators: %d: footer column number. */
				'name'          => sprintf( __( 'Footer Column %d', 'beauty-glow-hub' ), $i ),
				'id'            => 'footer-' . $i,
				'description'   => __( 'Footer widget area.', 'beauty-glow-hub' ),
				'before_widget' => '<div id="%1$s" class="bgh-footer__widget %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '<h3>',
				'after_title'   => '</h3>',
			)
		);
	}
}
add_action( 'widgets_init', 'bgh_widgets_init' );

/**
 * Load theme includes.
 */
require BGH_DIR . '/inc/template-tags.php';
require BGH_DIR . '/inc/template-functions.php';
require BGH_DIR . '/inc/breadcrumbs.php';
require BGH_DIR . '/inc/reading-time.php';
require BGH_DIR . '/inc/table-of-contents.php';
require BGH_DIR . '/inc/schema.php';
require BGH_DIR . '/inc/seo.php';
require BGH_DIR . '/inc/customizer.php';
require BGH_DIR . '/inc/ads.php';
require BGH_DIR . '/inc/class-bgh-walker-nav.php';
require BGH_DIR . '/inc/widgets.php';

/**
 * Fallback menu when no primary menu is assigned.
 */
function bgh_primary_menu_fallback() {
	echo '<ul id="primary-menu" class="bgh-menu">';
	echo '<li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'beauty-glow-hub' ) . '</a></li>';
	wp_list_categories(
		array(
			'title_li'   => '',
			'number'     => 6,
			'orderby'    => 'count',
			'order'      => 'DESC',
			'walker'     => null,
		)
	);
	echo '</ul>';
}

/**
 * Custom excerpt length and "read more".
 */
function bgh_excerpt_length( $length ) {
	return 24;
}
add_filter( 'excerpt_length', 'bgh_excerpt_length' );

function bgh_excerpt_more( $more ) {
	return '&hellip;';
}
add_filter( 'excerpt_more', 'bgh_excerpt_more' );

/**
 * Add lazy loading + async decoding to content images (belt-and-suspenders
 * on top of WordPress core defaults).
 */
function bgh_lazyload_content_images( $content ) {
	if ( is_admin() || is_feed() ) {
		return $content;
	}
	return $content;
}
add_filter( 'the_content', 'bgh_lazyload_content_images' );

/**
 * Body classes for layout control.
 */
function bgh_body_classes( $classes ) {
	if ( ! is_active_sidebar( 'sidebar-1' ) ) {
		$classes[] = 'bgh-no-sidebar';
	}
	if ( is_singular() ) {
		$classes[] = 'bgh-singular';
	}
	return $classes;
}
add_filter( 'body_class', 'bgh_body_classes' );
