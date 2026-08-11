<?php
/**
 * Previous / next article links.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_previous = get_previous_post();
$kkd_next     = get_next_post();

if ( ! $kkd_previous && ! $kkd_next ) {
	return;
}
?>
<nav class="kkd-postnav" aria-label="<?php esc_attr_e( 'Continue reading', 'keepkeep-decorated' ); ?>">
	<?php if ( $kkd_previous ) : ?>
		<a class="kkd-postnav__link kkd-postnav__link--prev" href="<?php echo esc_url( (string) get_permalink( $kkd_previous ) ); ?>">
			<span class="kkd-postnav__label"><span aria-hidden="true">&larr;</span> <?php esc_html_e( 'Previous article', 'keepkeep-decorated' ); ?></span>
			<span class="kkd-postnav__title"><?php echo esc_html( get_the_title( $kkd_previous ) ); ?></span>
		</a>
	<?php endif; ?>

	<?php if ( $kkd_next ) : ?>
		<a class="kkd-postnav__link kkd-postnav__link--next" href="<?php echo esc_url( (string) get_permalink( $kkd_next ) ); ?>">
			<span class="kkd-postnav__label"><?php esc_html_e( 'Next article', 'keepkeep-decorated' ); ?> <span aria-hidden="true">&rarr;</span></span>
			<span class="kkd-postnav__title"><?php echo esc_html( get_the_title( $kkd_next ) ); ?></span>
		</a>
	<?php endif; ?>
</nav>
