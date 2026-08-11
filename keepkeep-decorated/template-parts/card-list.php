<?php
/**
 * Compact horizontal card, used in the sidebar and in list-layout sections.
 *
 * @package KeepKeep_Decorated
 *
 * @param array $args {
 *     @type string $heading Heading tag.
 *     @type int    $number  Optional rank number to display.
 *     @type bool   $meta    Whether to show the date and reading time.
 * }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_args = wp_parse_args(
	$args ?? array(),
	array(
		'heading' => 'h3',
		'number'  => 0,
		'meta'    => true,
	)
);

$kkd_heading = in_array( $kkd_args['heading'], array( 'h2', 'h3', 'h4' ), true ) ? $kkd_args['heading'] : 'h3';
?>
<article <?php post_class( 'kkd-hcard' ); ?>>
	<?php if ( (int) $kkd_args['number'] > 0 ) : ?>
		<span class="kkd-hcard__rank" aria-hidden="true"><?php echo esc_html( number_format_i18n( (int) $kkd_args['number'] ) ); ?></span>
	<?php endif; ?>

	<a class="kkd-hcard__media kkd-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php kkd_post_thumbnail( 'kkd-thumb', array( 'sizes' => '96px' ) ); ?>
	</a>

	<div class="kkd-hcard__body">
		<<?php echo esc_html( $kkd_heading ); ?> class="kkd-hcard__title">
			<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
		</<?php echo esc_html( $kkd_heading ); ?>>

		<?php if ( $kkd_args['meta'] ) : ?>
			<p class="kkd-hcard__meta">
				<time datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
				<span class="kkd-dot" aria-hidden="true"></span>
				<span><?php echo esc_html( kkd_reading_time() ); ?></span>
			</p>
		<?php endif; ?>
	</div>
</article>
