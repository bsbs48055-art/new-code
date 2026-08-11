<?php
/**
 * Share links.
 *
 * Plain anchor tags to each network's share endpoint — no third-party
 * JavaScript, no tracking pixels, nothing that blocks rendering.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$kkd_links = kkd_share_links();
if ( empty( $kkd_links ) ) {
	return;
}

$kkd_icons = array(
	'facebook'  => 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6A22 22 0 0 0 14.5 3.5c-2.3 0-3.9 1.4-3.9 4v2.4H8v3.1h2.6V21z',
	'x'         => 'M17.7 3h3.3l-7.2 8.2L21.5 21h-5.9l-4.6-6-5.3 6H2.4l7.5-8.6L2.7 3h6l4.3 5.7zm-1.2 16h1.8L7.4 4.8H5.5z',
	'pinterest' => 'M12 3a9 9 0 0 0-3.3 17.4c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.2-.8 3.4-.3 1 .5 1.9 1.5 1.9 1.8 0 3.1-2.3 3.1-5 0-2.1-1.4-3.6-3.9-3.6-2.8 0-4.6 2-4.6 4.3 0 .8.2 1.4.6 1.9.2.2.2.3.1.5l-.2.8c-.1.3-.3.4-.6.2-1.1-.5-1.8-2-1.8-3.3 0-2.7 2.2-5.6 6.5-5.6 3.5 0 5.8 2.5 5.8 5.2 0 3.6-2 6.3-5 6.3-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.7 1.7-1.1 2.3A9 9 0 1 0 12 3z',
	'email'     => 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5zm2.2.5 6.8 5 6.8-5z',
);
?>
<div class="kkd-share">
	<span class="kkd-share__label"><?php esc_html_e( 'Share this article', 'keepkeep-decorated' ); ?></span>
	<ul class="kkd-share__list">
		<?php foreach ( $kkd_links as $kkd_key => $kkd_link ) : ?>
			<li>
				<a class="kkd-share__link kkd-share__link--<?php echo esc_attr( $kkd_key ); ?>" href="<?php echo esc_url( $kkd_link['url'] ); ?>" rel="noopener nofollow"<?php echo 'email' === $kkd_key ? '' : ' target="_blank"'; ?>>
					<?php if ( isset( $kkd_icons[ $kkd_key ] ) ) : ?>
						<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false"><path d="<?php echo esc_attr( $kkd_icons[ $kkd_key ] ); ?>" fill="currentColor"/></svg>
					<?php endif; ?>
					<span class="screen-reader-text"><?php echo esc_html( $kkd_link['label'] ); ?></span>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
