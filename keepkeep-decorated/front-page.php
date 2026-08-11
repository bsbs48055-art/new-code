<?php
/**
 * The homepage.
 *
 * Every section below is filled from live WordPress queries — the theme contains
 * no hard-coded article titles, images or excerpts. Sections whose category has
 * no published posts remove themselves, so the page is always as full as the
 * site genuinely is.
 *
 * Heading structure: one H1 (the site's editorial promise), then one H2 per
 * section.
 *
 * @package KeepKeep_Decorated
 */

get_header();
?>

<main id="kkd-main" class="kkd-main kkd-home">

	<section class="kkd-intro">
		<div class="kkd-container">
			<h1 class="kkd-intro__title">
				<?php
				$kkd_intro = get_bloginfo( 'description', 'display' );
				echo esc_html( $kkd_intro ? $kkd_intro : __( 'Home decor ideas, room by room', 'keepkeep-decorated' ) );
				?>
			</h1>
			<?php
			$kkd_intro_text = get_theme_mod( 'kkd_home_description', '' );
			if ( $kkd_intro_text ) :
				?>
				<p class="kkd-intro__text"><?php echo esc_html( $kkd_intro_text ); ?></p>
			<?php endif; ?>
		</div>
	</section>

	<?php
	get_template_part( 'template-parts/hero' );

	// Category sections, in Customizer order, each remappable to any category.
	foreach ( kkd_home_sections() as $kkd_key => $kkd_section ) {
		$kkd_slug = get_theme_mod( 'kkd_section_' . $kkd_key, $kkd_section['slug'] );
		if ( '' === $kkd_slug ) {
			continue;
		}

		get_template_part(
			'template-parts/section-posts',
			null,
			array(
				'title'  => $kkd_section['title'],
				'intro'  => $kkd_section['intro'],
				'slug'   => $kkd_slug,
				'layout' => $kkd_section['layout'],
				'count'  => $kkd_section['count'],
				'tint'   => $kkd_section['tint'],
			)
		);
	}

	/* ----------------------------------------------- Popular articles */
	$kkd_popular_args = kkd_section_query_args( array( 'posts_per_page' => 5 ) );

	switch ( get_theme_mod( 'kkd_popular_source', 'comments' ) ) {
		case 'sticky':
			$kkd_sticky = get_option( 'sticky_posts' );
			if ( empty( $kkd_sticky ) ) {
				$kkd_popular_args = array();
				break;
			}
			$kkd_popular_args['post__in'] = $kkd_sticky;
			break;

		case 'recent':
			break;

		case 'comments':
		default:
			$kkd_popular_args['orderby'] = 'comment_count';
			$kkd_popular_args['order']   = 'DESC';
			break;
	}

	$kkd_popular = $kkd_popular_args ? new WP_Query( $kkd_popular_args ) : null;

	if ( $kkd_popular && $kkd_popular->have_posts() ) :
		?>
		<section class="kkd-section" aria-labelledby="kkd-popular-heading">
			<div class="kkd-container">
				<div class="kkd-section__head">
					<div class="kkd-section__headings">
						<h2 class="kkd-section__title" id="kkd-popular-heading"><?php esc_html_e( 'Popular articles', 'keepkeep-decorated' ); ?></h2>
						<p class="kkd-section__intro"><?php esc_html_e( 'The guides readers keep coming back to.', 'keepkeep-decorated' ); ?></p>
					</div>
					<a class="kkd-section__link" href="<?php echo esc_url( kkd_blog_url() ); ?>">
						<?php esc_html_e( 'Browse all articles', 'keepkeep-decorated' ); ?><span aria-hidden="true"> &rarr;</span>
					</a>
				</div>

				<div class="kkd-listgrid kkd-listgrid--ranked">
					<?php
					$kkd_rank = 1;
					while ( $kkd_popular->have_posts() ) :
						$kkd_popular->the_post();
						kkd_list_card( array( 'number' => $kkd_rank ) );
						$kkd_rank++;
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
		<?php
	endif;

	get_template_part( 'template-parts/newsletter' );
	get_template_part( 'template-parts/about-band' );
	?>
</main>

<?php
get_footer();
