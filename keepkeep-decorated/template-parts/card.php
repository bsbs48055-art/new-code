<?php
/**
 * Article card.
 *
 * @package KeepKeep_Decorated
 *
 * @param array $args {
 *     @type string $size     Registered image size.
 *     @type string $heading  Heading tag to use for the card title.
 *     @type bool   $excerpt  Whether to show the excerpt.
 *     @type string $sizes    Explicit `sizes` attribute for the thumbnail.
 *     @type bool   $priority Whether this is the LCP image.
 *     @type string $class    Extra CSS classes.
 * }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_args = wp_parse_args(
	$args ?? array(),
	array(
		'size'     => 'kkd-card',
		'heading'  => 'h3',
		'excerpt'  => true,
		'sizes'    => '(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 22rem',
		'priority' => false,
		'class'    => '',
	)
);

$kkd_heading = in_array( $kkd_args['heading'], array( 'h2', 'h3', 'h4' ), true ) ? $kkd_args['heading'] : 'h3';
?>
<article <?php post_class( trim( 'kkd-card ' . $kkd_args['class'] ) ); ?>>
	<a class="kkd-card__media kkd-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php
		kkd_post_thumbnail(
			$kkd_args['size'],
			array(
				'sizes'    => $kkd_args['sizes'],
				'priority' => (bool) $kkd_args['priority'],
			)
		);
		?>
	</a>

	<div class="kkd-card__body">
		<?php kkd_category_chip(); ?>

		<<?php echo esc_html( $kkd_heading ); ?> class="kkd-card__title">
			<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
		</<?php echo esc_html( $kkd_heading ); ?>>

		<?php if ( $kkd_args['excerpt'] ) : ?>
			<p class="kkd-card__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 22, '…' ) ); ?></p>
		<?php endif; ?>

		<?php kkd_entry_meta(); ?>
	</div>
</article>
