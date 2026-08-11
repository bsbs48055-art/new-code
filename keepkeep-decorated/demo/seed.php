<?php
/**
 * Preview content installer (WP-CLI).
 *
 *     wp eval-file wp-content/themes/keepkeep-decorated/demo/seed.php
 *
 * Creates the six pillar categories, three authors, the About/Contact/policy
 * pages, the navigation menus, and fourteen preview articles with images — so
 * the theme can be reviewed with real content in the layouts.
 *
 * This is a preview harness, not a content strategy. Delete or replace the
 * articles before launch: a site whose value comes from someone else's demo
 * content is exactly what Google's helpful-content guidance is written against.
 *
 * Safe to re-run — everything is matched by slug and skipped if it exists.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "Run this with: wp eval-file demo/seed.php\n" );
	return;
}

require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$theme_dir = get_template_directory();

require_once $theme_dir . '/inc/starter-content.php';
require_once $theme_dir . '/demo/articles.php';

/**
 * Import an image from the demo folder into the media library, once.
 *
 * @param string $filename Image file name.
 * @param string $alt      Alt text.
 * @param string $caption  Optional caption.
 * @return int Attachment ID, or 0 on failure.
 */
function kkd_seed_attachment( $filename, $alt, $caption = '' ) {
	$image_dir = get_template_directory() . '/demo/images/';

	$existing = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 1,
			'name'           => sanitize_title( pathinfo( $filename, PATHINFO_FILENAME ) ),
			'fields'         => 'ids',
		)
	);
	if ( ! empty( $existing ) ) {
		return (int) $existing[0];
	}

	$source = $image_dir . $filename;
	if ( ! file_exists( $source ) ) {
		WP_CLI::warning( "Run 'php demo/generate-images.php' first." );
		WP_CLI::warning( "Missing image: {$filename}" );
		return 0;
	}

	$upload = wp_upload_bits( $filename, null, file_get_contents( $source ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( ! empty( $upload['error'] ) ) {
		WP_CLI::warning( $upload['error'] );
		return 0;
	}

	$attachment_id = wp_insert_attachment(
		array(
			'post_mime_type' => $upload['type'],
			'post_title'     => $alt,
			'post_excerpt'   => $caption,
			'post_status'    => 'inherit',
		),
		$upload['file']
	);

	if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
		return 0;
	}

	wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $upload['file'] ) );
	update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt );

	return (int) $attachment_id;
}

WP_CLI::line( '' );
WP_CLI::line( '=== KeepKeep Decorated preview content ===' );

/* ---------------------------------------------------------------- Settings */
WP_CLI::line( '-> Site settings' );
update_option( 'permalink_structure', '/%postname%/' );
update_option( 'blogname', 'KeepKeep Decorated' );
update_option( 'blogdescription', 'Home decor ideas, room by room' );
update_option( 'posts_per_page', 12 );
update_option( 'timezone_string', 'Europe/London' );
update_option( 'default_ping_status', 'closed' );
flush_rewrite_rules( false );

set_theme_mod( 'kkd_footer_about', 'An independent home decor publication. Practical, room-by-room guides for making a home feel considered — written and tested by people who live in ordinary houses.' );
set_theme_mod( 'kkd_home_description', 'Practical decorating guides, interior design fundamentals and honest DIY walk-throughs for real homes.' );

/* Remove the WordPress sample content so the demo is clean. */
$hello = get_page_by_path( 'hello-world', OBJECT, 'post' );
if ( $hello ) {
	wp_delete_post( $hello->ID, true );
	WP_CLI::line( '   removed the sample post' );
}
$sample = get_page_by_path( 'sample-page' );
if ( $sample ) {
	wp_delete_post( $sample->ID, true );
	WP_CLI::line( '   removed the sample page' );
}

/* -------------------------------------------------------------- Categories */
WP_CLI::line( '-> Categories' );
$category_ids = array();
foreach ( kkd_starter_categories() as $slug => $category ) {
	$term = get_term_by( 'slug', $slug, 'category' );
	if ( ! $term ) {
		$result = wp_insert_term(
			$category['name'],
			'category',
			array(
				'slug'        => $slug,
				'description' => $category['description'],
			)
		);
		if ( is_wp_error( $result ) ) {
			WP_CLI::warning( $result->get_error_message() );
			continue;
		}
		$category_ids[ $slug ] = (int) $result['term_id'];
		WP_CLI::line( "   + {$category['name']}" );
	} else {
		$category_ids[ $slug ] = (int) $term->term_id;
		wp_update_term( $term->term_id, 'category', array( 'description' => $category['description'] ) );
	}
}

/* ----------------------------------------------------------------- Authors */
WP_CLI::line( '-> Authors' );
$author_definitions = array(
	array(
		'login' => 'rosa-whitfield',
		'name'  => 'Rosa Whitfield',
		'email' => 'rosa@keepkeepdecorated.test',
		'role'  => 'editor',
		'title' => 'Editor',
		'bio'   => 'Rosa writes about decorating on a real budget, mostly from a small Victorian terrace that has taught her a great deal about awkward proportions. She has been renovating and writing about her own homes for over a decade.',
	),
	array(
		'login' => 'tom-arden',
		'name'  => 'Tom Arden',
		'email' => 'tom@keepkeepdecorated.test',
		'role'  => 'author',
		'title' => 'DIY and projects',
		'bio'   => 'Tom covers practical projects and furniture. He tests every method he writes about in his own house first, which is why some of the guides include what went wrong.',
	),
	array(
		'login' => 'nadia-ellery',
		'name'  => 'Nadia Ellery',
		'email' => 'nadia@keepkeepdecorated.test',
		'role'  => 'author',
		'title' => 'Contributing writer',
		'bio'   => 'Nadia writes about organization and the way homes work day to day, with a particular interest in small flats and shared spaces.',
	),
);

$author_ids = array();
foreach ( $author_definitions as $definition ) {
	$user = get_user_by( 'login', $definition['login'] );
	if ( ! $user ) {
		$user_id = wp_insert_user(
			array(
				'user_login'   => $definition['login'],
				'user_pass'    => wp_generate_password( 24 ),
				'user_email'   => $definition['email'],
				'display_name' => $definition['name'],
				'first_name'   => strtok( $definition['name'], ' ' ),
				'last_name'    => trim( substr( $definition['name'], strpos( $definition['name'], ' ' ) ) ),
				'description'  => $definition['bio'],
				'role'         => $definition['role'],
			)
		);
		if ( is_wp_error( $user_id ) ) {
			WP_CLI::warning( $user_id->get_error_message() );
			continue;
		}
		WP_CLI::line( "   + {$definition['name']}" );
	} else {
		$user_id = $user->ID;
		wp_update_user(
			array(
				'ID'          => $user_id,
				'description' => $definition['bio'],
			)
		);
	}
	update_user_meta( $user_id, 'kkd_role', $definition['title'] );
	$author_ids[] = (int) $user_id;
}

if ( empty( $author_ids ) ) {
	$author_ids = array( 1 );
}

/* ------------------------------------------------------------------- Pages */
WP_CLI::line( '-> Pages' );
$page_ids = array();
foreach ( kkd_starter_pages() as $slug => $page ) {
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		$page_ids[ $slug ] = (int) $existing->ID;

		/*
		 * WordPress ships a draft Privacy Policy page on every new install.
		 * Publish it and give it the policy template so the footer link works
		 * in the preview; its WordPress-authored content is left alone.
		 */
		if ( 'publish' !== $existing->post_status ) {
			wp_update_post(
				array(
					'ID'          => $existing->ID,
					'post_status' => 'publish',
				)
			);
			if ( $page['template'] ) {
				update_post_meta( $existing->ID, '_wp_page_template', $page['template'] );
			}
			update_post_meta( $existing->ID, '_kkd_disable_ads', 'yes' );
			WP_CLI::line( "   * published the existing “{$existing->post_title}” page" );
		}
		continue;
	}

	$page_id = wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $page['title'],
			'post_name'    => $slug,
			'post_content' => $page['content'],
			'post_author'  => $author_ids[0],
		),
		true
	);

	if ( is_wp_error( $page_id ) ) {
		WP_CLI::warning( $page_id->get_error_message() );
		continue;
	}

	if ( $page['template'] ) {
		update_post_meta( $page_id, '_wp_page_template', $page['template'] );
	}
	// Policy and utility pages stay ad-free.
	if ( in_array( $slug, array( 'privacy-policy', 'terms-and-conditions', 'disclaimer', 'editorial-policy', 'contact' ), true ) ) {
		update_post_meta( $page_id, '_kkd_disable_ads', 'yes' );
	}

	$page_ids[ $slug ] = (int) $page_id;
	WP_CLI::line( "   + {$page['title']}" );
}

// About page gets an image and an excerpt for the homepage band.
if ( isset( $page_ids['about'] ) ) {
	$about_image = kkd_seed_attachment( 'kkd-about.jpg', 'Illustration of a gallery wall above a console table with a plant' );
	if ( $about_image ) {
		set_post_thumbnail( $page_ids['about'], $about_image );
	}
	wp_update_post(
		array(
			'ID'           => $page_ids['about'],
			'post_excerpt' => 'We are an independent home decor publication. We write practical, room-by-room guides for people who want their home to feel considered without hiring a designer or starting from scratch — and we say plainly when something is opinion rather than tested fact.',
		)
	);
	set_theme_mod( 'kkd_about_page', $page_ids['about'] );
}

// A posts index page, so the static homepage and the archive can coexist.
$blog_page = get_page_by_path( 'articles' );
if ( ! $blog_page ) {
	$blog_id = wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => 'Articles',
			'post_name'    => 'articles',
			'post_excerpt' => 'Every guide we have published, newest first.',
			'post_author'  => $author_ids[0],
		)
	);
} else {
	$blog_id = $blog_page->ID;
}

$front_page = get_page_by_path( 'home' );
if ( ! $front_page ) {
	$front_id = wp_insert_post(
		array(
			'post_type'   => 'page',
			'post_status' => 'publish',
			'post_title'  => 'Home',
			'post_name'   => 'home',
			'post_author' => $author_ids[0],
		)
	);
} else {
	$front_id = $front_page->ID;
}

update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $front_id );
update_option( 'page_for_posts', $blog_id );

if ( isset( $page_ids['privacy-policy'] ) ) {
	update_option( 'wp_page_for_privacy_policy', $page_ids['privacy-policy'] );
}

/* ---------------------------------------------------------------- Articles */
WP_CLI::line( '-> Articles' );
$articles      = kkd_demo_articles();
$total         = count( $articles );
$created_posts = array();

foreach ( $articles as $index => $article ) {
	$existing = get_page_by_path( $article['slug'], OBJECT, 'post' );
	if ( $existing ) {
		$created_posts[] = (int) $existing->ID;
		continue;
	}

	// Spread publication dates back over several months, newest first.
	$days_ago  = 3 + $index * 8;
	$published = gmdate( 'Y-m-d H:i:s', strtotime( "-{$days_ago} days 09:30" ) );

	$post_id = wp_insert_post(
		array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'post_title'     => $article['title'],
			'post_name'      => $article['slug'],
			'post_content'   => trim( $article['content'] ),
			'post_excerpt'   => $article['excerpt'],
			'post_author'    => $author_ids[ $index % count( $author_ids ) ],
			'post_date_gmt'  => $published,
			'post_date'      => get_date_from_gmt( $published ),
			'comment_status' => 'open',
		),
		true
	);

	if ( is_wp_error( $post_id ) ) {
		WP_CLI::warning( $post_id->get_error_message() );
		continue;
	}

	if ( isset( $category_ids[ $article['category'] ] ) ) {
		wp_set_post_categories( $post_id, array( $category_ids[ $article['category'] ] ) );
	}
	wp_set_post_tags( $post_id, $article['tags'] );

	$attachment_id = kkd_seed_attachment( $article['image'], $article['alt'] );
	if ( $attachment_id ) {
		set_post_thumbnail( $post_id, $attachment_id );
	}

	// A couple of posts get a later modified date so "Updated" is exercised.
	if ( 0 === $index % 5 ) {
		$updated = gmdate( 'Y-m-d H:i:s', strtotime( '-2 days 14:00' ) );
		wp_update_post(
			array(
				'ID'                => $post_id,
				'post_modified_gmt' => $updated,
				'post_modified'     => get_date_from_gmt( $updated ),
			)
		);
	}

	$created_posts[] = (int) $post_id;
	WP_CLI::line( sprintf( '   + [%d/%d] %s', $index + 1, $total, $article['title'] ) );
}

// Feature the two most substantial guides on the homepage hero.
if ( isset( $created_posts[0], $created_posts[3] ) ) {
	update_option( 'sticky_posts', array( $created_posts[0], $created_posts[3] ) );
}

/* ---------------------------------------------------------------- Comments */
WP_CLI::line( '-> A few comments (so the discussion layout can be reviewed)' );
$comment_seed = array(
	array( 'Ada Pierce', 'The point about bulb temperature is the one I keep forgetting. Swapped three bulbs last night and the room is unrecognisable.' ),
	array( 'Marcus Hale', 'Taping the footprint on the floor saved me from ordering a sofa 20cm too wide. Obvious in hindsight.' ),
	array( 'Priya Raman', 'I would add that the caulk step is worth doing even if you are not repainting. It tidied up our whole hallway.' ),
);
foreach ( array_slice( $created_posts, 0, 3 ) as $offset => $post_id ) {
	if ( get_comments_number( $post_id ) > 0 ) {
		continue;
	}
	$seed = $comment_seed[ $offset % count( $comment_seed ) ];
	wp_insert_comment(
		array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => $seed[0],
			'comment_author_email' => sanitize_title( $seed[0] ) . '@example.com',
			'comment_content'      => $seed[1],
			'comment_approved'     => 1,
			'comment_date_gmt'     => gmdate( 'Y-m-d H:i:s', strtotime( '-4 days' ) ),
			'comment_date'         => get_date_from_gmt( gmdate( 'Y-m-d H:i:s', strtotime( '-4 days' ) ) ),
		)
	);
}

/* ------------------------------------------------------------------- Menus */
WP_CLI::line( '-> Menus' );

/**
 * Create a menu and assign it to a theme location.
 *
 * @param string $name     Menu name.
 * @param string $location Theme location.
 * @param array  $items    Items: [ 'type' => page|category|home, 'value' => slug ].
 */
function kkd_seed_menu( $name, $location, $items ) {
	$menu = wp_get_nav_menu_object( $name );
	if ( ! $menu ) {
		$menu_id = wp_create_nav_menu( $name );
		if ( is_wp_error( $menu_id ) ) {
			WP_CLI::warning( $menu_id->get_error_message() );
			return;
		}
	} else {
		$menu_id = $menu->term_id;
		// Rebuild the menu so re-runs stay consistent.
		foreach ( wp_get_nav_menu_items( $menu_id ) as $item ) {
			wp_delete_post( $item->ID, true );
		}
	}

	$position = 1;
	foreach ( $items as $item ) {
		$args = array(
			'menu-item-status'   => 'publish',
			'menu-item-position' => $position,
		);

		if ( 'home' === $item['type'] ) {
			$page = get_page_by_path( $item['value'] );
			if ( ! $page ) {
				continue;
			}
			$args['menu-item-object']    = 'page';
			$args['menu-item-object-id'] = $page->ID;
			$args['menu-item-type']      = 'post_type';
			$args['menu-item-title']     = 'Home';
		} elseif ( 'page' === $item['type'] ) {
			$page = get_page_by_path( $item['value'] );
			if ( ! $page ) {
				continue;
			}
			$args['menu-item-object']    = 'page';
			$args['menu-item-object-id'] = $page->ID;
			$args['menu-item-type']      = 'post_type';
		} else {
			$term = get_term_by( 'slug', $item['value'], 'category' );
			if ( ! $term ) {
				continue;
			}
			$args['menu-item-object']    = 'category';
			$args['menu-item-object-id'] = $term->term_id;
			$args['menu-item-type']      = 'taxonomy';
		}

		wp_update_nav_menu_item( $menu_id, 0, $args );
		$position++;
	}

	$locations            = get_theme_mod( 'nav_menu_locations', array() );
	$locations[ $location ] = $menu_id;
	set_theme_mod( 'nav_menu_locations', $locations );

	WP_CLI::line( "   + {$name} → {$location}" );
}

kkd_seed_menu(
	'Primary',
	'primary',
	array(
		array( 'type' => 'home', 'value' => 'home' ),
		array( 'type' => 'category', 'value' => 'decor' ),
		array( 'type' => 'category', 'value' => 'interior-design' ),
		array( 'type' => 'category', 'value' => 'diy' ),
		array( 'type' => 'category', 'value' => 'organization' ),
		array( 'type' => 'category', 'value' => 'furniture' ),
		array( 'type' => 'category', 'value' => 'lifestyle' ),
		array( 'type' => 'page', 'value' => 'about' ),
	)
);

kkd_seed_menu(
	'Footer Explore',
	'footer-explore',
	array(
		array( 'type' => 'category', 'value' => 'decor' ),
		array( 'type' => 'category', 'value' => 'interior-design' ),
		array( 'type' => 'category', 'value' => 'diy' ),
		array( 'type' => 'category', 'value' => 'organization' ),
		array( 'type' => 'category', 'value' => 'furniture' ),
	)
);

kkd_seed_menu(
	'Footer Company',
	'footer-company',
	array(
		array( 'type' => 'page', 'value' => 'about' ),
		array( 'type' => 'page', 'value' => 'contact' ),
		array( 'type' => 'page', 'value' => 'editorial-policy' ),
		array( 'type' => 'page', 'value' => 'authors' ),
	)
);

kkd_seed_menu(
	'Footer Legal',
	'footer-legal',
	array(
		array( 'type' => 'page', 'value' => 'privacy-policy' ),
		array( 'type' => 'page', 'value' => 'terms-and-conditions' ),
		array( 'type' => 'page', 'value' => 'disclaimer' ),
	)
);

/* ----------------------------------------------------------------- Widgets */
WP_CLI::line( '-> Sidebar widgets' );
$sidebars = get_option( 'sidebars_widgets', array() );

if ( array( 'kkd_posts-2', 'kkd_about-2' ) !== ( $sidebars['sidebar-1'] ?? array() ) ) {
	update_option(
		'widget_kkd_posts',
		array(
			2 => array(
				'title'    => 'Most discussed',
				'number'   => 4,
				'orderby'  => 'comment_count',
				'category' => 0,
			),
			'_multiwidget' => 1,
		)
	);
	update_option(
		'widget_kkd_about',
		array(
			2 => array(
				'title' => 'About KeepKeep Decorated',
				'text'  => 'Practical, room-by-room decorating guides for real homes — written by people who test what they publish.',
				'link'  => isset( $page_ids['about'] ) ? $page_ids['about'] : 0,
			),
			'_multiwidget' => 1,
		)
	);

	$sidebars['sidebar-1'] = array( 'kkd_posts-2', 'kkd_about-2' );
	update_option( 'sidebars_widgets', $sidebars );
	WP_CLI::line( '   + article list + about card' );
}

WP_CLI::line( '' );
WP_CLI::success( 'Preview content installed. Replace the articles with your own work before launch.' );
WP_CLI::line( '' );
