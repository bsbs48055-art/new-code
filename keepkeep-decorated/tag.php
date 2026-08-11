<?php
/**
 * Tag archive.
 *
 * Tags are treated as narrow topics rather than a second category system: the
 * page is a clean, readable list with routes back into the main sections. If a
 * particular tag archive is too thin to be worth indexing, control that from
 * your SEO plugin's taxonomy settings — the theme does not force a decision.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_term        = get_queried_object();
$kkd_description = $kkd_term instanceof WP_Term ? term_description( $kkd_term ) : '';
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<header class="kkd-page-head">
			<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'Topic', 'keepkeep-decorated' ); ?></p>
			<h1 class="kkd-page-head__title"><?php single_term_title(); ?></h1>

			<?php if ( $kkd_description ) : ?>
				<div class="kkd-page-head__intro"><?php echo wp_kses_post( $kkd_description ); ?></div>
			<?php else : ?>
				<p class="kkd-page-head__intro">
					<?php
					printf(
						/* translators: %s: tag name. */
						esc_html__( 'Every article filed under %s.', 'keepkeep-decorated' ),
						esc_html( single_term_title( '', false ) )
					);
					?>
				</p>
			<?php endif; ?>
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

				<nav class="kkd-related-sections" aria-label="<?php esc_attr_e( 'Main sections', 'keepkeep-decorated' ); ?>">
					<h2 class="kkd-related__title"><?php esc_html_e( 'Browse the main sections', 'keepkeep-decorated' ); ?></h2>
					<?php kkd_category_links(); ?>
				</nav>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
