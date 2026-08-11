<?php
/**
 * Reading time estimate.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Word count for a post, ignoring markup and shortcodes.
 *
 * @param int|null $post_id Post ID.
 * @return int
 */
function kkd_word_count( $post_id = null ) {
	$post_id = $post_id ? (int) $post_id : get_the_ID();
	$content = (string) get_post_field( 'post_content', $post_id );
	$content = wp_strip_all_tags( strip_shortcodes( $content ) );

	if ( '' === trim( $content ) ) {
		return 0;
	}

	// preg_split handles multibyte content better than str_word_count().
	$words = preg_split( '/[\s\p{Z}]+/u', trim( $content ), -1, PREG_SPLIT_NO_EMPTY );

	return is_array( $words ) ? count( $words ) : 0;
}

/**
 * Human-readable reading time, e.g. "6 min read".
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function kkd_reading_time( $post_id = null ) {
	/**
	 * Filters the assumed reading speed in words per minute.
	 *
	 * @param int $wpm Words per minute.
	 */
	$wpm = (int) apply_filters( 'kkd_reading_words_per_minute', 220 );
	$wpm = max( 100, $wpm );

	$minutes = (int) max( 1, ceil( kkd_word_count( $post_id ) / $wpm ) );

	return sprintf(
		/* translators: %s: number of minutes. */
		_n( '%s min read', '%s min read', $minutes, 'keepkeep-decorated' ),
		number_format_i18n( $minutes )
	);
}
