<?php
/**
 * Homepage hero: one lead story plus two supporting stories.
 *
 * The lead image is the page's largest above-the-fold element, so it is loaded
 * eagerly with a high fetch priority to keep Largest Contentful Paint down;
 * everything else on the page stays lazy.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_hero_args = array(
	'post_type'      => 'post',
	'post_status'    => 'publish',
	'posts_per_page' => 3,
	'no_found_rows'  => true,
);

if ( 'recent' === get_theme_mod( 'kkd_hero_source', 'sticky' ) ) {
	$kkd_hero_args['ignore_sticky_posts'] = true;
}

$kkd_hero = new WP_Query( $kkd_hero_args );

if ( ! $kkd_hero->have_posts() ) {
	return;
}

$kkd_index = 0;
?>
<section class="kkd-hero" aria-labelledby="kkd-hero-heading">
	<div class="kkd-container">
		<h2 class="screen-reader-text" id="kkd-hero-heading"><?php esc_html_e( 'Featured stories', 'keepkeep-decorated' ); ?></h2>

		<div class="kkd-hero__grid">
			<?php
			while ( $kkd_hero->have_posts() ) :
				$kkd_hero->the_post();
				kkd_mark_shown();

				if ( 0 === $kkd_index ) :
					?>
					<article <?php post_class( 'kkd-lead' ); ?>>
						<a class="kkd-lead__media kkd-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
							<?php
							kkd_post_thumbnail(
								'kkd-hero',
								array(
									'priority' => true,
									'sizes'    => '(max-width: 1023px) 100vw, 62vw',
								)
							);
							?>
						</a>
						<div class="kkd-lead__body">
							<?php kkd_category_chip(); ?>
							<h3 class="kkd-lead__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
							<p class="kkd-lead__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 32, '…' ) ); ?></p>
							<div class="kkd-lead__meta">
								<?php kkd_byline(); ?>
								<span class="kkd-dot" aria-hidden="true"></span>
								<span><?php echo esc_html( kkd_reading_time() ); ?></span>
							</div>
						</div>
					</article>
					<div class="kkd-hero__side">
					<?php
				else :
					kkd_card(
						array(
							'size'    => 'kkd-card-sm',
							'excerpt' => false,
							'class'   => 'kkd-card--compact',
							'sizes'   => '(max-width: 1023px) 46vw, 20rem',
						)
					);
				endif;

				$kkd_index++;
			endwhile;

			if ( $kkd_index > 1 ) {
				echo '</div>';
			}

			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
