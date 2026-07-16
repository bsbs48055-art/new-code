<?php
/**
 * Accessible breadcrumb trail (also feeds BreadcrumbList schema).
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Build an ordered array of breadcrumb items: [ 'name' => ..., 'url' => ... ].
 *
 * @return array
 */
function bgh_get_breadcrumb_items() {
	$items = array();
	$items[] = array(
		'name' => __( 'Home', 'beauty-glow-hub' ),
		'url'  => home_url( '/' ),
	);

	if ( is_singular( 'post' ) ) {
		$cats = get_the_category();
		if ( ! empty( $cats ) ) {
			$primary = $cats[0];
			// Include category ancestors.
			$ancestors = array_reverse( get_ancestors( $primary->term_id, 'category' ) );
			foreach ( $ancestors as $ancestor_id ) {
				$term    = get_term( $ancestor_id, 'category' );
				$items[] = array( 'name' => $term->name, 'url' => get_category_link( $term->term_id ) );
			}
			$items[] = array( 'name' => $primary->name, 'url' => get_category_link( $primary->term_id ) );
		}
		$items[] = array( 'name' => get_the_title(), 'url' => get_permalink() );
	} elseif ( is_page() ) {
		$ancestors = array_reverse( get_post_ancestors( get_the_ID() ) );
		foreach ( $ancestors as $ancestor_id ) {
			$items[] = array( 'name' => get_the_title( $ancestor_id ), 'url' => get_permalink( $ancestor_id ) );
		}
		$items[] = array( 'name' => get_the_title(), 'url' => get_permalink() );
	} elseif ( is_category() || is_tax() ) {
		$term = get_queried_object();
		if ( $term && ! is_wp_error( $term ) ) {
			$ancestors = array_reverse( get_ancestors( $term->term_id, $term->taxonomy ) );
			foreach ( $ancestors as $ancestor_id ) {
				$anc     = get_term( $ancestor_id, $term->taxonomy );
				$items[] = array( 'name' => $anc->name, 'url' => get_term_link( $anc ) );
			}
			$items[] = array( 'name' => single_term_title( '', false ), 'url' => get_term_link( $term ) );
		}
	} elseif ( is_tag() ) {
		$items[] = array( 'name' => single_tag_title( '', false ), 'url' => get_term_link( get_queried_object() ) );
	} elseif ( is_author() ) {
		$items[] = array( 'name' => __( 'Authors', 'beauty-glow-hub' ), 'url' => home_url( '/authors/' ) );
		$items[] = array( 'name' => get_the_author(), 'url' => get_author_posts_url( get_queried_object_id() ) );
	} elseif ( is_search() ) {
		/* translators: %s: search query. */
		$items[] = array( 'name' => sprintf( __( 'Search: %s', 'beauty-glow-hub' ), get_search_query() ), 'url' => '' );
	} elseif ( is_year() || is_month() || is_day() ) {
		$items[] = array( 'name' => get_the_archive_title(), 'url' => '' );
	} elseif ( is_404() ) {
		$items[] = array( 'name' => __( 'Page Not Found', 'beauty-glow-hub' ), 'url' => '' );
	} elseif ( is_home() && ! is_front_page() ) {
		$items[] = array( 'name' => get_the_title( get_option( 'page_for_posts' ) ), 'url' => '' );
	}

	return $items;
}

/**
 * Output the breadcrumb HTML.
 */
function bgh_breadcrumbs() {
	if ( is_front_page() ) {
		return;
	}
	$items = bgh_get_breadcrumb_items();
	if ( count( $items ) < 2 ) {
		return;
	}

	echo '<nav class="bgh-breadcrumbs" aria-label="' . esc_attr__( 'Breadcrumb', 'beauty-glow-hub' ) . '"><ol>';
	$last = count( $items ) - 1;
	foreach ( $items as $index => $item ) {
		if ( $index === $last || empty( $item['url'] ) ) {
			echo '<li><span aria-current="page">' . esc_html( $item['name'] ) . '</span></li>';
		} else {
			echo '<li><a href="' . esc_url( $item['url'] ) . '">' . esc_html( $item['name'] ) . '</a></li>';
		}
	}
	echo '</ol></nav>';
}
