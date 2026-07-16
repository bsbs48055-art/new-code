<?php
/**
 * The template for displaying 404 (not found) pages.
 *
 * @package Beauty_Glow_Hub
 */

get_header();
?>

<main id="primary" class="bgh-site-main" role="main">
	<div class="bgh-container">

		<?php bgh_breadcrumbs(); ?>

		<section class="bgh-page-hero" style="padding-block:3.5rem;">
			<span class="bgh-eyebrow" style="font-size:3rem;line-height:1;">404</span>
			<h1><?php esc_html_e( 'This page has vanished like last season&rsquo;s trend', 'beauty-glow-hub' ); ?></h1>
			<p><?php esc_html_e( 'The page you were looking for could not be found. Try a search, or explore our most popular beauty guides below.', 'beauty-glow-hub' ); ?></p>
			<div style="max-width:520px;margin:1.4rem auto;"><?php get_search_form(); ?></div>
			<a class="bgh-btn" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to Homepage', 'beauty-glow-hub' ); ?></a>
		</section>

		<section class="bgh-section">
			<div class="bgh-section-head">
				<h2 class="bgh-section-title"><?php esc_html_e( 'Popular Right Now', 'beauty-glow-hub' ); ?></h2>
			</div>
			<div class="bgh-grid bgh-grid--3">
				<?php
				$bgh_q = bgh_get_posts_query( 3, array( 'orderby' => 'comment_count' ) );
				while ( $bgh_q->have_posts() ) :
					$bgh_q->the_post();
					bgh_card();
				endwhile;
				wp_reset_postdata();
				?>
			</div>
		</section>
	</div>
</main>

<?php
get_footer();
