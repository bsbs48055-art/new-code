<?php
/**
 * Author box shown under articles.
 *
 * Every field comes from the WordPress user profile. Nothing is invented: with
 * no biography written, the box simply links to the author's other work.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_author_id = (int) get_the_author_meta( 'ID' );
if ( ! $kkd_author_id ) {
	return;
}

$kkd_name = get_the_author_meta( 'display_name', $kkd_author_id );
$kkd_bio  = trim( (string) get_the_author_meta( 'description', $kkd_author_id ) );
$kkd_role = trim( (string) get_the_author_meta( 'kkd_role', $kkd_author_id ) );
$kkd_url  = get_author_posts_url( $kkd_author_id );

$kkd_links = array_filter(
	array(
		__( 'Website', 'keepkeep-decorated' )   => get_the_author_meta( 'url', $kkd_author_id ),
		__( 'Instagram', 'keepkeep-decorated' ) => get_the_author_meta( 'kkd_instagram', $kkd_author_id ),
		__( 'Pinterest', 'keepkeep-decorated' ) => get_the_author_meta( 'kkd_pinterest', $kkd_author_id ),
	)
);
?>
<section class="kkd-author" aria-labelledby="kkd-author-heading">
	<h2 class="screen-reader-text" id="kkd-author-heading"><?php esc_html_e( 'About the author', 'keepkeep-decorated' ); ?></h2>

	<div class="kkd-author__avatar">
		<?php
		echo get_avatar(
			$kkd_author_id,
			88,
			'',
			$kkd_name,
			array(
				'class'   => 'kkd-avatar kkd-avatar--lg',
				'loading' => 'lazy',
			)
		); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_avatar() returns escaped markup.
		?>
	</div>

	<div class="kkd-author__body">
		<p class="kkd-author__name">
			<a href="<?php echo esc_url( $kkd_url ); ?>" rel="author"><?php echo esc_html( $kkd_name ); ?></a>
		</p>

		<?php if ( $kkd_role ) : ?>
			<p class="kkd-author__role"><?php echo esc_html( $kkd_role ); ?></p>
		<?php endif; ?>

		<?php if ( $kkd_bio ) : ?>
			<p class="kkd-author__bio"><?php echo esc_html( $kkd_bio ); ?></p>
		<?php endif; ?>

		<p class="kkd-author__links">
			<a href="<?php echo esc_url( $kkd_url ); ?>">
				<?php
				printf(
					/* translators: %s: author name. */
					esc_html__( 'All articles by %s', 'keepkeep-decorated' ),
					esc_html( $kkd_name )
				);
				?>
			</a>
			<?php foreach ( $kkd_links as $kkd_label => $kkd_link ) : ?>
				<a href="<?php echo esc_url( $kkd_link ); ?>" rel="noopener me" target="_blank">
					<?php echo esc_html( $kkd_label ); ?>
					<span class="screen-reader-text"><?php esc_html_e( '(opens in a new tab)', 'keepkeep-decorated' ); ?></span>
				</a>
			<?php endforeach; ?>
		</p>
	</div>
</section>
