<?php
/**
 * Template Name: FAQ Page
 *
 * Renders the page content, then a styled FAQ accordion parsed from the
 * page body: each H3 becomes a question and the following markup its answer.
 * Also outputs FAQPage schema.
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

			<div class="bgh-prose">
				<div class="bgh-entry-content bgh-mt-0"><?php the_content(); ?></div>

				<?php
				// Parse H3 question / answer pairs from the raw content.
				$bgh_html = apply_filters( 'the_content', get_the_content() );
				$bgh_faqs = array();
				if ( preg_match_all( '/<h3[^>]*>(.*?)<\/h3>(.*?)(?=<h3|$)/is', $bgh_html, $bgh_m, PREG_SET_ORDER ) ) {
					foreach ( $bgh_m as $bgh_pair ) {
						$bgh_faqs[] = array(
							'q' => wp_strip_all_tags( $bgh_pair[1] ),
							'a' => trim( wp_strip_all_tags( $bgh_pair[2] ) ),
						);
					}
				}

				if ( ! empty( $bgh_faqs ) ) :
					?>
					<div class="bgh-faq">
						<?php foreach ( $bgh_faqs as $bgh_i => $bgh_faq ) : ?>
							<div class="bgh-faq__item<?php echo 0 === $bgh_i ? ' is-open' : ''; ?>">
								<button class="bgh-faq__q" type="button" aria-expanded="<?php echo 0 === $bgh_i ? 'true' : 'false'; ?>"><?php echo esc_html( $bgh_faq['q'] ); ?></button>
								<div class="bgh-faq__a"><p><?php echo esc_html( $bgh_faq['a'] ); ?></p></div>
							</div>
						<?php endforeach; ?>
					</div>
					<?php
					if ( function_exists( 'bgh_output_faq_schema' ) ) {
						bgh_output_faq_schema( $bgh_faqs );
					}
				endif;
				?>
			</div>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();
