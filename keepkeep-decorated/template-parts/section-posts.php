<?php
/**
 * A homepage category section.
 *
 * Renders nothing when the category has no published posts left to show, which
 * is what keeps a young site from displaying empty shelves.
 *
 * @package KeepKeep_Decorated
 *
 * @param array $args {
 *     @type string $title  Section heading.
 *     @type string $intro  Supporting sentence.
 *     @type string $slug   Category slug.
 *     @type string $layout One of grid, split, list.
 *     @type int    $count  Number of posts.
 *     @type bool   $tint   Whether to use the tinted background.
 * }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_args = wp_parse_args(
	$args ?? array(),
	array(
		'title'  => '',
		'intro'  => '',
		'slug'   => '',
		'layout' => 'grid',
		'count'  => 3,
		'tint'   => false,
	)
);

if ( '' === $kkd_args['slug'] ) {
	return;
}

$kkd_term = get_term_by( 'slug', $kkd_args['slug'], 'category' );
if ( ! $kkd_term || is_wp_error( $kkd_term ) ) {
	return;
}

$kkd_query = new WP_Query(
	kkd_section_query_args(
		array(
			'category_name'  => $kkd_args['slug'],
			'posts_per_page' => max( 1, (int) $kkd_args['count'] ),
		)
	)
);

if ( ! $kkd_query->have_posts() ) {
	return;
}

$kkd_title   = $kkd_args['title'] ? $kkd_args['title'] : $kkd_term->name;
$kkd_classes = 'kkd-section kkd-section--' . sanitize_html_class( $kkd_args['layout'] );
if ( $kkd_args['tint'] ) {
	$kkd_classes .= ' kkd-section--tint';
}
$kkd_heading_id = 'kkd-section-' . sanitize_html_class( $kkd_args['slug'] );
?>
<section class="<?php echo esc_attr( $kkd_classes ); ?>" aria-labelledby="<?php echo esc_attr( $kkd_heading_id ); ?>">
	<div class="kkd-container">

		<div class="kkd-section__head">
			<div class="kkd-section__headings">
				<h2 class="kkd-section__title" id="<?php echo esc_attr( $kkd_heading_id ); ?>"><?php echo esc_html( $kkd_title ); ?></h2>
				<?php if ( $kkd_args['intro'] ) : ?>
					<p class="kkd-section__intro"><?php echo esc_html( $kkd_args['intro'] ); ?></p>
				<?php endif; ?>
			</div>
			<a class="kkd-section__link" href="<?php echo esc_url( get_category_link( $kkd_term->term_id ) ); ?>">
				<?php
				printf(
					/* translators: %s: category name. */
					esc_html__( 'All %s articles', 'keepkeep-decorated' ),
					esc_html( $kkd_term->name )
				);
				?>
				<span aria-hidden="true"> &rarr;</span>
			</a>
		</div>

		<?php if ( 'split' === $kkd_args['layout'] ) : ?>

			<div class="kkd-split">
				<?php
				$kkd_i = 0;
				while ( $kkd_query->have_posts() ) :
					$kkd_query->the_post();

					if ( 0 === $kkd_i ) {
						kkd_card(
							array(
								'size'  => 'kkd-card',
								'class' => 'kkd-card--feature',
								'sizes' => '(max-width: 767px) 92vw, 34rem',
							)
						);
						echo '<div class="kkd-split__list">';
					} else {
						echo '<div class="kkd-split__item">';
						kkd_list_card();
						echo '</div>';
					}
					$kkd_i++;
				endwhile;
				if ( $kkd_i > 1 ) {
					echo '</div>';
				}
				wp_reset_postdata();
				?>
			</div>

		<?php elseif ( 'list' === $kkd_args['layout'] ) : ?>

			<div class="kkd-listgrid">
				<?php
				while ( $kkd_query->have_posts() ) :
					$kkd_query->the_post();
					kkd_list_card();
				endwhile;
				wp_reset_postdata();
				?>
			</div>

		<?php else : ?>

			<div class="kkd-grid kkd-grid--3">
				<?php
				while ( $kkd_query->have_posts() ) :
					$kkd_query->the_post();
					kkd_card();
				endwhile;
				wp_reset_postdata();
				?>
			</div>

		<?php endif; ?>
	</div>
</section>
