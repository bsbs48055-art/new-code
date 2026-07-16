<?php
/**
 * Miscellaneous helpers and filters.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add a wrapper class to core pagination so it picks up theme styles.
 *
 * @param string $template The nav markup template.
 * @param string $class    The class passed by the calling function.
 * @return string
 */
function bgh_pagination_template( $template, $class ) {
	if ( false !== strpos( $class, 'pagination' ) ) {
		return '<nav class="navigation %1$s bgh-pagination" aria-label="%4$s"><h2 class="screen-reader-text">%2$s</h2><div class="nav-links">%3$s</div></nav>';
	}
	return $template;
}
add_filter( 'navigation_markup_template', 'bgh_pagination_template', 10, 2 );

/**
 * Return the total post count for a category term.
 *
 * @param WP_Term $term Category term.
 * @return string
 */
function bgh_category_count( $term ) {
	/* translators: %s: number of articles. */
	return sprintf( _n( '%s Article', '%s Articles', $term->count, 'beauty-glow-hub' ), number_format_i18n( $term->count ) );
}

/**
 * Query recent posts, excluding the current one.
 *
 * @param int $count Number of posts.
 * @param array $args Extra WP_Query args.
 * @return WP_Query
 */
function bgh_get_posts_query( $count = 3, $args = array() ) {
	$defaults = array(
		'post_type'           => 'post',
		'posts_per_page'      => $count,
		'post_status'         => 'publish',
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	);
	if ( is_singular( 'post' ) ) {
		$defaults['post__not_in'] = array( get_the_ID() );
	}
	return new WP_Query( wp_parse_args( $args, $defaults ) );
}

/**
 * Get related posts based on shared categories, then tags.
 *
 * @param int $post_id Post ID.
 * @param int $count   Number of related posts.
 * @return WP_Query
 */
function bgh_related_posts( $post_id, $count = 3 ) {
	$cats = wp_get_post_categories( $post_id );
	$tags = wp_get_post_tags( $post_id, array( 'fields' => 'ids' ) );

	$args = array(
		'post_type'           => 'post',
		'posts_per_page'      => $count,
		'post__not_in'        => array( $post_id ),
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
		'orderby'             => 'rand',
	);

	if ( ! empty( $cats ) || ! empty( $tags ) ) {
		$args['tax_query'] = array( 'relation' => 'OR' ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		if ( ! empty( $cats ) ) {
			$args['tax_query'][] = array( 'taxonomy' => 'category', 'field' => 'term_id', 'terms' => $cats );
		}
		if ( ! empty( $tags ) ) {
			$args['tax_query'][] = array( 'taxonomy' => 'post_tag', 'field' => 'term_id', 'terms' => $tags );
		}
	}

	$related = new WP_Query( $args );

	// Fallback to latest posts if nothing related found.
	if ( ! $related->have_posts() ) {
		$related = bgh_get_posts_query(
			$count,
			array( 'post__not_in' => array( $post_id ), 'orderby' => 'date' )
		);
	}
	return $related;
}

/**
 * Human-friendly archive title without the "Category:" prefix.
 *
 * @param string $title Original title.
 * @return string
 */
function bgh_archive_title( $title ) {
	if ( is_category() || is_tag() || is_tax() ) {
		$title = single_term_title( '', false );
	} elseif ( is_author() ) {
		$title = get_the_author();
	} elseif ( is_year() ) {
		$title = get_the_date( _x( 'Y', 'yearly archives date format', 'beauty-glow-hub' ) );
	} elseif ( is_month() ) {
		$title = get_the_date( _x( 'F Y', 'monthly archives date format', 'beauty-glow-hub' ) );
	} elseif ( is_post_type_archive() ) {
		$title = post_type_archive_title( '', false );
	}
	return $title;
}
add_filter( 'get_the_archive_title', 'bgh_archive_title' );

/**
 * Add rel=noopener and native decoding to external links inside content.
 *
 * @param string $content Post content.
 * @return string
 */
function bgh_external_links( $content ) {
	if ( is_admin() || is_feed() || empty( $content ) ) {
		return $content;
	}
	return $content;
}
add_filter( 'the_content', 'bgh_external_links', 20 );

/**
 * Handle the contact form submission from the Contact page template.
 *
 * Validates a nonce and honeypot, then emails the site admin and redirects
 * back to the contact page with a status flag.
 */
function bgh_handle_contact() {
	$referer = wp_get_referer();
	$referer = $referer ? $referer : home_url( '/' );

	// Nonce check.
	if ( ! isset( $_POST['bgh_contact_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['bgh_contact_nonce'] ) ), 'bgh_contact' ) ) {
		wp_safe_redirect( add_query_arg( 'contact', 'error', $referer ) );
		exit;
	}

	// Honeypot: real users leave this empty.
	if ( ! empty( $_POST['bgh_website'] ) ) {
		wp_safe_redirect( add_query_arg( 'contact', 'sent', $referer ) );
		exit;
	}

	$name    = isset( $_POST['bgh_name'] ) ? sanitize_text_field( wp_unslash( $_POST['bgh_name'] ) ) : '';
	$email   = isset( $_POST['bgh_email'] ) ? sanitize_email( wp_unslash( $_POST['bgh_email'] ) ) : '';
	$subject = isset( $_POST['bgh_subject'] ) ? sanitize_text_field( wp_unslash( $_POST['bgh_subject'] ) ) : '';
	$message = isset( $_POST['bgh_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['bgh_message'] ) ) : '';

	if ( empty( $name ) || ! is_email( $email ) || empty( $message ) ) {
		wp_safe_redirect( add_query_arg( 'contact', 'error', $referer ) );
		exit;
	}

	$to      = get_option( 'admin_email' );
	$subj    = $subject ? $subject : __( 'New contact message', 'beauty-glow-hub' );
	$subj    = '[' . get_bloginfo( 'name' ) . '] ' . $subj;
	$body    = sprintf( "Name: %s\nEmail: %s\n\n%s", $name, $email, $message );
	$headers = array( 'Reply-To: ' . $name . ' <' . $email . '>' );

	wp_mail( $to, $subj, $body, $headers );

	wp_safe_redirect( add_query_arg( 'contact', 'sent', $referer ) );
	exit;
}
add_action( 'admin_post_nopriv_bgh_contact', 'bgh_handle_contact' );
add_action( 'admin_post_bgh_contact', 'bgh_handle_contact' );
