<?php
/**
 * Template Name: Contact
 * Template Post Type: page
 *
 * Renders the page's own content — including a form shortcode from Contact Form
 * 7, WPForms, Fluent Forms, Gravity Forms or any other plugin — inside a styled
 * panel.
 *
 * If no form is present, the panel shows the contact email from the Customizer
 * instead. The theme never renders a decorative form that silently drops
 * messages.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_email    = sanitize_email( (string) get_theme_mod( 'kkd_contact_email', '' ) );
$kkd_profiles = kkd_social_profiles();
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<?php
		while ( have_posts() ) :
			the_post();

			$kkd_content     = apply_filters( 'the_content', get_the_content() );
			$kkd_has_form    = (bool) preg_match( '/<form[\s>]/i', $kkd_content );
			?>
			<article <?php post_class( 'kkd-contact' ); ?>>

				<header class="kkd-page-head kkd-page-head--tight">
					<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'Get in touch', 'keepkeep-decorated' ); ?></p>
					<h1 class="kkd-page-head__title"><?php the_title(); ?></h1>
				</header>

				<div class="kkd-contact__grid">

					<div class="kkd-contact__main kkd-prose">
						<?php
						echo $kkd_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already filtered through the_content.
						?>

						<?php if ( ! $kkd_has_form ) : ?>
							<div class="kkd-panel kkd-panel--note">
								<h2><?php esc_html_e( 'How to reach us', 'keepkeep-decorated' ); ?></h2>
								<?php if ( $kkd_email && is_email( $kkd_email ) ) : ?>
									<p>
										<?php esc_html_e( 'Email is the quickest way to get a reply:', 'keepkeep-decorated' ); ?>
										<a href="<?php echo esc_url( 'mailto:' . $kkd_email ); ?>"><?php echo esc_html( $kkd_email ); ?></a>
									</p>
								<?php else : ?>
									<p>
										<?php esc_html_e( 'No contact method has been published yet. Site owner: add a contact email under Appearance → Customize → Contact & Social, or install a form plugin and paste its shortcode into this page.', 'keepkeep-decorated' ); ?>
									</p>
								<?php endif; ?>
							</div>
						<?php endif; ?>
					</div>

					<aside class="kkd-contact__aside" aria-label="<?php esc_attr_e( 'Contact details', 'keepkeep-decorated' ); ?>">

						<?php if ( $kkd_email && is_email( $kkd_email ) ) : ?>
							<div class="kkd-panel">
								<h2 class="kkd-panel__title"><?php esc_html_e( 'Email', 'keepkeep-decorated' ); ?></h2>
								<p><a href="<?php echo esc_url( 'mailto:' . $kkd_email ); ?>"><?php echo esc_html( $kkd_email ); ?></a></p>
								<p class="kkd-panel__note"><?php esc_html_e( 'We aim to reply to reader questions and corrections first.', 'keepkeep-decorated' ); ?></p>
							</div>
						<?php endif; ?>

						<?php if ( $kkd_profiles ) : ?>
							<div class="kkd-panel">
								<h2 class="kkd-panel__title"><?php esc_html_e( 'Elsewhere', 'keepkeep-decorated' ); ?></h2>
								<ul class="kkd-panel__list">
									<?php foreach ( $kkd_profiles as $kkd_profile ) : ?>
										<li>
											<a href="<?php echo esc_url( $kkd_profile['url'] ); ?>" rel="noopener me" target="_blank">
												<?php echo esc_html( $kkd_profile['label'] ); ?>
												<span class="screen-reader-text"><?php esc_html_e( '(opens in a new tab)', 'keepkeep-decorated' ); ?></span>
											</a>
										</li>
									<?php endforeach; ?>
								</ul>
							</div>
						<?php endif; ?>

						<div class="kkd-panel">
							<h2 class="kkd-panel__title"><?php esc_html_e( 'Before you write', 'keepkeep-decorated' ); ?></h2>
							<ul class="kkd-panel__list">
								<?php
								$kkd_editorial = kkd_page_url( 'editorial-policy' );
								$kkd_about     = kkd_page_url( 'about' );
								if ( $kkd_about ) :
									?>
									<li><a href="<?php echo esc_url( $kkd_about ); ?>"><?php esc_html_e( 'What we publish and why', 'keepkeep-decorated' ); ?></a></li>
								<?php endif; ?>
								<?php if ( $kkd_editorial ) : ?>
									<li><a href="<?php echo esc_url( $kkd_editorial ); ?>"><?php esc_html_e( 'How we handle corrections', 'keepkeep-decorated' ); ?></a></li>
								<?php endif; ?>
								<li><a href="<?php echo esc_url( kkd_blog_url() ); ?>"><?php esc_html_e( 'Search the archive first', 'keepkeep-decorated' ); ?></a></li>
							</ul>
						</div>
					</aside>
				</div>
			</article>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();
