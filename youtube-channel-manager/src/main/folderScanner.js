'use strict';

const fs = require('fs');
const path = require('path');

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.mkv',
  '.avi',
  '.webm',
  '.m4v',
  '.flv',
  '.wmv',
  '.mpg',
  '.mpeg'
]);

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * A content folder can optionally contain a `channel.json` (or
 * `defaults.json`) file with fallback values applied to every video that
 * doesn't specify its own metadata, e.g.:
 * {
 *   "privacy": "unlisted",
 *   "tags": ["vlog", "daily"],
 *   "descriptionTemplate": "Thanks for watching!\n\n#shorts"
 * }
 */
function loadFolderDefaults(folderPath) {
  const candidates = ['channel.json', 'defaults.json', 'folder.json'];
  for (const name of candidates) {
    const data = readJsonSafe(path.join(folderPath, name));
    if (data) return data;
  }
  return {};
}

/**
 * Scans a content folder (non-recursive by default) for video files and
 * resolves per-video metadata using, in priority order:
 *   1. <basename>.json          -> full metadata object
 *   2. <basename>.title.txt     -> title override
 *   3. <basename>.description.txt / <basename>.desc.txt -> description override
 *   4. <basename>.tags.txt      -> comma or newline separated tags
 *   5. Folder-level defaults (channel.json / defaults.json)
 *   6. The filename itself (humanized) as a last-resort title
 */
function scanContentFolder(folderPath, options = {}) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { folderPath, exists: false, videos: [], defaults: {} };
  }

  const recursive = Boolean(options.recursive);
  const defaults = loadFolderDefaults(folderPath);
  const entries = listFilesRecursive(folderPath, recursive);
  const videos = [];

  for (const filePath of entries) {
    const ext = path.extname(filePath).toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext)) continue;

    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ext);

    const sidecarJson = readJsonSafe(path.join(dir, `${base}.json`));
    const titleOverride = readTextSafe(path.join(dir, `${base}.title.txt`));
    const descriptionOverride =
      readTextSafe(path.join(dir, `${base}.description.txt`)) ||
      readTextSafe(path.join(dir, `${base}.desc.txt`));
    const tagsOverride = readTextSafe(path.join(dir, `${base}.tags.txt`));

    const stat = fs.statSync(filePath);

    const humanizedTitle = base
      .replace(/[_\-.]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const metadata = {
      title:
        (sidecarJson && sidecarJson.title) ||
        titleOverride ||
        humanizedTitle,
      description:
        (sidecarJson && sidecarJson.description) ||
        descriptionOverride ||
        defaults.descriptionTemplate ||
        '',
      tags: parseTags((sidecarJson && sidecarJson.tags) || tagsOverride || defaults.tags),
      privacy: (sidecarJson && sidecarJson.privacy) || defaults.privacy || 'private',
      playlist: (sidecarJson && sidecarJson.playlist) || defaults.playlist || null,
      madeForKids:
        typeof (sidecarJson && sidecarJson.madeForKids) === 'boolean'
          ? sidecarJson.madeForKids
          : typeof defaults.madeForKids === 'boolean'
            ? defaults.madeForKids
            : false,
      publishAt: (sidecarJson && sidecarJson.publishAt) || null,
      thumbnail: resolveThumbnail(dir, base, sidecarJson)
    };

    videos.push({
      id: filePath,
      filePath,
      fileName: path.basename(filePath),
      sizeBytes: stat.size,
      mtimeMs: stat.mtimeMs,
      metadata
    });
  }

  videos.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));

  return { folderPath, exists: true, videos, defaults };
}

function resolveThumbnail(dir, base, sidecarJson) {
  if (sidecarJson && sidecarJson.thumbnail) {
    const p = path.isAbsolute(sidecarJson.thumbnail)
      ? sidecarJson.thumbnail
      : path.join(dir, sidecarJson.thumbnail);
    if (fs.existsSync(p)) return p;
  }
  for (const ext of ['.jpg', '.jpeg', '.png']) {
    const candidate = path.join(dir, `${base}.thumb${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  return String(raw)
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function listFilesRecursive(dir, recursive) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) results.push(...listFilesRecursive(fullPath, recursive));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

module.exports = { scanContentFolder, VIDEO_EXTENSIONS };
