<?php
/**
 * The sidebar.
 *
 * Falls back to a small set of genuinely useful navigation blocks when no
 * widgets have been added, so the column is never empty on a new site.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_has_widgets = is_active_sidebar( 'sidebar-1' );
?>
<aside class="kkd-sidebar" id="kkd-sidebar" aria-label="<?php esc_attr_e( 'More from this site', 'keepkeep-decorated' ); ?>">

	<?php if ( $kkd_has_widgets ) : ?>
		<?php dynamic_sidebar( 'sidebar-1' ); ?>
	<?php else : ?>

		<section class="kkd-widget">
			<h2 class="kkd-widget__title"><?php esc_html_e( 'Search', 'keepkeep-decorated' ); ?></h2>
			<?php get_search_form(); ?>
		</section>

		<?php
		$kkd_categories = get_categories(
			array(
				'orderby'    => 'name',
				'hide_empty' => true,
				'number'     => 8,
			)
		);
		if ( $kkd_categories ) :
			?>
			<section class="kkd-widget">
				<h2 class="kkd-widget__title"><?php esc_html_e( 'Browse by room &amp; topic', 'keepkeep-decorated' ); ?></h2>
				<ul class="kkd-widget__links">
					<?php foreach ( $kkd_categories as $kkd_category ) : ?>
						<li>
							<a href="<?php echo esc_url( get_category_link( $kkd_category->term_id ) ); ?>">
								<?php echo esc_html( $kkd_category->name ); ?>
							</a>
							<span class="kkd-widget__count" aria-hidden="true"><?php echo esc_html( number_format_i18n( $kkd_category->count ) ); ?></span>
						</li>
					<?php endforeach; ?>
				</ul>
			</section>
		<?php endif; ?>

		<?php
		$kkd_recent = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => 4,
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
				'post__not_in'        => is_singular() ? array( get_the_ID() ) : array(),
			)
		);
		if ( $kkd_recent->have_posts() ) :
			?>
			<section class="kkd-widget">
				<h2 class="kkd-widget__title"><?php esc_html_e( 'Latest articles', 'keepkeep-decorated' ); ?></h2>
				<ul class="kkd-widget__list">
					<?php
					while ( $kkd_recent->have_posts() ) :
						$kkd_recent->the_post();
						echo '<li>';
						get_template_part( 'template-parts/card-list', null, array( 'heading' => 'h3' ) );
						echo '</li>';
					endwhile;
					wp_reset_postdata();
					?>
				</ul>
			</section>
		<?php endif; ?>

	<?php endif; ?>

	<?php kkd_ad_slot( 'sidebar', 'sidebar' ); ?>
</aside>
