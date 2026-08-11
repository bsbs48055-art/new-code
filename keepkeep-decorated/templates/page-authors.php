<?php
/**
 * Template Name: Authors
 * Template Post Type: page
 *
 * Lists everyone who has published an article, using only what each person has
 * written on their own WordPress profile.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_authors = get_users(
	array(
		'has_published_posts' => array( 'post' ),
		'orderby'             => 'display_name',
		'order'               => 'ASC',
		'number'              => 50,
	)
);
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<header class="kkd-page-head">
				<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'The team', 'keepkeep-decorated' ); ?></p>
				<h1 class="kkd-page-head__title"><?php the_title(); ?></h1>
				<div class="kkd-page-head__intro kkd-prose"><?php the_content(); ?></div>
			</header>
			<?php
		endwhile;
		?>

		<?php if ( $kkd_authors ) : ?>
			<div class="kkd-authors">
				<?php foreach ( $kkd_authors as $kkd_user ) : ?>
					<?php
					$kkd_role  = trim( (string) get_user_meta( $kkd_user->ID, 'kkd_role', true ) );
					$kkd_bio   = trim( (string) $kkd_user->description );
					$kkd_count = (int) count_user_posts( $kkd_user->ID, 'post', true );
					?>
					<article class="kkd-authors__item">
						<?php
						echo get_avatar(
							$kkd_user->ID,
							80,
							'',
							$kkd_user->display_name,
							array(
								'class'   => 'kkd-avatar kkd-avatar--lg',
								'loading' => 'lazy',
							)
						); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_avatar() returns escaped markup.
						?>
						<div>
							<h2 class="kkd-authors__name">
								<a href="<?php echo esc_url( get_author_posts_url( $kkd_user->ID ) ); ?>" rel="author">
									<?php echo esc_html( $kkd_user->display_name ); ?>
								</a>
							</h2>
							<?php if ( $kkd_role ) : ?>
								<p class="kkd-authors__role"><?php echo esc_html( $kkd_role ); ?></p>
							<?php endif; ?>
							<?php if ( $kkd_bio ) : ?>
								<p class="kkd-authors__bio"><?php echo esc_html( wp_trim_words( $kkd_bio, 40, '…' ) ); ?></p>
							<?php endif; ?>
							<p class="kkd-authors__count">
								<?php
								printf(
									/* translators: %s: number of articles. */
									esc_html( _n( '%s article', '%s articles', $kkd_count, 'keepkeep-decorated' ) ),
									esc_html( number_format_i18n( $kkd_count ) )
								);
								?>
							</p>
						</div>
					</article>
				<?php endforeach; ?>
			</div>
		<?php else : ?>
			<p class="kkd-empty__lead"><?php esc_html_e( 'No articles have been published yet.', 'keepkeep-decorated' ); ?></p>
		<?php endif; ?>
	</div>
</main>

<?php
get_footer();
