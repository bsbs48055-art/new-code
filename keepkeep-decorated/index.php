<?php
/**
 * The fallback template.
 *
 * Used whenever a more specific template does not exist. WordPress requires it,
 * and it renders a plain, correct article listing.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<div class="kkd-layout">
			<div class="kkd-layout__content">

				<header class="kkd-page-head">
					<h1 class="kkd-page-head__title">
						<?php
						if ( is_home() ) {
							esc_html_e( 'Latest articles', 'keepkeep-decorated' );
						} else {
							the_archive_title();
						}
						?>
					</h1>
				</header>

				<?php if ( have_posts() ) : ?>
					<div class="kkd-grid kkd-grid--2">
						<?php
						while ( have_posts() ) :
							the_post();
							kkd_card( array( 'heading' => 'h2' ) );
						endwhile;
						?>
					</div>
					<?php kkd_pagination(); ?>
				<?php else : ?>
					<?php get_template_part( 'template-parts/content-none' ); ?>
				<?php endif; ?>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
