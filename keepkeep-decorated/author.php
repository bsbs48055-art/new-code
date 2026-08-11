<?php
/**
 * Author archive.
 *
 * The profile block shows only what the author has actually filled in on their
 * WordPress profile.
 *
 * @package KeepKeep_Decorated
 */

get_header();

$kkd_author_id = (int) get_queried_object_id();
$kkd_name      = get_the_author_meta( 'display_name', $kkd_author_id );
$kkd_bio       = trim( (string) get_the_author_meta( 'description', $kkd_author_id ) );
$kkd_role      = trim( (string) get_the_author_meta( 'kkd_role', $kkd_author_id ) );
$kkd_count     = (int) count_user_posts( $kkd_author_id, 'post', true );
?>

<main id="kkd-main" class="kkd-main">
	<div class="kkd-container">

		<?php kkd_breadcrumbs(); ?>

		<header class="kkd-page-head kkd-author-head">
			<div class="kkd-author-head__avatar">
				<?php
				echo get_avatar( $kkd_author_id, 96, '', $kkd_name, array( 'class' => 'kkd-avatar kkd-avatar--lg' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_avatar() returns escaped markup.
				?>
			</div>
			<div class="kkd-author-head__body">
				<p class="kkd-page-head__eyebrow"><?php esc_html_e( 'Author', 'keepkeep-decorated' ); ?></p>
				<h1 class="kkd-page-head__title"><?php echo esc_html( $kkd_name ); ?></h1>

				<?php if ( $kkd_role ) : ?>
					<p class="kkd-author-head__role"><?php echo esc_html( $kkd_role ); ?></p>
				<?php endif; ?>

				<?php if ( $kkd_bio ) : ?>
					<p class="kkd-page-head__intro"><?php echo esc_html( $kkd_bio ); ?></p>
				<?php endif; ?>

				<p class="kkd-page-head__count">
					<?php
					printf(
						/* translators: %s: number of articles. */
						esc_html( _n( '%s published article', '%s published articles', $kkd_count, 'keepkeep-decorated' ) ),
						esc_html( number_format_i18n( $kkd_count ) )
					);
					?>
				</p>
			</div>
		</header>

		<div class="kkd-layout">
			<div class="kkd-layout__content">
				<?php if ( have_posts() ) : ?>
					<div class="kkd-grid kkd-grid--2">
						<?php
						while ( have_posts() ) :
							the_post();
							kkd_card( array( 'heading' => 'h2' ) );
						endwhile;
						?>
					</div>
					<?php kkd_pagination(); ?>
				<?php else : ?>
					<?php get_template_part( 'template-parts/content-none' ); ?>
				<?php endif; ?>
			</div>

			<?php get_sidebar(); ?>
		</div>
	</div>
</main>

<?php
get_footer();
