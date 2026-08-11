<?php
/**
 * Search form.
 *
 * @package KeepKeep_Decorated
 */

$kkd_field_id = wp_unique_id( 'kkd-search-field-' );
?>
<form role="search" method="get" class="kkd-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="<?php echo esc_attr( $kkd_field_id ); ?>">
		<?php esc_html_e( 'Search for articles', 'keepkeep-decorated' ); ?>
	</label>
	<input
		type="search"
		id="<?php echo esc_attr( $kkd_field_id ); ?>"
		class="kkd-searchform__field"
		name="s"
		value="<?php echo esc_attr( get_search_query() ); ?>"
		placeholder="<?php esc_attr_e( 'Try “small bedroom” or “paint”', 'keepkeep-decorated' ); ?>"
		autocomplete="off"
	>
	<button type="submit" class="kkd-searchform__submit">
		<?php esc_html_e( 'Search', 'keepkeep-decorated' ); ?>
	</button>
</form>
