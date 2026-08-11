<?php
/**
 * Template Name: Legal / Policy
 * Template Post Type: page
 *
 * A narrow, highly readable column for policy documents, with the last-updated
 * date shown so readers can see how current the page is.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<div class="kkd-layout kkd-layout--narrow">
			<div class="kkd-layout__content">

				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'kkd-page kkd-page--legal' ); ?>>

						<header class="kkd-page-head kkd-page-head--tight">
							<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'Policy', 'keepkeep-decorated' ); ?></p>
							<h1 class="kkd-page-head__title"><?php the_title(); ?></h1>
							<p class="kkd-page-head__count">
								<?php
								printf(
									/* translators: %s: last updated date. */
									esc_html__( 'Last updated %s', 'keepkeep-decorated' ),
									esc_html( get_the_modified_date() )
								);
								?>
							</p>
						</header>

						<div class="kkd-prose kkd-prose--legal">
							<?php the_content(); ?>
						</div>

						<?php
						$kkd_contact = kkd_page_url( 'contact' );
						if ( $kkd_contact ) :
							?>
							<p class="kkd-page__footnote">
								<?php esc_html_e( 'Questions about this page?', 'keepkeep-decorated' ); ?>
								<a href="<?php echo esc_url( $kkd_contact ); ?>"><?php esc_html_e( 'Contact us', 'keepkeep-decorated' ); ?></a>
							</p>
						<?php endif; ?>
					</article>
					<?php
				endwhile;
				?>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();
