<?php
/**
 * Automatic Table of Contents.
 *
 * Adds anchor IDs to H2/H3 headings in single post content and renders a
 * nested, accessible TOC. Purely server-side, no external dependencies.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Slugify heading text into a stable anchor id.
 *
 * @param string $text  Heading text.
 * @param array  $used  Reference to used slugs (to keep them unique).
 * @return string
 */
function bgh_toc_slug( $text, &$used ) {
	$slug = sanitize_title( $text );
	if ( '' === $slug ) {
		$slug = 'section';
	}
	$base = $slug;
	$i    = 2;
	while ( in_array( $slug, $used, true ) ) {
		$slug = $base . '-' . $i;
		$i++;
	}
	$used[] = $slug;
	return $slug;
}

/**
 * Parse content and inject IDs into H2/H3, collecting a heading list.
 *
 * @param string $content Post content.
 * @return array [ 'content' => modified HTML, 'headings' => array ]
 */
function bgh_toc_process( $content ) {
	$headings = array();
	$used     = array();

	$content = preg_replace_callback(
		'/<h([23])([^>]*)>(.*?)<\/h\1>/is',
		function ( $m ) use ( &$headings, &$used ) {
			$level = (int) $m[1];
			$attrs = $m[2];
			$inner = $m[3];
			$text  = trim( wp_strip_all_tags( $inner ) );

			// Reuse an existing id if the author added one, else generate.
			if ( preg_match( '/id=["\']([^"\']+)["\']/i', $attrs, $idm ) ) {
				$id = $idm[1];
			} else {
				$id    = bgh_toc_slug( $text, $used );
				$attrs .= ' id="' . esc_attr( $id ) . '"';
			}

			$headings[] = array( 'level' => $level, 'text' => $text, 'id' => $id );
			return '<h' . $level . $attrs . '>' . $inner . '</h' . $level . '>';
		},
		$content
	);

	return array( 'content' => $content, 'headings' => $headings );
}

/**
 * Filter single-post content to add heading anchors and store headings.
 *
 * @param string $content Post content.
 * @return string
 */
function bgh_toc_filter_content( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	// Allow opt-out via custom field.
	if ( 'off' === get_post_meta( get_the_ID(), '_bgh_toc', true ) ) {
		return $content;
	}
	$result = bgh_toc_process( $content );
	$GLOBALS['bgh_toc_headings'] = $result['headings'];
	return $result['content'];
}
add_filter( 'the_content', 'bgh_toc_filter_content', 7 );

/**
 * Render the TOC box. Call after the content filter has run, or it will
 * lazily process the raw content as a fallback.
 */
function bgh_render_toc() {
	$headings = isset( $GLOBALS['bgh_toc_headings'] ) ? $GLOBALS['bgh_toc_headings'] : array();

	if ( empty( $headings ) ) {
		$processed = bgh_toc_process( get_the_content() );
		$headings  = $processed['headings'];
	}

	if ( count( $headings ) < 3 ) {
		return; // Not worth a TOC for very short posts.
	}

	echo '<nav class="bgh-toc" aria-label="' . esc_attr__( 'Table of contents', 'beauty-glow-hub' ) . '">';
	echo '<h2 class="bgh-toc__title">';
	echo '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E91E63" stroke-width="2" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> ';
	echo esc_html__( 'Table of Contents', 'beauty-glow-hub' );
	echo '</h2>';

	echo '<ol>';
	$open_sub = false;
	foreach ( $headings as $i => $h ) {
		if ( 2 === $h['level'] ) {
			if ( $open_sub ) {
				echo '</ol></li>';
				$open_sub = false;
			}
			// Peek whether next is an h3 to decide on wrapping.
			echo '<li><a href="#' . esc_attr( $h['id'] ) . '">' . esc_html( $h['text'] ) . '</a>';
			$next = isset( $headings[ $i + 1 ] ) ? $headings[ $i + 1 ] : null;
			if ( $next && 3 === $next['level'] ) {
				echo '<ol class="bgh-toc__sub">';
				$open_sub = true;
			} else {
				echo '</li>';
			}
		} else { // level 3
			echo '<li><a href="#' . esc_attr( $h['id'] ) . '">' . esc_html( $h['text'] ) . '</a></li>';
		}
	}
	if ( $open_sub ) {
		echo '</ol></li>';
	}
	echo '</ol>';
	echo '</nav>';
}
