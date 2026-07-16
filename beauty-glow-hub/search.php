<?php
/**
 * The template for displaying search results.
 *
 * @package Beauty_Glow_Hub
 */

get_header();
?>

<main id="primary" class="bgh-site-main" role="main">
	<div class="bgh-container">

		<?php bgh_breadcrumbs(); ?>

		<header class="bgh-page-hero">
			<span class="bgh-eyebrow"><?php esc_html_e( 'Search Results', 'beauty-glow-hub' ); ?></span>
			<h1 class="bgh-mb-0">
				<?php
				/* translators: %s: search query. */
				printf( esc_html__( 'Results for &ldquo;%s&rdquo;', 'beauty-glow-hub' ), '<span>' . esc_html( get_search_query() ) . '</span>' );
				?>
			</h1>
			<?php
			global $wp_query;
			if ( $wp_query->found_posts ) {
				/* translators: %d: number of results. */
				echo '<p>' . esc_html( sprintf( _n( '%d article found.', '%d articles found.', $wp_query->found_posts, 'beauty-glow-hub' ), $wp_query->found_posts ) ) . '</p>';
			}
			?>
			<div style="max-width:520px;margin:1rem auto 0;"><?php get_search_form(); ?></div>
		</header>

		<div class="bgh-layout">
			<div class="bgh-content-area">
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
