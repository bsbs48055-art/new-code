import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

import { site, categories, nav } from "./config.mjs";
import { formatDate, isoDate, readingTime } from "./utils.mjs";
import { renderLayout, adSlot, breadcrumbs } from "./templates/layout.mjs";
import {
  postCard,
  categoryCard,
  pagination,
  tocFromHeadings,
  sidebar,
  relatedPosts,
} from "./templates/components.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const PUBLIC_DIR = path.join(ROOT, "public");
const DIST_DIR = path.join(ROOT, "site");

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function renderMarkdownWithHeadingIds(source) {
  const tokens = md.parse(source, {});
  const headings = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "heading_open" && token.tag === "h2") {
      const inline = tokens[i + 1];
      const text = inline ? inline.content : "";
      const id = slugifyHeading(text);
      token.attrSet("id", id);
      headings.push({ id, text });
    }
  }
  const html = md.renderer.render(tokens, md.options, {});
  return { html, headings };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeHtml(relPath, html) {
  const outPath = path.join(DIST_DIR, relPath);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, html);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function loadPosts() {
  const postsDir = path.join(CONTENT_DIR, "posts");
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const { data, content } = matter(raw);
    const { html, headings } = renderMarkdownWithHeadingIds(content);
    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      category: data.category,
      tags: data.tags || [],
      image: data.image,
      imageAlt: data.imageAlt || data.title,
      featured: !!data.featured,
      readingTime: readingTime(content),
      html,
      headings,
      rawWordCount: content.trim().split(/\s+/).length,
    };
  });
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

function loadPage(slugName) {
  const filePath = path.join(CONTENT_DIR, "pages", `${slugName}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const { html } = renderMarkdownWithHeadingIds(content);
  return { title: data.title, description: data.description, html };
}

function categoryMeta(slug) {
  return categories.find((c) => c.slug === slug);
}

function buildJsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.siteUrl,
    logo: `${site.siteUrl}${site.logo}`,
    description: site.description,
  };
}

function buildJsonLdWebsite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.siteUrl,
    description: site.description,
  };
}

function buildJsonLdArticle(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${site.siteUrl}${post.image}`,
    datePublished: isoDate(post.date),
    dateModified: isoDate(post.date),
    author: {
      "@type": "Organization",
      name: site.author,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: `${site.siteUrl}${site.logo}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${site.siteUrl}/blog/${post.slug}/`,
    },
  };
}

// ---------- Page builders ----------

function buildHome(posts) {
  const featured = posts.filter((p) => p.featured).slice(0, 3);
  const featuredFallback = featured.length ? featured : posts.slice(0, 3);
  const recent = posts.slice(0, 6);

  const content = `
  <section class="hero">
    <div class="container">
      <div>
        <h1>Indoor plant care for people with small spaces, not big gardens.</h1>
        <p class="lead">${site.description}</p>
        <div class="hero-actions">
          <a class="btn" href="/blog/">Browse All Guides</a>
          <a class="btn btn-outline" href="/about/">About This Site</a>
        </div>
        <div class="category-strip">
          ${categories.map((c) => `<a class="pill" href="/category/${c.slug}/">${c.name}</a>`).join("\n")}
        </div>
      </div>
      <div class="hero-art">
        <img src="/images/og-banner.jpg" alt="Illustration of houseplants in a cozy small apartment corner" width="1200" height="630" />
      </div>
    </div>
  </section>

  <div class="container">
    ${adSlot({ type: "leaderboard", label: "Advertisement" })}
  </div>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Start here</span>
          <h2>Featured Guides</h2>
        </div>
        <a href="/blog/">View all articles &rarr;</a>
      </div>
      <div class="grid cols-3">
        ${featuredFallback.map(postCard).join("\n")}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Explore by topic</span>
          <h2>Browse Categories</h2>
        </div>
      </div>
      <div class="grid cols-3">
        ${categories.map(categoryCard).join("\n")}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="container">
      ${adSlot({ type: "rectangle", label: "Advertisement" })}
    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Fresh off the shelf</span>
          <h2>Latest Articles</h2>
        </div>
        <a href="/blog/">View all articles &rarr;</a>
      </div>
      <div class="grid cols-3">
        ${recent.map(postCard).join("\n")}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="container">
      <div class="cta-band">
        <div>
          <h2>Get one plant tip a week.</h2>
          <p>Short, practical, no spam — just the kind of advice we wish someone had told us before we killed our first calathea.</p>
        </div>
        <a class="btn" href="/contact/">Subscribe via Contact</a>
      </div>
    </div>
  </section>
  `;

  writeHtml(
    "index.html",
    renderLayout({
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      path: "/",
      content,
      jsonLd: [buildJsonLdOrganization(), buildJsonLdWebsite()],
    })
  );
}

function buildBlogIndex(posts) {
  const perPage = 9;
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));

  for (let page = 1; page <= totalPages; page++) {
    const slice = posts.slice((page - 1) * perPage, page * perPage);
    const bc = breadcrumbs([
      { label: "Home", href: "/" },
      { label: "Blog" },
    ]);

    const content = `
    <div class="container">
      ${bc.html}
      <div class="page-hero" style="text-align:left; padding-top:6px;">
        <h1>All Articles</h1>
        <p style="margin-left:0;">Practical, no-fluff houseplant care guides for small-space living.</p>
      </div>
      <div class="category-strip">
        <a class="pill active" href="/blog/">All</a>
        ${categories.map((c) => `<a class="pill" href="/category/${c.slug}/">${c.name}</a>`).join("\n")}
      </div>
      <div class="section" style="padding-bottom:0;">
        <div class="grid cols-3">
          ${slice.map(postCard).join("\n")}
        </div>
        ${pagination(page, totalPages, "/blog/")}
      </div>
    </div>`;

    const relPath = page === 1 ? "blog/index.html" : `blog/page/${page}/index.html`;
    const urlPath = page === 1 ? "/blog/" : `/blog/page/${page}/`;

    writeHtml(
      relPath,
      renderLayout({
        title: page === 1 ? "Blog" : `Blog — Page ${page}`,
        description: "All houseplant care articles from The Leafy Nook.",
        path: urlPath,
        content,
        jsonLd: [bc.jsonLd],
      })
    );
  }
}

function buildCategoryPages(posts) {
  for (const cat of categories) {
    const catPosts = posts.filter((p) => p.category === cat.slug);
    const bc = breadcrumbs([
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog/" },
      { label: cat.name },
    ]);

    const content = `
    <div class="container">
      ${bc.html}
      <div class="page-hero" style="text-align:left; padding-top:6px;">
        <h1>${cat.name}</h1>
        <p style="margin-left:0; max-width: 70ch;">${cat.description}</p>
      </div>
      <div class="category-strip">
        <a class="pill" href="/blog/">All</a>
        ${categories
          .map(
            (c) =>
              `<a class="pill${c.slug === cat.slug ? " active" : ""}" href="/category/${c.slug}/">${c.name}</a>`
          )
          .join("\n")}
      </div>
      <div class="section">
        <div class="grid cols-3">
          ${catPosts.map(postCard).join("\n") || "<p>New articles for this category are on the way — check back soon.</p>"}
        </div>
      </div>
    </div>`;

    writeHtml(
      `category/${cat.slug}/index.html`,
      renderLayout({
        title: cat.name,
        description: cat.description,
        path: `/category/${cat.slug}/`,
        content,
        ogImage: cat.image,
        jsonLd: [bc.jsonLd],
      })
    );
  }
}

function buildPostPages(posts) {
  for (const post of posts) {
    const cat = categoryMeta(post.category);
    const related = posts
      .filter((p) => p.slug !== post.slug && p.category === post.category)
      .slice(0, 3);
    const fallbackRelated = related.length
      ? related
      : posts.filter((p) => p.slug !== post.slug).slice(0, 3);

    const bc = breadcrumbs([
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog/" },
      { label: cat ? cat.name : post.category, href: `/category/${post.category}/` },
      { label: post.title },
    ]);

    const toc = tocFromHeadings(post.headings);

    const content = `
    <div class="container">
      ${bc.html}
      <div class="post-hero">
        <div class="post-cat"><a href="/category/${post.category}/">${cat ? cat.name : post.category}</a></div>
        <h1>${post.title}</h1>
        <div class="post-meta">
          <span class="author">
            <img src="/images/logo.png" alt="" width="24" height="24" style="border-radius:50%;" />
            ${site.author}
          </span>
          <span>${formatDate(post.date)}</span>
          <span>&middot;</span>
          <span>${post.readingTime}</span>
        </div>
      </div>
      <div class="post-featured-image">
        <img src="${post.image}" alt="${post.imageAlt}" width="1200" height="675" />
      </div>

      <div class="post-layout">
        <article>
          ${toc}
          <div class="article-content">
            ${post.html}
          </div>

          ${adSlot({ type: "in-article", label: "Advertisement" })}

          <div class="tags-row">
            ${post.tags.map((t) => `<span class="pill">${t}</span>`).join("\n")}
          </div>

          <div class="author-box">
            <img src="/images/logo.png" alt="${site.name} logo" width="56" height="56" />
            <div>
              <h4>${site.author}</h4>
              <p>We write research-backed, practically tested houseplant care guides for apartments and other small spaces. Read more on our <a href="/about/">About page</a>.</p>
            </div>
          </div>

          ${relatedPosts(fallbackRelated)}
        </article>
        ${sidebar({ recentPosts: posts.filter((p) => p.slug !== post.slug), activeCategory: post.category })}
      </div>
    </div>`;

    writeHtml(
      `blog/${post.slug}/index.html`,
      renderLayout({
        title: post.title,
        description: post.description,
        path: `/blog/${post.slug}/`,
        content,
        ogImage: post.image,
        type: "article",
        jsonLd: [buildJsonLdArticle(post), bc.jsonLd],
      })
    );
  }
}

function buildStaticPage(slugName, urlPath) {
  const page = loadPage(slugName);
  const bc = breadcrumbs([{ label: "Home", href: "/" }, { label: page.title }]);
  const content = `
  <div class="container">
    ${bc.html}
    <div class="page-hero">
      <h1>${page.title}</h1>
    </div>
    <div class="page-content section" style="padding-top:10px;">
      ${page.html}
    </div>
  </div>`;

  writeHtml(
    `${urlPath}/index.html`.replace(/^\//, ""),
    renderLayout({
      title: page.title,
      description: page.description,
      path: `/${urlPath}/`,
      content,
      jsonLd: [bc.jsonLd],
    })
  );
}

function buildContactPage() {
  const bc = breadcrumbs([{ label: "Home", href: "/" }, { label: "Contact" }]);
  const content = `
  <div class="container">
    ${bc.html}
    <div class="page-hero">
      <h1>Contact Us</h1>
      <p>Questions, corrections, collaboration ideas, or just want to tell us about your plant? We'd love to hear from you.</p>
    </div>
    <div class="section contact-grid">
      <div>
        <form action="https://formspree.io/f/your-form-id" method="POST">
          <div class="form-field">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div class="form-field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-field">
            <label for="subject">Subject</label>
            <input type="text" id="subject" name="subject" required />
          </div>
          <div class="form-field">
            <label for="message">Message</label>
            <textarea id="message" name="message" required></textarea>
          </div>
          <button class="btn" type="submit">Send Message</button>
          <p class="small-muted" style="margin-top:14px;">
            This form currently points to a placeholder endpoint. Connect it to a form
            service like Formspree, Getform, or your own backend before going live —
            see the README for instructions.
          </p>
        </form>
      </div>
      <div class="contact-info-card">
        <h3>Other ways to reach us</h3>
        <div class="info-row">
          <strong>Email:</strong>
          <span>${site.email}</span>
        </div>
        <div class="info-row">
          <strong>Response time:</strong>
          <span>We typically reply within 3-5 business days.</span>
        </div>
        <div class="info-row">
          <strong>For corrections:</strong>
          <span>Please include a link to the specific article and a brief description of the issue.</span>
        </div>
      </div>
    </div>
  </div>`;

  writeHtml(
    "contact/index.html",
    renderLayout({
      title: "Contact",
      description: "Get in touch with The Leafy Nook — questions, corrections, and collaboration inquiries welcome.",
      path: "/contact/",
      content,
      jsonLd: [bc.jsonLd],
    })
  );
}

function build404() {
  const content = `
  <div class="container">
    <div class="error-page">
      <p class="code">404</p>
      <h1>This page must have wilted.</h1>
      <p class="small-muted">The page you're looking for doesn't exist or may have moved.</p>
      <div style="margin-top:24px;">
        <a class="btn" href="/">Back to Home</a>
        <a class="btn btn-outline" href="/blog/" style="margin-left:10px;">Browse Articles</a>
      </div>
    </div>
  </div>`;

  writeHtml(
    "404.html",
    renderLayout({
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist.",
      path: "/404.html",
      content,
      noIndex: true,
    })
  );
}

function buildSitemap(posts) {
  const staticUrls = [
    "/",
    "/blog/",
    "/about/",
    "/contact/",
    "/editorial-policy/",
    "/privacy-policy/",
    "/terms-of-service/",
    "/disclaimer/",
    "/cookie-policy/",
    ...categories.map((c) => `/category/${c.slug}/`),
  ];
  const postUrls = posts.map((p) => `/blog/${p.slug}/`);
  const all = [...staticUrls, ...postUrls];

  const urlEntries = all
    .map(
      (u) => `  <url>
    <loc>${site.siteUrl}${u}</loc>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), xml);
}

function buildRobotsTxt() {
  const txt = `User-agent: *
Allow: /

Sitemap: ${site.siteUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), txt);
}

function buildAdsTxt() {
  const txt = `# Replace with the line Google AdSense gives you after you're approved, e.g.:
# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
`;
  fs.writeFileSync(path.join(DIST_DIR, "ads.txt"), txt);
}

function buildManifest() {
  const manifest = {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f0",
    theme_color: site.themeColor,
    icons: [
      { src: "/images/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  fs.writeFileSync(path.join(DIST_DIR, "site.webmanifest"), JSON.stringify(manifest, null, 2));
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  const posts = loadPosts();

  buildHome(posts);
  buildBlogIndex(posts);
  buildCategoryPages(posts);
  buildPostPages(posts);
  buildStaticPage("about", "about");
  buildStaticPage("editorial-policy", "editorial-policy");
  buildStaticPage("privacy-policy", "privacy-policy");
  buildStaticPage("terms-of-service", "terms-of-service");
  buildStaticPage("disclaimer", "disclaimer");
  buildStaticPage("cookie-policy", "cookie-policy");
  buildContactPage();
  build404();
  buildSitemap(posts);
  buildRobotsTxt();
  buildAdsTxt();
  buildManifest();

  copyDir(PUBLIC_DIR, DIST_DIR);

  console.log(`Built ${posts.length} posts + static pages into site/`);
}

main();
