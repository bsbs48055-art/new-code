<?php
/**
 * The homepage template (magazine layout).
 *
 * Sections: Hero, Featured, Popular Categories, Latest, Editor's Picks,
 * Trending, Newsletter, Author, Testimonials, FAQ.
 *
 * @package Beauty_Glow_Hub
 */

get_header();

/**
 * Simple category icon set (inline SVG paths) keyed by common slugs.
 *
 * @param string $slug Category slug.
 * @return string SVG markup.
 */
function bgh_home_category_icon( $slug ) {
	$icons = array(
		'skin-care'       => '<circle cx="12" cy="12" r="9"/><path d="M9 10a3 3 0 0 1 6 0"/><path d="M8 15c1.5 1 6.5 1 8 0"/>',
		'hair-care'       => '<path d="M4 20c2-8 5-13 8-16 3 3 6 8 8 16"/><path d="M8 20c1-4 2-7 4-9"/>',
		'makeup'          => '<path d="M4 7l6-3 3 5-6 3z"/><path d="M13 9l5 8a2 2 0 0 1-3 2l-5-8"/>',
		'nail-care'       => '<rect x="8" y="3" width="8" height="18" rx="4"/><path d="M8 8h8"/>',
		'beauty-tips'     => '<path d="M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/><path d="M9 20h6"/>',
		'anti-aging'      => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'natural-remedies'=> '<path d="M12 21c-4-2-8-6-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-4 9-8 11z"/>',
		'product-reviews' => '<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
		'beauty-trends'   => '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
		'lifestyle'       => '<path d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
	);
	$path = isset( $icons[ $slug ] ) ? $icons[ $slug ] : '<path d="M12 21s-7-4.35-9-8.5C1.5 8 4 4.5 7.5 5 9.5 5.3 11 7 12 8.5 13 7 14.5 5.3 16.5 5 20 4.5 22.5 8 21 12.5 19 16.65 12 21 12 21Z"/>';
	return '<svg viewBox="0 0 24 24" aria-hidden="true">' . $path . '</svg>';
}
?>

<main id="primary" class="bgh-site-main bgh-home" role="main">

	<?php
	/* ============================= HERO ============================= */
	$bgh_hero = new WP_Query(
		array(
			'posts_per_page'      => 3,
			'ignore_sticky_posts' => false,
			'no_found_rows'       => true,
		)
	);
	if ( $bgh_hero->have_posts() ) :
		?>
		<section class="bgh-hero" aria-label="<?php esc_attr_e( 'Featured stories', 'beauty-glow-hub' ); ?>">
			<div class="bgh-container">
				<div class="bgh-hero__grid">
					<?php
					$bgh_i = 0;
					$bgh_side_open = false;
					while ( $bgh_hero->have_posts() ) :
						$bgh_hero->the_post();
						if ( 0 === $bgh_i ) :
							?>
							<div class="bgh-hero__main">
								<a class="bgh-feature-card" href="<?php the_permalink(); ?>">
									<?php bgh_post_thumbnail( 'bgh-hero' ); ?>
									<span class="bgh-feature-card__overlay">
										<?php bgh_entry_categories(); ?>
										<h2 class="bgh-feature-card__title"><?php the_title(); ?></h2>
										<span class="bgh-feature-card__meta"><?php echo esc_html( get_the_date() ); ?> &middot; <?php echo esc_html( bgh_get_reading_time() ); ?></span>
									</span>
								</a>
							</div>
							<div class="bgh-hero__side">
							<?php
							$bgh_side_open = true;
						else :
							?>
							<article>
								<a class="bgh-feature-card" href="<?php the_permalink(); ?>">
									<?php bgh_post_thumbnail( 'bgh-card' ); ?>
									<span class="bgh-feature-card__overlay">
										<?php bgh_entry_categories( 'bgh-chip--light' ); ?>
										<h3 class="bgh-feature-card__title"><?php the_title(); ?></h3>
									</span>
								</a>
							</article>
							<?php
						endif;
						$bgh_i++;
					endwhile;
					if ( $bgh_side_open ) {
						echo '</div>';
					}
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ======================= FEATURED ARTICLES ======================= */
	$bgh_featured = new WP_Query(
		array(
			'posts_per_page'      => 3,
			'offset'              => 3,
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	if ( $bgh_featured->have_posts() ) :
		?>
		<section class="bgh-section">
			<div class="bgh-container">
				<div class="bgh-section-head">
					<h2 class="bgh-section-title"><?php esc_html_e( 'Featured Articles', 'beauty-glow-hub' ); ?></h2>
					<a class="bgh-section-link" href="<?php echo esc_url( get_permalink( get_option( 'page_for_posts' ) ) ? get_permalink( get_option( 'page_for_posts' ) ) : home_url( '/' ) ); ?>"><?php esc_html_e( 'View all', 'beauty-glow-hub' ); ?></a>
				</div>
				<div class="bgh-grid bgh-grid--3">
					<?php
					while ( $bgh_featured->have_posts() ) :
						$bgh_featured->the_post();
						bgh_card();
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ====================== POPULAR CATEGORIES ====================== */
	$bgh_cats = get_categories(
		array(
			'orderby'    => 'count',
			'order'      => 'DESC',
			'number'     => 10,
			'hide_empty' => true,
		)
	);
	if ( ! empty( $bgh_cats ) ) :
		?>
		<section class="bgh-section bgh-section--tint">
			<div class="bgh-container">
				<div class="bgh-section-head">
					<h2 class="bgh-section-title bgh-section-title--center"><?php esc_html_e( 'Explore Popular Categories', 'beauty-glow-hub' ); ?></h2>
				</div>
				<div class="bgh-cats">
					<?php foreach ( $bgh_cats as $bgh_cat ) : ?>
						<a class="bgh-cat-tile" href="<?php echo esc_url( get_category_link( $bgh_cat->term_id ) ); ?>">
							<span class="bgh-cat-tile__icon"><?php echo bgh_home_category_icon( $bgh_cat->slug ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
							<span><?php echo esc_html( $bgh_cat->name ); ?></span>
							<span class="bgh-cat-tile__count"><?php echo esc_html( bgh_category_count( $bgh_cat ) ); ?></span>
						</a>
					<?php endforeach; ?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ===================== LATEST + SIDEBAR + ADS ==================== */
	$bgh_latest = new WP_Query(
		array(
			'posts_per_page'      => 6,
			'offset'              => 6,
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	if ( $bgh_latest->have_posts() ) :
		?>
		<section class="bgh-section">
			<div class="bgh-container">
				<div class="bgh-layout">
					<div class="bgh-content-area">
						<div class="bgh-section-head">
							<h2 class="bgh-section-title"><?php esc_html_e( 'Latest Posts', 'beauty-glow-hub' ); ?></h2>
						</div>
						<div class="bgh-grid bgh-grid--2">
							<?php
							while ( $bgh_latest->have_posts() ) :
								$bgh_latest->the_post();
								bgh_card();
							endwhile;
							wp_reset_postdata();
							?>
						</div>
					</div>
					<?php get_sidebar(); ?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ======================== EDITOR'S PICKS ======================== */
	$bgh_picks = new WP_Query(
		array(
			'posts_per_page'      => 4,
			'orderby'             => 'rand',
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	if ( $bgh_picks->have_posts() ) :
		?>
		<section class="bgh-section bgh-section--tint">
			<div class="bgh-container">
				<div class="bgh-section-head">
					<h2 class="bgh-section-title"><?php esc_html_e( 'Editor&rsquo;s Picks', 'beauty-glow-hub' ); ?></h2>
				</div>
				<div class="bgh-picks">
					<?php
					while ( $bgh_picks->have_posts() ) :
						$bgh_picks->the_post();
						?>
						<article class="bgh-pick">
							<a class="bgh-pick__thumb" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php bgh_post_thumbnail( 'bgh-card' ); ?></a>
							<div class="bgh-pick__body">
								<?php bgh_entry_categories( 'bgh-chip--accent' ); ?>
								<h3 class="bgh-pick__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
								<span class="bgh-list__meta"><?php echo esc_html( get_the_date() ); ?> &middot; <?php echo esc_html( bgh_get_reading_time() ); ?></span>
							</div>
						</article>
						<?php
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ========================= TRENDING ============================= */
	$bgh_trending = new WP_Query(
		array(
			'posts_per_page'      => 4,
			'orderby'             => 'comment_count',
			'order'               => 'DESC',
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	if ( $bgh_trending->have_posts() ) :
		?>
		<section class="bgh-section">
			<div class="bgh-container">
				<div class="bgh-section-head">
					<h2 class="bgh-section-title"><?php esc_html_e( 'Trending Articles', 'beauty-glow-hub' ); ?></h2>
				</div>
				<div class="bgh-grid bgh-grid--4">
					<?php
					while ( $bgh_trending->have_posts() ) :
						$bgh_trending->the_post();
						bgh_card();
					endwhile;
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ========================= NEWSLETTER =========================== */
	?>
	<section class="bgh-section">
		<div class="bgh-container">
			<div class="bgh-newsletter">
				<h2><?php esc_html_e( 'Get Glowing With Our Weekly Newsletter', 'beauty-glow-hub' ); ?></h2>
				<p><?php esc_html_e( 'Join 25,000+ beauty lovers. Receive expert skincare routines, honest product reviews and seasonal beauty tips — no spam, ever.', 'beauty-glow-hub' ); ?></p>
				<?php bgh_newsletter_form( 'home' ); ?>
				<p class="bgh-newsletter__note"><?php esc_html_e( 'We respect your privacy. Unsubscribe at any time.', 'beauty-glow-hub' ); ?></p>
			</div>
		</div>
	</section>

	<?php
	/* ========================= AUTHOR SECTION ======================= */
	$bgh_authors = get_users(
		array(
			'who'                 => 'authors',
			'has_published_posts' => array( 'post' ),
			'number'              => 1,
			'orderby'             => 'post_count',
			'order'               => 'DESC',
		)
	);
	if ( ! empty( $bgh_authors ) ) :
		$bgh_author = $bgh_authors[0];
		?>
		<section class="bgh-section bgh-section--tint">
			<div class="bgh-container">
				<div class="bgh-section-head">
					<h2 class="bgh-section-title"><?php esc_html_e( 'Meet Our Editor', 'beauty-glow-hub' ); ?></h2>
					<a class="bgh-section-link" href="<?php echo esc_url( home_url( '/authors/' ) ); ?>"><?php esc_html_e( 'All authors', 'beauty-glow-hub' ); ?></a>
				</div>
				<div class="bgh-author-band">
					<?php echo get_avatar( $bgh_author->ID, 110, '', $bgh_author->display_name, array( 'class' => 'bgh-avatar bgh-avatar--lg' ) ); // phpcs:ignore ?>
					<div>
						<h3 class="bgh-author-band__name"><?php echo esc_html( $bgh_author->display_name ); ?></h3>
						<span class="bgh-author-band__role"><?php esc_html_e( 'Editor-in-Chief', 'beauty-glow-hub' ); ?></span>
						<p><?php echo esc_html( $bgh_author->description ? $bgh_author->description : __( 'Passionate about evidence-based beauty, our editor curates and fact-checks every guide so you can make confident choices for your skin, hair and wellbeing.', 'beauty-glow-hub' ) ); ?></p>
						<a class="bgh-btn bgh-btn--ghost" href="<?php echo esc_url( get_author_posts_url( $bgh_author->ID ) ); ?>"><?php esc_html_e( 'Read articles by', 'beauty-glow-hub' ); ?> <?php echo esc_html( $bgh_author->display_name ); ?></a>
					</div>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	/* ========================= TESTIMONIALS ======================== */
	$bgh_testimonials = array(
		array(
			'text'   => __( 'Beauty Glow Hub completely changed my skincare routine. The guides are easy to follow and actually backed by research, not hype.', 'beauty-glow-hub' ),
			'name'   => __( 'Amara Bennett', 'beauty-glow-hub' ),
			'role'   => __( 'Reader, London', 'beauty-glow-hub' ),
		),
		array(
			'text'   => __( 'I love that every product review feels honest. It is my go-to before buying anything for my hair.', 'beauty-glow-hub' ),
			'name'   => __( 'Priya Sharma', 'beauty-glow-hub' ),
			'role'   => __( 'Reader, Mumbai', 'beauty-glow-hub' ),
		),
		array(
			'text'   => __( 'Finally a beauty blog that explains the science simply. The anti-aging tips are gold.', 'beauty-glow-hub' ),
			'name'   => __( 'Sofia Rossi', 'beauty-glow-hub' ),
			'role'   => __( 'Reader, Milan', 'beauty-glow-hub' ),
		),
	);
	?>
	<section class="bgh-section">
		<div class="bgh-container">
			<div class="bgh-section-head">
				<h2 class="bgh-section-title bgh-section-title--center"><?php esc_html_e( 'What Our Readers Say', 'beauty-glow-hub' ); ?></h2>
			</div>
			<div class="bgh-quotes">
				<?php foreach ( $bgh_testimonials as $bgh_t ) : ?>
					<figure class="bgh-quote">
						<div class="bgh-quote__stars" aria-label="<?php esc_attr_e( '5 out of 5 stars', 'beauty-glow-hub' ); ?>">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
						<blockquote class="bgh-quote__text" style="border:0;background:none;padding:0;margin:0;">&ldquo;<?php echo esc_html( $bgh_t['text'] ); ?>&rdquo;</blockquote>
						<figcaption class="bgh-quote__author">
							<span aria-hidden="true" style="width:44px;height:44px;border-radius:50%;background:var(--bgh-secondary);display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:var(--bgh-primary-dark);"><?php echo esc_html( mb_substr( $bgh_t['name'], 0, 1 ) ); ?></span>
							<span><strong><?php echo esc_html( $bgh_t['name'] ); ?></strong><span><?php echo esc_html( $bgh_t['role'] ); ?></span></span>
						</figcaption>
					</figure>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<?php
	/* ============================= FAQ ============================= */
	$bgh_faqs = array(
		array(
			'q' => __( 'Is the advice on Beauty Glow Hub medically reviewed?', 'beauty-glow-hub' ),
			'a' => __( 'Our content is written by experienced beauty writers and fact-checked against reputable dermatological and scientific sources. However, our articles are for informational purposes only and are not a substitute for professional medical advice.', 'beauty-glow-hub' ),
		),
		array(
			'q' => __( 'How do you choose which products to review?', 'beauty-glow-hub' ),
			'a' => __( 'We select products based on reader interest, ingredient quality and real-world testing. We clearly disclose any affiliate relationships and never let them influence our honest opinions.', 'beauty-glow-hub' ),
		),
		array(
			'q' => __( 'Can I contribute an article?', 'beauty-glow-hub' ),
			'a' => __( 'Yes! We welcome qualified beauty and wellness writers. Visit our Write For Us page to read the guidelines and submit your pitch.', 'beauty-glow-hub' ),
		),
		array(
			'q' => __( 'How often do you publish new content?', 'beauty-glow-hub' ),
			'a' => __( 'We publish new, original beauty and skincare guides every week, and regularly update older articles to keep information accurate and current.', 'beauty-glow-hub' ),
		),
	);
	?>
	<section class="bgh-section bgh-section--tint">
		<div class="bgh-container">
			<div class="bgh-section-head">
				<h2 class="bgh-section-title bgh-section-title--center"><?php esc_html_e( 'Frequently Asked Questions', 'beauty-glow-hub' ); ?></h2>
			</div>
			<div class="bgh-faq">
				<?php foreach ( $bgh_faqs as $bgh_index => $bgh_faq ) : ?>
					<div class="bgh-faq__item<?php echo 0 === $bgh_index ? ' is-open' : ''; ?>">
						<button class="bgh-faq__q" type="button" aria-expanded="<?php echo 0 === $bgh_index ? 'true' : 'false'; ?>"><?php echo esc_html( $bgh_faq['q'] ); ?></button>
						<div class="bgh-faq__a"><p><?php echo esc_html( $bgh_faq['a'] ); ?></p></div>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<?php
	// Output FAQ schema for the homepage questions.
	if ( function_exists( 'bgh_output_faq_schema' ) ) {
		bgh_output_faq_schema( $bgh_faqs );
	}
	?>

</main>

<?php
get_footer();
