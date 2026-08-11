<?php
/**
 * Admin-side helpers: a one-screen setup checklist, author profile fields and a
 * per-post advertising switch.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once KKD_DIR . '/inc/starter-content.php';

/**
 * Add the setup screen under Appearance.
 */
function kkd_add_setup_page() {
	add_theme_page(
		__( 'KeepKeep Setup', 'keepkeep-decorated' ),
		__( 'KeepKeep Setup', 'keepkeep-decorated' ),
		'edit_theme_options',
		'kkd-setup',
		'kkd_render_setup_page'
	);
}
add_action( 'admin_menu', 'kkd_add_setup_page' );

/**
 * Create the starter categories.
 *
 * @return int Number of categories created.
 */
function kkd_create_starter_categories() {
	$created = 0;

	foreach ( kkd_starter_categories() as $slug => $category ) {
		if ( term_exists( $slug, 'category' ) ) {
			continue;
		}
		$result = wp_insert_term(
			$category['name'],
			'category',
			array(
				'slug'        => $slug,
				'description' => $category['description'],
			)
		);
		if ( ! is_wp_error( $result ) ) {
			$created++;
		}
	}

	return $created;
}

/**
 * Create the starter pages as drafts.
 *
 * Drafts, not published pages: a half-finished privacy policy should never be
 * publicly reachable, and the footer only links to pages that are published.
 *
 * @return int Number of pages created.
 */
function kkd_create_starter_pages() {
	$created = 0;

	foreach ( kkd_starter_pages() as $slug => $page ) {
		if ( get_page_by_path( $slug ) ) {
			continue;
		}

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'draft',
				'post_title'   => $page['title'],
				'post_name'    => $slug,
				'post_content' => $page['content'],
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			continue;
		}

		if ( $page['template'] ) {
			update_post_meta( $post_id, '_wp_page_template', $page['template'] );
		}
		$created++;
	}

	return $created;
}

/**
 * Handle the setup form submission.
 */
function kkd_handle_setup_actions() {
	if ( ! isset( $_POST['kkd_setup_action'] ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to do that.', 'keepkeep-decorated' ) );
	}
	check_admin_referer( 'kkd_setup' );

	$action  = sanitize_key( wp_unslash( $_POST['kkd_setup_action'] ) );
	$notices = array();

	if ( 'create_categories' === $action ) {
		$count     = kkd_create_starter_categories();
		$notices[] = $count
			/* translators: %d: number of categories. */
			? sprintf( _n( '%d category created.', '%d categories created.', $count, 'keepkeep-decorated' ), $count )
			: __( 'All starter categories already exist.', 'keepkeep-decorated' );
	}

	if ( 'create_pages' === $action ) {
		$count     = kkd_create_starter_pages();
		$notices[] = $count
			/* translators: %d: number of pages. */
			? sprintf( _n( '%d page drafted. Review, complete and publish each one.', '%d pages drafted. Review, complete and publish each one.', $count, 'keepkeep-decorated' ), $count )
			: __( 'All starter pages already exist.', 'keepkeep-decorated' );
	}

	set_transient( 'kkd_setup_notice_' . get_current_user_id(), $notices, 60 );

	wp_safe_redirect( add_query_arg( 'page', 'kkd-setup', admin_url( 'themes.php' ) ) );
	exit;
}
add_action( 'admin_init', 'kkd_handle_setup_actions' );

/**
 * A checklist row.
 *
 * @param bool   $done  Whether the item is complete.
 * @param string $label Item label.
 * @param string $hint  Supporting text (already escaped markup allowed).
 */
function kkd_setup_row( $done, $label, $hint = '' ) {
	printf(
		'<li class="kkd-setup__item"><span class="kkd-setup__state %1$s" aria-hidden="true">%2$s</span><span><strong>%3$s</strong>%4$s</span></li>',
		$done ? 'is-done' : 'is-todo',
		$done ? '&#10003;' : '&middot;',
		esc_html( $label ),
		$hint ? '<br><span class="description">' . wp_kses_post( $hint ) . '</span>' : ''
	);
}

/**
 * Render the setup screen.
 */
function kkd_render_setup_page() {
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}

	$notices = get_transient( 'kkd_setup_notice_' . get_current_user_id() );
	if ( $notices ) {
		delete_transient( 'kkd_setup_notice_' . get_current_user_id() );
		foreach ( (array) $notices as $notice ) {
			printf( '<div class="notice notice-success is-dismissible"><p>%s</p></div>', esc_html( $notice ) );
		}
	}

	$missing_categories = 0;
	foreach ( array_keys( kkd_starter_categories() ) as $slug ) {
		if ( ! term_exists( $slug, 'category' ) ) {
			$missing_categories++;
		}
	}

	$missing_pages   = array();
	$unpublished     = array();
	foreach ( kkd_starter_pages() as $slug => $page ) {
		$existing = get_page_by_path( $slug );
		if ( ! $existing ) {
			$missing_pages[] = $page['title'];
		} elseif ( 'publish' !== $existing->post_status ) {
			$unpublished[] = sprintf(
				'<a href="%1$s">%2$s</a>',
				esc_url( (string) get_edit_post_link( $existing->ID ) ),
				esc_html( $page['title'] )
			);
		}
	}

	$post_count = (int) wp_count_posts()->publish;
	?>
	<div class="wrap kkd-setup">
		<h1><?php esc_html_e( 'KeepKeep Decorated — Setup', 'keepkeep-decorated' ); ?></h1>
		<p class="description" style="max-width:46em">
			<?php esc_html_e( 'This screen only ever creates structure — categories, and drafts of the pages a publication needs. It never writes articles for you. Google rewards original, genuinely useful content, and that part has to come from you.', 'keepkeep-decorated' ); ?>
		</p>

		<h2><?php esc_html_e( 'Readiness checklist', 'keepkeep-decorated' ); ?></h2>
		<ul class="kkd-setup__list">
			<?php
			kkd_setup_row(
				0 === $missing_categories,
				__( 'Content categories exist', 'keepkeep-decorated' ),
				0 === $missing_categories
					? __( 'All six pillar categories are in place.', 'keepkeep-decorated' )
					/* translators: %d: number of categories. */
					: sprintf( esc_html__( '%d still missing — use the button below.', 'keepkeep-decorated' ), $missing_categories )
			);

			kkd_setup_row(
				empty( $missing_pages ),
				__( 'About, Contact and policy pages exist', 'keepkeep-decorated' ),
				empty( $missing_pages )
					? __( 'All starter pages exist.', 'keepkeep-decorated' )
					: esc_html( implode( ', ', $missing_pages ) )
			);

			kkd_setup_row(
				empty( $unpublished ),
				__( 'Every policy page is completed and published', 'keepkeep-decorated' ),
				empty( $unpublished )
					? __( 'Nothing left in draft.', 'keepkeep-decorated' )
					: __( 'Still in draft: ', 'keepkeep-decorated' ) . implode( ', ', $unpublished )
			);

			kkd_setup_row(
				has_nav_menu( 'primary' ),
				__( 'Primary menu assigned', 'keepkeep-decorated' ),
				sprintf(
					'<a href="%s">%s</a>',
					esc_url( admin_url( 'nav-menus.php' ) ),
					esc_html__( 'Manage menus', 'keepkeep-decorated' )
				)
			);

			kkd_setup_row(
				has_nav_menu( 'footer-legal' ),
				__( 'Footer legal menu assigned', 'keepkeep-decorated' ),
				__( 'Until you build it, the footer links to any published policy pages it can find by slug.', 'keepkeep-decorated' )
			);

			kkd_setup_row(
				has_custom_logo(),
				__( 'Logo uploaded', 'keepkeep-decorated' ),
				sprintf(
					'<a href="%s">%s</a>',
					esc_url( admin_url( 'customize.php' ) ),
					esc_html__( 'Site Identity in the Customizer', 'keepkeep-decorated' )
				)
			);

			kkd_setup_row(
				'' !== get_option( 'blogdescription' ),
				__( 'Tagline written', 'keepkeep-decorated' ),
				__( 'Used in the header, the footer and as your homepage description fallback.', 'keepkeep-decorated' )
			);

			kkd_setup_row(
				'/%postname%/' === get_option( 'permalink_structure' ) || false !== strpos( (string) get_option( 'permalink_structure' ), '%postname%' ),
				__( 'Descriptive permalinks enabled', 'keepkeep-decorated' ),
				sprintf(
					'<a href="%s">%s</a>',
					esc_url( admin_url( 'options-permalink.php' ) ),
					esc_html__( 'Settings → Permalinks', 'keepkeep-decorated' )
				)
			);

			kkd_setup_row(
				$post_count >= 20,
				__( 'A substantial library of original articles', 'keepkeep-decorated' ),
				sprintf(
					/* translators: %d: number of published posts. */
					esc_html__( '%d published. There is no magic number, but a thin site is the most common reason an advertising application is turned down.', 'keepkeep-decorated' ),
					$post_count
				)
			);
			?>
		</ul>

		<h2><?php esc_html_e( 'Set up structure', 'keepkeep-decorated' ); ?></h2>
		<form method="post" action="">
			<?php wp_nonce_field( 'kkd_setup' ); ?>
			<p>
				<button type="submit" name="kkd_setup_action" value="create_categories" class="button">
					<?php esc_html_e( 'Create the six pillar categories', 'keepkeep-decorated' ); ?>
				</button>
				<span class="description"><?php esc_html_e( 'Decor, Interior Design, DIY, Organization, Furniture, Lifestyle — each with a description that archive pages use.', 'keepkeep-decorated' ); ?></span>
			</p>
			<p>
				<button type="submit" name="kkd_setup_action" value="create_pages" class="button">
					<?php esc_html_e( 'Draft the About, Contact and policy pages', 'keepkeep-decorated' ); ?>
				</button>
				<span class="description"><?php esc_html_e( 'Created as drafts with section outlines and bracketed placeholders for you to complete.', 'keepkeep-decorated' ); ?></span>
			</p>
		</form>

		<style>
			.kkd-setup__list { max-width: 46em; margin: 1em 0 2em; }
			.kkd-setup__item { display: flex; gap: .6em; padding: .55em 0; border-bottom: 1px solid #e4e4e4; align-items: flex-start; }
			.kkd-setup__state { flex: 0 0 1.4em; height: 1.4em; line-height: 1.4em; text-align: center; border-radius: 50%; font-size: 12px; }
			.kkd-setup__state.is-done { background: #d6ecd9; color: #14602b; }
			.kkd-setup__state.is-todo { background: #f0e4d4; color: #8a5a2b; }
		</style>
	</div>
	<?php
}

/**
 * Extra author profile fields.
 *
 * Free-text only, and entirely under the author's control. The theme provides no
 * field for credentials or awards, because a theme has no way to verify them.
 *
 * @param WP_User $user User being edited.
 */
function kkd_author_profile_fields( $user ) {
	?>
	<h2><?php esc_html_e( 'KeepKeep Decorated profile', 'keepkeep-decorated' ); ?></h2>
	<table class="form-table" role="presentation">
		<tr>
			<th><label for="kkd_role"><?php esc_html_e( 'Role at the publication', 'keepkeep-decorated' ); ?></label></th>
			<td>
				<input type="text" id="kkd_role" name="kkd_role" class="regular-text" value="<?php echo esc_attr( (string) get_user_meta( $user->ID, 'kkd_role', true ) ); ?>">
				<p class="description"><?php esc_html_e( 'Shown under your name in the author box, e.g. “Editor” or “Contributing writer”. Leave empty to hide it.', 'keepkeep-decorated' ); ?></p>
			</td>
		</tr>
		<tr>
			<th><label for="kkd_instagram"><?php esc_html_e( 'Instagram URL', 'keepkeep-decorated' ); ?></label></th>
			<td><input type="url" id="kkd_instagram" name="kkd_instagram" class="regular-text" value="<?php echo esc_url( (string) get_user_meta( $user->ID, 'kkd_instagram', true ) ); ?>"></td>
		</tr>
		<tr>
			<th><label for="kkd_pinterest"><?php esc_html_e( 'Pinterest URL', 'keepkeep-decorated' ); ?></label></th>
			<td><input type="url" id="kkd_pinterest" name="kkd_pinterest" class="regular-text" value="<?php echo esc_url( (string) get_user_meta( $user->ID, 'kkd_pinterest', true ) ); ?>"></td>
		</tr>
	</table>
	<?php
}
add_action( 'show_user_profile', 'kkd_author_profile_fields' );
add_action( 'edit_user_profile', 'kkd_author_profile_fields' );

/**
 * Save the author profile fields.
 *
 * WordPress verifies the profile form nonce before these hooks fire; the
 * capability check confirms this user may edit that profile.
 *
 * @param int $user_id User ID.
 */
function kkd_save_author_profile_fields( $user_id ) {
	if ( ! current_user_can( 'edit_user', $user_id ) ) {
		return;
	}

	update_user_meta( $user_id, 'kkd_role', sanitize_text_field( wp_unslash( $_POST['kkd_role'] ?? '' ) ) );
	update_user_meta( $user_id, 'kkd_instagram', esc_url_raw( wp_unslash( $_POST['kkd_instagram'] ?? '' ) ) );
	update_user_meta( $user_id, 'kkd_pinterest', esc_url_raw( wp_unslash( $_POST['kkd_pinterest'] ?? '' ) ) );
}
add_action( 'personal_options_update', 'kkd_save_author_profile_fields' );
add_action( 'edit_user_profile_update', 'kkd_save_author_profile_fields' );

/**
 * Per-post switch to suppress advertising.
 */
function kkd_add_post_meta_box() {
	add_meta_box(
		'kkd-post-options',
		__( 'KeepKeep Decorated', 'keepkeep-decorated' ),
		'kkd_render_post_meta_box',
		array( 'post', 'page' ),
		'side',
		'default'
	);
}
add_action( 'add_meta_boxes', 'kkd_add_post_meta_box' );

/**
 * Render the meta box.
 *
 * @param WP_Post $post Current post.
 */
function kkd_render_post_meta_box( $post ) {
	wp_nonce_field( 'kkd_post_options', 'kkd_post_options_nonce' );
	$disabled = 'yes' === get_post_meta( $post->ID, '_kkd_disable_ads', true );
	?>
	<p>
		<label>
			<input type="checkbox" name="kkd_disable_ads" value="yes" <?php checked( $disabled ); ?>>
			<?php esc_html_e( 'Hide all advertising on this page', 'keepkeep-decorated' ); ?>
		</label>
	</p>
	<p class="description"><?php esc_html_e( 'Recommended for policy pages and anything you want to keep completely clean.', 'keepkeep-decorated' ); ?></p>
	<?php
}

/**
 * Save the meta box.
 *
 * @param int $post_id Post ID.
 */
function kkd_save_post_meta_box( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! isset( $_POST['kkd_post_options_nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['kkd_post_options_nonce'] ) ), 'kkd_post_options' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( isset( $_POST['kkd_disable_ads'] ) ) {
		update_post_meta( $post_id, '_kkd_disable_ads', 'yes' );
	} else {
		delete_post_meta( $post_id, '_kkd_disable_ads' );
	}
}
add_action( 'save_post', 'kkd_save_post_meta_box' );

/**
 * Point the site owner at the setup screen after activation.
 */
function kkd_activation_notice() {
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'themes' !== $screen->id || ! isset( $_GET['activated'] ) ) {
		return;
	}
	printf(
		'<div class="notice notice-info is-dismissible"><p>%1$s <a href="%2$s">%3$s</a></p></div>',
		esc_html__( 'KeepKeep Decorated is active.', 'keepkeep-decorated' ),
		esc_url( add_query_arg( 'page', 'kkd-setup', admin_url( 'themes.php' ) ) ),
		esc_html__( 'Open the setup checklist', 'keepkeep-decorated' )
	);
}
add_action( 'admin_notices', 'kkd_activation_notice' );
