<?php
/**
 * Homepage "About" band.
 *
 * Pulls its copy from the page the owner selected in the Customizer, so the
 * homepage never states something the About page does not.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_about_id = (int) get_theme_mod( 'kkd_about_page', 0 );
if ( ! $kkd_about_id ) {
	$kkd_about_page = get_page_by_path( 'about' );
	$kkd_about_id   = $kkd_about_page ? (int) $kkd_about_page->ID : 0;
}

if ( ! $kkd_about_id || 'publish' !== get_post_status( $kkd_about_id ) ) {
	return;
}

$kkd_excerpt = get_the_excerpt( $kkd_about_id );
if ( ! $kkd_excerpt ) {
	return;
}
?>
<section class="kkd-section kkd-section--tint kkd-about" aria-labelledby="kkd-about-heading">
	<div class="kkd-container kkd-about__inner">

		<?php if ( has_post_thumbnail( $kkd_about_id ) ) : ?>
			<div class="kkd-about__media kkd-media">
				<?php
				echo wp_get_attachment_image(
					get_post_thumbnail_id( $kkd_about_id ),
					'kkd-card',
					false,
					array(
						'class'    => 'kkd-media__img',
						'loading'  => 'lazy',
						'decoding' => 'async',
						'sizes'    => '(max-width: 767px) 92vw, 24rem',
					)
				);
				?>
			</div>
		<?php endif; ?>

		<div class="kkd-about__body">
			<h2 class="kkd-section__title" id="kkd-about-heading">
				<?php
				printf(
					/* translators: %s: site name. */
					esc_html__( 'About %s', 'keepkeep-decorated' ),
					esc_html( get_bloginfo( 'name' ) )
				);
				?>
			</h2>
			<p class="kkd-about__text"><?php echo esc_html( wp_trim_words( $kkd_excerpt, 60, '…' ) ); ?></p>
			<a class="kkd-btn kkd-btn--ghost" href="<?php echo esc_url( (string) get_permalink( $kkd_about_id ) ); ?>">
				<?php esc_html_e( 'Read more about us', 'keepkeep-decorated' ); ?>
			</a>
		</div>
	</div>
</section>
