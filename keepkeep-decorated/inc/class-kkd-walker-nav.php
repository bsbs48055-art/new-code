<?php
/**
 * Navigation walker that adds an accessible submenu toggle.
 *
 * The toggle is a real button, so submenus can be opened with the keyboard and
 * on touch devices where there is no hover state. Without JavaScript the
 * submenu still opens on focus and hover via CSS.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Primary menu walker.
 */
class KKD_Walker_Nav extends Walker_Nav_Menu {

	/**
	 * Start the element output, appending a toggle button to parent items.
	 *
	 * @param string   $output Passed by reference. Used to append content.
	 * @param WP_Post  $item   Menu item data object.
	 * @param int      $depth  Depth of menu item.
	 * @param stdClass $args   Menu arguments.
	 * @param int      $id     Current item ID.
	 */
	public function start_el( &$output, $item, $depth = 0, $args = null, $id = 0 ) {
		$before = $output;
		parent::start_el( $output, $item, $depth, $args, $id );

		if ( empty( $item->classes ) || ! in_array( 'menu-item-has-children', (array) $item->classes, true ) ) {
			return;
		}

		$added  = substr( $output, strlen( $before ) );
		$button = sprintf(
			'<button class="kkd-submenu-toggle" type="button" aria-expanded="false"><span class="screen-reader-text">%1$s %2$s</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
			esc_html__( 'Show submenu for', 'keepkeep-decorated' ),
			esc_html( $item->title )
		);

		$output = $before . $added . $button;
	}
}
