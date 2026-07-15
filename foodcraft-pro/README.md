# FoodCraft Pro

A premium, production-ready **Shopify Online Store 2.0** theme built for artisan food, pantry, and recipe brands. Built with semantic HTML5, modern CSS3, and vanilla ES modules — no build step, no framework, no bloat.

## Highlights

- **Sections everywhere** — every page is composed of JSON templates + fully schema-driven sections. Nothing is hard-coded.
- **Theme App Extension compatible** — the header, footer, product page, and Instagram feed all expose `@app` block slots for app blocks (reviews, upsells, loyalty, etc.).
- **Mobile-first & accessible** — semantic landmarks, skip links, visible focus states, `aria-*` wiring on every interactive component, and full keyboard support in menus/modals/drawers.
- **Performance-minded** — lazy-loaded images with `srcset`/`sizes`, deferred non-critical JS, native `scroll-snap` carousels (no slider library), CSS containment-friendly layout, and font preloading.
- **Zero dependencies** — all interactivity is written in small, framework-free custom elements (Web Components) and ES modules.

## Pages & templates

| Page | Template | Notes |
| --- | --- | --- |
| Homepage | `templates/index.json` | Hero slider, categories, featured products, featured recipes, testimonials, Instagram feed, map |
| Shop (all products) | `templates/collection.json` applied to `/collections/all` | Same template/sections as Collection page — see below |
| Collection page | `templates/collection.json` | Banner + filterable, sortable, paginated product grid |
| Product page | `templates/product.json` | Gallery, variants, reviews, related & recently-viewed products |
| Recipe Blog | `templates/blog.recipes.json` | Assign to your "Recipes" blog |
| Recipe details | `templates/article.recipe.json` | Ingredients, instructions, nutrition, related recipes |
| Blog | `templates/blog.json` | Assign to any other blog |
| Blog article | `templates/article.json` | Standard article layout |
| About | `templates/page.about.json` | Story, values, team, testimonials |
| Contact | `templates/page.contact.json` | Contact form + map + mini FAQ |
| Reservation | `templates/page.reservation.json` | Table reservation form + map |
| FAQ | `templates/page.faq.json` | Searchable accordion |
| Search | `templates/search.json` | Tabs for products/recipes/pages |
| Wishlist | `templates/page.wishlist.json` | Client-rendered from `localStorage` |
| Compare | `templates/page.compare.json` | Client-rendered from `localStorage` |
| Cart | `templates/cart.json` | Used only when Theme Settings → Cart → "Page" is selected |
| 404 | `templates/404.json` | |

> **Why "Shop" and "Collection" share a template:** Shopify's own "All" collection (`/collections/all`) *is* the canonical shop-all-products page. Reusing `collection.json` for it (instead of a bespoke page) means filters, sorting, and pagination all work out of the box — point your "Shop" navigation link at `/collections/all`.

## Feature map

| Requirement | Implementation |
| --- | --- |
| Mega menu | `sections/header.liquid` + `snippets/mega-menu.liquid`, up to 3 menu levels, optional promo tile block matched by top-level item title |
| Sticky header | `<sticky-header>` custom element (`assets/header.js`), hides on scroll-down / reveals on scroll-up |
| Hero slider | `sections/hero-slider.liquid`, native scroll-snap `<slider-component>`, image or video slides |
| Featured products / recipes | `sections/featured-collection.liquid`, `sections/featured-recipes.liquid` |
| Categories | `sections/collection-list.liquid` |
| Testimonials | `sections/testimonials.liquid` |
| Newsletter | `sections/newsletter.liquid`, native Shopify customer form |
| Instagram feed | `sections/instagram-feed.liquid`, merchant-curated tiles + `@app` block for feed apps |
| Google Maps | `sections/google-map.liquid`, embeds a directions iframe from an address — no API key required |
| Ajax cart / Cart drawer | `sections/cart-drawer.liquid` + `assets/cart.js`, Cart AJAX API, Section Rendering API for live refresh |
| Wishlist | `assets/wishlist.js`, `localStorage`-backed, no app/account required |
| Product compare | `assets/compare.js`, up to 4 products, live comparison table |
| Product filters | `snippets/facets.liquid` + `assets/facets.js`, native Storefront Filtering API, fully Ajax |
| Quick view | `assets/quick-view.js` fetches `templates/product.quick-view.json` (`layout: false`) into a modal |
| Recently viewed | `assets/recently-viewed.js`, `localStorage`-backed carousel |
| Product reviews | `sections/product-reviews.liquid`. Reads `product.metafields.reviews.rating` / `rating_count` (same namespace as Shopify's legacy Product Reviews app) for the aggregate score, and `product.metafields.reviews.reviews_list` (a list-of-metaobjects metafield you define) for individual reviews. New reviews submit through Shopify's native `contact` form so they land in your inbox for moderation — no app required. Also exposes an `@app` block so a reviews app (Judge.me, Loox, etc.) can render there instead. |
| Predictive search | `sections/predictive-search.liquid` + `assets/predictive-search.js`, official Predictive Search API |
| Variant swatches | `snippets/variant-picker.liquid`, color swatches + text pills, live combinatorial availability |
| Countdown timer | `snippets/countdown-timer.liquid` + `assets/countdown.js`, product page block or any custom section |
| Related products | `sections/related-products.liquid`, Shopify Product Recommendations API |

## Theme editor customization

Every section ships with a full settings schema (colors, spacing, headings, images) and, where relevant, repeatable blocks so merchants can reorder, add, remove, and restyle content without touching code. Global brand controls (colors, type, corner radius, spacing, button style) live in **Theme settings**.

## Metafield setup (optional, for full recipe & review data)

The theme works out of the box with sensible empty states, but you can unlock richer content with these metafields:

**Article (recipe) metafields**, namespace `recipe`:
- `prep_time` (single line text) — e.g. `15 min`
- `cook_time` (single line text)
- `servings` (single line text) — e.g. `4 servings`
- `difficulty` (single line text) — e.g. `Easy`
- `ingredients` (list of single line text)
- `instructions` (list of single line text)
- `nutrition` (single line text)

**Product metafields**, namespace `reviews`:
- `rating` (rating) and `rating_count` (integer) — aggregate score shown on product cards and the product page
- `reviews_list` (list of metaobjects, fields: `author`, `rating`, `title`, `body`, `date`, `verified`) — individual review cards

## Local development & linting

This repo ships a `package.json` with the official Shopify CLI as a dev dependency so you can lint the theme without any store credentials:

```bash
cd foodcraft-pro
npm install
npm run theme:check   # Theme Check — lints Liquid, JSON schemas, translations, a11y & perf rules
```

To preview against a real store (requires Shopify CLI login):

```bash
npm run theme:dev     # shopify theme dev
npm run theme:push    # shopify theme push
```

## Folder structure

```
foodcraft-pro/
├── assets/         CSS & JS — one component/template per file, no bundler required
├── config/         settings_schema.json + settings_data.json (theme editor settings)
├── layout/         theme.liquid, password.liquid
├── locales/        en.default.json (storefront strings), en.default.schema.json (editor strings)
├── sections/       every page section + reusable content sections
├── snippets/       reusable partials (product card, icons, forms, pagination, etc.)
└── templates/      JSON templates wiring sections to each page type
```
