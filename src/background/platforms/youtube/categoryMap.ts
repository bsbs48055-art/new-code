/** Maps human-friendly category names (used across the UI) to YouTube's numeric video category IDs. */
export const YOUTUBE_CATEGORY_IDS: Record<string, string> = {
  'Film & Animation': '1',
  'Autos & Vehicles': '2',
  Music: '10',
  'Pets & Animals': '15',
  Sports: '17',
  'Travel & Events': '19',
  Gaming: '20',
  'People & Blogs': '22',
  Comedy: '23',
  Entertainment: '24',
  'News & Politics': '25',
  'Howto & Style': '26',
  Education: '27',
  'Science & Technology': '28',
  'Nonprofits & Activism': '29',
};

export function resolveCategoryId(name: string | undefined): string {
  if (!name) return YOUTUBE_CATEGORY_IDS['People & Blogs'];
  return YOUTUBE_CATEGORY_IDS[name] ?? YOUTUBE_CATEGORY_IDS['People & Blogs'];
}
