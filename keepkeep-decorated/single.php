<?php
/**
 * Single post.
 *
 * Reading order: breadcrumbs, section, H1, standfirst, byline and dates,
 * featured image, body, topics, sharing, author, previous/next, related
 * articles, comments.
 *
 * The body column is capped at a comfortable measure (about 68 characters) and
 * the sidebar drops below it on narrow screens.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<div class="kkd-layout">
			<div class="kkd-layout__content">

				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'kkd-article' ); ?>>

						<header class="kkd-article__head">
							<?php kkd_category_chip( 'kkd-chip--solid' ); ?>

							<h1 class="kkd-article__title"><?php the_title(); ?></h1>

							<?php if ( has_excerpt() ) : ?>
								<p class="kkd-article__standfirst"><?php echo esc_html( get_the_excerpt() ); ?></p>
							<?php endif; ?>

							<div class="kkd-article__meta">
								<?php kkd_byline(); ?>
								<span class="kkd-article__dates">
									<?php kkd_posted_on( true ); ?>
								</span>
								<span class="kkd-dot" aria-hidden="true"></span>
								<span class="kkd-article__reading"><?php echo esc_html( kkd_reading_time() ); ?></span>
								<?php if ( comments_open() || get_comments_number() ) : ?>
									<span class="kkd-dot" aria-hidden="true"></span>
									<a class="kkd-article__comments" href="#comments">
										<?php
										comments_number(
											esc_html__( 'Leave a comment', 'keepkeep-decorated' ),
											esc_html__( '1 comment', 'keepkeep-decorated' ),
											/* translators: %  is replaced by the comment count. */
											esc_html__( '% comments', 'keepkeep-decorated' )
										);
										?>
									</a>
								<?php endif; ?>
							</div>
						</header>

						<?php if ( has_post_thumbnail() ) : ?>
							<figure class="kkd-article__figure kkd-media">
								<?php
								the_post_thumbnail(
									'post-thumbnail',
									array(
										'class'         => 'kkd-media__img',
										'fetchpriority' => 'high',
										'decoding'      => 'async',
										'sizes'         => '(max-width: 767px) 100vw, 46rem',
									)
								);
								$kkd_caption = get_the_post_thumbnail_caption();
								if ( $kkd_caption ) {
									echo '<figcaption class="kkd-media__caption">' . wp_kses_post( $kkd_caption ) . '</figcaption>';
								}
								?>
							</figure>
						<?php endif; ?>

						<?php kkd_ad_slot( 'before_article', 'before-article' ); ?>

						<div class="kkd-article__body kkd-prose">
							<?php
							the_content();

							wp_link_pages(
								array(
									'before'   => '<nav class="kkd-page-links" aria-label="' . esc_attr__( 'Article pages', 'keepkeep-decorated' ) . '"><span>' . esc_html__( 'Pages:', 'keepkeep-decorated' ) . '</span>',
									'after'    => '</nav>',
								)
							);
							?>
						</div>

						<?php kkd_entry_tags(); ?>

						<?php kkd_ad_slot( 'after_article', 'after-article' ); ?>

						<?php get_template_part( 'template-parts/share' ); ?>

						<?php get_template_part( 'template-parts/author-box' ); ?>

						<?php get_template_part( 'template-parts/newsletter', null, array( 'compact' => true ) ); ?>

						<?php get_template_part( 'template-parts/post-navigation' ); ?>

						<?php get_template_part( 'template-parts/related-posts' ); ?>

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
