<?php
/**
 * Theme Customizer options: social links, newsletter, ad slots, footer text.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register Customizer settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager.
 */
function bgh_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';

	/* ------------------------------------------------------ Social links */
	$wp_customize->add_section(
		'bgh_social',
		array(
			'title'    => __( 'Social Links', 'beauty-glow-hub' ),
			'priority' => 40,
		)
	);

	$socials = array(
		'bgh_social_facebook'  => __( 'Facebook URL', 'beauty-glow-hub' ),
		'bgh_social_instagram' => __( 'Instagram URL', 'beauty-glow-hub' ),
		'bgh_social_pinterest' => __( 'Pinterest URL', 'beauty-glow-hub' ),
		'bgh_social_twitter'   => __( 'X / Twitter URL', 'beauty-glow-hub' ),
		'bgh_social_youtube'   => __( 'YouTube URL', 'beauty-glow-hub' ),
	);
	foreach ( $socials as $id => $label ) {
		$wp_customize->add_setting( $id, array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' ) );
		$wp_customize->add_control( $id, array( 'label' => $label, 'section' => 'bgh_social', 'type' => 'url' ) );
	}

	/* -------------------------------------------------- Newsletter block */
	$wp_customize->add_section(
		'bgh_newsletter',
		array(
			'title'    => __( 'Newsletter', 'beauty-glow-hub' ),
			'priority' => 45,
		)
	);
	$wp_customize->add_setting(
		'bgh_newsletter_action',
		array( 'default' => '', 'sanitize_callback' => 'esc_url_raw' )
	);
	$wp_customize->add_control(
		'bgh_newsletter_action',
		array(
			'label'       => __( 'Newsletter form action URL', 'beauty-glow-hub' ),
			'description' => __( 'Paste your Mailchimp/ConvertKit form action URL. Leave blank to show a demo form.', 'beauty-glow-hub' ),
			'section'     => 'bgh_newsletter',
			'type'        => 'url',
		)
	);

	/* --------------------------------------------------------- Ad slots */
	$wp_customize->add_section(
		'bgh_ads',
		array(
			'title'       => __( 'Advertisement Slots', 'beauty-glow-hub' ),
			'description' => __( 'Paste your Google AdSense / ad network code. Placements follow AdSense best practices and stay hidden until filled.', 'beauty-glow-hub' ),
			'priority'    => 50,
		)
	);

	$ad_slots = array(
		'bgh_ad_header'     => __( 'Header Banner (Leaderboard)', 'beauty-glow-hub' ),
		'bgh_ad_below_title'=> __( 'Below Post Title', 'beauty-glow-hub' ),
		'bgh_ad_in_article' => __( 'Middle of Article (In-Content)', 'beauty-glow-hub' ),
		'bgh_ad_sidebar'    => __( 'Sidebar', 'beauty-glow-hub' ),
		'bgh_ad_footer'     => __( 'Footer', 'beauty-glow-hub' ),
	);
	foreach ( $ad_slots as $id => $label ) {
		$wp_customize->add_setting( $id, array( 'default' => '', 'sanitize_callback' => 'bgh_sanitize_ad_code' ) );
		$wp_customize->add_control(
			$id,
			array( 'label' => $label, 'section' => 'bgh_ads', 'type' => 'textarea' )
		);
	}

	$wp_customize->add_setting( 'bgh_adsense_pub_id', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp_customize->add_control(
		'bgh_adsense_pub_id',
		array(
			'label'       => __( 'AdSense Publisher ID', 'beauty-glow-hub' ),
			'description' => __( 'e.g. ca-pub-XXXXXXXXXXXXXXXX. Loads the AdSense auto-ads / verification script in the head.', 'beauty-glow-hub' ),
			'section'     => 'bgh_ads',
			'type'        => 'text',
		)
	);

	/* ------------------------------------------------------ Layout misc */
	$wp_customize->add_section(
		'bgh_layout',
		array( 'title' => __( 'Layout & Footer', 'beauty-glow-hub' ), 'priority' => 55 )
	);
	$wp_customize->add_setting( 'bgh_footer_copyright', array( 'default' => '', 'sanitize_callback' => 'wp_kses_post' ) );
	$wp_customize->add_control(
		'bgh_footer_copyright',
		array( 'label' => __( 'Footer copyright text', 'beauty-glow-hub' ), 'section' => 'bgh_layout', 'type' => 'text' )
	);
	$wp_customize->add_setting( 'bgh_sticky_header', array( 'default' => true, 'sanitize_callback' => 'wp_validate_boolean' ) );
	$wp_customize->add_control(
		'bgh_sticky_header',
		array( 'label' => __( 'Enable sticky header', 'beauty-glow-hub' ), 'section' => 'bgh_layout', 'type' => 'checkbox' )
	);
}
add_action( 'customize_register', 'bgh_customize_register' );

/**
 * Allow script/ins/div markup in ad slot fields (trusted admin input).
 *
 * @param string $input Raw ad markup.
 * @return string
 */
function bgh_sanitize_ad_code( $input ) {
	if ( current_user_can( 'unfiltered_html' ) ) {
		return $input;
	}
	return wp_kses_post( $input );
}

/**
 * Customizer live-preview JS.
 */
function bgh_customize_preview_js() {
	wp_enqueue_script( 'bgh-customizer', BGH_URI . '/assets/js/customizer.js', array( 'customize-preview' ), BGH_VERSION, true );
}
add_action( 'customize_preview_init', 'bgh_customize_preview_js' );

/**
 * Load AdSense head script when a publisher ID is configured.
 */
function bgh_adsense_head() {
	$pub = get_theme_mod( 'bgh_adsense_pub_id' );
	if ( ! $pub ) {
		return;
	}
	$pub = esc_attr( $pub );
	echo "\n<!-- Google AdSense -->\n";
	echo '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' . $pub . '" crossorigin="anonymous"></script>' . "\n";
}
add_action( 'wp_head', 'bgh_adsense_head', 2 );
