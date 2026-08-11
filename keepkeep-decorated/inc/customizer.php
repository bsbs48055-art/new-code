<?php
/**
 * Customizer settings.
 *
 * Everything the site owner might reasonably want to change — brand copy,
 * homepage section sources, contact details, social profiles and ad code — is
 * editable here so nothing requires touching PHP.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sanitize a checkbox value.
 *
 * @param mixed $value Raw value.
 * @return bool
 */
function kkd_sanitize_checkbox( $value ) {
	return (bool) $value;
}

/**
 * Sanitize a select value against its registered choices.
 *
 * @param string               $value   Raw value.
 * @param WP_Customize_Setting $setting Setting instance.
 * @return string
 */
function kkd_sanitize_select( $value, $setting ) {
	$value   = sanitize_key( $value );
	$control = $setting->manager->get_control( $setting->id );
	$choices = $control ? $control->choices : array();

	return array_key_exists( $value, $choices ) ? $value : $setting->default;
}

/**
 * Sanitize an AdSense publisher ID (`ca-pub-` followed by digits).
 *
 * @param string $value Raw value.
 * @return string
 */
function kkd_sanitize_publisher_id( $value ) {
	$value = trim( sanitize_text_field( $value ) );
	if ( '' === $value ) {
		return '';
	}
	if ( preg_match( '/^(?:ca-)?pub-(\d{10,20})$/i', $value, $matches ) ) {
		return 'ca-pub-' . $matches[1];
	}
	return '';
}

/**
 * Sanitize a category slug against existing categories.
 *
 * @param string $value Raw value.
 * @return string
 */
function kkd_sanitize_category_slug( $value ) {
	$value = sanitize_title( $value );
	if ( '' === $value ) {
		return '';
	}
	return term_exists( $value, 'category' ) ? $value : '';
}

/**
 * Ad code is trusted markup entered by an administrator (an AdSense or ad
 * network snippet), so it is stored as-is rather than run through KSES, which
 * would strip the `<ins>`/`<script>` tags the network requires.
 *
 * Only users with `edit_theme_options` can reach the Customizer.
 *
 * @param string $value Raw value.
 * @return string
 */
function kkd_sanitize_ad_code( $value ) {
	return trim( (string) $value );
}

/**
 * Sanitize multi-line plain text (ads.txt records).
 *
 * @param string $value Raw value.
 * @return string
 */
function kkd_sanitize_textarea_plain( $value ) {
	return trim( wp_strip_all_tags( (string) $value ) );
}

/**
 * Register Customizer sections, settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager.
 */
function kkd_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport        = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport = 'postMessage';

	/* ------------------------------------------------------------ Brand */
	$wp_customize->add_section(
		'kkd_brand',
		array(
			'title'       => __( 'Brand & Header', 'keepkeep-decorated' ),
			'priority'    => 25,
			'description' => __( 'Upload your logo under Site Identity. These options control the header behaviour and the tagline shown in the footer.', 'keepkeep-decorated' ),
		)
	);

	$wp_customize->add_setting(
		'kkd_sticky_header',
		array(
			'default'           => true,
			'sanitize_callback' => 'kkd_sanitize_checkbox',
		)
	);
	$wp_customize->add_control(
		'kkd_sticky_header',
		array(
			'section' => 'kkd_brand',
			'label'   => __( 'Keep the header visible while scrolling', 'keepkeep-decorated' ),
			'type'    => 'checkbox',
		)
	);

	$wp_customize->add_setting(
		'kkd_footer_about',
		array(
			'default'           => '',
			'sanitize_callback' => 'wp_kses_post',
		)
	);
	$wp_customize->add_control(
		'kkd_footer_about',
		array(
			'section'     => 'kkd_brand',
			'label'       => __( 'Footer brand description', 'keepkeep-decorated' ),
			'description' => __( 'One or two sentences about the publication. Falls back to your site tagline.', 'keepkeep-decorated' ),
			'type'        => 'textarea',
		)
	);

	$wp_customize->add_setting(
		'kkd_home_description',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'kkd_home_description',
		array(
			'section'     => 'kkd_brand',
			'label'       => __( 'Homepage meta description', 'keepkeep-decorated' ),
			'description' => __( 'Used only when no SEO plugin is active. With Yoast, Rank Math or AIOSEO installed, edit the homepage description there instead.', 'keepkeep-decorated' ),
			'type'        => 'textarea',
		)
	);

	/* --------------------------------------------------------- Homepage */
	$wp_customize->add_section(
		'kkd_homepage',
		array(
			'title'       => __( 'Homepage Sections', 'keepkeep-decorated' ),
			'priority'    => 26,
			'description' => __( 'Each section pulls live posts from a category you choose. Sections with no published posts are hidden automatically — nothing is faked.', 'keepkeep-decorated' ),
		)
	);

	$wp_customize->add_setting(
		'kkd_hero_source',
		array(
			'default'           => 'sticky',
			'sanitize_callback' => 'kkd_sanitize_select',
		)
	);
	$wp_customize->add_control(
		'kkd_hero_source',
		array(
			'section' => 'kkd_homepage',
			'label'   => __( 'Hero feature story', 'keepkeep-decorated' ),
			'type'    => 'select',
			'choices' => array(
				'sticky' => __( 'Sticky posts first, then most recent', 'keepkeep-decorated' ),
				'recent' => __( 'Most recent post', 'keepkeep-decorated' ),
			),
		)
	);

	foreach ( kkd_home_sections() as $key => $section ) {
		$wp_customize->add_setting(
			'kkd_section_' . $key,
			array(
				'default'           => $section['slug'],
				'sanitize_callback' => 'kkd_sanitize_category_slug',
			)
		);
		$wp_customize->add_control(
			'kkd_section_' . $key,
			array(
				'section'     => 'kkd_homepage',
				/* translators: %s: section heading. */
				'label'       => sprintf( __( '“%s” category slug', 'keepkeep-decorated' ), $section['title'] ),
				'description' => __( 'Leave empty to hide this section.', 'keepkeep-decorated' ),
				'type'        => 'text',
			)
		);
	}

	$wp_customize->add_setting(
		'kkd_popular_source',
		array(
			'default'           => 'comments',
			'sanitize_callback' => 'kkd_sanitize_select',
		)
	);
	$wp_customize->add_control(
		'kkd_popular_source',
		array(
			'section'     => 'kkd_homepage',
			'label'       => __( 'Popular articles are ranked by', 'keepkeep-decorated' ),
			'description' => __( 'The theme never invents view counts. Choose a signal WordPress can measure honestly.', 'keepkeep-decorated' ),
			'type'        => 'select',
			'choices'     => array(
				'comments' => __( 'Most discussed (comment count)', 'keepkeep-decorated' ),
				'sticky'   => __( 'Posts you marked as sticky', 'keepkeep-decorated' ),
				'recent'   => __( 'Most recently published', 'keepkeep-decorated' ),
			),
		)
	);

	$wp_customize->add_setting(
		'kkd_about_page',
		array(
			'default'           => 0,
			'sanitize_callback' => 'absint',
		)
	);
	$wp_customize->add_control(
		'kkd_about_page',
		array(
			'section'     => 'kkd_homepage',
			'label'       => __( '“About” section page', 'keepkeep-decorated' ),
			'description' => __( 'The homepage About band uses this page’s excerpt and featured image.', 'keepkeep-decorated' ),
			'type'        => 'dropdown-pages',
		)
	);

	/* -------------------------------------------------------- Newsletter */
	$wp_customize->add_section(
		'kkd_newsletter',
		array(
			'title'       => __( 'Newsletter', 'keepkeep-decorated' ),
			'priority'    => 27,
			'description' => __( 'Paste the embed code from your email provider (Mailchimp, MailerLite, Kit, Brevo…). Until you do, the newsletter blocks stay hidden so readers never meet a form that silently fails.', 'keepkeep-decorated' ),
		)
	);

	$wp_customize->add_setting(
		'kkd_newsletter_heading',
		array(
			'default'           => __( 'Decorating ideas, once a week', 'keepkeep-decorated' ),
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'kkd_newsletter_heading',
		array(
			'section' => 'kkd_newsletter',
			'label'   => __( 'Heading', 'keepkeep-decorated' ),
			'type'    => 'text',
		)
	);

	$wp_customize->add_setting(
		'kkd_newsletter_text',
		array(
			'default'           => __( 'Room-by-room ideas, seasonal styling notes and practical projects — sent to your inbox. No spam, unsubscribe any time.', 'keepkeep-decorated' ),
			'sanitize_callback' => 'sanitize_textarea_field',
		)
	);
	$wp_customize->add_control(
		'kkd_newsletter_text',
		array(
			'section' => 'kkd_newsletter',
			'label'   => __( 'Supporting text', 'keepkeep-decorated' ),
			'type'    => 'textarea',
		)
	);

	$wp_customize->add_setting(
		'kkd_newsletter_embed',
		array(
			'default'           => '',
			'sanitize_callback' => 'kkd_sanitize_ad_code',
		)
	);
	$wp_customize->add_control(
		'kkd_newsletter_embed',
		array(
			'section'     => 'kkd_newsletter',
			'label'       => __( 'Signup form embed code', 'keepkeep-decorated' ),
			'description' => __( 'Paste a form embed, or the shortcode of a form plugin. Leave empty to hide all newsletter blocks.', 'keepkeep-decorated' ),
			'type'        => 'textarea',
		)
	);

	/* ------------------------------------------------ Contact & social */
	$wp_customize->add_section(
		'kkd_contact',
		array(
			'title'       => __( 'Contact & Social', 'keepkeep-decorated' ),
			'priority'    => 28,
			'description' => __( 'Only filled-in profiles are shown, and only real URLs are added to your Organization structured data.', 'keepkeep-decorated' ),
		)
	);

	$wp_customize->add_setting(
		'kkd_contact_email',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_email',
		)
	);
	$wp_customize->add_control(
		'kkd_contact_email',
		array(
			'section' => 'kkd_contact',
			'label'   => __( 'Public contact email', 'keepkeep-decorated' ),
			'type'    => 'email',
		)
	);

	$socials = array(
		'pinterest' => __( 'Pinterest URL', 'keepkeep-decorated' ),
		'instagram' => __( 'Instagram URL', 'keepkeep-decorated' ),
		'facebook'  => __( 'Facebook URL', 'keepkeep-decorated' ),
		'x'         => __( 'X (Twitter) URL', 'keepkeep-decorated' ),
		'youtube'   => __( 'YouTube URL', 'keepkeep-decorated' ),
	);
	foreach ( $socials as $key => $label ) {
		$wp_customize->add_setting(
			'kkd_social_' . $key,
			array(
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
			)
		);
		$wp_customize->add_control(
			'kkd_social_' . $key,
			array(
				'section' => 'kkd_contact',
				'label'   => $label,
				'type'    => 'url',
			)
		);
	}

	/* --------------------------------------------------------- Adverts */
	$wp_customize->add_section(
		'kkd_ads',
		array(
			'title'       => __( 'Advertising', 'keepkeep-decorated' ),
			'priority'    => 29,
			'description' => __( 'Paste your own ad code into the placements you want to use. Empty placements render nothing at all — no boxes, no blank space. Content stays the main event: the theme deliberately offers no way to stack ads above the article title.', 'keepkeep-decorated' ),
		)
	);

	$wp_customize->add_setting(
		'kkd_adsense_publisher_id',
		array(
			'default'           => '',
			'sanitize_callback' => 'kkd_sanitize_publisher_id',
		)
	);
	$wp_customize->add_control(
		'kkd_adsense_publisher_id',
		array(
			'section'     => 'kkd_ads',
			'label'       => __( 'AdSense publisher ID', 'keepkeep-decorated' ),
			'description' => __( 'Format: ca-pub-0000000000000000. Leave empty until your own account is approved — the theme ships with no publisher ID.', 'keepkeep-decorated' ),
			'type'        => 'text',
		)
	);

	$wp_customize->add_setting(
		'kkd_adsense_auto_ads',
		array(
			'default'           => false,
			'sanitize_callback' => 'kkd_sanitize_checkbox',
		)
	);
	$wp_customize->add_control(
		'kkd_adsense_auto_ads',
		array(
			'section'     => 'kkd_ads',
			'label'       => __( 'Load the AdSense script for Auto ads', 'keepkeep-decorated' ),
			'description' => __( 'Requires a publisher ID. Manual placements below work without this.', 'keepkeep-decorated' ),
			'type'        => 'checkbox',
		)
	);

	foreach ( kkd_ad_slots() as $slot => $meta ) {
		$wp_customize->add_setting(
			'kkd_ad_' . $slot,
			array(
				'default'           => '',
				'sanitize_callback' => 'kkd_sanitize_ad_code',
			)
		);
		$wp_customize->add_control(
			'kkd_ad_' . $slot,
			array(
				'section'     => 'kkd_ads',
				'label'       => $meta['label'],
				'description' => $meta['description'],
				'type'        => 'textarea',
			)
		);
	}

	$wp_customize->add_setting(
		'kkd_ads_txt',
		array(
			'default'           => '',
			'sanitize_callback' => 'kkd_sanitize_textarea_plain',
		)
	);
	$wp_customize->add_control(
		'kkd_ads_txt',
		array(
			'section'     => 'kkd_ads',
			'label'       => __( 'ads.txt records', 'keepkeep-decorated' ),
			'description' => __( 'Optional. Served at /ads.txt when no real file exists on the server. One record per line.', 'keepkeep-decorated' ),
			'type'        => 'textarea',
		)
	);
}
add_action( 'customize_register', 'kkd_customize_register' );

/**
 * Live-preview script for the title and tagline.
 */
function kkd_customize_preview_js() {
	wp_enqueue_script(
		'kkd-customizer',
		KKD_URI . '/assets/js/customizer.js',
		array( 'jquery', 'customize-preview' ),
		KKD_VERSION,
		true
	);
}
add_action( 'customize_preview_init', 'kkd_customize_preview_js' );
