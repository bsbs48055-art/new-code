# Beauty Glow Hub — Premium WordPress Beauty & Skincare Theme

Beauty Glow Hub is a **content-first, magazine-style WordPress theme** built for
beauty, skincare, hair care, makeup and wellness publishers. It is engineered
for **Google AdSense approval**: fast, accessible, semantic, SEO-ready and full
of trust signals — with an elegant, luxury-yet-simple design.

> Not an eCommerce theme. This is a trustworthy content blog, following Google's
> Helpful Content guidelines and AdSense layout best practices.

---

## Highlights

- **Design** — clean, elegant magazine layout, generous white space, professional
  typography (Playfair Display + Inter), fully responsive, minimal animation.
- **Brand palette** — Primary `#E91E63`, Secondary `#F8BBD0`, Accent `#D4AF37`,
  Text `#333333`, Background `#FFFFFF`, Light `#FFF8FB`.
- **SEO** — semantic HTML5, Schema.org JSON-LD (Organization, WebSite, Article/
  BlogPosting, BreadcrumbList, Person, FAQPage), Open Graph, Twitter Cards,
  meta descriptions, clean permalinks, breadcrumbs, native XML sitemap support.
- **Speed** — one small CSS file, ~2 KB of vanilla JS, lazy-loaded/responsive
  images, `fetchpriority` on hero images, font `display=swap` + preconnect, no
  heavy libraries, no jQuery on the front end.
- **Blog features** — breadcrumbs, author box, reading time, automatic Table of
  Contents, related articles, search, category/tag/date/author archives, clean
  sidebar, popular & recent posts, newsletter.
- **AdSense-ready** — natural, non-intrusive ad slots (header banner, below
  title, mid-article, sidebar, footer) configured from the Customizer. Paste an
  AdSense Publisher ID to load the ad script.
- **Trust signals** — About, Contact (working form), Editorial Policy, Privacy,
  Terms, Disclaimer, Affiliate Disclosure, Cookie Policy, DMCA, author profiles,
  social links, newsletter.

## Theme Structure

```
beauty-glow-hub/
├── style.css              Theme header + base fallbacks
├── theme.json             Editor palette, fonts, layout
├── functions.php          Setup, enqueues, menus, widgets, includes
├── header.php  footer.php  index.php  front-page.php
├── single.php  archive.php  page.php  search.php  404.php
├── sidebar.php  comments.php  searchform.php
├── inc/                   Modular features
│   ├── template-tags.php  template-functions.php
│   ├── breadcrumbs.php    reading-time.php  table-of-contents.php
│   ├── schema.php         seo.php           ads.php
│   ├── customizer.php     widgets.php       class-bgh-walker-nav.php
├── template-parts/        Reusable partials (hero, cards, author, share…)
├── templates/             Custom page templates
│   ├── page-full-width.php (legal), page-contact.php, page-faq.php,
│   ├── page-authors.php, page-sitemap.php
├── assets/ css/ js/ images/ fonts/
└── demo/                  Content plan + one-command demo installer
```

## Installation

1. Copy the `beauty-glow-hub` folder into `wp-content/themes/`.
2. In **Appearance → Themes**, activate **Beauty Glow Hub**.
3. (Optional) Load the demo content (see below).
4. Configure social links, ad slots and newsletter in **Appearance → Customize**.

## One-Command Demo Content

The theme ships with a WP-CLI seeder that creates 10 categories, 3 authors,
all trust/legal pages, **29 genuine demo articles** (incl. 11 in-depth featured
guides), menus, widgets and a static homepage:

```bash
wp eval-file wp-content/themes/beauty-glow-hub/demo/seed.php
```

See `demo/content-plan.md` for the full **50-title SEO content strategy**.

## Google AdSense Notes

- Add your Publisher ID under **Customize → Advertisement Slots** to load
  `adsbygoogle.js`; paste ad unit code into any of the five slots.
- Placements follow AdSense best practices: labelled "Advertisement", no
  accidental clicks, no ads above the logo, and a mid-article unit only on
  longer posts.
- Empty slots show a subtle placeholder in demo mode; disable via the
  `bgh_show_ad_placeholders` filter on production.

## Accessibility & Standards

- Skip link, semantic landmarks, ARIA on menus/accordions, visible focus states,
  `prefers-reduced-motion` support and keyboard-friendly navigation.
- Translation-ready (`beauty-glow-hub` text domain, `languages/`).
- Licensed under the GNU GPL v2 or later.
