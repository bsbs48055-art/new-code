<?php
/**
 * Author archive header (author profile card).
 *
 * @package Beauty_Glow_Hub
 */

$bgh_author_id = get_queried_object_id();
$bgh_bio       = get_the_author_meta( 'description', $bgh_author_id );
?>
<header class="bgh-author-band" style="margin-bottom:2rem;">
	<?php echo get_avatar( $bgh_author_id, 110, '', get_the_author_meta( 'display_name', $bgh_author_id ), array( 'class' => 'bgh-avatar bgh-avatar--lg' ) ); // phpcs:ignore ?>
	<div>
		<span class="bgh-author-band__role"><?php esc_html_e( 'Author', 'beauty-glow-hub' ); ?></span>
		<h1 class="bgh-author-band__name"><?php echo esc_html( get_the_author_meta( 'display_name', $bgh_author_id ) ); ?></h1>
		<?php if ( $bgh_bio ) : ?>
			<p class="bgh-mb-0"><?php echo esc_html( $bgh_bio ); ?></p>
		<?php endif; ?>
	</div>
</header>
