<?php
/**
 * Static page.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<div class="kkd-layout kkd-layout--narrow">
			<div class="kkd-layout__content">

				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'kkd-page' ); ?>>

						<header class="kkd-page-head kkd-page-head--tight">
							<h1 class="kkd-page-head__title"><?php the_title(); ?></h1>
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
								?>
							</figure>
						<?php endif; ?>

						<div class="kkd-prose">
							<?php the_content(); ?>
						</div>

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
		</div>
	</div>
</main>

<?php
get_footer();
