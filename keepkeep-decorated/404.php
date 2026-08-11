<?php
/**
 * 404 page.
 *
 * A missing page should still be a useful page: search, a route home, the
 * sections, and real articles to read instead.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<div class="kkd-error">
			<p class="kkd-error__code" aria-hidden="true">404</p>
			<h1 class="kkd-error__title"><?php esc_html_e( 'Looks like this page has been moved.', 'keepkeep-decorated' ); ?></h1>
			<p class="kkd-error__text">
				<?php esc_html_e( 'The link may be out of date, or the page may have a new address. Search for what you were after, or pick up one of these instead.', 'keepkeep-decorated' ); ?>
			</p>

			<div class="kkd-error__search"><?php get_search_form(); ?></div>

			<p class="kkd-error__actions">
				<a class="kkd-btn kkd-btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>">
					<?php esc_html_e( 'Back to the homepage', 'keepkeep-decorated' ); ?>
				</a>
				<a class="kkd-btn kkd-btn--ghost" href="<?php echo esc_url( kkd_blog_url() ); ?>">
					<?php esc_html_e( 'Browse all articles', 'keepkeep-decorated' ); ?>
				</a>
			</p>
		</div>

		<section class="kkd-section" aria-labelledby="kkd-404-sections">
			<h2 class="kkd-section__title kkd-section__title--center" id="kkd-404-sections"><?php esc_html_e( 'Browse by section', 'keepkeep-decorated' ); ?></h2>
			<div class="kkd-error__chips"><?php kkd_category_links(); ?></div>
		</section>

		<?php
		$kkd_popular = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => 6,
				'orderby'             => 'comment_count',
				'order'               => 'DESC',
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
			)
		);
		if ( $kkd_popular->have_posts() ) :
			?>
			<section class="kkd-section" aria-labelledby="kkd-404-popular">
				<h2 class="kkd-section__title kkd-section__title--center" id="kkd-404-popular"><?php esc_html_e( 'Popular articles', 'keepkeep-decorated' ); ?></h2>
				<div class="kkd-grid kkd-grid--3">
					<?php
					while ( $kkd_popular->have_posts() ) :
						$kkd_popular->the_post();
						get_template_part(
							'template-parts/card',
							null,
							array(
								'heading' => 'h3',
								'excerpt' => false,
								'size'    => 'kkd-card-sm',
								'sizes'   => '(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 20rem',
							)
						);
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</section>
		<?php endif; ?>
	</div>
</main>

<?php
get_footer();
