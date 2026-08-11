<?php
/**
 * Filters and small helpers that shape WordPress output.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Excerpt length, in words.
 *
 * @param int $length Default length.
 * @return int
 */
function kkd_excerpt_length( $length ) {
	return is_singular() ? 32 : 22;
}
add_filter( 'excerpt_length', 'kkd_excerpt_length' );

/**
 * Replace the excerpt "[...]" with a typographic ellipsis.
 *
 * @return string
 */
function kkd_excerpt_more() {
	return '&hellip;';
}
add_filter( 'excerpt_more', 'kkd_excerpt_more' );

/**
 * Layout-related body classes.
 *
 * @param array $classes Body classes.
 * @return array
 */
function kkd_body_classes( $classes ) {
	if ( ! is_active_sidebar( 'sidebar-1' ) ) {
		$classes[] = 'kkd-no-sidebar';
	}
	if ( is_singular() ) {
		$classes[] = 'kkd-singular';
	}
	if ( ! is_singular() ) {
		$classes[] = 'kkd-listing';
	}
	if ( get_theme_mod( 'kkd_sticky_header', true ) ) {
		$classes[] = 'kkd-has-sticky-header';
	}
	return $classes;
}
add_filter( 'body_class', 'kkd_body_classes' );

/**
 * Clean archive titles: WordPress prefixes them with "Category:", "Tag:", etc.
 * and the page already labels the archive type separately.
 *
 * @param string $title Archive title.
 * @return string
 */
function kkd_archive_title( $title ) {
	if ( is_category() || is_tag() || is_tax() ) {
		$title = single_term_title( '', false );
	} elseif ( is_author() ) {
		$title = get_the_author();
	} elseif ( is_post_type_archive() ) {
		$title = post_type_archive_title( '', false );
	}
	return $title;
}
add_filter( 'get_the_archive_title', 'kkd_archive_title' );

/**
 * Remove the emoji detection script and styles. Modern browsers render emoji
 * natively, so this is dead weight on every page load.
 */
function kkd_disable_emoji_assets() {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'admin_print_styles', 'print_emoji_styles' );
	remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
	remove_action( 'wp_head', 'wp_generator' );
}
add_action( 'init', 'kkd_disable_emoji_assets' );

/**
 * Drop the oEmbed front-end script; the theme does not rely on being embedded
 * elsewhere and it saves a request on every page.
 */
function kkd_dequeue_embed_script() {
	if ( ! is_admin() ) {
		wp_dequeue_script( 'wp-embed' );
	}
}
add_action( 'wp_footer', 'kkd_dequeue_embed_script' );

/**
 * Track post IDs already rendered on the current request so homepage sections
 * never repeat the same story twice.
 *
 * @param int|int[]|null $add Post ID(s) to remember, or null to just read.
 * @return int[]
 */
function kkd_shown_posts( $add = null ) {
	static $shown = array();

	if ( null !== $add ) {
		foreach ( (array) $add as $id ) {
			$id = (int) $id;
			if ( $id && ! in_array( $id, $shown, true ) ) {
				$shown[] = $id;
			}
		}
	}
	return $shown;
}

/**
 * Remember the current post as rendered.
 */
function kkd_mark_shown() {
	kkd_shown_posts( get_the_ID() );
}

/**
 * Look up a published page by slug and return its permalink.
 *
 * Used for graceful footer/404 fallbacks before the site owner has built menus.
 * Returns an empty string when the page does not exist, so nothing links to a
 * dead URL.
 *
 * @param string $slug Page slug.
 * @return string
 */
function kkd_page_url( $slug ) {
	static $cache = array();

	$slug = sanitize_title( $slug );
	if ( isset( $cache[ $slug ] ) ) {
		return $cache[ $slug ];
	}

	if ( 'privacy-policy' === $slug ) {
		$policy_id = (int) get_option( 'wp_page_for_privacy_policy' );
		if ( $policy_id && 'publish' === get_post_status( $policy_id ) ) {
			$cache[ $slug ] = get_permalink( $policy_id );
			return $cache[ $slug ];
		}
	}

	$page           = get_page_by_path( $slug );
	$cache[ $slug ] = ( $page && 'publish' === $page->post_status ) ? get_permalink( $page ) : '';

	return $cache[ $slug ];
}

/**
 * The category used as a post's section label in cards and article headers.
 *
 * @param int|null $post_id Post ID.
 * @return WP_Term|null
 */
function kkd_primary_category( $post_id = null ) {
	$terms = get_the_category( $post_id );
	if ( empty( $terms ) || is_wp_error( $terms ) ) {
		return null;
	}
	return $terms[0];
}

/**
 * Comment form copy tuned for a decor publication.
 *
 * @param array $defaults Comment form defaults.
 * @return array
 */
function kkd_comment_form_defaults( $defaults ) {
	$defaults['title_reply']          = __( 'Join the conversation', 'keepkeep-decorated' );
	$defaults['title_reply_to']       = __( 'Reply to %s', 'keepkeep-decorated' );
	$defaults['label_submit']         = __( 'Post comment', 'keepkeep-decorated' );
	$defaults['class_submit']         = 'kkd-btn kkd-btn--primary';
	$defaults['comment_notes_before'] = '<p class="kkd-form__note">' . esc_html__( 'Your email address will not be published. Required fields are marked *', 'keepkeep-decorated' ) . '</p>';
	$defaults['comment_field']        = sprintf(
		'<p class="comment-form-comment"><label for="comment">%1$s</label><textarea id="comment" name="comment" cols="45" rows="6" required></textarea></p>',
		esc_html__( 'Your comment', 'keepkeep-decorated' )
	);
	return $defaults;
}
add_filter( 'comment_form_defaults', 'kkd_comment_form_defaults' );

/**
 * Wrap content tables so they can scroll horizontally on small screens instead
 * of forcing the whole page to scroll.
 *
 * @param string $content Post content.
 * @return string
 */
function kkd_wrap_content_tables( $content ) {
	if ( is_admin() || is_feed() || false === strpos( $content, '<table' ) ) {
		return $content;
	}
	// Skip tables the block editor already wrapped in a figure.
	$content = preg_replace(
		'/(?<!<figure class="wp-block-table">)(<table\b)/',
		'<div class="kkd-table-scroll">$1',
		$content
	);
	return str_replace( '</table>', '</table></div>', $content );
}

add_filter( 'the_content', 'kkd_wrap_content_tables', 30 );

/**
 * Social share URLs for the current post.
 *
 * Share endpoints are plain links — no third-party scripts, no tracking.
 *
 * @return array<string,array{label:string,url:string}>
 */
function kkd_share_links() {
	$permalink = get_permalink();
	$title     = wp_strip_all_tags( get_the_title() );
	$image     = get_the_post_thumbnail_url( get_the_ID(), 'full' );

	$links = array(
		'facebook'  => array(
			'label' => __( 'Share on Facebook', 'keepkeep-decorated' ),
			'url'   => add_query_arg( 'u', urlencode( $permalink ), 'https://www.facebook.com/sharer/sharer.php' ),
		),
		'x'         => array(
			'label' => __( 'Share on X', 'keepkeep-decorated' ),
			'url'   => add_query_arg(
				array(
					'text' => urlencode( $title ),
					'url'  => urlencode( $permalink ),
				),
				'https://twitter.com/intent/tweet'
			),
		),
		'pinterest' => array(
			'label' => __( 'Save to Pinterest', 'keepkeep-decorated' ),
			'url'   => add_query_arg(
				array_filter(
					array(
						'url'         => urlencode( $permalink ),
						'description' => urlencode( $title ),
						'media'       => $image ? urlencode( $image ) : '',
					)
				),
				'https://pinterest.com/pin/create/button/'
			),
		),
		'email'     => array(
			'label' => __( 'Share by email', 'keepkeep-decorated' ),
			'url'   => 'mailto:?subject=' . rawurlencode( $title ) . '&body=' . rawurlencode( $permalink ),
		),
	);

	/**
	 * Filters the share destinations shown under articles.
	 *
	 * @param array $links Share links.
	 */
	return apply_filters( 'kkd_share_links', $links );
}

/**
 * Crawlable fallback for the primary menu.
 *
 * Shown only until the owner assigns a real menu under Appearance → Menus. It is
 * built from the categories that actually have posts, so it never links to an
 * empty archive.
 */
function kkd_primary_menu_fallback() {
	$items = array(
		array(
			'url'   => home_url( '/' ),
			'label' => __( 'Home', 'keepkeep-decorated' ),
		),
	);

	foreach ( get_categories( array( 'orderby' => 'name', 'number' => 6, 'hide_empty' => true ) ) as $category ) {
		$items[] = array(
			'url'   => get_category_link( $category->term_id ),
			'label' => $category->name,
		);
	}

	$about = kkd_page_url( 'about' );
	if ( $about ) {
		$items[] = array(
			'url'   => $about,
			'label' => __( 'About', 'keepkeep-decorated' ),
		);
	}

	echo '<ul id="kkd-primary-menu" class="kkd-menu">';
	foreach ( $items as $item ) {
		printf(
			'<li class="menu-item"><a href="%1$s">%2$s</a></li>',
			esc_url( $item['url'] ),
			esc_html( $item['label'] )
		);
	}
	echo '</ul>';
}

/**
 * Render a footer link column from a menu, falling back to page lookups.
 *
 * @param string   $location Menu theme location.
 * @param string   $heading  Column heading.
 * @param string[] $fallback Page slugs used when no menu is assigned.
 */
function kkd_footer_column( $location, $heading, $fallback = array() ) {
	$has_menu = has_nav_menu( $location );

	$links = array();
	if ( ! $has_menu ) {
		foreach ( $fallback as $slug ) {
			$url = kkd_page_url( $slug );
			if ( $url ) {
				$page = get_page_by_path( $slug );
				$links[] = array(
					'url'   => $url,
					'label' => $page ? get_the_title( $page ) : ucwords( str_replace( '-', ' ', $slug ) ),
				);
			}
		}
		if ( empty( $links ) ) {
			return;
		}
	}

	printf(
		'<div class="kkd-footer__col"><h2 class="kkd-footer__heading">%s</h2>',
		esc_html( $heading )
	);

	if ( $has_menu ) {
		wp_nav_menu(
			array(
				'theme_location' => $location,
				'container'      => false,
				'menu_class'     => 'kkd-footer__list',
				'depth'          => 1,
			)
		);
	} else {
		echo '<ul class="kkd-footer__list">';
		foreach ( $links as $link ) {
			printf(
				'<li><a href="%1$s">%2$s</a></li>',
				esc_url( $link['url'] ),
				esc_html( $link['label'] )
			);
		}
		echo '</ul>';
	}

	echo '</div>';
}

/**
 * Footer "Explore" column, built from categories when no menu is assigned.
 *
 * @param string $heading Column heading.
 */
function kkd_footer_explore_column( $heading ) {
	if ( has_nav_menu( 'footer-explore' ) ) {
		kkd_footer_column( 'footer-explore', $heading );
		return;
	}

	$categories = get_categories(
		array(
			'orderby'    => 'name',
			'number'     => 6,
			'hide_empty' => true,
		)
	);
	if ( empty( $categories ) ) {
		return;
	}

	printf(
		'<div class="kkd-footer__col"><h2 class="kkd-footer__heading">%s</h2><ul class="kkd-footer__list">',
		esc_html( $heading )
	);
	foreach ( $categories as $category ) {
		printf(
			'<li><a href="%1$s">%2$s</a></li>',
			esc_url( get_category_link( $category->term_id ) ),
			esc_html( $category->name )
		);
	}
	echo '</ul></div>';
}

/**
 * Social profile links the owner has filled in.
 *
 * @return array<string,array{label:string,url:string,path:string}>
 */
function kkd_social_profiles() {
	$icons = array(
		'pinterest' => 'M12 3a9 9 0 0 0-3.3 17.4c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.2-.8 3.4-.3 1 .5 1.9 1.5 1.9 1.8 0 3.1-2.3 3.1-5 0-2.1-1.4-3.6-3.9-3.6-2.8 0-4.6 2-4.6 4.3 0 .8.2 1.4.6 1.9.2.2.2.3.1.5l-.2.8c-.1.3-.3.4-.6.2-1.1-.5-1.8-2-1.8-3.3 0-2.7 2.2-5.6 6.5-5.6 3.5 0 5.8 2.5 5.8 5.2 0 3.6-2 6.3-5 6.3-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.7 1.7-1.1 2.3A9 9 0 1 0 12 3z',
		'instagram' => 'M12 7.4A4.6 4.6 0 1 0 16.6 12 4.6 4.6 0 0 0 12 7.4zm0 7.6A3 3 0 1 1 15 12a3 3 0 0 1-3 3zm5.9-7.8a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1zM12 4.6c1.9 0 2.2 0 3 .1a4.1 4.1 0 0 1 1.4.3 2.5 2.5 0 0 1 1.5 1.5 4.1 4.1 0 0 1 .3 1.4c0 .8.1 1.1.1 3s0 2.2-.1 3a4.1 4.1 0 0 1-.3 1.4 2.5 2.5 0 0 1-1.5 1.5 4.1 4.1 0 0 1-1.4.3c-.8 0-1.1.1-3 .1s-2.2 0-3-.1a4.1 4.1 0 0 1-1.4-.3 2.5 2.5 0 0 1-1.5-1.5 4.1 4.1 0 0 1-.3-1.4c0-.8-.1-1.1-.1-3s0-2.2.1-3a4.1 4.1 0 0 1 .3-1.4A2.5 2.5 0 0 1 7.6 5a4.1 4.1 0 0 1 1.4-.3c.8 0 1.1-.1 3-.1zM12 3c-1.9 0-2.3 0-3.1.1a5.7 5.7 0 0 0-1.9.3 4.1 4.1 0 0 0-2.3 2.3 5.7 5.7 0 0 0-.3 1.9C4.3 8.4 4.3 8.8 4.3 12s0 3.6.1 4.4a5.7 5.7 0 0 0 .3 1.9 4.1 4.1 0 0 0 2.3 2.3 5.7 5.7 0 0 0 1.9.3c.8.1 1.2.1 3.1.1s2.3 0 3.1-.1a5.7 5.7 0 0 0 1.9-.3 4.1 4.1 0 0 0 2.3-2.3 5.7 5.7 0 0 0 .3-1.9c.1-.8.1-1.2.1-4.4s0-3.6-.1-4.4a5.7 5.7 0 0 0-.3-1.9 4.1 4.1 0 0 0-2.3-2.3 5.7 5.7 0 0 0-1.9-.3C14.3 3 13.9 3 12 3z',
		'facebook'  => 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6A22 22 0 0 0 14.5 3.5c-2.3 0-3.9 1.4-3.9 4v2.4H8v3.1h2.6V21z',
		'x'         => 'M17.7 3h3.3l-7.2 8.2L21.5 21h-5.9l-4.6-6-5.3 6H2.4l7.5-8.6L2.7 3h6l4.3 5.7zm-1.2 16h1.8L7.4 4.8H5.5z',
		'youtube'   => 'M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.6 2.6 0 0 0-1.8 1.8A27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2z',
	);

	$labels = array(
		'pinterest' => __( 'Pinterest', 'keepkeep-decorated' ),
		'instagram' => __( 'Instagram', 'keepkeep-decorated' ),
		'facebook'  => __( 'Facebook', 'keepkeep-decorated' ),
		'x'         => __( 'X', 'keepkeep-decorated' ),
		'youtube'   => __( 'YouTube', 'keepkeep-decorated' ),
	);

	$profiles = array();
	foreach ( $icons as $key => $path ) {
		$url = trim( (string) get_theme_mod( 'kkd_social_' . $key, '' ) );
		if ( '' === $url ) {
			continue;
		}
		$profiles[ $key ] = array(
			'label' => $labels[ $key ],
			'url'   => $url,
			'path'  => $path,
		);
	}

	return $profiles;
}

/**
 * The homepage's category sections, in the order they appear.
 *
 * `slug` is only the default; each one is remappable in the Customizer, and a
 * section with no published posts is skipped entirely.
 *
 * @return array<string,array{title:string,slug:string,layout:string,count:int,tint:bool,intro:string}>
 */
function kkd_home_sections() {
	$sections = array(
		'decor'          => array(
			'title'  => __( 'Latest Decor Ideas', 'keepkeep-decorated' ),
			'slug'   => 'decor',
			'layout' => 'grid',
			'count'  => 6,
			'tint'   => false,
			'intro'  => __( 'Fresh looks for every room, from small refreshes to full rethinks.', 'keepkeep-decorated' ),
		),
		'interior-design' => array(
			'title'  => __( 'Interior Design', 'keepkeep-decorated' ),
			'slug'   => 'interior-design',
			'layout' => 'split',
			'count'  => 4,
			'tint'   => true,
			'intro'  => __( 'Colour, proportion, light and layout — the thinking behind rooms that work.', 'keepkeep-decorated' ),
		),
		'diy'            => array(
			'title'  => __( 'DIY Projects', 'keepkeep-decorated' ),
			'slug'   => 'diy',
			'layout' => 'grid',
			'count'  => 3,
			'tint'   => false,
			'intro'  => __( 'Weekend projects with clear steps, honest costs and realistic results.', 'keepkeep-decorated' ),
		),
		'organization'   => array(
			'title'  => __( 'Home Organization', 'keepkeep-decorated' ),
			'slug'   => 'organization',
			'layout' => 'list',
			'count'  => 4,
			'tint'   => true,
			'intro'  => __( 'Storage that holds up to everyday life, room by room.', 'keepkeep-decorated' ),
		),
		'furniture'      => array(
			'title'  => __( 'Furniture', 'keepkeep-decorated' ),
			'slug'   => 'furniture',
			'layout' => 'grid',
			'count'  => 3,
			'tint'   => false,
			'intro'  => __( 'Choosing, placing and caring for the pieces you live with.', 'keepkeep-decorated' ),
		),
		'lifestyle'      => array(
			'title'  => __( 'Lifestyle', 'keepkeep-decorated' ),
			'slug'   => 'lifestyle',
			'layout' => 'grid',
			'count'  => 3,
			'tint'   => true,
			'intro'  => __( 'Seasonal rhythms, hosting and the habits that keep a home feeling good.', 'keepkeep-decorated' ),
		),
	);

	/**
	 * Filters the homepage section definitions.
	 *
	 * @param array $sections Section definitions.
	 */
	return apply_filters( 'kkd_home_sections', $sections );
}

/**
 * Query args for a homepage section, excluding anything already displayed.
 *
 * @param array $args Base WP_Query args.
 * @return array
 */
function kkd_section_query_args( $args = array() ) {
	$defaults = array(
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => 4,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
		'post__not_in'        => kkd_shown_posts(),
	);
	return wp_parse_args( $args, $defaults );
}
