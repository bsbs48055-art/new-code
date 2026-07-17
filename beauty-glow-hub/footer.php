<?php
/**
 * The theme footer.
 *
 * @package Beauty_Glow_Hub
 */

$bgh_footer_socials = array(
	'bgh_social_facebook'  => array( 'label' => 'Facebook', 'path' => 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' ),
	'bgh_social_instagram' => array( 'label' => 'Instagram', 'path' => 'M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2zm0 3.5A6.3 6.3 0 1 0 18.3 12 6.3 6.3 0 0 0 12 5.7zm0 10.4A4.1 4.1 0 1 1 16.1 12 4.1 4.1 0 0 1 12 16.1zm6.55-10.7a1.47 1.47 0 1 1-1.47-1.47 1.47 1.47 0 0 1 1.47 1.47z' ),
	'bgh_social_pinterest' => array( 'label' => 'Pinterest', 'path' => 'M12 2a10 10 0 0 0-3.6 19.33c-.08-.79-.16-2 .03-2.86.18-.78 1.13-4.79 1.13-4.79s-.29-.58-.29-1.43c0-1.34.78-2.34 1.74-2.34.82 0 1.22.62 1.22 1.36 0 .83-.53 2.07-.8 3.22-.23.96.48 1.75 1.43 1.75 1.72 0 3.04-1.81 3.04-4.43 0-2.32-1.66-3.94-4.04-3.94a4.19 4.19 0 0 0-4.37 4.2c0 .83.32 1.72.72 2.21a.29.29 0 0 1 .07.28c-.07.31-.24.96-.27 1.09-.04.18-.14.22-.33.13-1.24-.58-2.02-2.39-2.02-3.85 0-3.13 2.28-6.01 6.57-6.01 3.45 0 6.13 2.46 6.13 5.74 0 3.43-2.16 6.18-5.16 6.18-1.01 0-1.96-.52-2.28-1.14l-.62 2.37c-.22.86-.83 1.94-1.24 2.6A10 10 0 1 0 12 2z' ),
	'bgh_social_twitter'   => array( 'label' => 'X', 'path' => 'M18.9 2H22l-7.3 8.34L23 22h-6.75l-5.28-6.9L4.92 22H1.8l7.8-8.92L1 2h6.92l4.77 6.31zm-1.18 18h1.72L7.36 3.8H5.5z' ),
	'bgh_social_youtube'   => array( 'label' => 'YouTube', 'path' => 'M23 12s0-3.2-.41-4.73a2.5 2.5 0 0 0-1.76-1.77C19.3 5.09 12 5.09 12 5.09s-7.3 0-8.83.41A2.5 2.5 0 0 0 1.41 7.27C1 8.8 1 12 1 12s0 3.2.41 4.73a2.5 2.5 0 0 0 1.76 1.77c1.53.41 8.83.41 8.83.41s7.3 0 8.83-.41a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12zM9.75 15.5v-7l6 3.5z' ),
);
?>
	<footer class="bgh-footer" role="contentinfo">

		<?php
		// Footer ad slot.
		$bgh_footer_ad = get_theme_mod( 'bgh_ad_footer' );
		if ( ! empty( trim( (string) $bgh_footer_ad ) ) || ( function_exists( 'bgh_show_ad_placeholders' ) && bgh_show_ad_placeholders() ) ) {
			echo '<div class="bgh-container">';
			bgh_ad_slot( 'bgh_ad_footer', 'footer', __( 'Footer ad', 'beauty-glow-hub' ) );
			echo '</div>';
		}
		?>

		<div class="bgh-container">
			<div class="bgh-footer__top">
				<div class="bgh-footer__col bgh-footer__brand">
					<?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
						<?php dynamic_sidebar( 'footer-1' ); ?>
					<?php else : ?>
						<p class="bgh-brand__title"><?php bloginfo( 'name' ); ?></p>
						<p class="bgh-footer__about"><?php esc_html_e( 'Beauty Glow Hub is a content-first beauty magazine sharing dermatologist-informed skincare, hair care, makeup and wellness guides you can trust.', 'beauty-glow-hub' ); ?></p>
						<div class="bgh-footer__social">
							<?php
							foreach ( $bgh_footer_socials as $bgh_key => $bgh_data ) :
								$bgh_url = get_theme_mod( $bgh_key );
								if ( ! $bgh_url ) {
									continue;
								}
								?>
								<a href="<?php echo esc_url( $bgh_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( $bgh_data['label'] ); ?>">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="<?php echo esc_attr( $bgh_data['path'] ); ?>"/></svg>
								</a>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
				</div>

				<div class="bgh-footer__col">
					<?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
						<?php dynamic_sidebar( 'footer-2' ); ?>
					<?php else : ?>
						<h3><?php esc_html_e( 'Explore', 'beauty-glow-hub' ); ?></h3>
						<?php
						wp_list_categories(
							array(
								'title_li' => '',
								'number'   => 6,
								'orderby'  => 'count',
								'order'    => 'DESC',
							)
						);
						?>
					<?php endif; ?>
				</div>

				<div class="bgh-footer__col">
					<?php if ( is_active_sidebar( 'footer-3' ) ) : ?>
						<?php dynamic_sidebar( 'footer-3' ); ?>
					<?php else : ?>
						<h3><?php esc_html_e( 'Company', 'beauty-glow-hub' ); ?></h3>
						<?php
						if ( has_nav_menu( 'footer' ) ) {
							wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'menu_class' => '', 'depth' => 1 ) );
						} else {
							echo '<ul>';
							echo '<li><a href="' . esc_url( home_url( '/about-us/' ) ) . '">' . esc_html__( 'About Us', 'beauty-glow-hub' ) . '</a></li>';
							echo '<li><a href="' . esc_url( home_url( '/contact/' ) ) . '">' . esc_html__( 'Contact', 'beauty-glow-hub' ) . '</a></li>';
							echo '<li><a href="' . esc_url( home_url( '/write-for-us/' ) ) . '">' . esc_html__( 'Write For Us', 'beauty-glow-hub' ) . '</a></li>';
							echo '<li><a href="' . esc_url( home_url( '/authors/' ) ) . '">' . esc_html__( 'Authors', 'beauty-glow-hub' ) . '</a></li>';
							echo '<li><a href="' . esc_url( home_url( '/editorial-policy/' ) ) . '">' . esc_html__( 'Editorial Policy', 'beauty-glow-hub' ) . '</a></li>';
							echo '</ul>';
						}
						?>
					<?php endif; ?>
				</div>

				<div class="bgh-footer__col">
					<?php if ( is_active_sidebar( 'footer-4' ) ) : ?>
						<?php dynamic_sidebar( 'footer-4' ); ?>
					<?php else : ?>
						<h3><?php esc_html_e( 'Stay in the Glow', 'beauty-glow-hub' ); ?></h3>
						<p class="bgh-footer__about"><?php esc_html_e( 'Subscribe for weekly beauty tips and honest product reviews.', 'beauty-glow-hub' ); ?></p>
						<?php bgh_newsletter_form( 'footer' ); ?>
					<?php endif; ?>
				</div>
			</div>

			<div class="bgh-footer__bottom">
				<p class="bgh-mb-0">
					<?php
					$bgh_copy = get_theme_mod( 'bgh_footer_copyright' );
					if ( $bgh_copy ) {
						echo wp_kses_post( $bgh_copy );
					} else {
						/* translators: %1$s: year, %2$s: site name. */
						printf( '&copy; %1$s %2$s. ' . esc_html__( 'All rights reserved.', 'beauty-glow-hub' ), esc_html( gmdate( 'Y' ) ), esc_html( get_bloginfo( 'name' ) ) );
					}
					?>
				</p>
				<?php
				if ( has_nav_menu( 'legal' ) ) {
					wp_nav_menu(
						array(
							'theme_location' => 'legal',
							'container'      => false,
							'menu_class'     => 'bgh-footer__legal',
							'depth'          => 1,
						)
					);
				} else {
					echo '<ul class="bgh-footer__legal">';
					echo '<li><a href="' . esc_url( home_url( '/privacy-policy/' ) ) . '">' . esc_html__( 'Privacy', 'beauty-glow-hub' ) . '</a></li>';
					echo '<li><a href="' . esc_url( home_url( '/terms-conditions/' ) ) . '">' . esc_html__( 'Terms', 'beauty-glow-hub' ) . '</a></li>';
					echo '<li><a href="' . esc_url( home_url( '/disclaimer/' ) ) . '">' . esc_html__( 'Disclaimer', 'beauty-glow-hub' ) . '</a></li>';
					echo '<li><a href="' . esc_url( home_url( '/affiliate-disclosure/' ) ) . '">' . esc_html__( 'Affiliate Disclosure', 'beauty-glow-hub' ) . '</a></li>';
					echo '<li><a href="' . esc_url( home_url( '/cookie-policy/' ) ) . '">' . esc_html__( 'Cookie Policy', 'beauty-glow-hub' ) . '</a></li>';
					echo '<li><a href="' . esc_url( home_url( '/dmca-policy/' ) ) . '">' . esc_html__( 'DMCA', 'beauty-glow-hub' ) . '</a></li>';
					echo '</ul>';
				}
				?>
			</div>
		</div>
	</footer>
</div><!-- #page -->

<?php wp_footer(); ?>
</body>
</html>
