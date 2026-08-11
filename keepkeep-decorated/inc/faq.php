<?php
/**
 * FAQ shortcodes.
 *
 * Usage inside a post or page (Shortcode block):
 *
 *     [kkd_faq]
 *       [kkd_faq_item question="How do I pick a rug size?"]Answer text.[/kkd_faq_item]
 *       [kkd_faq_item question="What about layering?"]Answer text.[/kkd_faq_item]
 *     [/kkd_faq]
 *
 * Rendered with native `<details>`/`<summary>`, so the accordion is keyboard
 * accessible and needs no JavaScript.
 *
 * FAQPage structured data is off by default and must be requested per FAQ with
 * `[kkd_faq schema="yes"]`. Marking up questions that a page does not really
 * answer is exactly the kind of mismatch between markup and visible content
 * that Google's structured data guidelines prohibit, so the decision is left to
 * whoever wrote the page.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Collected question/answer pairs for the current request.
 *
 * @param array|null $add Item to append, or null to read the collection.
 * @return array<int,array{question:string,answer:string}>
 */
function kkd_faq_items( $add = null ) {
	static $items = array();

	if ( null !== $add ) {
		$items[] = $add;
	}
	return $items;
}

/**
 * Whether any FAQ on this page asked for structured data.
 *
 * @param bool|null $set Set the flag.
 * @return bool
 */
function kkd_faq_schema_requested( $set = null ) {
	static $requested = false;

	if ( true === $set ) {
		$requested = true;
	}
	return $requested;
}

/**
 * `[kkd_faq]` — wraps a group of questions.
 *
 * @param array  $atts    Shortcode attributes.
 * @param string $content Inner shortcodes.
 * @return string
 */
function kkd_faq_shortcode( $atts, $content = '' ) {
	$atts = shortcode_atts(
		array(
			'title'  => '',
			'schema' => 'no',
		),
		$atts,
		'kkd_faq'
	);

	if ( in_array( strtolower( (string) $atts['schema'] ), array( 'yes', 'true', '1' ), true ) ) {
		kkd_faq_schema_requested( true );
	}

	$inner = do_shortcode( (string) $content );
	if ( '' === trim( wp_strip_all_tags( $inner ) ) ) {
		return '';
	}

	$html = '<section class="kkd-faq">';
	if ( $atts['title'] ) {
		$html .= '<h2 class="kkd-faq__title">' . esc_html( $atts['title'] ) . '</h2>';
	}
	$html .= $inner . '</section>';

	return $html;
}
add_shortcode( 'kkd_faq', 'kkd_faq_shortcode' );

/**
 * `[kkd_faq_item]` — a single question and answer.
 *
 * @param array  $atts    Shortcode attributes.
 * @param string $content Answer content.
 * @return string
 */
function kkd_faq_item_shortcode( $atts, $content = '' ) {
	$atts = shortcode_atts(
		array(
			'question' => '',
			'open'     => 'no',
		),
		$atts,
		'kkd_faq_item'
	);

	$question = sanitize_text_field( (string) $atts['question'] );
	$answer   = trim( (string) $content );

	if ( '' === $question || '' === trim( wp_strip_all_tags( $answer ) ) ) {
		return '';
	}

	$answer_html = wpautop( do_shortcode( $answer ) );

	kkd_faq_items(
		array(
			'question' => $question,
			'answer'   => trim( wp_strip_all_tags( $answer_html ) ),
		)
	);

	$open = in_array( strtolower( (string) $atts['open'] ), array( 'yes', 'true', '1' ), true ) ? ' open' : '';

	return sprintf(
		'<details class="kkd-faq__item"%1$s><summary class="kkd-faq__question">%2$s</summary><div class="kkd-faq__answer">%3$s</div></details>',
		$open,
		esc_html( $question ),
		wp_kses_post( $answer_html )
	);
}
add_shortcode( 'kkd_faq_item', 'kkd_faq_item_shortcode' );

/**
 * Output FAQPage structured data when a page explicitly opted in.
 */
function kkd_faq_schema() {
	if ( kkd_seo_plugin_active() || ! kkd_faq_schema_requested() ) {
		return;
	}

	$items = kkd_faq_items();
	if ( count( $items ) < 2 ) {
		return; // A single question is not an FAQ page.
	}

	$entities = array();
	foreach ( $items as $item ) {
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $item['question'],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $item['answer'],
			),
		);
	}

	$json = wp_json_encode(
		array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => $entities,
		),
		JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP
	);

	if ( false === $json ) {
		return;
	}

	echo '<script type="application/ld+json">' . $json . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON encoded with HTML-safe flags.
}
add_action( 'wp_footer', 'kkd_faq_schema', 20 );
