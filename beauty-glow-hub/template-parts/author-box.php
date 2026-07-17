<?php
/**
 * Author bio box shown after single post content.
 *
 * @package Beauty_Glow_Hub
 */

$bgh_author_id = get_the_author_meta( 'ID' );
$bgh_bio       = get_the_author_meta( 'description', $bgh_author_id );
if ( ! $bgh_bio ) {
	$bgh_bio = __( 'Contributing beauty writer at Beauty Glow Hub, covering skincare, makeup and wellness with a research-first approach.', 'beauty-glow-hub' );
}
$bgh_url       = get_theme_mod( 'bgh_social_instagram' );
?>
<div class="bgh-authorbox">
	<?php echo get_avatar( $bgh_author_id, 88, '', get_the_author(), array( 'class' => 'bgh-avatar' ) ); // phpcs:ignore ?>
	<div>
		<span class="bgh-authorbox__role"><?php esc_html_e( 'Written by', 'beauty-glow-hub' ); ?></span>
		<h2 class="bgh-authorbox__name"><a href="<?php echo esc_url( get_author_posts_url( $bgh_author_id ) ); ?>" rel="author"><?php echo esc_html( get_the_author() ); ?></a></h2>
		<p class="bgh-authorbox__bio"><?php echo esc_html( $bgh_bio ); ?></p>
		<div class="bgh-authorbox__links">
			<a class="bgh-btn bgh-btn--ghost" href="<?php echo esc_url( get_author_posts_url( $bgh_author_id ) ); ?>"><?php esc_html_e( 'View all posts', 'beauty-glow-hub' ); ?></a>
			<?php
			$bgh_user_url = get_the_author_meta( 'user_url', $bgh_author_id );
			if ( $bgh_user_url ) :
				?>
				<a class="bgh-btn bgh-btn--ghost" href="<?php echo esc_url( $bgh_user_url ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Website', 'beauty-glow-hub' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
</div>
