<?php
/**
 * The template for displaying archive pages (category, tag, author, date).
 *
 * @package Beauty_Glow_Hub
 */

get_header();
?>

<main id="primary" class="bgh-site-main" role="main">
	<div class="bgh-container">

		<?php bgh_breadcrumbs(); ?>

		<?php if ( is_author() ) : ?>
			<?php get_template_part( 'template-parts/author', 'archive' ); ?>
		<?php else : ?>
			<header class="bgh-page-hero">
				<span class="bgh-eyebrow"><?php esc_html_e( 'Browsing', 'beauty-glow-hub' ); ?></span>
				<h1 class="bgh-mb-0"><?php the_archive_title(); ?></h1>
				<?php
				$bgh_desc = get_the_archive_description();
				if ( $bgh_desc ) {
					echo '<div class="bgh-lead">' . wp_kses_post( $bgh_desc ) . '</div>';
				}
				?>
			</header>
		<?php endif; ?>

		<div class="bgh-layout">
			<div class="bgh-content-area">
				<?php if ( have_posts() ) : ?>
					<div class="bgh-grid bgh-grid--2">
						<?php
						while ( have_posts() ) :
							the_post();
							bgh_card();
						endwhile;
						?>
					</div>
					<?php bgh_pagination(); ?>
				<?php else : ?>
					<?php get_template_part( 'template-parts/content', 'none' ); ?>
				<?php endif; ?>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
