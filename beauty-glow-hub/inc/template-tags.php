<?php
/**
 * Custom template tags for Beauty Glow Hub.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'bgh_posted_on' ) ) {
	/**
	 * Print the published / updated date with machine-readable time tags.
	 */
	function bgh_posted_on() {
		$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time>';
		if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
			$time_string .= '<time class="updated screen-reader-text" datetime="%3$s">%4$s</time>';
		}
		$time_string = sprintf(
			$time_string,
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() ),
			esc_attr( get_the_modified_date( DATE_W3C ) ),
			esc_html( get_the_modified_date() )
		);
		echo '<span class="bgh-posted-on">' . $time_string . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

if ( ! function_exists( 'bgh_byline' ) ) {
	/**
	 * Print the author byline with avatar.
	 *
	 * @param bool $with_avatar Whether to render the avatar.
	 */
	function bgh_byline( $with_avatar = true ) {
		$author_id = get_the_author_meta( 'ID' );
		echo '<span class="bgh-byline">';
		if ( $with_avatar ) {
			echo get_avatar( $author_id, 38, '', esc_attr( get_the_author() ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		printf(
			'<span>%1$s <a href="%2$s" rel="author"><strong>%3$s</strong></a></span>',
			esc_html__( 'By', 'beauty-glow-hub' ),
			esc_url( get_author_posts_url( $author_id ) ),
			esc_html( get_the_author() )
		);
		echo '</span>';
	}
}

if ( ! function_exists( 'bgh_entry_categories' ) ) {
	/**
	 * Print the primary category as a chip.
	 *
	 * @param string $extra_class Additional classes for the chip.
	 */
	function bgh_entry_categories( $extra_class = '' ) {
		$categories = get_the_category();
		if ( empty( $categories ) ) {
			return;
		}
		$primary = $categories[0];
		printf(
			'<a class="bgh-chip %1$s" href="%2$s">%3$s</a>',
			esc_attr( $extra_class ),
			esc_url( get_category_link( $primary->term_id ) ),
			esc_html( $primary->name )
		);
	}
}

if ( ! function_exists( 'bgh_entry_meta' ) ) {
	/**
	 * Compact meta line: author, date, reading time.
	 */
	function bgh_entry_meta() {
		echo '<div class="bgh-card__meta">';
		echo '<span>' . esc_html( get_the_date() ) . '</span>';
		echo '<span class="bgh-dot" aria-hidden="true"></span>';
		echo '<span class="bgh-reading-time">' . esc_html( bgh_get_reading_time() ) . '</span>';
		echo '</div>';
	}
}

if ( ! function_exists( 'bgh_post_thumbnail' ) ) {
	/**
	 * Responsive, lazy-loaded featured image with graceful placeholder.
	 *
	 * @param string $size WordPress image size.
	 */
	function bgh_post_thumbnail( $size = 'bgh-card', $priority = false ) {
		if ( post_password_required() || is_attachment() ) {
			return;
		}
		if ( has_post_thumbnail() ) {
			$attr = array(
				'decoding' => 'async',
				'alt'      => the_title_attribute( array( 'echo' => false ) ),
			);
			if ( $priority ) {
				$attr['loading']       = 'eager';
				$attr['fetchpriority'] = 'high';
			} else {
				$attr['loading'] = 'lazy';
			}
			the_post_thumbnail( $size, $attr );
		} else {
			bgh_placeholder_image( get_the_ID() );
		}
	}
}

if ( ! function_exists( 'bgh_placeholder_image' ) ) {
	/**
	 * Render an on-brand inline SVG placeholder when no thumbnail exists.
	 *
	 * @param int $seed Seed used to vary the gradient direction.
	 */
	function bgh_placeholder_image( $seed = 0 ) {
		$palette = array(
			array( '#F8BBD0', '#E91E63' ),
			array( '#FFF8FB', '#F8BBD0' ),
			array( '#FCE4EC', '#D4AF37' ),
		);
		$pair  = $palette[ $seed % count( $palette ) ];
		$title = esc_attr( get_the_title() );
		echo '<div class="bgh-placeholder" role="img" aria-label="' . $title . '" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,' . esc_attr( $pair[0] ) . ',' . esc_attr( $pair[1] ) . ');">';
		echo '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.4" aria-hidden="true"><path d="M12 21s-7-4.35-9-8.5C1.5 8 4 4.5 7.5 5 9.5 5.3 11 7 12 8.5 13 7 14.5 5.3 16.5 5 20 4.5 22.5 8 21 12.5 19 16.65 12 21 12 21Z"/></svg>';
		echo '</div>';
	}
}

if ( ! function_exists( 'bgh_entry_footer_tags' ) ) {
	/**
	 * Print post tags.
	 */
	function bgh_entry_footer_tags() {
		$tags = get_the_tags();
		if ( empty( $tags ) ) {
			return;
		}
		echo '<div class="bgh-tags">';
		echo '<span class="screen-reader-text">' . esc_html__( 'Tags:', 'beauty-glow-hub' ) . '</span>';
		foreach ( $tags as $tag ) {
			printf( '<a href="%1$s" rel="tag">#%2$s</a>', esc_url( get_tag_link( $tag->term_id ) ), esc_html( $tag->name ) );
		}
		echo '</div>';
	}
}

if ( ! function_exists( 'bgh_card' ) ) {
	/**
	 * Render a standard article card (used in loops).
	 *
	 * @param string $chip_class Optional chip modifier.
	 */
	function bgh_card( $chip_class = '' ) {
		?>
		<article <?php post_class( 'bgh-card' ); ?>>
			<div class="bgh-card__thumb">
				<?php bgh_post_thumbnail( 'bgh-card' ); ?>
				<?php bgh_entry_categories( $chip_class ); ?>
			</div>
			<div class="bgh-card__body">
				<h3 class="bgh-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
				<p class="bgh-card__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 20 ) ); ?></p>
				<?php bgh_entry_meta(); ?>
			</div>
		</article>
		<?php
	}
}

if ( ! function_exists( 'bgh_list_item' ) ) {
	/**
	 * Render a compact list item (popular / recent widgets).
	 */
	function bgh_list_item() {
		?>
		<li class="bgh-list__item">
			<a class="bgh-list__thumb" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php bgh_post_thumbnail( 'bgh-thumb' ); ?></a>
			<div>
				<h4 class="bgh-list__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h4>
				<span class="bgh-list__meta"><?php echo esc_html( get_the_date() ); ?> &middot; <?php echo esc_html( bgh_get_reading_time() ); ?></span>
			</div>
		</li>
		<?php
	}
}

if ( ! function_exists( 'bgh_pagination' ) ) {
	/**
	 * Themed archive pagination.
	 */
	function bgh_pagination() {
		the_posts_pagination(
			array(
				'mid_size'           => 1,
				'prev_text'          => __( '&larr; Previous', 'beauty-glow-hub' ),
				'next_text'          => __( 'Next &rarr;', 'beauty-glow-hub' ),
				'screen_reader_text' => __( 'Posts navigation', 'beauty-glow-hub' ),
				'class'              => 'bgh-pagination',
			)
		);
	}
}
