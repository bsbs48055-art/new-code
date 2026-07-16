<?php
/**
 * Template Name: Authors Page
 *
 * Lists all contributing authors with avatars, bios and post counts.
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

			<?php if ( trim( get_the_content() ) ) : ?>
				<div class="bgh-entry-content bgh-prose bgh-mt-0"><?php the_content(); ?></div>
			<?php endif; ?>
			<?php
		endwhile;

		$bgh_authors = get_users(
			array(
				'who'                 => 'authors',
				'has_published_posts' => array( 'post' ),
				'orderby'             => 'post_count',
				'order'               => 'DESC',
			)
		);

		if ( ! empty( $bgh_authors ) ) :
			?>
			<div class="bgh-grid bgh-grid--2" style="margin-top:2rem;">
				<?php foreach ( $bgh_authors as $bgh_author ) : ?>
					<div class="bgh-authorbox" style="margin:0;max-width:none;">
						<?php echo get_avatar( $bgh_author->ID, 88, '', $bgh_author->display_name, array( 'class' => 'bgh-avatar' ) ); // phpcs:ignore ?>
						<div>
							<h2 class="bgh-authorbox__name"><a href="<?php echo esc_url( get_author_posts_url( $bgh_author->ID ) ); ?>"><?php echo esc_html( $bgh_author->display_name ); ?></a></h2>
							<span class="bgh-authorbox__role"><?php echo esc_html( sprintf( _n( '%d article', '%d articles', count_user_posts( $bgh_author->ID, 'post' ), 'beauty-glow-hub' ), count_user_posts( $bgh_author->ID, 'post' ) ) ); ?></span>
							<?php if ( $bgh_author->description ) : ?>
								<p class="bgh-authorbox__bio"><?php echo esc_html( wp_trim_words( $bgh_author->description, 28 ) ); ?></p>
							<?php endif; ?>
							<a class="bgh-btn bgh-btn--ghost" href="<?php echo esc_url( get_author_posts_url( $bgh_author->ID ) ); ?>"><?php esc_html_e( 'View profile', 'beauty-glow-hub' ); ?></a>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</main>

<?php
get_footer();
