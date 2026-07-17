import { site, nav } from "../config.mjs";

function navLinks(activePath) {
  return nav
    .map((item) => {
      const active = activePath === item.href ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${active}>${item.label}</a>`;
    })
    .join("\n        ");
}

export function adSlot({ type = "leaderboard", label = "Advertisement" } = {}) {
  return `
  <div class="ad-slot ad-${type}">
    <div class="ad-label">${label}</div>
    <div class="ad-placeholder" aria-hidden="true">
      <!--
        AdSense ad unit goes here once your account is approved.
        Example (replace ca-pub-XXXXXXXXXXXXXXXX and the slot id):

        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="0000000000"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      -->
      Ad space
    </div>
  </div>`;
}

export function breadcrumbs(items) {
  // items: [{label, href}], last item has no href
  const listItems = items
    .map((item, i) => {
      const isLast = i === items.length - 1;
      return isLast
        ? `<span aria-current="page">${item.label}</span>`
        : `<a href="${item.href}">${item.label}</a><span class="sep">/</span>`;
    })
    .join("");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? `${site.siteUrl}${item.href}` : undefined,
    })),
  };

  return {
    html: `<nav class="breadcrumbs" aria-label="Breadcrumb">${listItems}</nav>`,
    jsonLd,
  };
}

export function renderLayout({
  title,
  description,
  path = "/",
  content,
  bodyClass = "",
  ogImage = site.ogImage,
  jsonLd = [],
  type = "website",
  noIndex = false,
}) {
  const fullTitle = title === site.name ? title : `${title} | ${site.name}`;
  const canonical = `${site.siteUrl}${path}`;
  const jsonLdBlocks = jsonLd
    .filter(Boolean)
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="${site.language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fullTitle}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  ${noIndex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow" />'}

  <!-- Open Graph -->
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${fullTitle}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${site.name}" />
  <meta property="og:image" content="${site.siteUrl}${ogImage}" />
  <meta property="og:locale" content="${site.locale}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${fullTitle}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${site.siteUrl}${ogImage}" />

  <!-- Favicons -->
  <link rel="icon" href="/images/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <meta name="theme-color" content="${site.themeColor}" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="/css/style.css" />

  <!--
    Google AdSense verification / auto ads snippet.
    Uncomment and add your publisher ID once you have applied for AdSense:

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
  -->

  ${jsonLdBlocks}
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${renderHeader(path)}
  <main id="main-content">
    ${content}
  </main>
  ${renderFooter()}
  <script src="/js/main.js" defer></script>
</body>
</html>`;
}

function renderHeader(activePath) {
  return `
  <header class="site-header">
    <div class="container">
      <a class="brand" href="/">
        <img src="${site.logo}" alt="${site.name} logo" width="40" height="40" />
        <span>
          ${site.name}
          <span class="tagline-mini">${site.tagline}</span>
        </span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="mainNav">
        <span></span><span></span><span></span>
      </button>
      <nav class="main-nav" id="mainNav">
        ${navLinks(activePath)}
      </nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div>
          <a class="brand" href="/">
            <img src="${site.logo}" alt="${site.name} logo" width="40" height="40" />
            <span>${site.name}</span>
          </a>
          <p class="about-blurb">${site.description}</p>
        </div>
        <div>
          <h5>Explore</h5>
          <ul>
            <li><a href="/blog/">All Articles</a></li>
            <li><a href="/category/plant-care-basics/">Plant Care Basics</a></li>
            <li><a href="/category/plant-guides/">Plant Guides</a></li>
            <li><a href="/category/small-space-living/">Small-Space Living</a></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="/about/">About Us</a></li>
            <li><a href="/contact/">Contact</a></li>
            <li><a href="/editorial-policy/">Editorial Policy</a></li>
          </ul>
        </div>
        <div>
          <h5>Legal</h5>
          <ul>
            <li><a href="/privacy-policy/">Privacy Policy</a></li>
            <li><a href="/terms-of-service/">Terms of Service</a></li>
            <li><a href="/disclaimer/">Disclaimer</a></li>
            <li><a href="/cookie-policy/">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-disclaimer">
        ${site.name} provides general educational information about houseplant care for informational purposes only. It is not professional horticultural, agricultural, or veterinary advice.
        Always research the specific needs of any plant before bringing it into a home with children or pets. See our <a href="/disclaimer/">Disclaimer</a> for details.
      </p>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${site.name}. All rights reserved.</span>
        <span>Made with care for small-space plant lovers.</span>
      </div>
    </div>
  </footer>`;
}
