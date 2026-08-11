<?php
/**
 * Newsletter call to action.
 *
 * Renders only when the owner has pasted a real signup form from their email
 * provider. A form that looks functional but silently discards addresses is
 * worse than no form at all, so there is no decorative fallback.
 *
 * @package KeepKeep_Decorated
 *
 * @param array $args {
 *     @type bool $compact Use the narrow in-article variant.
 * }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_embed = trim( (string) get_theme_mod( 'kkd_newsletter_embed', '' ) );
if ( '' === $kkd_embed ) {
	return;
}

$kkd_args    = wp_parse_args( $args ?? array(), array( 'compact' => false ) );
$kkd_heading = get_theme_mod( 'kkd_newsletter_heading', __( 'Decorating ideas, once a week', 'keepkeep-decorated' ) );
$kkd_text    = get_theme_mod( 'kkd_newsletter_text', '' );
$kkd_id      = wp_unique_id( 'kkd-newsletter-' );
?>
<section class="kkd-newsletter<?php echo $kkd_args['compact'] ? ' kkd-newsletter--compact' : ''; ?>" aria-labelledby="<?php echo esc_attr( $kkd_id ); ?>">
	<div class="<?php echo $kkd_args['compact'] ? 'kkd-newsletter__inner' : 'kkd-container kkd-newsletter__inner'; ?>">
		<div class="kkd-newsletter__text">
			<h2 class="kkd-newsletter__title" id="<?php echo esc_attr( $kkd_id ); ?>"><?php echo esc_html( $kkd_heading ); ?></h2>
			<?php if ( $kkd_text ) : ?>
				<p><?php echo esc_html( $kkd_text ); ?></p>
			<?php endif; ?>
		</div>
		<div class="kkd-newsletter__form">
			<?php
			/*
			 * Trusted markup: administrators paste their provider's embed code or
			 * a form plugin shortcode here.
			 */
			echo do_shortcode( $kkd_embed ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			?>
		</div>
	</div>
</section>
