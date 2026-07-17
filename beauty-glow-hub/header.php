<?php
/**
 * The theme header: doctype, <head>, site branding and navigation.
 *
 * @package Beauty_Glow_Hub
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#E91E63">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'beauty-glow-hub' ); ?></a>

<div id="page" class="bgh-site">

	<?php get_template_part( 'template-parts/topbar' ); ?>

	<header class="bgh-header <?php echo get_theme_mod( 'bgh_sticky_header', true ) ? 'bgh-header--sticky' : ''; ?>" role="banner">
		<div class="bgh-container bgh-header__inner">
			<div class="bgh-brand">
				<?php if ( has_custom_logo() ) : ?>
					<div class="bgh-brand__logo"><?php the_custom_logo(); ?></div>
				<?php else : ?>
					<div class="bgh-brand__text">
						<p class="bgh-brand__title">
							<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
								<?php
								$name  = get_bloginfo( 'name' );
								$parts = explode( ' ', $name, 2 );
								echo esc_html( $parts[0] ) . ' ';
								if ( isset( $parts[1] ) ) {
									echo '<span class="bgh-brand__mark">' . esc_html( $parts[1] ) . '</span>';
								}
								?>
							</a>
						</p>
						<?php
						$desc = get_bloginfo( 'description', 'display' );
						if ( $desc ) :
							?>
							<span class="bgh-brand__tagline"><?php echo esc_html( $desc ); ?></span>
						<?php endif; ?>
					</div>
				<?php endif; ?>
			</div>

			<div class="bgh-header__actions">
				<button class="bgh-icon-btn bgh-search-toggle" aria-expanded="false" aria-controls="bgh-search-panel" aria-label="<?php esc_attr_e( 'Toggle search', 'beauty-glow-hub' ); ?>">
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				</button>
			</div>
		</div>
	</header>

	<?php
	// Header banner ad (leaderboard).
	if ( function_exists( 'bgh_ad_slot' ) ) {
		$header_ad = get_theme_mod( 'bgh_ad_header' );
		if ( ! empty( trim( (string) $header_ad ) ) || bgh_show_ad_placeholders() ) {
			echo '<div class="bgh-ad--header"><div class="bgh-container">';
			bgh_ad_slot( 'bgh_ad_header', 'leaderboard', __( 'Header banner  (728 x 90)', 'beauty-glow-hub' ) );
			echo '</div></div>';
		}
	}
	?>

	<nav class="bgh-nav" role="navigation" aria-label="<?php esc_attr_e( 'Primary Menu', 'beauty-glow-hub' ); ?>">
		<div class="bgh-container bgh-nav__inner">
			<button class="bgh-icon-btn bgh-menu-toggle" aria-expanded="false" aria-controls="primary-menu" aria-label="<?php esc_attr_e( 'Menu', 'beauty-glow-hub' ); ?>">
				<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
			</button>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'menu_id'        => 'primary-menu',
					'menu_class'     => 'bgh-menu',
					'container'      => false,
					'walker'         => class_exists( 'BGH_Walker_Nav' ) ? new BGH_Walker_Nav() : '',
					'fallback_cb'    => 'bgh_primary_menu_fallback',
					'depth'          => 2,
				)
			);
			?>
		</div>
		<div class="bgh-search-panel" id="bgh-search-panel">
			<div class="bgh-container"><?php get_search_form(); ?></div>
		</div>
	</nav>
