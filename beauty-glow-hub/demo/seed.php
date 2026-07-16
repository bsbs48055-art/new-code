<?php
/**
 * Beauty Glow Hub demo content seeder.
 *
 * Usage (from the WordPress root, with the theme active):
 *   wp eval-file wp-content/themes/beauty-glow-hub/demo/seed.php
 *
 * Idempotent-ish: it will skip categories/pages/menus that already exist by
 * slug, but will create duplicate posts if run twice. Intended for a fresh
 * install / demo environment.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "This script must be run via WP-CLI (wp eval-file).\n" );
	return;
}

require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$theme_dir = get_template_directory();
$img_dir   = $theme_dir . '/demo/images/';

WP_CLI::line( '==> Configuring site settings...' );
update_option( 'permalink_structure', '/%postname%/' );
update_option( 'blogdescription', 'Beauty, Skincare & Wellness Magazine' );
update_option( 'timezone_string', 'UTC' );
update_option( 'posts_per_page', 12 );
flush_rewrite_rules( false );

/* ------------------------------------------------------------------ Categories */
$categories = array(
	'skin-care'        => 'Expert skincare routines, ingredient guides and tips for healthy, glowing skin.',
	'hair-care'        => 'Everything from scalp care to repairing damage for stronger, shinier hair.',
	'makeup'           => 'Beginner-friendly makeup routines, product picks and application techniques.',
	'nail-care'        => 'Keep your nails strong and healthy with our nail care guides.',
	'beauty-tips'      => 'Timeless, practical beauty tips that actually work.',
	'anti-aging'       => 'Science-backed anti-aging ingredients and habits for firmer, smoother skin.',
	'natural-remedies' => 'Gentle, natural beauty remedies using simple, effective ingredients.',
	'product-reviews'  => 'Honest, hands-on reviews of beauty and skincare products.',
	'beauty-trends'    => 'The latest beauty trends explained — the good, the hype and the worth-trying.',
	'lifestyle'        => 'How diet, sleep, stress and wellness shape your beauty from within.',
);
$cat_ids = array();
foreach ( $categories as $slug => $desc ) {
	$existing = get_term_by( 'slug', $slug, 'category' );
	if ( $existing ) {
		$cat_ids[ $slug ] = (int) $existing->term_id;
		continue;
	}
	$name = ucwords( str_replace( '-', ' ', $slug ) );
	$res  = wp_insert_term( $name, 'category', array( 'slug' => $slug, 'description' => $desc ) );
	if ( ! is_wp_error( $res ) ) {
		$cat_ids[ $slug ] = (int) $res['term_id'];
		WP_CLI::line( "    + category: $name" );
	}
}

/* --------------------------------------------------------------------- Authors */
$authors = array(
	array(
		'login' => 'sophia-laurent',
		'name'  => 'Sophia Laurent',
		'email' => 'sophia@beautyglowhub.test',
		'role'  => 'editor',
		'bio'   => 'Sophia is the Editor-in-Chief of Beauty Glow Hub. With over a decade writing about skincare and cosmetic science, she is passionate about making evidence-based beauty accessible to everyone.',
	),
	array(
		'login' => 'maya-chen',
		'name'  => 'Maya Chen',
		'email' => 'maya@beautyglowhub.test',
		'role'  => 'author',
		'bio'   => 'Maya is a beauty writer specialising in hair care and makeup. She loves testing products in real life and sharing honest, practical advice.',
	),
	array(
		'login' => 'olivia-reed',
		'name'  => 'Olivia Reed',
		'email' => 'olivia@beautyglowhub.test',
		'role'  => 'author',
		'bio'   => 'Olivia covers wellness, natural remedies and lifestyle. She believes true beauty starts with healthy habits from the inside out.',
	),
);
$author_ids = array();
foreach ( $authors as $a ) {
	$user = get_user_by( 'login', $a['login'] );
	if ( ! $user ) {
		$uid = wp_insert_user(
			array(
				'user_login'   => $a['login'],
				'user_pass'    => wp_generate_password( 20 ),
				'user_email'   => $a['email'],
				'display_name' => $a['name'],
				'first_name'   => explode( ' ', $a['name'] )[0],
				'last_name'    => explode( ' ', $a['name'] )[1],
				'description'  => $a['bio'],
				'role'         => $a['role'],
			)
		);
		if ( ! is_wp_error( $uid ) ) {
			$author_ids[] = (int) $uid;
			WP_CLI::line( "    + author: {$a['name']}" );
		}
	} else {
		wp_update_user( array( 'ID' => $user->ID, 'description' => $a['bio'] ) );
		$author_ids[] = (int) $user->ID;
	}
}
if ( empty( $author_ids ) ) {
	$author_ids[] = 1;
}

/* ------------------------------------------------------------- Media sideload */
$attachment_for = array();
/**
 * Import a demo image into the media library once and return its ID.
 */
function bgh_import_image( $path ) {
	if ( ! file_exists( $path ) ) {
		return 0;
	}
	$filename = basename( $path );
	// Reuse if already imported.
	$existing = get_posts(
		array(
			'post_type'   => 'attachment',
			'meta_key'    => '_bgh_demo_src',
			'meta_value'  => $filename,
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( ! empty( $existing ) ) {
		return (int) $existing[0];
	}

	$upload = wp_upload_dir();
	$dest   = trailingslashit( $upload['path'] ) . $filename;
	copy( $path, $dest );

	$filetype = wp_check_filetype( $filename, null );
	$attach   = array(
		'post_mime_type' => $filetype['type'],
		'post_title'     => sanitize_file_name( pathinfo( $filename, PATHINFO_FILENAME ) ),
		'post_content'   => '',
		'post_status'    => 'inherit',
	);
	$attach_id = wp_insert_attachment( $attach, $dest );
	$meta      = wp_generate_attachment_metadata( $attach_id, $dest );
	wp_update_attachment_metadata( $attach_id, $meta );
	update_post_meta( $attach_id, '_bgh_demo_src', $filename );
	return (int) $attach_id;
}

$category_image = array(
	'skin-care'        => 'bgh-skincare.jpg',
	'hair-care'        => 'bgh-haircare.jpg',
	'makeup'           => 'bgh-makeup.jpg',
	'nail-care'        => 'bgh-nails.jpg',
	'beauty-tips'      => 'bgh-skincare.jpg',
	'anti-aging'       => 'bgh-skincare.jpg',
	'natural-remedies' => 'bgh-natural.jpg',
	'product-reviews'  => 'bgh-makeup.jpg',
	'beauty-trends'    => 'bgh-hero.jpg',
	'lifestyle'        => 'bgh-natural.jpg',
);
foreach ( array_unique( array_values( $category_image ) ) as $file ) {
	$attachment_for[ $file ] = bgh_import_image( $img_dir . $file );
}

/* ----------------------------------------------------------------------- Pages */
WP_CLI::line( '==> Creating pages...' );
$pages     = include $theme_dir . '/demo/pages.php';
$page_ids  = array();
foreach ( $pages as $p ) {
	$existing = get_page_by_path( $p['slug'] );
	if ( $existing ) {
		// Update in place (handles WordPress' auto-created draft pages, e.g. Privacy Policy).
		wp_update_post(
			array(
				'ID'           => $existing->ID,
				'post_title'   => $p['title'],
				'post_content' => $p['content'],
				'post_excerpt' => $p['excerpt'],
				'post_status'  => 'publish',
			)
		);
		if ( ! empty( $p['template'] ) ) {
			update_post_meta( $existing->ID, '_wp_page_template', $p['template'] );
		}
		$page_ids[ $p['slug'] ] = (int) $existing->ID;
		WP_CLI::line( "    ~ updated page: {$p['title']}" );
		continue;
	}
	$pid = wp_insert_post(
		array(
			'post_title'   => $p['title'],
			'post_name'    => $p['slug'],
			'post_content' => $p['content'],
			'post_excerpt' => $p['excerpt'],
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'post_author'  => $author_ids[0],
		)
	);
	if ( ! is_wp_error( $pid ) ) {
		if ( ! empty( $p['template'] ) ) {
			update_post_meta( $pid, '_wp_page_template', $p['template'] );
		}
		$page_ids[ $p['slug'] ] = (int) $pid;
		WP_CLI::line( "    + page: {$p['title']}" );
	}
}

// Static front page + posts page.
if ( isset( $page_ids['home'], $page_ids['blog'] ) ) {
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $page_ids['home'] );
	update_option( 'page_for_posts', $page_ids['blog'] );
}

/* ----------------------------------------------------------------------- Posts */
WP_CLI::line( '==> Creating posts...' );
$articles   = include $theme_dir . '/demo/articles.php';
$post_ids   = array();
$slug_to_id = array();
$i          = 0;
$day        = 2;
foreach ( $articles as $art ) {
	$existing = get_page_by_path( $art['slug'], OBJECT, 'post' );
	if ( $existing ) {
		$slug_to_id[ $art['slug'] ] = (int) $existing->ID;
		continue;
	}
	$author = $author_ids[ $i % count( $author_ids ) ];
	$date   = gmdate( 'Y-m-d H:i:s', strtotime( "-{$day} days" ) );

	$pid = wp_insert_post(
		array(
			'post_title'   => $art['title'],
			'post_name'    => $art['slug'],
			'post_content' => trim( $art['content'] ),
			'post_excerpt' => $art['excerpt'],
			'post_status'  => 'publish',
			'post_type'    => 'post',
			'post_author'  => $author,
			'post_date'    => $date,
			'post_date_gmt'=> $date,
			'comment_status' => 'open',
		)
	);
	if ( is_wp_error( $pid ) ) {
		continue;
	}

	// Category + tags.
	if ( isset( $cat_ids[ $art['cat'] ] ) ) {
		wp_set_post_categories( $pid, array( $cat_ids[ $art['cat'] ] ) );
	}
	if ( ! empty( $art['tags'] ) ) {
		wp_set_post_tags( $pid, $art['tags'] );
	}

	// Featured image by category.
	$file = isset( $category_image[ $art['cat'] ] ) ? $category_image[ $art['cat'] ] : '';
	if ( $file && ! empty( $attachment_for[ $file ] ) ) {
		set_post_thumbnail( $pid, $attachment_for[ $file ] );
	}

	// Mark featured posts as sticky-ish (used only as a hint).
	if ( ! empty( $art['featured'] ) ) {
		update_post_meta( $pid, '_bgh_featured', '1' );
	}

	$post_ids[]                 = $pid;
	$slug_to_id[ $art['slug'] ] = $pid;
	$i++;
	$day += 2;
	WP_CLI::line( "    + post: {$art['title']}" );
}

/* --------------------------------------------------- Demo comments (popularity) */
WP_CLI::line( '==> Adding demo comments...' );
$commenters = array(
	array( 'Grace M.', 'grace@example.com' ),
	array( 'Nadia K.', 'nadia@example.com' ),
	array( 'Emily T.', 'emily@example.com' ),
	array( 'Hannah B.', 'hannah@example.com' ),
	array( 'Zoe P.', 'zoe@example.com' ),
);
$comment_texts = array(
	'This was so helpful, thank you! I have already started applying these tips.',
	'Finally a clear explanation. Bookmarked for future reference.',
	'Loved this article — exactly what I needed to read today.',
	'Great advice. I appreciate that it is backed by real evidence.',
	'I tried this and saw a difference within a couple of weeks!',
);
$c = 0;
foreach ( $post_ids as $index => $pid ) {
	// Give the first ~12 posts a descending number of comments to drive "popular/trending".
	$num = max( 0, 6 - (int) floor( $index / 2 ) );
	for ( $n = 0; $n < $num; $n++ ) {
		$person = $commenters[ $c % count( $commenters ) ];
		wp_insert_comment(
			array(
				'comment_post_ID'      => $pid,
				'comment_author'       => $person[0],
				'comment_author_email' => $person[1],
				'comment_content'      => $comment_texts[ $c % count( $comment_texts ) ],
				'comment_approved'     => 1,
				'comment_date'         => gmdate( 'Y-m-d H:i:s', strtotime( '-1 days' ) ),
			)
		);
		$c++;
	}
}

/* ----------------------------------------------------------------------- Menus */
WP_CLI::line( '==> Building menus...' );

/**
 * Create (or reset) a menu and return its ID.
 */
function bgh_make_menu( $name ) {
	$menu = wp_get_nav_menu_object( $name );
	if ( $menu ) {
		return (int) $menu->term_id;
	}
	return (int) wp_create_nav_menu( $name );
}

$locations = get_theme_mod( 'nav_menu_locations', array() );
if ( ! is_array( $locations ) ) {
	$locations = array();
}

// Primary menu: Home, Categories, About, Contact.
$primary_id = bgh_make_menu( 'Primary' );
if ( ! wp_get_nav_menu_items( $primary_id ) ) {
	wp_update_nav_menu_item(
		$primary_id,
		0,
		array( 'menu-item-title' => 'Home', 'menu-item-url' => home_url( '/' ), 'menu-item-status' => 'publish' )
	);
	foreach ( array( 'skin-care', 'hair-care', 'makeup', 'anti-aging', 'product-reviews', 'beauty-trends' ) as $slug ) {
		if ( isset( $cat_ids[ $slug ] ) ) {
			wp_update_nav_menu_item(
				$primary_id,
				0,
				array(
					'menu-item-title'     => ucwords( str_replace( '-', ' ', $slug ) ),
					'menu-item-object'    => 'category',
					'menu-item-object-id' => $cat_ids[ $slug ],
					'menu-item-type'      => 'taxonomy',
					'menu-item-status'    => 'publish',
				)
			);
		}
	}
	foreach ( array( 'about-us' => 'About', 'contact' => 'Contact', 'faq' => 'FAQ' ) as $slug => $title ) {
		if ( isset( $page_ids[ $slug ] ) ) {
			wp_update_nav_menu_item(
				$primary_id,
				0,
				array(
					'menu-item-title'     => $title,
					'menu-item-object'    => 'page',
					'menu-item-object-id' => $page_ids[ $slug ],
					'menu-item-type'      => 'post_type',
					'menu-item-status'    => 'publish',
				)
			);
		}
	}
}
$locations['primary'] = $primary_id;

// Footer "Company" menu.
$footer_id = bgh_make_menu( 'Footer' );
if ( ! wp_get_nav_menu_items( $footer_id ) ) {
	foreach ( array( 'about-us' => 'About Us', 'contact' => 'Contact', 'write-for-us' => 'Write For Us', 'authors' => 'Authors', 'editorial-policy' => 'Editorial Policy', 'sitemap' => 'Sitemap' ) as $slug => $title ) {
		if ( isset( $page_ids[ $slug ] ) ) {
			wp_update_nav_menu_item( $footer_id, 0, array( 'menu-item-title' => $title, 'menu-item-object' => 'page', 'menu-item-object-id' => $page_ids[ $slug ], 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
		}
	}
}
$locations['footer'] = $footer_id;

// Legal menu.
$legal_id = bgh_make_menu( 'Legal' );
if ( ! wp_get_nav_menu_items( $legal_id ) ) {
	foreach ( array( 'privacy-policy' => 'Privacy Policy', 'terms-conditions' => 'Terms', 'disclaimer' => 'Disclaimer', 'affiliate-disclosure' => 'Affiliate Disclosure', 'cookie-policy' => 'Cookie Policy', 'dmca-policy' => 'DMCA' ) as $slug => $title ) {
		if ( isset( $page_ids[ $slug ] ) ) {
			wp_update_nav_menu_item( $legal_id, 0, array( 'menu-item-title' => $title, 'menu-item-object' => 'page', 'menu-item-object-id' => $page_ids[ $slug ], 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
		}
	}
}
$locations['legal'] = $legal_id;

set_theme_mod( 'nav_menu_locations', $locations );

/* ------------------------------------------------------------------ Theme mods */
set_theme_mod( 'bgh_social_facebook', 'https://facebook.com/beautyglowhub' );
set_theme_mod( 'bgh_social_instagram', 'https://instagram.com/beautyglowhub' );
set_theme_mod( 'bgh_social_pinterest', 'https://pinterest.com/beautyglowhub' );
set_theme_mod( 'bgh_social_twitter', 'https://twitter.com/beautyglowhub' );
set_theme_mod( 'bgh_footer_copyright', '' );

/* --------------------------------------------------------------------- Widgets */
$sidebars = get_option( 'sidebars_widgets', array() );
if ( empty( $sidebars['sidebar-1'] ) ) {
	// Register widget instances.
	update_option( 'widget_bgh_about', array( 2 => array( 'title' => 'About Beauty Glow Hub', 'text' => 'Trustworthy, research-informed beauty, skincare and wellness advice, reviewed by our editorial team.' ), '_multiwidget' => 1 ) );
	update_option( 'widget_bgh_popular_posts', array( 2 => array( 'title' => 'Popular Posts', 'number' => 5 ), '_multiwidget' => 1 ) );
	update_option( 'widget_bgh_newsletter', array( 2 => array( 'title' => 'Join Our Newsletter' ), '_multiwidget' => 1 ) );
	update_option( 'widget_categories', array( 2 => array( 'title' => 'Categories', 'count' => 1, 'hierarchical' => 0 ), '_multiwidget' => 1 ) );

	$sidebars['sidebar-1'] = array( 'bgh_about-2', 'bgh_popular_posts-2', 'categories-2', 'bgh_newsletter-2' );
	update_option( 'sidebars_widgets', $sidebars );
}

flush_rewrite_rules( false );

WP_CLI::success( 'Beauty Glow Hub demo content installed: ' . count( $post_ids ) . ' posts, ' . count( $page_ids ) . ' pages, ' . count( $cat_ids ) . ' categories.' );
