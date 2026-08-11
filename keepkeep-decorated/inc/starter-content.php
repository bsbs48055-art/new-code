<?php
/**
 * Starter content for the pages every publication needs.
 *
 * These are outlines, not finished documents. Placeholders are written in
 * [square brackets] so they are impossible to miss, and none of them assert a
 * legal fact on the owner's behalf — the wording deliberately stops short of
 * claiming a company name, jurisdiction or policy the owner has not chosen.
 *
 * Pages are created as drafts so an unfinished policy never goes live.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Definitions for the starter pages.
 *
 * @return array<string,array{title:string,template:string,content:string,menu:string}>
 */
function kkd_starter_pages() {
	$site = get_bloginfo( 'name' );

	$pages = array(
		'about' => array(
			'title'    => __( 'About', 'keepkeep-decorated' ),
			'template' => '',
			'menu'     => 'company',
			'content'  => '<!-- wp:paragraph --><p>' . sprintf(
				/* translators: %s: site name. */
				esc_html__( '%s is an independent home decor publication. We write practical, room-by-room guides for people who want their home to feel considered without hiring a designer or starting from scratch.', 'keepkeep-decorated' ),
				esc_html( $site )
			) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'What we cover', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Decorating ideas, interior design fundamentals, weekend DIY projects, home organization, furniture choices and the seasonal side of living well at home. [Describe the topics you actually publish, and who you write for.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'How we work', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Explain your process in your own words: how you research a piece, whether you test products or projects yourself, who reviews articles before publication, and how you handle updates when advice changes. Only describe what you genuinely do.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Who writes here', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Introduce yourself and any contributors. Real names, real experience. Do not list qualifications you do not hold.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Get in touch', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Questions, corrections or ideas are welcome — see the contact page. [Add your contact email.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
		'contact' => array(
			'title'    => __( 'Contact', 'keepkeep-decorated' ),
			'template' => 'templates/page-contact.php',
			'menu'     => 'company',
			'content'  => '<!-- wp:paragraph --><p>' . esc_html__( 'We read every message. Whether you have spotted an error in an article, want to suggest a topic, or have a question about something we have published, this is the place to reach us.', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Install a form plugin such as Contact Form 7, WPForms or Fluent Forms, then paste its shortcode below this paragraph. The Contact template renders your form inside a styled panel; if no form is present it shows your email address instead, so readers are never left with a form that goes nowhere.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
		'editorial-policy' => array(
			'title'    => __( 'Editorial Policy', 'keepkeep-decorated' ),
			'template' => 'templates/page-legal.php',
			'menu'     => 'company',
			'content'  => '<!-- wp:paragraph --><p>' . esc_html__( 'This page explains how content on this site is researched, written, reviewed and corrected. [Adjust every section so it describes what you actually do.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Who we write for', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Describe your reader and the problem you help them solve.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'How articles are researched', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Explain your sources: first-hand projects, manufacturer documentation, interviews, published standards. State plainly when something is opinion rather than tested fact.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Corrections and updates', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Articles show a published date and, where they have been revised, an updated date. [Explain how readers can report an error and how quickly you aim to respond.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Advertising, affiliates and sponsorship', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[State whether the site carries advertising, whether any links earn commission, and confirm that commercial arrangements do not decide what appears in an article. If you accept sponsored content, say how it is labelled.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Use of AI tools', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Be specific and honest about whether and how AI tools are used in your workflow, and who is accountable for what gets published.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
		'privacy-policy' => array(
			'title'    => __( 'Privacy Policy', 'keepkeep-decorated' ),
			'template' => 'templates/page-legal.php',
			'menu'     => 'legal',
			'content'  => '<!-- wp:paragraph --><p>' . esc_html__( 'This is an outline only. WordPress can generate a fuller draft under Settings → Privacy, and the sections below list what most decor blogs need to cover. [Review every section, and take professional advice if you are unsure of your obligations.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Who we are', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Your site name, the legal entity or individual responsible for it, and a contact email.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'What we collect', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:list --><ul><li>' . esc_html__( 'Comments: the name, email address and comment text you submit, plus your IP address and browser user agent, used for spam detection.', 'keepkeep-decorated' ) . '</li>'
				. '<li>' . esc_html__( 'Contact form or newsletter: the details you choose to send us. [Name your email provider.]', 'keepkeep-decorated' ) . '</li>'
				. '<li>' . esc_html__( 'Analytics: [name the analytics tool you use, or delete this line].', 'keepkeep-decorated' ) . '</li>'
				. '<li>' . esc_html__( 'Advertising: [if you run ads, name the network and link to its privacy notice].', 'keepkeep-decorated' ) . '</li></ul><!-- /wp:list -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Cookies', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Explain which cookies the site sets, why, and how a reader can refuse or remove them. Cover any consent tool you use.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Third parties', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[List every service that receives reader data: hosting, email, analytics, ad networks, comment spam filtering, embedded media.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'How long we keep data', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Comments and their metadata are retained indefinitely so follow-up replies stay readable. [State your retention periods for anything else you collect.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Your rights', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Explain how a reader can request a copy of their data or ask for it to be erased, and where to send that request.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
		'terms-and-conditions' => array(
			'title'    => __( 'Terms and Conditions', 'keepkeep-decorated' ),
			'template' => 'templates/page-legal.php',
			'menu'     => 'legal',
			'content'  => '<!-- wp:paragraph --><p>' . esc_html__( 'These terms govern use of this website. [Review and adapt them; this outline is not legal advice.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Using this site', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'By browsing this site you agree to these terms. [Set out what readers may and may not do.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Content and copyright', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Articles, photography and illustrations on this site belong to their respective owners. [State your position on quoting, linking and reproducing your work.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Comments', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Describe your moderation approach and what will be removed.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Links to other sites', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'We link to sites we find useful but are not responsible for their content. [Adjust as needed.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Changes to these terms', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[Explain how you will notify readers of changes, and add a contact address for questions.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
		'disclaimer' => array(
			'title'    => __( 'Disclaimer', 'keepkeep-decorated' ),
			'template' => 'templates/page-legal.php',
			'menu'     => 'legal',
			'content'  => '<!-- wp:paragraph --><p>' . esc_html__( 'The guides on this site are written to be genuinely useful, but every home is different. [Adapt the wording below to your own situation.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'General information only', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Our articles describe ideas, materials and methods for general situations. They are not a substitute for advice from a qualified professional about your specific property.', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'DIY safety', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Work involving electricity, gas, plumbing, structural changes or working at height should be carried out by a qualified tradesperson and in line with local building regulations. Read the instructions supplied with any tool, adhesive, paint or finish before you use it, and follow the manufacturer’s safety guidance.', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'Prices, availability and product details', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( 'Prices and availability change, and specifications are sometimes revised by manufacturers. Check the details with the retailer before you buy.', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->'
				. '<!-- wp:heading --><h2>' . esc_html__( 'External links and advertising', 'keepkeep-decorated' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:paragraph --><p>' . esc_html__( '[If any links earn commission, or the site carries advertising, disclose it here in plain language.]', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
		'authors' => array(
			'title'    => __( 'Authors', 'keepkeep-decorated' ),
			'template' => 'templates/page-authors.php',
			'menu'     => 'company',
			'content'  => '<!-- wp:paragraph --><p>' . esc_html__( 'The people who research, write and edit what you read here. Every article carries a byline that links to its author’s work.', 'keepkeep-decorated' ) . '</p><!-- /wp:paragraph -->',
		),
	);

	/**
	 * Filters the starter page definitions.
	 *
	 * @param array $pages Starter pages keyed by slug.
	 */
	return apply_filters( 'kkd_starter_pages', $pages );
}

/**
 * The category structure the theme is designed around.
 *
 * @return array<string,array{name:string,description:string}>
 */
function kkd_starter_categories() {
	return array(
		'decor'           => array(
			'name'        => __( 'Decor', 'keepkeep-decorated' ),
			'description' => __( 'Room-by-room decorating ideas — colour, texture, wall treatments, lighting and the finishing touches that pull a space together.', 'keepkeep-decorated' ),
		),
		'interior-design' => array(
			'name'        => __( 'Interior Design', 'keepkeep-decorated' ),
			'description' => __( 'The principles behind rooms that work: layout, proportion, natural light, colour relationships and how to plan a scheme before you spend anything.', 'keepkeep-decorated' ),
		),
		'diy'             => array(
			'name'        => __( 'DIY', 'keepkeep-decorated' ),
			'description' => __( 'Practical home projects with clear steps, realistic costs and honest notes on difficulty — from painting and panelling to shelving and small repairs.', 'keepkeep-decorated' ),
		),
		'organization'    => array(
			'name'        => __( 'Organization', 'keepkeep-decorated' ),
			'description' => __( 'Storage and organizing systems that survive daily life, including small-space solutions, entryways, kitchens, wardrobes and paperwork.', 'keepkeep-decorated' ),
		),
		'furniture'       => array(
			'name'        => __( 'Furniture', 'keepkeep-decorated' ),
			'description' => __( 'How to choose, measure, arrange and care for the pieces you live with — sofas, beds, dining tables, storage and second-hand finds.', 'keepkeep-decorated' ),
		),
		'lifestyle'       => array(
			'name'        => __( 'Lifestyle', 'keepkeep-decorated' ),
			'description' => __( 'Seasonal decorating, hosting, home routines and the habits that keep a home feeling calm and cared for.', 'keepkeep-decorated' ),
		),
	);
}
