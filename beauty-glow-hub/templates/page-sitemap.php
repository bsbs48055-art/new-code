<?php
/**
 * Template Name: HTML Sitemap
 *
 * A human-friendly sitemap listing pages, categories and recent posts.
 * (WordPress also exposes an XML sitemap at /wp-sitemap.xml for search engines.)
 *
 * @package Beauty_Glow_Hub
 */

get_header();
?>

<main id="primary" class="bgh-site-main" role="main">
	<div class="bgh-container">

		<?php bgh_breadcrumbs(); ?>

		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<header class="bgh-page-hero">
				<h1 class="bgh-mb-0"><?php the_title(); ?></h1>
				<p class="bgh-lead"><?php esc_html_e( 'Find everything on Beauty Glow Hub. For search engines, an XML sitemap is available at /wp-sitemap.xml.', 'beauty-glow-hub' ); ?></p>
			</header>
			<?php
		endwhile;
		?>

		<div class="bgh-prose">
			<div class="bgh-entry-content">
				<h2><?php esc_html_e( 'Pages', 'beauty-glow-hub' ); ?></h2>
				<ul>
					<?php
					wp_list_pages(
						array(
							'title_li' => '',
							'sort_column' => 'menu_order, post_title',
						)
					);
					?>
				</ul>

				<h2><?php esc_html_e( 'Categories', 'beauty-glow-hub' ); ?></h2>
				<ul>
					<?php
					wp_list_categories(
						array(
							'title_li'   => '',
							'show_count' => true,
						)
					);
					?>
				</ul>

				<h2><?php esc_html_e( 'Recent Articles', 'beauty-glow-hub' ); ?></h2>
				<ul>
					<?php
					$bgh_posts = get_posts( array( 'numberposts' => 50, 'orderby' => 'date', 'order' => 'DESC' ) );
					foreach ( $bgh_posts as $bgh_p ) {
						echo '<li><a href="' . esc_url( get_permalink( $bgh_p ) ) . '">' . esc_html( get_the_title( $bgh_p ) ) . '</a></li>';
					}
					?>
				</ul>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();
