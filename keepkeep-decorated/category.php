<?php
/**
 * Category archive.
 *
 * Leads with the category description and the most recent article as a feature,
 * then a grid of the rest. On paginated pages the feature is skipped so nothing
 * appears twice.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_term        = get_queried_object();
$kkd_description = $kkd_term instanceof WP_Term ? term_description( $kkd_term ) : '';
$kkd_feature     = ! is_paged();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<header class="kkd-page-head">
			<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'Section', 'keepkeep-decorated' ); ?></p>
			<h1 class="kkd-page-head__title"><?php single_term_title(); ?></h1>

			<?php if ( $kkd_description ) : ?>
				<div class="kkd-page-head__intro"><?php echo wp_kses_post( $kkd_description ); ?></div>
			<?php endif; ?>

			<p class="kkd-page-head__count">
				<?php
				$kkd_total = (int) $GLOBALS['wp_query']->found_posts;
				printf(
					/* translators: %s: number of articles. */
					esc_html( _n( '%s article', '%s articles', $kkd_total, 'keepkeep-decorated' ) ),
					esc_html( number_format_i18n( $kkd_total ) )
				);
				?>
			</p>
		</header>

		<div class="kkd-layout">
			<div class="kkd-layout__content">

				<?php if ( have_posts() ) : ?>

					<?php
					$kkd_index = 0;
					$kkd_grid_open = false;

					while ( have_posts() ) :
						the_post();

						if ( $kkd_feature && 0 === $kkd_index ) :
							?>
							<article <?php post_class( 'kkd-feature' ); ?>>
								<a class="kkd-feature__media kkd-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
									<?php
									kkd_post_thumbnail(
										'kkd-card',
										array(
											'priority' => true,
											'sizes'    => '(max-width: 767px) 92vw, 34rem',
										)
									);
									?>
								</a>
								<div class="kkd-feature__body">
									<p class="kkd-feature__eyebrow"><?php esc_html_e( 'Latest in this section', 'keepkeep-decorated' ); ?></p>
									<h2 class="kkd-feature__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
									<p class="kkd-feature__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 34, '…' ) ); ?></p>
									<div class="kkd-feature__meta">
										<?php kkd_byline(); ?>
										<span class="kkd-dot" aria-hidden="true"></span>
										<span><?php echo esc_html( kkd_reading_time() ); ?></span>
									</div>
								</div>
							</article>
							<?php
						else :
							if ( ! $kkd_grid_open ) {
								echo '<div class="kkd-grid kkd-grid--2">';
								$kkd_grid_open = true;
							}
							kkd_card( array( 'heading' => 'h2' ) );
						endif;

						$kkd_index++;
					endwhile;

					if ( $kkd_grid_open ) {
						echo '</div>';
					}
					?>

					<?php kkd_pagination(); ?>

				<?php else : ?>
					<?php get_template_part( 'template-parts/content-none' ); ?>
				<?php endif; ?>

				<nav class="kkd-related-sections" aria-label="<?php esc_attr_e( 'Other sections', 'keepkeep-decorated' ); ?>">
					<h2 class="kkd-related__title"><?php esc_html_e( 'Explore other sections', 'keepkeep-decorated' ); ?></h2>
					<?php kkd_category_links(); ?>
				</nav>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
