<?php
/**
 * JSON-LD structured data.
 *
 * Only facts that WordPress actually knows are emitted: the site name and logo,
 * the breadcrumb trail that is visibly rendered on the page, the post's real
 * dates, and the author account that wrote it. Nothing is invented — no
 * ratings, no review counts, no fabricated credentials.
 *
 * Yoast SEO, Rank Math, AIOSEO and The SEO Framework all publish their own
 * `@graph`, so when one of them is active the theme emits nothing at all rather
 * than risk conflicting duplicate entities.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Site logo URL for the Organization node.
 *
 * @return string
 */
function kkd_schema_logo() {
	$logo_id = (int) get_theme_mod( 'custom_logo' );
	if ( $logo_id ) {
		$src = wp_get_attachment_image_src( $logo_id, 'full' );
		if ( $src ) {
			return $src[0];
		}
	}
	return KKD_URI . '/assets/images/logo.svg';
}

/**
 * Publisher profile URLs the owner has actually filled in.
 *
 * @return string[]
 */
function kkd_schema_same_as() {
	$profiles = array(
		get_theme_mod( 'kkd_social_pinterest', '' ),
		get_theme_mod( 'kkd_social_instagram', '' ),
		get_theme_mod( 'kkd_social_facebook', '' ),
		get_theme_mod( 'kkd_social_x', '' ),
		get_theme_mod( 'kkd_social_youtube', '' ),
	);

	$profiles = array_filter(
		array_map( 'esc_url_raw', array_map( 'trim', $profiles ) )
	);

	return array_values( array_unique( $profiles ) );
}

/**
 * Organization node.
 *
 * @return array
 */
function kkd_schema_organization() {
	$node = array(
		'@type' => 'Organization',
		'@id'   => home_url( '/#organization' ),
		'name'  => get_bloginfo( 'name' ),
		'url'   => home_url( '/' ),
		'logo'  => array(
			'@type' => 'ImageObject',
			'@id'   => home_url( '/#logo' ),
			'url'   => kkd_schema_logo(),
		),
	);

	$same_as = kkd_schema_same_as();
	if ( $same_as ) {
		$node['sameAs'] = $same_as;
	}

	$email = sanitize_email( (string) get_theme_mod( 'kkd_contact_email', '' ) );
	if ( $email && is_email( $email ) ) {
		$node['email'] = $email;
	}

	return $node;
}

/**
 * WebSite node, including the site search action.
 *
 * @return array
 */
function kkd_schema_website() {
	return array(
		'@type'           => 'WebSite',
		'@id'             => home_url( '/#website' ),
		'url'             => home_url( '/' ),
		'name'            => get_bloginfo( 'name' ),
		'description'     => get_bloginfo( 'description', 'display' ),
		'publisher'       => array( '@id' => home_url( '/#organization' ) ),
		'inLanguage'      => get_bloginfo( 'language' ),
		'potentialAction' => array(
			array(
				'@type'       => 'SearchAction',
				'target'      => array(
					'@type'       => 'EntryPoint',
					'urlTemplate' => home_url( '/?s={search_term_string}' ),
				),
				'query-input' => 'required name=search_term_string',
			),
		),
	);
}

/**
 * Person node for a WordPress user.
 *
 * @param int $user_id User ID.
 * @return array
 */
function kkd_schema_person( $user_id ) {
	$user_id = (int) $user_id;

	$node = array(
		'@type' => 'Person',
		'@id'   => get_author_posts_url( $user_id ) . '#person',
		'name'  => get_the_author_meta( 'display_name', $user_id ),
		'url'   => get_author_posts_url( $user_id ),
	);

	$bio = trim( (string) get_the_author_meta( 'description', $user_id ) );
	if ( $bio ) {
		$node['description'] = wp_strip_all_tags( $bio );
	}

	$avatar = get_avatar_url( $user_id, array( 'size' => 192 ) );
	if ( $avatar ) {
		$node['image'] = array(
			'@type' => 'ImageObject',
			'url'   => $avatar,
		);
	}

	$profiles = array_filter(
		array(
			get_the_author_meta( 'url', $user_id ),
			get_the_author_meta( 'kkd_instagram', $user_id ),
			get_the_author_meta( 'kkd_pinterest', $user_id ),
		)
	);
	if ( $profiles ) {
		$node['sameAs'] = array_values( array_map( 'esc_url_raw', $profiles ) );
	}

	return $node;
}

/**
 * BlogPosting node for the current post.
 *
 * @return array
 */
function kkd_schema_blog_posting() {
	$post_id   = get_the_ID();
	$author_id = (int) get_post_field( 'post_author', $post_id );

	$node = array(
		'@type'            => 'BlogPosting',
		'@id'              => get_permalink() . '#article',
		'isPartOf'         => array( '@id' => home_url( '/#website' ) ),
		'mainEntityOfPage' => array( '@id' => get_permalink() . '#webpage' ),
		'headline'         => wp_strip_all_tags( get_the_title() ),
		'url'              => get_permalink(),
		'datePublished'    => get_the_date( DATE_W3C ),
		'dateModified'     => get_the_modified_date( DATE_W3C ),
		'author'           => array( '@id' => get_author_posts_url( $author_id ) . '#person' ),
		'publisher'        => array( '@id' => home_url( '/#organization' ) ),
		'inLanguage'       => get_bloginfo( 'language' ),
		'wordCount'        => kkd_word_count( $post_id ),
	);

	$description = kkd_meta_description();
	if ( $description ) {
		$node['description'] = $description;
	}

	if ( has_post_thumbnail( $post_id ) ) {
		$src = wp_get_attachment_image_src( get_post_thumbnail_id( $post_id ), 'post-thumbnail' );
		if ( $src ) {
			$node['image'] = array(
				'@type'  => 'ImageObject',
				'url'    => $src[0],
				'width'  => (int) $src[1],
				'height' => (int) $src[2],
			);
		}
	}

	$term = kkd_primary_category( $post_id );
	if ( $term ) {
		$node['articleSection'] = $term->name;
	}

	$tags = get_the_tags( $post_id );
	if ( $tags && ! is_wp_error( $tags ) ) {
		$node['keywords'] = wp_list_pluck( $tags, 'name' );
	}

	if ( comments_open( $post_id ) || get_comments_number( $post_id ) ) {
		$node['commentCount'] = (int) get_comments_number( $post_id );
	}

	return $node;
}

/**
 * WebPage node for a static page.
 *
 * @return array
 */
function kkd_schema_web_page() {
	$node = array(
		'@type'      => 'WebPage',
		'@id'        => get_permalink() . '#webpage',
		'url'        => get_permalink(),
		'name'       => wp_strip_all_tags( get_the_title() ),
		'isPartOf'   => array( '@id' => home_url( '/#website' ) ),
		'inLanguage' => get_bloginfo( 'language' ),
		'datePublished' => get_the_date( DATE_W3C ),
		'dateModified'  => get_the_modified_date( DATE_W3C ),
	);

	$description = kkd_meta_description();
	if ( $description ) {
		$node['description'] = $description;
	}

	return $node;
}

/**
 * CollectionPage node for category and tag archives.
 *
 * @return array|null
 */
function kkd_schema_collection_page() {
	$term = get_queried_object();
	if ( ! $term instanceof WP_Term ) {
		return null;
	}
	$link = get_term_link( $term );
	if ( is_wp_error( $link ) ) {
		return null;
	}

	$node = array(
		'@type'      => 'CollectionPage',
		'@id'        => $link . '#webpage',
		'url'        => $link,
		'name'       => $term->name,
		'isPartOf'   => array( '@id' => home_url( '/#website' ) ),
		'inLanguage' => get_bloginfo( 'language' ),
	);

	$description = wp_strip_all_tags( (string) term_description( $term ) );
	if ( $description ) {
		$node['description'] = trim( preg_replace( '/\s+/', ' ', $description ) );
	}

	return $node;
}

/**
 * BreadcrumbList node built from the visible breadcrumb trail.
 *
 * @return array|null
 */
function kkd_schema_breadcrumbs() {
	if ( is_front_page() || kkd_plugin_breadcrumbs_available() ) {
		return null;
	}

	$items = kkd_breadcrumb_items();
	if ( count( $items ) < 2 ) {
		return null;
	}

	$elements = array();
	foreach ( $items as $index => $item ) {
		$element = array(
			'@type'    => 'ListItem',
			'position' => $index + 1,
			'name'     => $item['name'],
		);
		if ( ! empty( $item['url'] ) ) {
			$element['item'] = $item['url'];
		}
		$elements[] = $element;
	}

	return array(
		'@type'           => 'BreadcrumbList',
		'@id'             => kkd_current_url() . '#breadcrumb',
		'itemListElement' => $elements,
	);
}

/**
 * Best-effort URL of the current request, used only for schema `@id` values.
 *
 * @return string
 */
function kkd_current_url() {
	if ( is_singular() ) {
		return (string) get_permalink();
	}
	$canonical = kkd_canonical_url();
	return $canonical ? $canonical : home_url( '/' );
}

/**
 * Output the combined JSON-LD graph.
 */
function kkd_output_schema() {
	if ( kkd_seo_plugin_active() ) {
		return; // The plugin publishes its own graph.
	}

	/**
	 * Filters whether the theme prints structured data.
	 *
	 * @param bool $enabled Whether to print JSON-LD.
	 */
	if ( ! apply_filters( 'kkd_enable_schema', true ) ) {
		return;
	}

	$graph = array( kkd_schema_organization(), kkd_schema_website() );

	if ( is_singular( 'post' ) ) {
		$graph[] = kkd_schema_blog_posting();
		$graph[] = kkd_schema_person( (int) get_post_field( 'post_author', get_the_ID() ) );
	} elseif ( is_page() ) {
		$graph[] = kkd_schema_web_page();
	} elseif ( is_author() ) {
		$graph[] = kkd_schema_person( get_queried_object_id() );
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$collection = kkd_schema_collection_page();
		if ( $collection ) {
			$graph[] = $collection;
		}
	}

	$breadcrumbs = kkd_schema_breadcrumbs();
	if ( $breadcrumbs ) {
		$graph[] = $breadcrumbs;
	}

	$data = array(
		'@context' => 'https://schema.org',
		'@graph'   => $graph,
	);

	/*
	 * JSON_HEX_TAG escapes `<` and `>` to their \u equivalents, which keeps a
	 * literal "</script>" inside a post title from breaking out of the tag.
	 */
	$json = wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP );
	if ( false === $json ) {
		return;
	}

	echo '<script type="application/ld+json">' . $json . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON encoded with HTML-safe flags.
}
add_action( 'wp_head', 'kkd_output_schema', 20 );
