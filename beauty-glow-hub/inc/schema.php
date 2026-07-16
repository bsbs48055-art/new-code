<?php
/**
 * Schema.org JSON-LD structured data.
 *
 * Outputs Organization, WebSite, Article/BlogPosting, BreadcrumbList and
 * Person schema in the footer. Kept dependency-free so the theme does not
 * require an SEO plugin for AdSense-ready structured data.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Site logo URL for schema (falls back to bundled logo).
 *
 * @return string
 */
function bgh_schema_logo_url() {
	$custom_logo_id = get_theme_mod( 'custom_logo' );
	if ( $custom_logo_id ) {
		$src = wp_get_attachment_image_src( $custom_logo_id, 'full' );
		if ( $src ) {
			return $src[0];
		}
	}
	return BGH_URI . '/assets/images/logo.svg';
}

/**
 * Organization node.
 *
 * @return array
 */
function bgh_schema_organization() {
	$social = array_filter(
		array(
			get_theme_mod( 'bgh_social_facebook' ),
			get_theme_mod( 'bgh_social_instagram' ),
			get_theme_mod( 'bgh_social_pinterest' ),
			get_theme_mod( 'bgh_social_twitter' ),
			get_theme_mod( 'bgh_social_youtube' ),
		)
	);

	return array(
		'@type'  => 'Organization',
		'@id'    => home_url( '/#organization' ),
		'name'   => get_bloginfo( 'name' ),
		'url'    => home_url( '/' ),
		'logo'   => array(
			'@type' => 'ImageObject',
			'url'   => bgh_schema_logo_url(),
		),
		'sameAs' => array_values( $social ),
	);
}

/**
 * WebSite node with SearchAction.
 *
 * @return array
 */
function bgh_schema_website() {
	return array(
		'@type'           => 'WebSite',
		'@id'             => home_url( '/#website' ),
		'url'             => home_url( '/' ),
		'name'            => get_bloginfo( 'name' ),
		'description'     => get_bloginfo( 'description' ),
		'publisher'       => array( '@id' => home_url( '/#organization' ) ),
		'inLanguage'      => get_bloginfo( 'language' ),
		'potentialAction' => array(
			'@type'       => 'SearchAction',
			'target'      => array(
				'@type'       => 'EntryPoint',
				'urlTemplate' => home_url( '/?s={search_term_string}' ),
			),
			'query-input' => 'required name=search_term_string',
		),
	);
}

/**
 * Article / BlogPosting node for singular posts.
 *
 * @return array
 */
function bgh_schema_article() {
	$post_id   = get_the_ID();
	$author_id = get_post_field( 'post_author', $post_id );

	$image = get_the_post_thumbnail_url( $post_id, 'post-thumbnail' );
	if ( ! $image ) {
		$image = BGH_URI . '/assets/images/og-default.jpg';
	}

	$node = array(
		'@type'            => 'BlogPosting',
		'@id'              => get_permalink() . '#article',
		'isPartOf'         => array( '@id' => home_url( '/#website' ) ),
		'mainEntityOfPage' => array( '@type' => 'WebPage', '@id' => get_permalink() ),
		'headline'         => wp_strip_all_tags( get_the_title() ),
		'description'      => bgh_get_meta_description(),
		'datePublished'    => get_the_date( DATE_W3C ),
		'dateModified'     => get_the_modified_date( DATE_W3C ),
		'wordCount'        => str_word_count( wp_strip_all_tags( get_post_field( 'post_content', $post_id ) ) ),
		'image'            => array( '@type' => 'ImageObject', 'url' => $image ),
		'author'           => array(
			'@type' => 'Person',
			'@id'   => get_author_posts_url( $author_id ) . '#author',
			'name'  => get_the_author_meta( 'display_name', $author_id ),
			'url'   => get_author_posts_url( $author_id ),
		),
		'publisher'        => array( '@id' => home_url( '/#organization' ) ),
		'inLanguage'       => get_bloginfo( 'language' ),
	);

	$cats = get_the_category();
	if ( ! empty( $cats ) ) {
		$node['articleSection'] = wp_list_pluck( $cats, 'name' );
	}
	$tags = get_the_tags();
	if ( ! empty( $tags ) ) {
		$node['keywords'] = implode( ', ', wp_list_pluck( $tags, 'name' ) );
	}

	return $node;
}

/**
 * BreadcrumbList node from the shared breadcrumb builder.
 *
 * @return array|null
 */
function bgh_schema_breadcrumbs() {
	if ( is_front_page() || ! function_exists( 'bgh_get_breadcrumb_items' ) ) {
		return null;
	}
	$items = bgh_get_breadcrumb_items();
	if ( count( $items ) < 2 ) {
		return null;
	}
	$list = array();
	foreach ( $items as $i => $item ) {
		$entry = array(
			'@type'    => 'ListItem',
			'position' => $i + 1,
			'name'     => $item['name'],
		);
		if ( ! empty( $item['url'] ) ) {
			$entry['item'] = $item['url'];
		}
		$list[] = $entry;
	}
	return array(
		'@type'           => 'BreadcrumbList',
		'@id'             => ( is_singular() ? get_permalink() : home_url( add_query_arg( array() ) ) ) . '#breadcrumb',
		'itemListElement' => $list,
	);
}

/**
 * Person (author) node for author archives.
 *
 * @return array
 */
function bgh_schema_person() {
	$author_id = get_queried_object_id();
	return array(
		'@type'       => 'Person',
		'@id'         => get_author_posts_url( $author_id ) . '#author',
		'name'        => get_the_author_meta( 'display_name', $author_id ),
		'description' => get_the_author_meta( 'description', $author_id ),
		'url'         => get_author_posts_url( $author_id ),
	);
}

/**
 * Output the combined @graph JSON-LD in the footer.
 */
function bgh_output_schema() {
	$graph = array( bgh_schema_organization(), bgh_schema_website() );

	if ( is_singular( 'post' ) ) {
		$graph[] = bgh_schema_article();
	}
	if ( is_author() ) {
		$graph[] = bgh_schema_person();
	}

	$crumbs = bgh_schema_breadcrumbs();
	if ( $crumbs ) {
		$graph[] = $crumbs;
	}

	$data = array(
		'@context' => 'https://schema.org',
		'@graph'   => $graph,
	);

	echo "\n" . '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}
add_action( 'wp_footer', 'bgh_output_schema', 20 );

/**
 * Output FAQPage schema when a page/post declares FAQs via the helper.
 *
 * @param array $faqs Array of [ 'q' => question, 'a' => answer ].
 */
function bgh_output_faq_schema( $faqs ) {
	if ( empty( $faqs ) ) {
		return;
	}
	$entities = array();
	foreach ( $faqs as $faq ) {
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => wp_strip_all_tags( $faq['q'] ),
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => wp_strip_all_tags( $faq['a'] ),
			),
		);
	}
	$data = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $entities,
	);
	echo "\n" . '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}
