<?php
/**
 * Demo page definitions for Beauty Glow Hub.
 *
 * Returns an array of pages (title, slug, template, excerpt, content).
 * Consumed by demo/seed.php via WP-CLI.
 *
 * @package Beauty_Glow_Hub
 */

return array(

	array(
		'title'    => 'Home',
		'slug'     => 'home',
		'template' => '',
		'excerpt'  => '',
		'content'  => '<!-- wp:paragraph --><p>Welcome to Beauty Glow Hub. This page is powered by the theme homepage template.</p><!-- /wp:paragraph -->',
	),

	array(
		'title'    => 'Blog',
		'slug'     => 'blog',
		'template' => '',
		'excerpt'  => '',
		'content'  => '',
	),

	array(
		'title'    => 'About Us',
		'slug'     => 'about-us',
		'template' => '',
		'excerpt'  => 'Beauty Glow Hub is an independent beauty magazine sharing trustworthy, research-informed skincare, hair care, makeup and wellness advice.',
		'content'  => '
<p class="bgh-lead">Beauty Glow Hub was created on a simple belief: beauty advice should be honest, easy to understand and grounded in real evidence — not hype.</p>

<h2>Our Story</h2>
<p>We started Beauty Glow Hub after years of frustration with beauty content that promised miracles but rarely explained the "why". Confusing ingredient lists, contradictory routines and sponsored reviews made it hard to know what actually works. So we built the resource we wished existed: a calm, clutter-free magazine where every guide is written to genuinely help you look after your skin, hair and wellbeing.</p>

<h2>What We Cover</h2>
<p>Our editorial team publishes practical, beginner-friendly guides across skincare, hair care, makeup, nail care, anti-aging, natural remedies, product reviews, beauty trends and lifestyle. Whether you are building your first routine or refining an advanced one, you will find clear, step-by-step advice you can trust.</p>

<h2>How We Work</h2>
<ul>
<li><strong>Research first.</strong> We reference dermatological and scientific sources, and we explain ingredients in plain language.</li>
<li><strong>Honest reviews.</strong> We test products in real life and disclose any affiliate relationships clearly.</li>
<li><strong>Always improving.</strong> We revisit and update older articles so the information stays accurate.</li>
</ul>

<h2>Our Promise to You</h2>
<p>We will never recommend something we would not use ourselves, and we will always tell you when the evidence is thin. Your trust is the foundation of everything we publish. To learn more about our standards, read our <a href="/editorial-policy/">Editorial Policy</a>.</p>

<h2>Say Hello</h2>
<p>Have a question, a product you would like us to review, or feedback on a guide? We would love to hear from you — visit our <a href="/contact/">Contact page</a>.</p>
',
	),

	array(
		'title'    => 'Contact',
		'slug'     => 'contact',
		'template' => 'templates/page-contact.php',
		'excerpt'  => 'Questions, feedback or partnership enquiries? We would love to hear from you.',
		'content'  => '
<p>We read every message. Use the form below for general questions, editorial feedback, review requests or partnership enquiries, and we will get back to you within two business days.</p>
<p>Before you write, you may find a quick answer on our <a href="/faq/">FAQ page</a> or in our <a href="/editorial-policy/">Editorial Policy</a>.</p>
',
	),

	array(
		'title'    => 'FAQ',
		'slug'     => 'faq',
		'template' => 'templates/page-faq.php',
		'excerpt'  => 'Answers to the questions our readers ask most about Beauty Glow Hub.',
		'content'  => '
<p>Here are answers to the questions we hear most often. Still stuck? <a href="/contact/">Contact us</a> and we will be happy to help.</p>

<h3>Is the advice on Beauty Glow Hub medically reviewed?</h3>
<p>Our content is written by experienced beauty writers and fact-checked against reputable dermatological and scientific sources. However, our articles are for informational purposes only and are not a substitute for professional medical advice. Always consult a qualified professional for concerns about your skin or health.</p>

<h3>How do you choose which products to review?</h3>
<p>We select products based on reader interest, ingredient quality and real-world testing. We clearly disclose any affiliate relationships and never allow them to influence our honest opinions.</p>

<h3>Do you accept guest posts?</h3>
<p>Yes. We welcome qualified beauty and wellness writers. Please read our guidelines on the Write For Us page and submit your pitch through the form.</p>

<h3>How often do you publish new content?</h3>
<p>We publish new, original beauty and skincare guides every week and regularly update older articles to keep the information accurate and current.</p>

<h3>How can I advertise on Beauty Glow Hub?</h3>
<p>We offer a limited number of tasteful advertising placements. Please reach out via our Contact page for our media kit and rates.</p>

<h3>Where can I read your policies?</h3>
<p>You can review our Privacy Policy, Terms &amp; Conditions, Disclaimer, Affiliate Disclosure, Cookie Policy and DMCA Policy from the footer of every page.</p>
',
	),

	array(
		'title'    => 'Write For Us',
		'slug'     => 'write-for-us',
		'template' => '',
		'excerpt'  => 'Contribute a beauty, skincare or wellness article to Beauty Glow Hub.',
		'content'  => '
<p class="bgh-lead">We are always looking for knowledgeable, passionate writers to contribute original beauty and wellness content.</p>

<h2>What We Look For</h2>
<ul>
<li>Original, well-researched articles that have not been published elsewhere.</li>
<li>Practical, reader-first advice in skincare, hair care, makeup, nail care, anti-aging, natural remedies or wellness.</li>
<li>A friendly, clear writing style with accurate, source-backed information.</li>
</ul>

<h2>Submission Guidelines</h2>
<ul>
<li>Word count: 1,000–2,000 words, structured with clear H2/H3 headings.</li>
<li>Include a short author bio (50–80 words) and a professional headshot.</li>
<li>Cite reputable sources; no plagiarism or AI-spun content.</li>
<li>One relevant, non-promotional link is allowed within the author bio.</li>
</ul>

<h2>Topics We Love</h2>
<p>Ingredient deep-dives, honest product comparisons, routine guides, myth-busting explainers and seasonal beauty tips tend to perform best with our readers.</p>

<h2>How to Pitch</h2>
<p>Send us two or three headline ideas with a one-paragraph summary for each via our <a href="/contact/">Contact page</a>, choosing "Editorial" as the subject. If it is a good fit, our editor will reply with next steps.</p>
',
	),

	array(
		'title'    => 'Authors',
		'slug'     => 'authors',
		'template' => 'templates/page-authors.php',
		'excerpt'  => 'Meet the writers and editors behind Beauty Glow Hub.',
		'content'  => '<p>Every article on Beauty Glow Hub is written and reviewed by our editorial team. Meet the people behind the guides you read.</p>',
	),

	array(
		'title'    => 'Editorial Policy',
		'slug'     => 'editorial-policy',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'How we research, write, review and update our content.',
		'content'  => '
<p class="bgh-lead">Trust is the foundation of Beauty Glow Hub. This policy explains how we create content you can rely on.</p>

<h2>Editorial Independence</h2>
<p>Our editorial content is created independently of any advertiser or affiliate relationship. Commercial partnerships never determine our opinions, ratings or recommendations.</p>

<h2>Research and Accuracy</h2>
<p>Our writers reference peer-reviewed studies, dermatological guidance and reputable industry sources. We aim to explain the science in plain language and to distinguish clearly between established evidence and emerging or anecdotal claims.</p>

<h2>Fact-Checking</h2>
<p>Before publication, each article is reviewed for accuracy, clarity and balance. Where a topic relates to health, we remind readers that our content is informational and not a substitute for professional medical advice.</p>

<h2>Product Testing and Reviews</h2>
<p>Where possible, we test products first-hand and describe our real experience. We assess ingredients, value and suitability for different skin and hair types. Any affiliate relationships are disclosed in line with our <a href="/affiliate-disclosure/">Affiliate Disclosure</a>.</p>

<h2>Corrections and Updates</h2>
<p>We regularly review and update older articles to keep them accurate. If you spot an error, please <a href="/contact/">let us know</a> and we will correct it promptly. Significant corrections are noted within the article where appropriate.</p>

<h2>Authorship and Transparency</h2>
<p>Every article displays its author and publication date. Author bios describe relevant experience so you know who is behind the advice.</p>

<h2>Advertising</h2>
<p>Advertisements are clearly labelled and kept separate from editorial content. We follow advertising best practices to ensure a clean, non-intrusive reading experience.</p>
',
	),

	array(
		'title'    => 'Privacy Policy',
		'slug'     => 'privacy-policy',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'How we collect, use and protect your personal information.',
		'content'  => '
<p class="bgh-lead">This Privacy Policy explains how Beauty Glow Hub ("we", "us") collects, uses and safeguards your information when you visit our website.</p>

<h2>Information We Collect</h2>
<p>We may collect information you provide directly (such as your name and email when you subscribe to our newsletter or use our contact form) and information collected automatically (such as your IP address, browser type, device information and pages visited) through cookies and similar technologies.</p>

<h2>How We Use Your Information</h2>
<ul>
<li>To operate, maintain and improve our website and content.</li>
<li>To respond to your enquiries and send our newsletter (if you subscribed).</li>
<li>To analyse traffic and understand how our content is used.</li>
<li>To display relevant, non-intrusive advertising.</li>
</ul>

<h2>Cookies and Advertising</h2>
<p>We use cookies to enhance your experience and to measure site performance. Third-party vendors, including Google, may use cookies to serve ads based on your prior visits to this and other websites. Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you based on your visits. You can opt out of personalised advertising by visiting Google&rsquo;s Ads Settings. For more detail, see our <a href="/cookie-policy/">Cookie Policy</a>.</p>

<h2>Third-Party Services</h2>
<p>We may use third-party services such as analytics providers, email platforms and advertising networks. These providers have their own privacy policies governing the use of your information.</p>

<h2>Your Rights</h2>
<p>Depending on your location, you may have the right to access, correct or delete your personal data, or to object to certain processing. To exercise these rights, please contact us.</p>

<h2>Data Retention and Security</h2>
<p>We retain personal data only as long as necessary for the purposes described here, and we use reasonable measures to protect it. No method of transmission over the internet is completely secure, however, and we cannot guarantee absolute security.</p>

<h2>Children&rsquo;s Privacy</h2>
<p>Our website is not directed at children under 13, and we do not knowingly collect data from them.</p>

<h2>Changes to This Policy</h2>
<p>We may update this policy from time to time. The "last updated" date at the top reflects the latest revision.</p>

<h2>Contact Us</h2>
<p>If you have questions about this Privacy Policy, please reach out via our <a href="/contact/">Contact page</a>.</p>
',
	),

	array(
		'title'    => 'Terms & Conditions',
		'slug'     => 'terms-conditions',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'The terms that govern your use of Beauty Glow Hub.',
		'content'  => '
<p class="bgh-lead">By accessing and using Beauty Glow Hub, you agree to these Terms &amp; Conditions. Please read them carefully.</p>

<h2>Use of Our Content</h2>
<p>All content on this website is provided for general informational purposes only. You may read and share our articles for personal, non-commercial use with appropriate attribution. You may not republish, reproduce or redistribute our content without written permission.</p>

<h2>Intellectual Property</h2>
<p>All text, graphics, logos and design elements are the property of Beauty Glow Hub or its content creators and are protected by copyright and other laws.</p>

<h2>No Professional Advice</h2>
<p>Our content is not medical, health or professional advice. See our <a href="/disclaimer/">Disclaimer</a> for details. Always consult a qualified professional before making decisions about your skin, hair or health.</p>

<h2>User Conduct</h2>
<p>When commenting or contacting us, you agree not to post unlawful, offensive, misleading or infringing material. We reserve the right to remove content and restrict access at our discretion.</p>

<h2>Third-Party Links</h2>
<p>Our site may contain links to third-party websites. We are not responsible for the content or practices of those sites.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, Beauty Glow Hub is not liable for any loss or damage arising from your use of, or reliance on, our content.</p>

<h2>Changes to These Terms</h2>
<p>We may revise these Terms at any time. Continued use of the site after changes constitutes acceptance of the updated Terms.</p>

<h2>Contact</h2>
<p>Questions about these Terms? Please use our <a href="/contact/">Contact page</a>.</p>
',
	),

	array(
		'title'    => 'Disclaimer',
		'slug'     => 'disclaimer',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'Important information about the limits of our content.',
		'content'  => '
<p class="bgh-lead">The information provided by Beauty Glow Hub is for general informational and educational purposes only.</p>

<h2>Not Medical Advice</h2>
<p>Nothing on this website constitutes medical, dermatological or professional health advice. Content is not intended to diagnose, treat, cure or prevent any condition. Always seek the advice of a qualified physician or dermatologist with any questions you may have regarding a medical condition or before starting a new skincare, supplement or treatment regimen.</p>

<h2>Results May Vary</h2>
<p>Beauty and skincare results depend on many individual factors, including skin type, genetics, lifestyle and consistency. Outcomes described in our articles are not guarantees. What works for one person may not work for another.</p>

<h2>Product Information</h2>
<p>Product details, prices and availability can change without notice. Always read the label and follow the manufacturer&rsquo;s instructions. Patch-test new products and discontinue use if irritation occurs.</p>

<h2>External Links</h2>
<p>We may link to external websites for reference. We do not endorse and are not responsible for the accuracy of third-party content.</p>

<h2>Affiliate Relationships</h2>
<p>Some links on this site are affiliate links. See our <a href="/affiliate-disclosure/">Affiliate Disclosure</a> for details.</p>

<h2>Your Responsibility</h2>
<p>Your use of the information on this website is entirely at your own risk. Beauty Glow Hub will not be liable for any losses or damages in connection with the use of our content.</p>
',
	),

	array(
		'title'    => 'Affiliate Disclosure',
		'slug'     => 'affiliate-disclosure',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'How affiliate links work on Beauty Glow Hub.',
		'content'  => '
<p class="bgh-lead">Transparency matters to us. This page explains how affiliate links support Beauty Glow Hub.</p>

<h2>What Affiliate Links Are</h2>
<p>Some of the links on Beauty Glow Hub are affiliate links. This means that if you click a link and make a purchase, we may earn a small commission — at no additional cost to you.</p>

<h2>How It Supports Us</h2>
<p>These commissions help us cover the cost of running the site, testing products and producing free, high-quality content. We are grateful for your support.</p>

<h2>Our Commitment</h2>
<ul>
<li>We only feature products we believe are genuinely useful to our readers.</li>
<li>Affiliate relationships never change our honest opinions or ratings.</li>
<li>We clearly identify affiliate or sponsored content where required.</li>
</ul>

<h2>Amazon Associates &amp; Other Programs</h2>
<p>Beauty Glow Hub may participate in affiliate programs with retailers and brands. As an Amazon Associate we may earn from qualifying purchases where applicable.</p>

<h2>Questions</h2>
<p>If you have any questions about our affiliate relationships, please <a href="/contact/">contact us</a>. You can also read our full <a href="/editorial-policy/">Editorial Policy</a>.</p>
',
	),

	array(
		'title'    => 'Cookie Policy',
		'slug'     => 'cookie-policy',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'How and why we use cookies on Beauty Glow Hub.',
		'content'  => '
<p class="bgh-lead">This Cookie Policy explains what cookies are, how we use them and how you can manage them.</p>

<h2>What Are Cookies?</h2>
<p>Cookies are small text files stored on your device when you visit a website. They help the site function, remember your preferences and understand how it is used.</p>

<h2>Types of Cookies We Use</h2>
<ul>
<li><strong>Essential cookies</strong> — required for the site to function properly.</li>
<li><strong>Analytics cookies</strong> — help us understand how visitors use our content so we can improve it.</li>
<li><strong>Advertising cookies</strong> — used by third parties such as Google to deliver relevant ads.</li>
</ul>

<h2>Third-Party Cookies</h2>
<p>We use trusted third-party services (such as analytics and advertising networks) that may set their own cookies. Google, as a third-party vendor, uses cookies to serve ads based on your visits to this and other sites.</p>

<h2>Managing Cookies</h2>
<p>You can control and delete cookies through your browser settings. Disabling some cookies may affect how the site works. You can also opt out of personalised Google advertising via Google&rsquo;s Ads Settings.</p>

<h2>Updates</h2>
<p>We may update this Cookie Policy periodically. Please check back for the latest version.</p>
',
	),

	array(
		'title'    => 'DMCA Policy',
		'slug'     => 'dmca-policy',
		'template' => 'templates/page-full-width.php',
		'excerpt'  => 'How to report copyright concerns.',
		'content'  => '
<p class="bgh-lead">Beauty Glow Hub respects the intellectual property rights of others and expects our users to do the same.</p>

<h2>Reporting Copyright Infringement</h2>
<p>If you believe that content on our website infringes your copyright, please send a written notice to us via our <a href="/contact/">Contact page</a> including the following:</p>
<ul>
<li>A description of the copyrighted work you claim has been infringed.</li>
<li>The exact URL where the allegedly infringing material is located.</li>
<li>Your contact information (name, email address).</li>
<li>A statement that you have a good-faith belief the use is not authorised.</li>
<li>A statement, under penalty of perjury, that the information is accurate and that you are the copyright owner or authorised to act on their behalf.</li>
<li>Your physical or electronic signature.</li>
</ul>

<h2>Our Response</h2>
<p>Upon receiving a valid notice, we will review and, where appropriate, remove or disable access to the material in question in a timely manner.</p>

<h2>Counter-Notice</h2>
<p>If you believe content was removed in error, you may submit a counter-notice with equivalent details and a statement under penalty of perjury.</p>

<h2>Repeat Infringers</h2>
<p>We may, at our discretion, restrict or remove access for users who repeatedly infringe copyright.</p>
',
	),

	array(
		'title'    => 'Sitemap',
		'slug'     => 'sitemap',
		'template' => 'templates/page-sitemap.php',
		'excerpt'  => 'A complete map of everything on Beauty Glow Hub.',
		'content'  => '',
	),
);
