<?php
/**
 * Template part for "no results found".
 *
 * @package Beauty_Glow_Hub
 */

?>
<section class="bgh-no-results">
	<div class="bgh-callout" style="text-align:center;">
		<h2 style="margin-top:0;"><?php esc_html_e( 'Nothing found', 'beauty-glow-hub' ); ?></h2>
		<?php if ( is_search() ) : ?>
			<p><?php esc_html_e( 'Sorry, no articles matched your search. Try different keywords.', 'beauty-glow-hub' ); ?></p>
		<?php else : ?>
			<p><?php esc_html_e( 'It seems we can&rsquo;t find what you&rsquo;re looking for. Perhaps a search can help.', 'beauty-glow-hub' ); ?></p>
		<?php endif; ?>
		<div style="max-width:480px;margin:1rem auto 0;"><?php get_search_form(); ?></div>
	</div>
</section>
