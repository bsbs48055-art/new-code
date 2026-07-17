<?php
/**
 * Social share buttons for single posts.
 *
 * @package Beauty_Glow_Hub
 */

$bgh_url   = rawurlencode( get_permalink() );
$bgh_title = rawurlencode( get_the_title() );
$bgh_img   = rawurlencode( (string) get_the_post_thumbnail_url( get_the_ID(), 'post-thumbnail' ) );
?>
<div class="bgh-share">
	<span><?php esc_html_e( 'Share:', 'beauty-glow-hub' ); ?></span>
	<a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $bgh_url; // phpcs:ignore ?>" target="_blank" rel="noopener noreferrer nofollow" aria-label="<?php esc_attr_e( 'Share on Facebook', 'beauty-glow-hub' ); ?>">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
	</a>
	<a href="https://www.pinterest.com/pin/create/button/?url=<?php echo $bgh_url; // phpcs:ignore ?>&media=<?php echo $bgh_img; // phpcs:ignore ?>&description=<?php echo $bgh_title; // phpcs:ignore ?>" target="_blank" rel="noopener noreferrer nofollow" aria-label="<?php esc_attr_e( 'Pin on Pinterest', 'beauty-glow-hub' ); ?>">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.6 19.33c-.08-.79-.16-2 .03-2.86.18-.78 1.13-4.79 1.13-4.79s-.29-.58-.29-1.43c0-1.34.78-2.34 1.74-2.34.82 0 1.22.62 1.22 1.36 0 .83-.53 2.07-.8 3.22-.23.96.48 1.75 1.43 1.75 1.72 0 3.04-1.81 3.04-4.43 0-2.32-1.66-3.94-4.04-3.94a4.19 4.19 0 0 0-4.37 4.2c0 .83.32 1.72.72 2.21a.29.29 0 0 1 .07.28c-.07.31-.24.96-.27 1.09-.04.18-.14.22-.33.13-1.24-.58-2.02-2.39-2.02-3.85 0-3.13 2.28-6.01 6.57-6.01 3.45 0 6.13 2.46 6.13 5.74 0 3.43-2.16 6.18-5.16 6.18-1.01 0-1.96-.52-2.28-1.14l-.62 2.37c-.22.86-.83 1.94-1.24 2.6A10 10 0 1 0 12 2z"/></svg>
	</a>
	<a href="https://twitter.com/intent/tweet?url=<?php echo $bgh_url; // phpcs:ignore ?>&text=<?php echo $bgh_title; // phpcs:ignore ?>" target="_blank" rel="noopener noreferrer nofollow" aria-label="<?php esc_attr_e( 'Share on X', 'beauty-glow-hub' ); ?>">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.3 8.34L23 22h-6.75l-5.28-6.9L4.92 22H1.8l7.8-8.92L1 2h6.92l4.77 6.31zm-1.18 18h1.72L7.36 3.8H5.5z"/></svg>
	</a>
	<a href="mailto:?subject=<?php echo $bgh_title; // phpcs:ignore ?>&body=<?php echo $bgh_url; // phpcs:ignore ?>" aria-label="<?php esc_attr_e( 'Share by email', 'beauty-glow-hub' ); ?>">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V6H4zm16 12V8.5l-8 5-8-5V18h16z"/></svg>
	</a>
</div>
