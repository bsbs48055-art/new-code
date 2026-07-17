<?php
/**
 * The template for displaying single posts.
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

				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'bgh-single' ); ?>>

						<header class="bgh-article-header">
							<?php bgh_entry_categories(); ?>
							<h1 class="bgh-article__title"><?php the_title(); ?></h1>

							<?php if ( has_excerpt() ) : ?>
								<p class="bgh-article__excerpt"><?php echo esc_html( get_the_excerpt() ); ?></p>
							<?php endif; ?>

							<div class="bgh-article__meta">
								<?php bgh_byline(); ?>
								<span class="bgh-dot" aria-hidden="true"></span>
								<span><?php echo esc_html__( 'Updated', 'beauty-glow-hub' ) . ' ' . esc_html( get_the_modified_date() ); ?></span>
								<span class="bgh-dot" aria-hidden="true"></span>
								<span class="bgh-reading-time"><?php echo esc_html( bgh_get_reading_time() ); ?></span>
								<?php if ( comments_open() || get_comments_number() ) : ?>
									<span class="bgh-dot" aria-hidden="true"></span>
									<span><?php comments_number( __( '0 Comments', 'beauty-glow-hub' ), __( '1 Comment', 'beauty-glow-hub' ), __( '% Comments', 'beauty-glow-hub' ) ); ?></span>
								<?php endif; ?>
							</div>
						</header>

						<?php
						// Ad below the title.
						bgh_ad_slot( 'bgh_ad_below_title', 'in-article', __( 'Below title ad', 'beauty-glow-hub' ) );
						?>

						<?php if ( has_post_thumbnail() ) : ?>
							<figure class="bgh-featured-media">
								<?php the_post_thumbnail( 'post-thumbnail', array( 'fetchpriority' => 'high', 'decoding' => 'async' ) ); ?>
								<?php
								$bgh_caption = get_the_post_thumbnail_caption();
								if ( $bgh_caption ) {
									echo '<figcaption>' . esc_html( $bgh_caption ) . '</figcaption>';
								}
								?>
							</figure>
						<?php endif; ?>

						<?php
						// The content filter injects heading IDs; render TOC first, then content.
						// Prime the heading list by running the content filter buffered.
						$bgh_rendered = apply_filters( 'the_content', get_the_content( null, false ) );
						bgh_render_toc();
						?>

						<div class="bgh-entry-content">
							<?php
							echo $bgh_rendered; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
							wp_link_pages(
								array(
									'before' => '<div class="bgh-page-links">' . esc_html__( 'Pages:', 'beauty-glow-hub' ),
									'after'  => '</div>',
								)
							);
							?>
						</div>

						<?php bgh_entry_footer_tags(); ?>

						<?php get_template_part( 'template-parts/share' ); ?>

						<?php get_template_part( 'template-parts/author', 'box' ); ?>

						<?php get_template_part( 'template-parts/post', 'navigation' ); ?>

						<?php get_template_part( 'template-parts/related' ); ?>

						<?php
						if ( comments_open() || get_comments_number() ) {
							comments_template();
						}
						?>
					</article>
					<?php
				endwhile;
				?>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
