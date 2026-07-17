<?php
/**
 * The main template file (blog index / fallback).
 *
 * @package Beauty_Glow_Hub
 */

get_header();
?>

<main id="primary" class="bgh-site-main" role="main">
	<div class="bgh-container">

		<?php bgh_breadcrumbs(); ?>

		<div class="bgh-layout">
			<div class="bgh-content-area">

				<header class="bgh-section-head">
					<h1 class="bgh-section-title">
						<?php
						if ( is_home() && ! is_front_page() ) {
							echo esc_html( get_the_title( get_option( 'page_for_posts' ) ) );
						} else {
							esc_html_e( 'Latest Beauty Articles', 'beauty-glow-hub' );
						}
						?>
					</h1>
				</header>

				<?php if ( have_posts() ) : ?>
					<div class="bgh-grid bgh-grid--2">
						<?php
						while ( have_posts() ) :
							the_post();
							bgh_card();
						endwhile;
						?>
					</div>

					<?php bgh_pagination(); ?>

				<?php else : ?>
					<?php get_template_part( 'template-parts/content', 'none' ); ?>
				<?php endif; ?>

			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
