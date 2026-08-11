<?php
/**
 * Shown when a query returns nothing.
 *
 * Always offers a route onwards — search, categories and the homepage — so no
 * view is a dead end.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="kkd-empty">
	<?php if ( is_search() ) : ?>

		<p class="kkd-empty__lead">
			<?php esc_html_e( 'We could not find an article matching that search.', 'keepkeep-decorated' ); ?>
		</p>
		<p><?php esc_html_e( 'Try a shorter phrase — a room name like “bedroom”, or a task like “paint” — or browse a section below.', 'keepkeep-decorated' ); ?></p>
		<?php get_search_form(); ?>

	<?php elseif ( is_home() || is_archive() ) : ?>

		<p class="kkd-empty__lead"><?php esc_html_e( 'Nothing published here yet.', 'keepkeep-decorated' ); ?></p>
		<p><?php esc_html_e( 'New articles are added regularly. In the meantime, these sections have plenty to read.', 'keepkeep-decorated' ); ?></p>

	<?php else : ?>

		<p class="kkd-empty__lead"><?php esc_html_e( 'There is nothing to show here.', 'keepkeep-decorated' ); ?></p>

	<?php endif; ?>

	<?php kkd_category_links(); ?>

	<p>
		<a class="kkd-btn kkd-btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<?php esc_html_e( 'Go to the homepage', 'keepkeep-decorated' ); ?>
		</a>
	</p>
</div>
