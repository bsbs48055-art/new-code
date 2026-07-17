<?php
/**
 * The template for displaying comments.
 *
 * @package Beauty_Glow_Hub
 */

if ( post_password_required() ) {
	return;
}
?>

<section id="comments" class="bgh-comments">

	<?php if ( have_comments() ) : ?>
		<h2 class="bgh-comments__title">
			<?php
			$bgh_count = get_comments_number();
			if ( '1' === $bgh_count ) {
				esc_html_e( '1 Comment', 'beauty-glow-hub' );
			} else {
				/* translators: %s: comment count. */
				printf( esc_html( _n( '%s Comment', '%s Comments', $bgh_count, 'beauty-glow-hub' ) ), esc_html( number_format_i18n( $bgh_count ) ) );
			}
			?>
		</h2>

		<ol class="comment-list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'short_ping'  => true,
					'avatar_size' => 48,
				)
			);
			?>
		</ol>

		<?php
		the_comments_navigation(
			array(
				'prev_text' => __( '&larr; Older comments', 'beauty-glow-hub' ),
				'next_text' => __( 'Newer comments &rarr;', 'beauty-glow-hub' ),
			)
		);
		?>

		<?php if ( ! comments_open() ) : ?>
			<p class="no-comments"><?php esc_html_e( 'Comments are closed.', 'beauty-glow-hub' ); ?></p>
		<?php endif; ?>

	<?php endif; ?>

	<?php
	comment_form(
		array(
			'class_form'         => 'bgh-comment-form',
			'title_reply_before' => '<h2 id="reply-title" class="comment-reply-title">',
			'title_reply_after'  => '</h2>',
			'title_reply'        => __( 'Leave a Comment', 'beauty-glow-hub' ),
			'class_submit'       => 'bgh-btn',
			'comment_notes_before' => '<p class="comment-notes">' . esc_html__( 'Your email address will not be published. Required fields are marked *', 'beauty-glow-hub' ) . '</p>',
		)
	);
	?>
</section>
