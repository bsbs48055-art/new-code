<?php
/**
 * The sidebar containing the main widget area.
 *
 * @package Beauty_Glow_Hub
 */

?>
<aside id="secondary" class="bgh-sidebar" role="complementary" aria-label="<?php esc_attr_e( 'Blog sidebar', 'beauty-glow-hub' ); ?>">

	<?php if ( is_active_sidebar( 'sidebar-1' ) ) : ?>

		<?php dynamic_sidebar( 'sidebar-1' ); ?>

	<?php else : ?>

		<?php get_search_form(); ?>

		<section class="bgh-widget">
			<h3 class="bgh-widget__title"><?php esc_html_e( 'Popular Posts', 'beauty-glow-hub' ); ?></h3>
			<ul class="bgh-list bgh-list--numbered">
				<?php
				$bgh_popular = new WP_Query(
					array(
						'posts_per_page'      => 5,
						'orderby'             => 'comment_count',
						'order'               => 'DESC',
						'ignore_sticky_posts' => true,
						'no_found_rows'       => true,
					)
				);
				while ( $bgh_popular->have_posts() ) :
					$bgh_popular->the_post();
					echo '<li class="bgh-list__item"><div><h4 class="bgh-list__title"><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h4><span class="bgh-list__meta">' . esc_html( get_the_date() ) . '</span></div></li>';
				endwhile;
				wp_reset_postdata();
				?>
			</ul>
		</section>

		<?php
		// Sidebar ad slot.
		bgh_ad_slot( 'bgh_ad_sidebar', 'sidebar', __( 'Sidebar ad (300 x 250)', 'beauty-glow-hub' ) );
		?>

		<section class="bgh-widget">
			<h3 class="bgh-widget__title"><?php esc_html_e( 'Categories', 'beauty-glow-hub' ); ?></h3>
			<ul>
				<?php
				wp_list_categories(
					array(
						'title_li'     => '',
						'show_count'   => true,
						'number'       => 10,
						'orderby'      => 'count',
						'order'        => 'DESC',
					)
				);
				?>
			</ul>
		</section>

		<section class="bgh-widget">
			<h3 class="bgh-widget__title"><?php esc_html_e( 'Join Our Newsletter', 'beauty-glow-hub' ); ?></h3>
			<p style="font-size:.92rem;color:var(--bgh-text-soft);"><?php esc_html_e( 'Get weekly beauty tips and honest reviews in your inbox.', 'beauty-glow-hub' ); ?></p>
			<?php bgh_newsletter_form( 'sidebar' ); ?>
		</section>

	<?php endif; ?>

</aside>
