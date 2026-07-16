<?php
/**
 * Related articles grid shown after single post content.
 *
 * @package Beauty_Glow_Hub
 */

$bgh_related = bgh_related_posts( get_the_ID(), 3 );
if ( ! $bgh_related->have_posts() ) {
	return;
}
?>
<section class="bgh-related">
	<div class="bgh-section-head">
		<h2 class="bgh-section-title"><?php esc_html_e( 'You May Also Like', 'beauty-glow-hub' ); ?></h2>
	</div>
	<div class="bgh-grid bgh-grid--3">
		<?php
		while ( $bgh_related->have_posts() ) :
			$bgh_related->the_post();
			bgh_card();
		endwhile;
		wp_reset_postdata();
		?>
	</div>
</section>
