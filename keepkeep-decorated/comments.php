<?php
/**
 * Comments area.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/*
 * If the post is password protected and the visitor has not entered the
 * password, do not show the discussion.
 */
if ( post_password_required() ) {
	return;
}
?>

<section id="comments" class="kkd-comments">

	<?php if ( have_comments() ) : ?>
		<h2 class="kkd-comments__title">
			<?php
			$kkd_count = get_comments_number();
			printf(
				/* translators: %s: comment count. */
				esc_html( _n( '%s comment', '%s comments', $kkd_count, 'keepkeep-decorated' ) ),
				esc_html( number_format_i18n( $kkd_count ) )
			);
			?>
		</h2>

		<ol class="kkd-comments__list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'short_ping'  => true,
					'avatar_size' => 44,
				)
			);
			?>
		</ol>

		<?php
		the_comments_pagination(
			array(
				'prev_text'          => '<span aria-hidden="true">&larr;</span> ' . esc_html__( 'Older comments', 'keepkeep-decorated' ),
				'next_text'          => esc_html__( 'Newer comments', 'keepkeep-decorated' ) . ' <span aria-hidden="true">&rarr;</span>',
				'screen_reader_text' => esc_html__( 'Comment page navigation', 'keepkeep-decorated' ),
			)
		);
		?>
	<?php endif; ?>

	<?php if ( ! comments_open() && get_comments_number() && post_type_supports( get_post_type(), 'comments' ) ) : ?>
		<p class="kkd-comments__closed"><?php esc_html_e( 'Comments are closed on this article.', 'keepkeep-decorated' ); ?></p>
	<?php endif; ?>

	<?php comment_form(); ?>
</section>
