<?php
/**
 * The site footer.
 *
 * Every column is driven by a WordPress menu. Until the owner builds those
 * menus, the columns fall back to categories that have posts and to policy
 * pages that are actually published — so the footer never shows a dead link.
 *
 * @package KeepKeep_Decorated
 */

?>
	<?php kkd_ad_slot( 'before_footer', 'before-footer' ); ?>

	<footer class="kkd-footer">

		<?php if ( is_active_sidebar( 'footer-widgets' ) ) : ?>
			<div class="kkd-footer__widgets">
				<div class="kkd-container kkd-footer__widgets-grid">
					<?php dynamic_sidebar( 'footer-widgets' ); ?>
				</div>
			</div>
		<?php endif; ?>

		<div class="kkd-container kkd-footer__grid">

			<div class="kkd-footer__col kkd-footer__col--brand">
				<?php if ( has_custom_logo() ) : ?>
					<div class="kkd-footer__logo"><?php the_custom_logo(); ?></div>
				<?php else : ?>
					<p class="kkd-footer__brand">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
					</p>
				<?php endif; ?>

				<?php
				$kkd_about = get_theme_mod( 'kkd_footer_about', '' );
				if ( ! $kkd_about ) {
					$kkd_about = get_bloginfo( 'description', 'display' );
				}
				if ( $kkd_about ) :
					?>
					<p class="kkd-footer__about"><?php echo wp_kses_post( $kkd_about ); ?></p>
				<?php endif; ?>

				<?php
				$kkd_profiles = kkd_social_profiles();
				if ( $kkd_profiles ) :
					?>
					<ul class="kkd-social" aria-label="<?php esc_attr_e( 'Follow us', 'keepkeep-decorated' ); ?>">
						<?php foreach ( $kkd_profiles as $kkd_key => $kkd_profile ) : ?>
							<li>
								<a class="kkd-social__link" href="<?php echo esc_url( $kkd_profile['url'] ); ?>" rel="noopener me" target="_blank">
									<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="<?php echo esc_attr( $kkd_profile['path'] ); ?>" fill="currentColor"/></svg>
									<span class="screen-reader-text">
										<?php
										printf(
											/* translators: %s: social network name. */
											esc_html__( '%s (opens in a new tab)', 'keepkeep-decorated' ),
											esc_html( $kkd_profile['label'] )
										);
										?>
									</span>
								</a>
							</li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>

				<?php
				$kkd_email = sanitize_email( (string) get_theme_mod( 'kkd_contact_email', '' ) );
				if ( $kkd_email && is_email( $kkd_email ) ) :
					?>
					<p class="kkd-footer__email">
						<a href="<?php echo esc_url( 'mailto:' . $kkd_email ); ?>"><?php echo esc_html( $kkd_email ); ?></a>
					</p>
				<?php endif; ?>
			</div>

			<?php
			kkd_footer_explore_column( __( 'Explore', 'keepkeep-decorated' ) );

			kkd_footer_column(
				'footer-company',
				__( 'Company', 'keepkeep-decorated' ),
				array( 'about', 'contact', 'editorial-policy' )
			);

			kkd_footer_column(
				'footer-legal',
				__( 'Legal', 'keepkeep-decorated' ),
				array( 'privacy-policy', 'terms-and-conditions', 'disclaimer' )
			);
			?>
		</div>

		<div class="kkd-footer__bar">
			<div class="kkd-container kkd-footer__bar-inner">
				<p class="kkd-footer__copyright">
					<?php
					printf(
						/* translators: 1: current year, 2: site name. */
						esc_html__( '© %1$s %2$s. All rights reserved.', 'keepkeep-decorated' ),
						esc_html( wp_date( 'Y' ) ),
						esc_html( get_bloginfo( 'name' ) )
					);
					?>
				</p>
				<p class="kkd-footer__note">
					<a href="#kkd-header"><?php esc_html_e( 'Back to top', 'keepkeep-decorated' ); ?></a>
				</p>
			</div>
		</div>
	</footer>
</div><!-- .kkd-site -->

<?php wp_footer(); ?>
</body>
</html>
