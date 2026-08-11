<?php
/**
 * Related articles shown under a post.
 *
 * Looks for posts sharing a tag first, then falls back to the same category,
 * then to recent posts — so the block is relevant when it can be and still
 * useful when the site is young.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_post_id = get_the_ID();

/**
 * Filters how many related articles are shown.
 *
 * @param int $count Number of related posts (3–6 reads best in the grid).
 */
$kkd_count = (int) apply_filters( 'kkd_related_posts_count', 3 );
$kkd_count = max( 3, min( 6, $kkd_count ) );

$kkd_base = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => $kkd_count,
	'post__not_in'        => array( $kkd_post_id ),
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);

$kkd_tag_ids = wp_list_pluck( (array) get_the_tags( $kkd_post_id ), 'term_id' );
$kkd_cat_ids = wp_list_pluck( (array) get_the_category( $kkd_post_id ), 'term_id' );

$kkd_related = new WP_Query( array() );

if ( ! empty( $kkd_tag_ids ) ) {
	$kkd_related = new WP_Query( array_merge( $kkd_base, array( 'tag__in' => $kkd_tag_ids ) ) );
}

if ( ! $kkd_related->have_posts() && ! empty( $kkd_cat_ids ) ) {
	$kkd_related = new WP_Query( array_merge( $kkd_base, array( 'category__in' => $kkd_cat_ids ) ) );
}

if ( ! $kkd_related->have_posts() ) {
	$kkd_related = new WP_Query( $kkd_base );
}

if ( ! $kkd_related->have_posts() ) {
	return;
}
?>
<section class="kkd-related" aria-labelledby="kkd-related-heading">
	<h2 class="kkd-related__title" id="kkd-related-heading"><?php esc_html_e( 'More decorating ideas', 'keepkeep-decorated' ); ?></h2>

	<div class="kkd-grid kkd-grid--3">
		<?php
		while ( $kkd_related->have_posts() ) :
			$kkd_related->the_post();
			get_template_part(
				'template-parts/card',
				null,
				array(
					'heading' => 'h3',
					'excerpt' => false,
					'size'    => 'kkd-card-sm',
					'sizes'   => '(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 15rem',
				)
			);
		endwhile;
		wp_reset_postdata();
		?>
	</div>
</section>
