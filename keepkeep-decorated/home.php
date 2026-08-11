<?php
/**
 * The posts index.
 *
 * Used for the "Blog" page when a static homepage is set, and for the site root
 * when it is not.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_posts_page = (int) get_option( 'page_for_posts' );
$kkd_title      = $kkd_posts_page ? get_the_title( $kkd_posts_page ) : __( 'All articles', 'keepkeep-decorated' );
$kkd_intro      = $kkd_posts_page ? get_the_excerpt( $kkd_posts_page ) : '';
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<header class="kkd-page-head">
			<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'The archive', 'keepkeep-decorated' ); ?></p>
			<h1 class="kkd-page-head__title"><?php echo esc_html( $kkd_title ); ?></h1>
			<?php if ( $kkd_intro ) : ?>
				<p class="kkd-page-head__intro"><?php echo esc_html( $kkd_intro ); ?></p>
			<?php endif; ?>
			<?php kkd_category_links(); ?>
		</header>

		<div class="kkd-layout">
			<div class="kkd-layout__content">
				<?php if ( have_posts() ) : ?>
					<div class="kkd-grid kkd-grid--2">
						<?php
						$kkd_index = 0;
						while ( have_posts() ) :
							the_post();
							kkd_card(
								array(
									'heading'  => 'h2',
									'priority' => 0 === $kkd_index && ! is_paged(),
									'sizes'    => '(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 21rem',
								)
							);
							$kkd_index++;
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
