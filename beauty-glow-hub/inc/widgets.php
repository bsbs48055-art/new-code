<?php
/**
 * Custom widgets: Popular Posts, About Blog, Newsletter.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Popular Posts widget (by comment count, falls back to most recent).
 */
class BGH_Popular_Posts_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'bgh_popular_posts',
			__( 'BGH: Popular Posts', 'beauty-glow-hub' ),
			array( 'description' => __( 'Displays popular posts with thumbnails.', 'beauty-glow-hub' ) )
		);
	}

	public function widget( $args, $instance ) {
		$title  = ! empty( $instance['title'] ) ? $instance['title'] : __( 'Popular Posts', 'beauty-glow-hub' );
		$number = ! empty( $instance['number'] ) ? absint( $instance['number'] ) : 5;

		$query = new WP_Query(
			array(
				'post_type'           => 'post',
				'posts_per_page'      => $number,
				'orderby'             => 'comment_count',
				'order'               => 'DESC',
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
			)
		);

		if ( ! $query->have_posts() ) {
			return;
		}

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<ul class="bgh-list bgh-list--numbered">';
		while ( $query->have_posts() ) {
			$query->the_post();
			echo '<li class="bgh-list__item"><div><h4 class="bgh-list__title"><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h4>';
			echo '<span class="bgh-list__meta">' . esc_html( get_the_date() ) . '</span></div></li>';
		}
		echo '</ul>';
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		wp_reset_postdata();
	}

	public function form( $instance ) {
		$title  = isset( $instance['title'] ) ? $instance['title'] : __( 'Popular Posts', 'beauty-glow-hub' );
		$number = isset( $instance['number'] ) ? absint( $instance['number'] ) : 5;
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'beauty-glow-hub' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'number' ) ); ?>"><?php esc_html_e( 'Number of posts:', 'beauty-glow-hub' ); ?></label>
			<input class="tiny-text" id="<?php echo esc_attr( $this->get_field_id( 'number' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'number' ) ); ?>" type="number" min="1" max="12" value="<?php echo esc_attr( $number ); ?>">
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$instance           = array();
		$instance['title']  = sanitize_text_field( $new_instance['title'] );
		$instance['number'] = absint( $new_instance['number'] );
		return $instance;
	}
}

/**
 * About the Blog widget.
 */
class BGH_About_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'bgh_about',
			__( 'BGH: About Blog', 'beauty-glow-hub' ),
			array( 'description' => __( 'A short about blurb with optional image.', 'beauty-glow-hub' ) )
		);
	}

	public function widget( $args, $instance ) {
		$title = ! empty( $instance['title'] ) ? $instance['title'] : __( 'About Beauty Glow Hub', 'beauty-glow-hub' );
		$text  = ! empty( $instance['text'] ) ? $instance['text'] : '';

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<p>' . esc_html( $text ) . '</p>';
		echo '<a class="bgh-btn bgh-btn--ghost bgh-btn--block" href="' . esc_url( home_url( '/about-us/' ) ) . '">' . esc_html__( 'Read More About Us', 'beauty-glow-hub' ) . '</a>';
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	public function form( $instance ) {
		$title = isset( $instance['title'] ) ? $instance['title'] : __( 'About Beauty Glow Hub', 'beauty-glow-hub' );
		$text  = isset( $instance['text'] ) ? $instance['text'] : '';
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'beauty-glow-hub' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>"><?php esc_html_e( 'Text:', 'beauty-glow-hub' ); ?></label>
			<textarea class="widefat" rows="4" id="<?php echo esc_attr( $this->get_field_id( 'text' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'text' ) ); ?>"><?php echo esc_textarea( $text ); ?></textarea>
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		return array(
			'title' => sanitize_text_field( $new_instance['title'] ),
			'text'  => sanitize_textarea_field( $new_instance['text'] ),
		);
	}
}

/**
 * Newsletter widget.
 */
class BGH_Newsletter_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'bgh_newsletter',
			__( 'BGH: Newsletter', 'beauty-glow-hub' ),
			array( 'description' => __( 'Newsletter signup call-to-action.', 'beauty-glow-hub' ) )
		);
	}

	public function widget( $args, $instance ) {
		$title = ! empty( $instance['title'] ) ? $instance['title'] : __( 'Join Our Newsletter', 'beauty-glow-hub' );
		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<p style="font-size:.92rem;color:var(--bgh-text-soft);">' . esc_html__( 'Weekly beauty tips, tried-and-tested reviews and skincare science — straight to your inbox.', 'beauty-glow-hub' ) . '</p>';
		bgh_newsletter_form( 'widget' );
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	public function form( $instance ) {
		$title = isset( $instance['title'] ) ? $instance['title'] : __( 'Join Our Newsletter', 'beauty-glow-hub' );
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'beauty-glow-hub' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		return array( 'title' => sanitize_text_field( $new_instance['title'] ) );
	}
}

/**
 * Register custom widgets.
 */
function bgh_register_widgets() {
	register_widget( 'BGH_Popular_Posts_Widget' );
	register_widget( 'BGH_About_Widget' );
	register_widget( 'BGH_Newsletter_Widget' );
}
add_action( 'widgets_init', 'bgh_register_widgets' );

/**
 * Shared newsletter form markup.
 *
 * @param string $context Context for the field ids.
 */
function bgh_newsletter_form( $context = 'section' ) {
	$action = get_theme_mod( 'bgh_newsletter_action' );
	$id     = 'bgh-nl-' . sanitize_html_class( $context );
	?>
	<form class="bgh-newsletter__form" action="<?php echo $action ? esc_url( $action ) : '#'; ?>" method="post" novalidate>
		<label class="screen-reader-text" for="<?php echo esc_attr( $id ); ?>"><?php esc_html_e( 'Email address', 'beauty-glow-hub' ); ?></label>
		<input id="<?php echo esc_attr( $id ); ?>" type="email" name="EMAIL" placeholder="<?php esc_attr_e( 'Your email address', 'beauty-glow-hub' ); ?>" required>
		<button type="submit" class="bgh-btn bgh-btn--light"><?php esc_html_e( 'Subscribe', 'beauty-glow-hub' ); ?></button>
	</form>
	<?php
}
