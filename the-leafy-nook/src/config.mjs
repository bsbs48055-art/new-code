// Central site configuration.
// IMPORTANT: Update `siteUrl` to your real domain before deploying and before applying to AdSense.
export const site = {
  name: "The Leafy Nook",
  tagline: "Indoor Plant Care for Small Spaces",
  description:
    "The Leafy Nook is a friendly, no-fluff guide to keeping houseplants alive and thriving in apartments, small bedrooms, and low-light spaces — real advice for real small-space plant parents.",
  siteUrl: "https://www.theleafynook.com", // TODO: replace with your real domain
  locale: "en_US",
  language: "en",
  author: "The Leafy Nook Editorial Team",
  email: "hello@theleafynook.com", // TODO: replace with your real contact email
  twitter: "@theleafynook", // TODO: replace or remove
  founded: 2026,
  logo: "/images/logo.png",
  ogImage: "/images/og-banner.jpg",
  themeColor: "#2d6a4f",
};

export const categories = [
  {
    slug: "plant-care-basics",
    name: "Plant Care Basics",
    description:
      "The fundamentals every houseplant owner needs — watering, light, soil, and feeding, explained without the jargon.",
    image: "/images/cat-basics.jpg",
    thumb: "/images/cat-basics-thumb.jpg",
  },
  {
    slug: "plant-guides",
    name: "Plant Guides",
    description:
      "In-depth, plant-by-plant care guides for the most popular low-maintenance houseplants.",
    image: "/images/cat-guides.jpg",
    thumb: "/images/cat-guides-thumb.jpg",
  },
  {
    slug: "small-space-living",
    name: "Small-Space Living",
    description:
      "Design ideas and practical tricks for fitting a thriving indoor jungle into apartments, dorms, and tiny homes.",
    image: "/images/cat-smallspace.jpg",
    thumb: "/images/cat-smallspace-thumb.jpg",
  },
  {
    slug: "plant-problem-solving",
    name: "Problem Solving",
    description:
      "Troubleshooting guides for yellowing leaves, pests, and the other things that go wrong — and how to fix them.",
    image: "/images/cat-problems.jpg",
    thumb: "/images/cat-problems-thumb.jpg",
  },
  {
    slug: "tools-and-gear",
    name: "Tools & Gear",
    description:
      "Honest, practical advice on the pots, lights, and tools that actually make a difference for indoor growers.",
    image: "/images/cat-tools.jpg",
    thumb: "/images/cat-tools-thumb.jpg",
  },
];

export const nav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
];
