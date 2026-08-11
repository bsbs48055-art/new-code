<?php
/**
 * Template tags used throughout the theme.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'kkd_posted_on' ) ) {
	/**
	 * Machine-readable published date, plus the updated date when it differs.
	 *
	 * @param bool $show_updated Whether to render the visible "Updated" date.
	 */
	function kkd_posted_on( $show_updated = false ) {
		$published = sprintf(
			'<time class="kkd-meta__date published" datetime="%1$s">%2$s</time>',
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() )
		);

		$updated = '';
		if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
			$updated = sprintf(
				'<time class="kkd-meta__date updated%3$s" datetime="%1$s">%2$s</time>',
				esc_attr( get_the_modified_date( DATE_W3C ) ),
				esc_html( get_the_modified_date() ),
				$show_updated ? '' : ' screen-reader-text'
			);
		}

		echo '<span class="kkd-meta__published">';
		printf(
			/* translators: %s: publication date. */
			esc_html__( 'Published %s', 'keepkeep-decorated' ),
			$published // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
		);
		echo '</span>';

		if ( $updated ) {
			echo '<span class="kkd-meta__updated">';
			if ( $show_updated ) {
				printf(
					/* translators: %s: last updated date. */
					esc_html__( 'Updated %s', 'keepkeep-decorated' ),
					$updated // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
				);
			} else {
				echo $updated; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
			}
			echo '</span>';
		}
	}
}

if ( ! function_exists( 'kkd_byline' ) ) {
	/**
	 * Author byline with optional avatar.
	 *
	 * @param bool $with_avatar Render the author avatar.
	 */
	function kkd_byline( $with_avatar = true ) {
		$author_id = (int) get_the_author_meta( 'ID' );
		if ( ! $author_id ) {
			return;
		}

		echo '<span class="kkd-byline">';
		if ( $with_avatar ) {
			echo get_avatar(
				$author_id,
				40,
				'',
				get_the_author(),
				array( 'class' => 'kkd-avatar' )
			); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_avatar() returns escaped markup.
		}
		printf(
			'<span class="kkd-byline__text">%1$s <a class="kkd-byline__link" href="%2$s" rel="author">%3$s</a></span>',
			esc_html_x( 'By', 'article byline', 'keepkeep-decorated' ),
			esc_url( get_author_posts_url( $author_id ) ),
			esc_html( get_the_author() )
		);
		echo '</span>';
	}
}

if ( ! function_exists( 'kkd_category_chip' ) ) {
	/**
	 * Section label linking to the post's primary category.
	 *
	 * @param string $extra_class Extra CSS classes.
	 */
	function kkd_category_chip( $extra_class = '' ) {
		$term = kkd_primary_category();
		if ( ! $term ) {
			return;
		}
		printf(
			'<a class="kkd-chip %1$s" href="%2$s">%3$s</a>',
			esc_attr( $extra_class ),
			esc_url( get_category_link( $term->term_id ) ),
			esc_html( $term->name )
		);
	}
}

if ( ! function_exists( 'kkd_entry_meta' ) ) {
	/**
	 * Compact card meta: date and reading time.
	 */
	function kkd_entry_meta() {
		echo '<p class="kkd-card__meta">';
		printf(
			'<time datetime="%1$s">%2$s</time>',
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() )
		);
		echo '<span class="kkd-dot" aria-hidden="true"></span>';
		echo '<span>' . esc_html( kkd_reading_time() ) . '</span>';
		echo '</p>';
	}
}

if ( ! function_exists( 'kkd_post_thumbnail' ) ) {
	/**
	 * Featured image for the current post, with a graceful fallback.
	 *
	 * @param string $size     Registered image size.
	 * @param array  $args     {
	 *     @type bool   $priority Load eagerly with high fetch priority (use for the LCP image only).
	 *     @type string $sizes    Explicit `sizes` attribute so browsers pick the right source.
	 *     @type string $class    Extra CSS classes.
	 * }
	 */
	function kkd_post_thumbnail( $size = 'kkd-card', $args = array() ) {
		if ( post_password_required() || is_attachment() ) {
			return;
		}

		$args = wp_parse_args(
			$args,
			array(
				'priority' => false,
				'sizes'    => '',
				'class'    => '',
			)
		);

		if ( ! has_post_thumbnail() ) {
			kkd_thumbnail_fallback();
			return;
		}

		$attr = array(
			'class'    => trim( 'kkd-media__img ' . $args['class'] ),
			'decoding' => 'async',
		);

		/*
		 * WordPress uses the post title as alt text only when the attachment has
		 * none. An explicit, meaningful alt on the attachment always wins.
		 */
		$thumb_id = get_post_thumbnail_id();
		$alt      = trim( (string) get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ) );
		if ( '' === $alt ) {
			$attr['alt'] = the_title_attribute( array( 'echo' => false ) );
		}

		if ( $args['sizes'] ) {
			$attr['sizes'] = $args['sizes'];
		}

		if ( $args['priority'] ) {
			$attr['loading']       = 'eager';
			$attr['fetchpriority'] = 'high';
		} else {
			$attr['loading'] = 'lazy';
		}

		the_post_thumbnail( $size, $attr );
	}
}

if ( ! function_exists( 'kkd_thumbnail_fallback' ) ) {
	/**
	 * Decorative stand-in used when a post has no featured image.
	 *
	 * Purely presentational, so it is hidden from assistive technology — the
	 * headline next to it already describes the article.
	 */
	function kkd_thumbnail_fallback() {
		$palettes = array(
			array( '#f1e6d8', '#dcc9b0' ),
			array( '#e9e4da', '#cdbfae' ),
			array( '#f4ece1', '#d8c3ae' ),
			array( '#ece7de', '#c3b3a1' ),
		);
		$pair = $palettes[ absint( get_the_ID() ) % count( $palettes ) ];

		printf(
			'<span class="kkd-media__fallback" aria-hidden="true" style="--kkd-fb-a:%1$s;--kkd-fb-b:%2$s">' .
			'<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.25" focusable="false">' .
			'<path d="M8 40V22l16-12 16 12v18z"/><path d="M18 40V28h12v12"/></svg></span>',
			esc_attr( $pair[0] ),
			esc_attr( $pair[1] )
		);
	}
}

if ( ! function_exists( 'kkd_entry_tags' ) ) {
	/**
	 * Post tags as a labelled list.
	 */
	function kkd_entry_tags() {
		$tags = get_the_tags();
		if ( empty( $tags ) || is_wp_error( $tags ) ) {
			return;
		}
		echo '<nav class="kkd-tags" aria-label="' . esc_attr__( 'Article topics', 'keepkeep-decorated' ) . '">';
		echo '<span class="kkd-tags__label">' . esc_html__( 'Topics', 'keepkeep-decorated' ) . '</span>';
		echo '<ul class="kkd-tags__list">';
		foreach ( $tags as $tag ) {
			printf(
				'<li><a href="%1$s" rel="tag">%2$s</a></li>',
				esc_url( get_tag_link( $tag->term_id ) ),
				esc_html( $tag->name )
			);
		}
		echo '</ul></nav>';
	}
}

if ( ! function_exists( 'kkd_card' ) ) {
	/**
	 * Render an article card for the current post in the loop.
	 *
	 * @param array $args Passed through to the card template part.
	 */
	function kkd_card( $args = array() ) {
		get_template_part(
			'template-parts/card',
			null,
			wp_parse_args(
				$args,
				array(
					'size'     => 'kkd-card',
					'heading'  => 'h3',
					'excerpt'  => true,
					'sizes'    => '(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 22rem',
					'priority' => false,
				)
			)
		);
		kkd_mark_shown();
	}
}

if ( ! function_exists( 'kkd_list_card' ) ) {
	/**
	 * Render a compact horizontal card (sidebar / popular lists).
	 *
	 * @param array $args Passed through to the template part.
	 */
	function kkd_list_card( $args = array() ) {
		get_template_part(
			'template-parts/card-list',
			null,
			wp_parse_args(
				$args,
				array(
					'heading' => 'h3',
					'number'  => 0,
				)
			)
		);
		kkd_mark_shown();
	}
}

if ( ! function_exists( 'kkd_pagination' ) ) {
	/**
	 * Archive pagination.
	 */
	function kkd_pagination() {
		the_posts_pagination(
			array(
				'mid_size'           => 1,
				'prev_text'          => '<span aria-hidden="true">&larr;</span> ' . esc_html__( 'Previous', 'keepkeep-decorated' ),
				'next_text'          => esc_html__( 'Next', 'keepkeep-decorated' ) . ' <span aria-hidden="true">&rarr;</span>',
				'screen_reader_text' => esc_html__( 'Page navigation', 'keepkeep-decorated' ),
				'aria_label'         => esc_attr__( 'Articles', 'keepkeep-decorated' ),
				'class'              => 'kkd-pagination',
			)
		);
	}
}

if ( ! function_exists( 'kkd_section_head' ) ) {
	/**
	 * Section heading with an optional "see all" link.
	 *
	 * @param string $title    Heading text.
	 * @param string $link     Optional URL.
	 * @param string $link_text Optional link label.
	 * @param string $intro    Optional supporting sentence.
	 * @param string $level    Heading level (h2 by default).
	 */
	function kkd_section_head( $title, $link = '', $link_text = '', $intro = '', $level = 'h2' ) {
		$level = in_array( $level, array( 'h1', 'h2', 'h3' ), true ) ? $level : 'h2';

		echo '<div class="kkd-section__head">';
		echo '<div class="kkd-section__headings">';
		printf(
			'<%1$s class="kkd-section__title">%2$s</%1$s>',
			esc_html( $level ),
			esc_html( $title )
		);
		if ( $intro ) {
			echo '<p class="kkd-section__intro">' . esc_html( $intro ) . '</p>';
		}
		echo '</div>';

		if ( $link ) {
			printf(
				'<a class="kkd-section__link" href="%1$s">%2$s<span aria-hidden="true"> &rarr;</span></a>',
				esc_url( $link ),
				esc_html( $link_text ? $link_text : __( 'See all', 'keepkeep-decorated' ) )
			);
		}
		echo '</div>';
	}
}

if ( ! function_exists( 'kkd_category_links' ) ) {
	/**
	 * A row of category links, used on 404, search and archive pages to keep
	 * every page one click from real content.
	 *
	 * @param int $limit Maximum number of categories.
	 */
	function kkd_category_links( $limit = 8 ) {
		$cats = get_categories(
			array(
				'orderby'    => 'count',
				'order'      => 'DESC',
				'number'     => absint( $limit ),
				'hide_empty' => true,
			)
		);
		if ( empty( $cats ) ) {
			return;
		}
		echo '<ul class="kkd-chip-row">';
		foreach ( $cats as $cat ) {
			printf(
				'<li><a class="kkd-chip kkd-chip--outline" href="%1$s">%2$s</a></li>',
				esc_url( get_category_link( $cat->term_id ) ),
				esc_html( $cat->name )
			);
		}
		echo '</ul>';
	}
}

if ( ! function_exists( 'kkd_blog_url' ) ) {
	/**
	 * URL of the posts index (the "Blog" page when one is assigned).
	 *
	 * @return string
	 */
	function kkd_blog_url() {
		$posts_page = (int) get_option( 'page_for_posts' );
		if ( $posts_page && 'publish' === get_post_status( $posts_page ) ) {
			return get_permalink( $posts_page );
		}
		return home_url( '/' );
	}
}
