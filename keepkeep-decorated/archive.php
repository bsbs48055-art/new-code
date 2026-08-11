<?php
/**
 * Generic archive (date archives, custom taxonomies, post type archives).
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<header class="kkd-page-head">
			<h1 class="kkd-page-head__title"><?php the_archive_title(); ?></h1>
			<?php
			$kkd_description = get_the_archive_description();
			if ( $kkd_description ) :
				?>
				<div class="kkd-page-head__intro"><?php echo wp_kses_post( $kkd_description ); ?></div>
			<?php endif; ?>
		</header>

		<div class="kkd-layout">
			<div class="kkd-layout__content">
				<?php if ( have_posts() ) : ?>
					<div class="kkd-grid kkd-grid--2">
						<?php
						while ( have_posts() ) :
							the_post();
							kkd_card( array( 'heading' => 'h2' ) );
						endwhile;
						?>
					</div>
					<?php kkd_pagination(); ?>
				<?php else : ?>
					<?php get_template_part( 'template-parts/content-none' ); ?>
				<?php endif; ?>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
