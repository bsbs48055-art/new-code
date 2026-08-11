<?php
/**
 * Template Name: Full Width
 * Template Post Type: page
 *
 * No sidebar, wide blocks allowed — useful for an About page built with the
 * block editor.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class( 'kkd-page kkd-page--wide' ); ?>>

				<header class="kkd-page-head">
					<h1 class="kkd-page-head__title"><?php the_title(); ?></h1>
					<?php if ( has_excerpt() ) : ?>
						<p class="kkd-page-head__intro"><?php echo esc_html( get_the_excerpt() ); ?></p>
					<?php endif; ?>
				</header>

				<?php if ( has_post_thumbnail() ) : ?>
					<figure class="kkd-page__figure kkd-media">
						<?php
						the_post_thumbnail(
							'kkd-hero',
							array(
								'class'         => 'kkd-media__img',
								'fetchpriority' => 'high',
								'decoding'      => 'async',
								'sizes'         => '(max-width: 1023px) 100vw, 68rem',
							)
						);
						?>
					</figure>
				<?php endif; ?>

				<div class="kkd-prose kkd-prose--centered">
					<?php the_content(); ?>
				</div>
			</article>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();
