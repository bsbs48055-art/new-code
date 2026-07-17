# Beauty Glow Hub — Full SEO Setup (Rank on Google)

The theme is already SEO‑optimized (fast, mobile, clean HTML, Schema.org,
Open Graph, Twitter Cards, and smart `robots` rules). Do the steps below to get
your blog indexed and ranking. Work through them top to bottom.

---

## 1. Turn on Blogger's built‑in SEO settings

**Settings → Meta tags**
- **Enable search description → ON**
- Add a homepage description (150–160 chars) with your main keywords, e.g.
  *"Beauty Glow Hub shares honest skincare, hair care and makeup tips, plus tested beauty product reviews to help you glow."*

**Settings → Crawlers and indexing**
- **Enable custom robots.txt → ON**, then paste (replace the domain):

```
User-agent: *
Disallow: /search
Allow: /
Sitemap: https://YOURBLOG.blogspot.com/sitemap.xml
```

- **Enable custom robots header tags → ON**, then set:
  - **Home page:** `all`, `noodp`
  - **Archive and search pages:** `noindex`, `noodp`
  - **Posts and pages:** `all`, `noodp`

> This stops Google from wasting crawl budget on duplicate label/search pages —
> a very common Blogger SEO problem. The theme also sends the same signals.

---

## 2. Submit your site to Google Search Console (most important)

1. Go to **search.google.com/search-console** and add your site (URL prefix).
2. Verify — for Blogger, use the **HTML tag** method: copy the
   `<meta name="google-site-verification" ...>` tag and paste it in
   **Blogger → Settings → Meta tags → (or Theme → Edit HTML, right under `&lt;head&gt;`)**.
3. After verifying, open **Sitemaps** and submit:
   - `sitemap.xml`
   - `atom.xml?redirect=false&start-index=1&max-results=500`
4. Use **URL Inspection → Request indexing** for your homepage and each new post
   to get indexed faster.

Also add your site to **Bing Webmaster Tools** (bing.com/webmasters) for extra traffic.

---

## 3. Per‑post SEO (do this for every article)

- **Title:** put the main keyword near the front, keep it under ~60 characters.
  Example: *"Best Vitamin C Serums for Brighter Skin (2026)"*.
- **Search Description:** fill the **Search Description** box on the right when
  editing a post (150–160 chars, include the keyword). The theme outputs this as
  your meta description.
- **Permalink:** use **Custom Permalink** → short, keyword‑rich, hyphenated,
  e.g. `best-vitamin-c-serums`.
- **First paragraph:** include the keyword naturally in the first 1–2 sentences.
- **Headings:** one H1 (the title) + H2/H3 for sections (the articles already do this).
- **Image alt text:** describe the image with keywords (the included articles already have alt text).
- **Internal links:** link each post to 2–3 related posts/labels (the articles include these).
- **Labels:** add 1–3 relevant labels (categories) — not 10.
- **Outbound links:** link to one reputable source where helpful.

---

## 4. Content strategy to actually rank

- Target **long‑tail keywords** (what people type), e.g. *"best moisturizer for oily skin"* rather than just *"moisturizer"*.
- Publish **consistently** — 2–3 quality posts per week beats 20 at once then nothing.
- Write **comprehensive** posts (900–1500+ words) that fully answer the topic.
- Add a **FAQ** section to posts (the included articles do — it can win "People also ask" spots; FAQ schema is built in).
- Update older posts every few months (freshness helps).
- Build a few **backlinks**: share on Pinterest (huge for beauty), Instagram,
  Facebook groups, and answer questions on Quora/Reddit with a helpful link.

---

## 5. Already handled by the theme ✅

- Mobile‑responsive, fast, minimal JS (Core Web Vitals friendly)
- Semantic HTML5, proper heading structure, breadcrumbs
- **Schema.org**: Organization, WebSite (+ Sitelinks Search Box), **BlogPosting** on posts, **FAQPage** in articles
- **Open Graph + Twitter Cards** with post images (great link previews)
- `robots` meta: index posts/pages/home, `noindex` search/label/archive (no duplicate content)
- Lazy‑loaded, resized images with alt text
- Canonical URLs (via Blogger) and clean permalinks

---

### Quick launch checklist
- [ ] Enable search description + custom robots.txt + robots header tags
- [ ] Verify in Google Search Console + submit sitemap
- [ ] Give every post a Search Description + custom permalink
- [ ] Publish 15–20 posts, then apply for AdSense
- [ ] Share every post on Pinterest & social media
