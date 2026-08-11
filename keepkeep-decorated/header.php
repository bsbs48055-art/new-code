<?php
/**
 * The site header.
 *
 * The primary menu is rendered once and re-flowed by CSS into a drawer on small
 * screens, so navigation links are never duplicated in the document.
 *
 * @package KeepKeep_Decorated
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#fdfbf7">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#kkd-main"><?php esc_html_e( 'Skip to main content', 'keepkeep-decorated' ); ?></a>

<div class="kkd-site">

	<header class="kkd-header" id="kkd-header">
		<div class="kkd-container kkd-header__inner">

			<button
				class="kkd-icon-btn kkd-header__menu"
				type="button"
				aria-expanded="false"
				aria-controls="kkd-nav"
				data-kkd-toggle="nav"
			>
				<span class="kkd-bars" aria-hidden="true"></span>
				<span class="screen-reader-text"><?php esc_html_e( 'Menu', 'keepkeep-decorated' ); ?></span>
			</button>

			<div class="kkd-brand">
				<?php if ( has_custom_logo() ) : ?>
					<?php the_custom_logo(); ?>
				<?php else : ?>
					<p class="kkd-brand__name">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
							<?php
							$kkd_name  = get_bloginfo( 'name' );
							$kkd_parts = explode( ' ', $kkd_name, 2 );
							echo esc_html( $kkd_parts[0] );
							if ( isset( $kkd_parts[1] ) ) {
								echo ' <span class="kkd-brand__accent">' . esc_html( $kkd_parts[1] ) . '</span>';
							}
							?>
						</a>
					</p>
					<?php
					$kkd_tagline = get_bloginfo( 'description', 'display' );
					if ( $kkd_tagline ) :
						?>
						<span class="kkd-brand__tagline"><?php echo esc_html( $kkd_tagline ); ?></span>
					<?php endif; ?>
				<?php endif; ?>
			</div>

			<nav class="kkd-nav" id="kkd-nav" aria-label="<?php esc_attr_e( 'Primary', 'keepkeep-decorated' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'menu_id'        => 'kkd-primary-menu',
						'menu_class'     => 'kkd-menu',
						'container'      => false,
						'depth'          => 2,
						'walker'         => new KKD_Walker_Nav(),
						'fallback_cb'    => 'kkd_primary_menu_fallback',
					)
				);
				?>
			</nav>

			<button
				class="kkd-icon-btn kkd-header__search"
				type="button"
				aria-expanded="false"
				aria-controls="kkd-search-panel"
				data-kkd-toggle="search"
			>
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
					<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/>
					<path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
				</svg>
				<span class="screen-reader-text"><?php esc_html_e( 'Search', 'keepkeep-decorated' ); ?></span>
			</button>
		</div>

		<div class="kkd-search-panel" id="kkd-search-panel">
			<div class="kkd-container">
				<?php get_search_form(); ?>
			</div>
		</div>
	</header>

	<?php kkd_ad_slot( 'header', 'leaderboard' ); ?>
