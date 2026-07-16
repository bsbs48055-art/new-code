<?php
/**
 * The template for displaying single pages.
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
			<article <?php post_class( 'bgh-page' ); ?>>
				<header class="bgh-page-hero">
					<h1 class="bgh-mb-0"><?php the_title(); ?></h1>
					<?php if ( has_excerpt() ) : ?>
						<p class="bgh-lead"><?php echo esc_html( get_the_excerpt() ); ?></p>
					<?php endif; ?>
				</header>

				<?php if ( has_post_thumbnail() ) : ?>
					<figure class="bgh-featured-media"><?php the_post_thumbnail( 'post-thumbnail' ); ?></figure>
				<?php endif; ?>

				<div class="bgh-entry-content bgh-prose">
					<?php
					the_content();
					wp_link_pages(
						array(
							'before' => '<div class="bgh-page-links">' . esc_html__( 'Pages:', 'beauty-glow-hub' ),
							'after'  => '</div>',
						)
					);
					?>
				</div>

				<?php
				if ( comments_open() || get_comments_number() ) {
					echo '<div class="bgh-prose">';
					comments_template();
					echo '</div>';
				}
				?>
			</article>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();
