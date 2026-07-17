<?php
/**
 * Template Name: Full Width (Legal / Content)
 *
 * Full-width, distraction-free layout ideal for legal and policy pages.
 * Automatically builds a jump-link index from the page's H2 headings.
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
			<article <?php post_class( 'bgh-page' ); ?>>
				<header class="bgh-page-hero">
					<h1 class="bgh-mb-0"><?php the_title(); ?></h1>
					<p class="bgh-updated"><?php echo esc_html__( 'Last updated:', 'beauty-glow-hub' ) . ' ' . esc_html( get_the_modified_date() ); ?></p>
					<?php if ( has_excerpt() ) : ?>
						<p class="bgh-lead"><?php echo esc_html( get_the_excerpt() ); ?></p>
					<?php endif; ?>
				</header>

				<div class="bgh-prose">
					<?php
					// Build a lightweight index from H2s for long legal docs.
					$bgh_raw    = get_the_content();
					$bgh_parsed = bgh_toc_process( apply_filters( 'the_content', $bgh_raw ) );

					$bgh_h2 = array_filter(
						$bgh_parsed['headings'],
						function ( $h ) {
							return 2 === $h['level'];
						}
					);

					if ( count( $bgh_h2 ) >= 3 ) :
						?>
						<nav class="bgh-legal-toc" aria-label="<?php esc_attr_e( 'On this page', 'beauty-glow-hub' ); ?>">
							<strong><?php esc_html_e( 'On this page', 'beauty-glow-hub' ); ?></strong>
							<ul>
								<?php foreach ( $bgh_h2 as $bgh_head ) : ?>
									<li><a href="#<?php echo esc_attr( $bgh_head['id'] ); ?>"><?php echo esc_html( $bgh_head['text'] ); ?></a></li>
								<?php endforeach; ?>
							</ul>
						</nav>
						<?php
					endif;
					?>

					<div class="bgh-entry-content">
						<?php echo $bgh_parsed['content']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</div>
				</div>
			</article>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();
