<?php
/**
 * Previous / next single post navigation.
 *
 * @package Beauty_Glow_Hub
 */

$bgh_prev = get_previous_post();
$bgh_next = get_next_post();

if ( ! $bgh_prev && ! $bgh_next ) {
	return;
}
?>
<nav class="bgh-post-nav" aria-label="<?php esc_attr_e( 'Post navigation', 'beauty-glow-hub' ); ?>">
	<?php if ( $bgh_prev ) : ?>
		<a class="prev" href="<?php echo esc_url( get_permalink( $bgh_prev ) ); ?>">
			<span class="bgh-post-nav__label"><?php esc_html_e( 'Previous Article', 'beauty-glow-hub' ); ?></span>
			<span class="bgh-post-nav__title"><?php echo esc_html( get_the_title( $bgh_prev ) ); ?></span>
		</a>
	<?php else : ?>
		<span></span>
	<?php endif; ?>

	<?php if ( $bgh_next ) : ?>
		<a class="next" href="<?php echo esc_url( get_permalink( $bgh_next ) ); ?>">
			<span class="bgh-post-nav__label"><?php esc_html_e( 'Next Article', 'beauty-glow-hub' ); ?></span>
			<span class="bgh-post-nav__title"><?php echo esc_html( get_the_title( $bgh_next ) ); ?></span>
		</a>
	<?php endif; ?>
</nav>
