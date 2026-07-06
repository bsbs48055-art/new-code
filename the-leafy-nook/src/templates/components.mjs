import { formatDate } from "../utils.mjs";
import { categories } from "../config.mjs";

function categoryName(slug) {
  const cat = categories.find((c) => c.slug === slug);
  return cat ? cat.name : slug;
}

export function postCard(post) {
  return `
  <article class="card">
    <a class="card-thumb" href="/blog/${post.slug}/" tabindex="-1">
      <img src="${post.image}" alt="${post.imageAlt || post.title}" loading="lazy" width="600" height="338" />
    </a>
    <div class="card-body">
      <div class="card-cat"><a href="/category/${post.category}/">${categoryName(post.category)}</a></div>
      <h3><a href="/blog/${post.slug}/">${post.title}</a></h3>
      <p>${post.description}</p>
      <div class="card-meta">
        <span>${formatDate(post.date)}</span>
        <span>&middot;</span>
        <span>${post.readingTime}</span>
      </div>
    </div>
  </article>`;
}

export function categoryCard(cat) {
  return `
  <article class="card">
    <a class="card-thumb" href="/category/${cat.slug}/" tabindex="-1">
      <img src="${cat.thumb}" alt="${cat.name}" loading="lazy" width="600" height="338" />
    </a>
    <div class="card-body">
      <h3><a href="/category/${cat.slug}/">${cat.name}</a></h3>
      <p>${cat.description}</p>
      <span class="read-more">Browse articles &rarr;</span>
    </div>
  </article>`;
}

export function pagination(current, total, basePath) {
  if (total <= 1) return "";
  let links = "";
  for (let i = 1; i <= total; i++) {
    const href = i === 1 ? basePath : `${basePath}page/${i}/`;
    if (i === current) {
      links += `<span class="current">${i}</span>`;
    } else {
      links += `<a href="${href}">${i}</a>`;
    }
  }
  return `<nav class="pagination" aria-label="Pagination">${links}</nav>`;
}

export function tocFromHeadings(headings) {
  if (!headings.length) return "";
  const items = headings
    .map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`)
    .join("");
  return `
  <div class="toc">
    <h4>In this article</h4>
    <ol>${items}</ol>
  </div>`;
}

export function sidebar({ recentPosts = [], activeCategory = null }) {
  const recent = recentPosts
    .slice(0, 5)
    .map(
      (p) => `<li><a href="/blog/${p.slug}/">${p.title}</a></li>`
    )
    .join("");

  const cats = categories
    .map(
      (c) =>
        `<li><a href="/category/${c.slug}/"${activeCategory === c.slug ? ' style="color: var(--green-700); font-weight:700;"' : ""}>${c.name}</a></li>`
    )
    .join("");

  return `
  <aside>
    <div class="sidebar-widget newsletter">
      <h4>Get the Weekly Leaf</h4>
      <p>One short email a week with a plant tip, a reader question answered, and nothing else. No spam, unsubscribe anytime.</p>
      <form action="https://example.com/subscribe" method="post">
        <label for="sidebar-email" class="visually-hidden">Email address</label>
        <input type="email" id="sidebar-email" name="email" placeholder="you@email.com" required />
        <button class="btn" type="submit">Subscribe</button>
      </form>
    </div>
    <div class="sidebar-widget">
      <h4>Recent Articles</h4>
      <ul>${recent}</ul>
    </div>
    <div class="sidebar-widget">
      <h4>Categories</h4>
      <ul>${cats}</ul>
    </div>
  </aside>`;
}

export function relatedPosts(posts) {
  if (!posts.length) return "";
  return `
  <section class="related-posts">
    <div class="section-head">
      <h2>Keep Reading</h2>
    </div>
    <div class="grid cols-3">
      ${posts.map(postCard).join("\n")}
    </div>
  </section>`;
}
