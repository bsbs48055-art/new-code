<?php
/**
 * Custom widgets.
 *
 * Two small widgets cover what a decor magazine sidebar actually needs and that
 * core does not provide: an article list with thumbnails, and a brief "about"
 * card. Everything else (search, categories, archives) is left to core blocks.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Article list widget with thumbnails.
 */
class KKD_Posts_Widget extends WP_Widget {

	/**
	 * Register the widget.
	 */
	public function __construct() {
		parent::__construct(
			'kkd_posts',
			__( 'KeepKeep: Article List', 'keepkeep-decorated' ),
			array(
				'classname'                   => 'kkd-widget--posts',
				'description'                 => __( 'A list of articles with thumbnails — latest, most discussed, or from one category.', 'keepkeep-decorated' ),
				'customize_selective_refresh' => true,
			)
		);
	}

	/**
	 * Default instance values.
	 *
	 * @return array
	 */
	protected function defaults() {
		return array(
			'title'    => __( 'Latest articles', 'keepkeep-decorated' ),
			'number'   => 4,
			'orderby'  => 'date',
			'category' => 0,
		);
	}

	/**
	 * Front-end output.
	 *
	 * @param array $args     Sidebar args.
	 * @param array $instance Saved values.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		$query_args = array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => max( 1, min( 10, (int) $instance['number'] ) ),
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		);

		if ( 'comment_count' === $instance['orderby'] ) {
			$query_args['orderby'] = 'comment_count';
			$query_args['order']   = 'DESC';
		}
		if ( (int) $instance['category'] > 0 ) {
			$query_args['cat'] = (int) $instance['category'];
		}

		$query = new WP_Query( $query_args );
		if ( ! $query->have_posts() ) {
			return;
		}

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sidebar markup from register_sidebar().

		$title = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );
		if ( $title ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sidebar markup from register_sidebar().
		}

		echo '<ul class="kkd-widget__list">';
		while ( $query->have_posts() ) {
			$query->the_post();
			echo '<li>';
			kkd_list_card( array( 'heading' => 'h3' ) );
			echo '</li>';
		}
		echo '</ul>';
		wp_reset_postdata();

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sidebar markup from register_sidebar().
	}

	/**
	 * Settings form.
	 *
	 * @param array $instance Saved values.
	 * @return void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'keepkeep-decorated' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'number' ) ); ?>"><?php esc_html_e( 'Number of articles:', 'keepkeep-decorated' ); ?></label>
			<input class="tiny-text" id="<?php echo esc_attr( $this->get_field_id( 'number' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'number' ) ); ?>" type="number" min="1" max="10" step="1" value="<?php echo esc_attr( (string) $instance['number'] ); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'orderby' ) ); ?>"><?php esc_html_e( 'Order by:', 'keepkeep-decorated' ); ?></label>
			<select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'orderby' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'orderby' ) ); ?>">
				<option value="date" <?php selected( $instance['orderby'], 'date' ); ?>><?php esc_html_e( 'Most recent', 'keepkeep-decorated' ); ?></option>
				<option value="comment_count" <?php selected( $instance['orderby'], 'comment_count' ); ?>><?php esc_html_e( 'Most discussed', 'keepkeep-decorated' ); ?></option>
			</select>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'category' ) ); ?>"><?php esc_html_e( 'Limit to category:', 'keepkeep-decorated' ); ?></label>
			<?php
			wp_dropdown_categories(
				array(
					'show_option_all' => __( 'All categories', 'keepkeep-decorated' ),
					'hide_empty'      => false,
					'selected'        => (int) $instance['category'],
					'name'            => $this->get_field_name( 'category' ),
					'id'              => $this->get_field_id( 'category' ),
					'class'           => 'widefat',
				)
			);
			?>
		</p>
		<?php
	}

	/**
	 * Sanitize submitted values.
	 *
	 * @param array $new_instance Submitted values.
	 * @param array $old_instance Previous values.
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		$instance             = array();
		$instance['title']    = sanitize_text_field( $new_instance['title'] ?? '' );
		$instance['number']   = max( 1, min( 10, (int) ( $new_instance['number'] ?? 4 ) ) );
		$instance['orderby']  = in_array( $new_instance['orderby'] ?? 'date', array( 'date', 'comment_count' ), true ) ? $new_instance['orderby'] : 'date';
		$instance['category'] = absint( $new_instance['category'] ?? 0 );

		return $instance;
	}
}

/**
 * Short "about this publication" card.
 */
class KKD_About_Widget extends WP_Widget {

	/**
	 * Register the widget.
	 */
	public function __construct() {
		parent::__construct(
			'kkd_about',
			__( 'KeepKeep: About Card', 'keepkeep-decorated' ),
			array(
				'classname'                   => 'kkd-widget--about',
				'description'                 => __( 'A short introduction with an optional link to your About page.', 'keepkeep-decorated' ),
				'customize_selective_refresh' => true,
			)
		);
	}

	/**
	 * Front-end output.
	 *
	 * @param array $args     Sidebar args.
	 * @param array $instance Saved values.
	 */
	public function widget( $args, $instance ) {
		$title = $instance['title'] ?? '';
		$text  = $instance['text'] ?? '';
		$link  = $instance['link'] ?? 0;

		if ( '' === trim( (string) $text ) ) {
			return;
		}

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sidebar markup from register_sidebar().

		$title = apply_filters( 'widget_title', $title, $instance, $this->id_base );
		if ( $title ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sidebar markup from register_sidebar().
		}

		echo '<p class="kkd-widget__text">' . esc_html( $text ) . '</p>';

		if ( (int) $link > 0 && 'publish' === get_post_status( (int) $link ) ) {
			printf(
				'<a class="kkd-btn kkd-btn--ghost kkd-btn--sm" href="%1$s">%2$s</a>',
				esc_url( (string) get_permalink( (int) $link ) ),
				esc_html__( 'More about us', 'keepkeep-decorated' )
			);
		}

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sidebar markup from register_sidebar().
	}

	/**
	 * Settings form.
	 *
	 * @param array $instance Saved values.
	 * @return void
	 */
	public function form( $instance ) {
		$title = $instance['title'] ?? __( 'About KeepKeep Decorated', 'keepkeep-decorated' );
		$text  = $instance['text'] ?? '';
		$link  = (int) ( $instance['link'] ?? 0 );
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'keepkeep-decorated' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>"><?php esc_html_e( 'Text:', 'keepkeep-decorated' ); ?></label>
			<textarea class="widefat" rows="4" id="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'text' ) ); ?>"><?php echo esc_textarea( $text ); ?></textarea>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'link' ) ); ?>"><?php esc_html_e( 'Link to page:', 'keepkeep-decorated' ); ?></label>
			<?php
			wp_dropdown_pages(
				array(
					'show_option_none' => __( 'No link', 'keepkeep-decorated' ),
					'option_none_value' => 0,
					'selected'         => $link,
					'name'             => $this->get_field_name( 'link' ),
					'id'               => $this->get_field_id( 'link' ),
					'class'            => 'widefat',
				)
			);
			?>
		</p>
		<?php
	}

	/**
	 * Sanitize submitted values.
	 *
	 * @param array $new_instance Submitted values.
	 * @param array $old_instance Previous values.
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		return array(
			'title' => sanitize_text_field( $new_instance['title'] ?? '' ),
			'text'  => sanitize_textarea_field( $new_instance['text'] ?? '' ),
			'link'  => absint( $new_instance['link'] ?? 0 ),
		);
	}
}

/**
 * Register the theme widgets.
 */
function kkd_register_widgets() {
	register_widget( 'KKD_Posts_Widget' );
	register_widget( 'KKD_About_Widget' );
}
add_action( 'widgets_init', 'kkd_register_widgets' );
