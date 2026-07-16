<?php
/**
 * Estimated reading time.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Calculate reading time in minutes for a post.
 *
 * @param int|null $post_id Post ID (defaults to current).
 * @param int      $wpm     Words-per-minute reading speed.
 * @return int Minutes (minimum 1).
 */
function bgh_reading_time_minutes( $post_id = null, $wpm = 220 ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$content = get_post_field( 'post_content', $post_id );
	$words   = str_word_count( wp_strip_all_tags( strip_shortcodes( $content ) ) );
	$minutes = (int) ceil( $words / max( 1, $wpm ) );
	return max( 1, $minutes );
}

/**
 * Human-readable reading time string.
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function bgh_get_reading_time( $post_id = null ) {
	$minutes = bgh_reading_time_minutes( $post_id );
	/* translators: %d: number of minutes. */
	return sprintf( _n( '%d min read', '%d min read', $minutes, 'beauty-glow-hub' ), $minutes );
}
