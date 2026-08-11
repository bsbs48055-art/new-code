<?php
/**
 * Search results.
 *
 * WordPress core marks search result pages `noindex` by default, which is the
 * right call — they are a reader tool, not content for the index. The theme does
 * not override it.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_query = get_search_query();
$kkd_found = (int) $GLOBALS['wp_query']->found_posts;
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<header class="kkd-page-head">
			<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'Search', 'keepkeep-decorated' ); ?></p>
			<h1 class="kkd-page-head__title">
				<?php
				if ( $kkd_query ) {
					printf(
						/* translators: %s: search term. */
						esc_html__( 'Results for “%s”', 'keepkeep-decorated' ),
						esc_html( $kkd_query )
					);
				} else {
					esc_html_e( 'Search the archive', 'keepkeep-decorated' );
				}
				?>
			</h1>

			<?php if ( $kkd_query ) : ?>
				<p class="kkd-page-head__count">
					<?php
					printf(
						/* translators: %s: number of results. */
						esc_html( _n( '%s article found', '%s articles found', $kkd_found, 'keepkeep-decorated' ) ),
						esc_html( number_format_i18n( $kkd_found ) )
					);
					?>
				</p>
			<?php endif; ?>

			<div class="kkd-page-head__search"><?php get_search_form(); ?></div>
		</header>

		<div class="kkd-layout">
			<div class="kkd-layout__content">
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
