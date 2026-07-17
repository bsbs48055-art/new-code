<?php
/**
 * Custom search form.
 *
 * @package Beauty_Glow_Hub
 */

$bgh_id = 'bgh-search-' . wp_unique_id();
?>
<form role="search" method="get" class="bgh-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="<?php echo esc_attr( $bgh_id ); ?>"><?php esc_html_e( 'Search for:', 'beauty-glow-hub' ); ?></label>
	<div style="display:flex;gap:.5rem;">
		<input type="search" id="<?php echo esc_attr( $bgh_id ); ?>" class="search-field" placeholder="<?php esc_attr_e( 'Search articles&hellip;', 'beauty-glow-hub' ); ?>" value="<?php echo get_search_query(); ?>" name="s" />
		<button type="submit" class="bgh-btn"><?php esc_html_e( 'Search', 'beauty-glow-hub' ); ?></button>
	</div>
</form>
