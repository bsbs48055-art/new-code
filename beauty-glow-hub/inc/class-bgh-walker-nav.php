<?php
/**
 * Navigation walker producing clean, accessible menu markup.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( class_exists( 'Walker_Nav_Menu' ) && ! class_exists( 'BGH_Walker_Nav' ) ) {

	/**
	 * Extends the core nav walker to add aria attributes to parent items.
	 */
	class BGH_Walker_Nav extends Walker_Nav_Menu {

		/**
		 * Start the sub-menu level.
		 *
		 * @param string   $output Passed by reference.
		 * @param int      $depth  Depth of menu item.
		 * @param stdClass $args   Menu arguments.
		 */
		public function start_lvl( &$output, $depth = 0, $args = null ) {
			$indent  = str_repeat( "\t", $depth );
			$output .= "\n$indent<ul class=\"sub-menu\">\n";
		}

		/**
		 * Start an individual menu element.
		 *
		 * @param string   $output Passed by reference.
		 * @param WP_Post  $item   Menu item data object.
		 * @param int      $depth  Depth of menu item.
		 * @param stdClass $args   Menu arguments.
		 * @param int      $id     Current item ID.
		 */
		public function start_el( &$output, $item, $depth = 0, $args = null, $id = 0 ) {
			$classes   = empty( $item->classes ) ? array() : (array) $item->classes;
			$classes[] = 'menu-item-' . $item->ID;
			$has_kids  = in_array( 'menu-item-has-children', $classes, true );

			$class_names = implode( ' ', apply_filters( 'nav_menu_css_class', array_filter( $classes ), $item, $args, $depth ) );
			$class_names = $class_names ? ' class="' . esc_attr( $class_names ) . '"' : '';

			$output .= '<li' . $class_names . '>';

			$atts          = array();
			$atts['href']  = ! empty( $item->url ) ? $item->url : '';
			$atts['title'] = ! empty( $item->attr_title ) ? $item->attr_title : '';
			if ( $has_kids && 0 === $depth ) {
				$atts['aria-haspopup'] = 'true';
			}

			$attributes = '';
			foreach ( $atts as $attr => $value ) {
				if ( '' !== $value ) {
					$attributes .= ' ' . $attr . '="' . esc_attr( $value ) . '"';
				}
			}

			$title = apply_filters( 'the_title', $item->title, $item->ID );
			$item_output  = isset( $args->before ) ? $args->before : '';
			$item_output .= '<a' . $attributes . '>';
			$item_output .= ( isset( $args->link_before ) ? $args->link_before : '' ) . esc_html( $title ) . ( isset( $args->link_after ) ? $args->link_after : '' );
			$item_output .= '</a>';
			$item_output .= isset( $args->after ) ? $args->after : '';

			$output .= apply_filters( 'walker_nav_menu_start_el', $item_output, $item, $depth, $args );
		}
	}
}
