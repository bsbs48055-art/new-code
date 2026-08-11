<?php
/**
 * Breadcrumbs.
 *
 * The trail is built once and reused for both the visible navigation and the
 * BreadcrumbList structured data, so the markup and the schema can never drift
 * apart (Google requires structured data to match visible content).
 *
 * When Yoast SEO or Rank Math breadcrumbs are enabled, their output is used
 * instead so the page never renders two trails.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Build the breadcrumb trail for the current view.
 *
 * @return array<int,array{name:string,url:string}> Ordered crumbs; the last has an empty URL.
 */
function kkd_breadcrumb_items() {
	$items = array(
		array(
			'name' => __( 'Home', 'keepkeep-decorated' ),
			'url'  => home_url( '/' ),
		),
	);

	if ( is_home() && ! is_front_page() ) {
		$items[] = array(
			'name' => get_the_title( (int) get_option( 'page_for_posts' ) ),
			'url'  => '',
		);
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			foreach ( array_reverse( get_ancestors( $term->term_id, $term->taxonomy ) ) as $ancestor_id ) {
				$ancestor = get_term( $ancestor_id, $term->taxonomy );
				if ( $ancestor && ! is_wp_error( $ancestor ) ) {
					$items[] = array(
						'name' => $ancestor->name,
						'url'  => get_term_link( $ancestor ),
					);
				}
			}
			$items[] = array(
				'name' => $term->name,
				'url'  => '',
			);
		}
	} elseif ( is_author() ) {
		$items[] = array(
			'name' => __( 'Authors', 'keepkeep-decorated' ),
			'url'  => kkd_page_url( 'authors' ),
		);
		$items[] = array(
			'name' => get_the_author_meta( 'display_name', get_queried_object_id() ),
			'url'  => '',
		);
	} elseif ( is_search() ) {
		$items[] = array(
			'name' => __( 'Search results', 'keepkeep-decorated' ),
			'url'  => '',
		);
	} elseif ( is_404() ) {
		$items[] = array(
			'name' => __( 'Page not found', 'keepkeep-decorated' ),
			'url'  => '',
		);
	} elseif ( is_year() || is_month() || is_day() ) {
		$items[] = array(
			'name' => get_the_archive_title(),
			'url'  => '',
		);
	} elseif ( is_singular() ) {
		$post_id = get_queried_object_id();

		if ( is_singular( 'post' ) ) {
			$term = kkd_primary_category( $post_id );
			if ( $term ) {
				foreach ( array_reverse( get_ancestors( $term->term_id, 'category' ) ) as $ancestor_id ) {
					$ancestor = get_term( $ancestor_id, 'category' );
					if ( $ancestor && ! is_wp_error( $ancestor ) ) {
						$items[] = array(
							'name' => $ancestor->name,
							'url'  => get_category_link( $ancestor ),
						);
					}
				}
				$items[] = array(
					'name' => $term->name,
					'url'  => get_category_link( $term->term_id ),
				);
			}
		} else {
			foreach ( array_reverse( get_post_ancestors( $post_id ) ) as $ancestor_id ) {
				$items[] = array(
					'name' => get_the_title( $ancestor_id ),
					'url'  => get_permalink( $ancestor_id ),
				);
			}
		}

		$items[] = array(
			'name' => get_the_title( $post_id ),
			'url'  => '',
		);
	}

	/*
	 * Drop unnamed crumbs, and intermediate crumbs whose URL lookup failed
	 * (e.g. an "Authors" crumb on a site with no authors page) so the trail
	 * never contains a link to nowhere.
	 */
	$last  = count( $items ) - 1;
	$items = array_values(
		array_filter(
			$items,
			static function ( $item, $index ) use ( $last ) {
				if ( '' === trim( (string) $item['name'] ) ) {
					return false;
				}
				return $index === $last || '' !== trim( (string) $item['url'] );
			},
			ARRAY_FILTER_USE_BOTH
		)
	);

	/**
	 * Filters the breadcrumb trail.
	 *
	 * @param array $items Breadcrumb items.
	 */
	return apply_filters( 'kkd_breadcrumb_items', $items );
}

/**
 * Whether an SEO plugin is rendering breadcrumbs for us.
 *
 * @return bool
 */
function kkd_plugin_breadcrumbs_available() {
	if ( function_exists( 'yoast_breadcrumb' ) && class_exists( 'WPSEO_Options' ) ) {
		return (bool) WPSEO_Options::get( 'breadcrumbs-enable', false );
	}
	if ( function_exists( 'rank_math_the_breadcrumbs' ) && function_exists( 'RankMath' ) ) {
		return true;
	}
	return false;
}

/**
 * Output the breadcrumb navigation.
 */
function kkd_breadcrumbs() {
	if ( is_front_page() ) {
		return;
	}

	if ( kkd_plugin_breadcrumbs_available() ) {
		echo '<nav class="kkd-breadcrumbs" aria-label="' . esc_attr__( 'Breadcrumb', 'keepkeep-decorated' ) . '">';
		if ( function_exists( 'yoast_breadcrumb' ) ) {
			yoast_breadcrumb();
		} else {
			rank_math_the_breadcrumbs();
		}
		echo '</nav>';
		return;
	}

	$items = kkd_breadcrumb_items();
	if ( count( $items ) < 2 ) {
		return;
	}

	echo '<nav class="kkd-breadcrumbs" aria-label="' . esc_attr__( 'Breadcrumb', 'keepkeep-decorated' ) . '">';
	echo '<ol class="kkd-breadcrumbs__list">';
	$last = count( $items ) - 1;
	foreach ( $items as $index => $item ) {
		echo '<li class="kkd-breadcrumbs__item">';
		if ( $item['url'] && $index !== $last ) {
			printf(
				'<a href="%1$s">%2$s</a>',
				esc_url( $item['url'] ),
				esc_html( $item['name'] )
			);
			echo '<span class="kkd-breadcrumbs__sep" aria-hidden="true">/</span>';
		} else {
			printf(
				'<span aria-current="page">%s</span>',
				esc_html( $item['name'] )
			);
		}
		echo '</li>';
	}
	echo '</ol></nav>';
}
