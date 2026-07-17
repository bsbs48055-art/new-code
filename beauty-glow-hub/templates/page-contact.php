<?php
/**
 * Template Name: Contact Page
 *
 * Renders page content, an accessible contact form and contact details.
 * The form posts to admin-post.php and is handled by bgh_handle_contact().
 *
 * @package Beauty_Glow_Hub
 */

get_header();
?>

<main id="primary" class="bgh-site-main" role="main">
	<div class="bgh-container">

		<?php bgh_breadcrumbs(); ?>

		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<header class="bgh-page-hero">
				<h1 class="bgh-mb-0"><?php the_title(); ?></h1>
				<?php if ( has_excerpt() ) : ?>
					<p class="bgh-lead"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>
			</header>

			<div class="bgh-layout">
				<div class="bgh-content-area">
					<div class="bgh-entry-content bgh-prose bgh-mt-0"><?php the_content(); ?></div>

					<?php
					$bgh_status = isset( $_GET['contact'] ) ? sanitize_key( wp_unslash( $_GET['contact'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
					if ( 'sent' === $bgh_status ) {
						echo '<div class="bgh-callout" role="status"><strong>' . esc_html__( 'Thank you!', 'beauty-glow-hub' ) . '</strong> ' . esc_html__( 'Your message has been sent. We usually reply within two business days.', 'beauty-glow-hub' ) . '</div>';
					} elseif ( 'error' === $bgh_status ) {
						echo '<div class="bgh-callout" role="alert" style="border-color:#e57373;"><strong>' . esc_html__( 'Oops.', 'beauty-glow-hub' ) . '</strong> ' . esc_html__( 'Please complete all required fields with a valid email address.', 'beauty-glow-hub' ) . '</div>';
					}
					?>

					<form class="bgh-form-page bgh-prose" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
						<input type="hidden" name="action" value="bgh_contact">
						<?php wp_nonce_field( 'bgh_contact', 'bgh_contact_nonce' ); ?>
						<div class="bgh-field">
							<label for="bgh-name"><?php esc_html_e( 'Your Name *', 'beauty-glow-hub' ); ?></label>
							<input type="text" id="bgh-name" name="bgh_name" required>
						</div>
						<div class="bgh-field">
							<label for="bgh-email"><?php esc_html_e( 'Your Email *', 'beauty-glow-hub' ); ?></label>
							<input type="email" id="bgh-email" name="bgh_email" required>
						</div>
						<div class="bgh-field">
							<label for="bgh-subject"><?php esc_html_e( 'Subject', 'beauty-glow-hub' ); ?></label>
							<input type="text" id="bgh-subject" name="bgh_subject">
						</div>
						<div class="bgh-field">
							<label for="bgh-message"><?php esc_html_e( 'Message *', 'beauty-glow-hub' ); ?></label>
							<textarea id="bgh-message" name="bgh_message" rows="6" required></textarea>
						</div>
						<!-- Honeypot spam trap (hidden from humans) -->
						<div class="bgh-field" style="position:absolute;left:-9999px;" aria-hidden="true">
							<label for="bgh-website"><?php esc_html_e( 'Leave this field empty', 'beauty-glow-hub' ); ?></label>
							<input type="text" id="bgh-website" name="bgh_website" tabindex="-1" autocomplete="off">
						</div>
						<button type="submit" class="bgh-btn"><?php esc_html_e( 'Send Message', 'beauty-glow-hub' ); ?></button>
					</form>
				</div>

				<aside class="bgh-sidebar">
					<section class="bgh-widget">
						<h2 class="bgh-widget__title"><?php esc_html_e( 'Get in Touch', 'beauty-glow-hub' ); ?></h2>
						<p><strong><?php esc_html_e( 'Email:', 'beauty-glow-hub' ); ?></strong><br><a href="mailto:<?php echo esc_attr( get_option( 'admin_email' ) ); ?>"><?php echo esc_html( get_option( 'admin_email' ) ); ?></a></p>
						<p><strong><?php esc_html_e( 'Editorial enquiries:', 'beauty-glow-hub' ); ?></strong><br><?php esc_html_e( 'Use the form and select &ldquo;Editorial&rdquo; as your subject.', 'beauty-glow-hub' ); ?></p>
						<p><strong><?php esc_html_e( 'Response time:', 'beauty-glow-hub' ); ?></strong><br><?php esc_html_e( 'Within 2 business days.', 'beauty-glow-hub' ); ?></p>
					</section>
				</aside>
			</div>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();
