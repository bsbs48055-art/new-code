/**
 * Minimal, dependency-free CSV parser sufficient for the `schedule.csv`
 * convention used by folder import (columns: fileName, publishAt, platform,
 * title). Supports quoted fields and escaped quotes ("").
 */

import type { ScheduleCsvRow } from '@shared/types/index';

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** Parses a `schedule.csv` file's text content into structured rows. */
export function parseScheduleCsv(csvText: string): ScheduleCsvRow[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const fileNameIdx = header.indexOf('filename');
  const publishAtIdx = header.indexOf('publishat');
  const platformIdx = header.indexOf('platform');
  const titleIdx = header.indexOf('title');

  const hasHeader = fileNameIdx !== -1 && publishAtIdx !== -1;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = parseCsvLine(line);
    if (hasHeader) {
      return {
        fileName: cols[fileNameIdx] ?? '',
        publishAt: cols[publishAtIdx] ?? '',
        platform: platformIdx !== -1 ? cols[platformIdx] : undefined,
        title: titleIdx !== -1 ? cols[titleIdx] : undefined,
      };
    }
    // Fallback: positional columns fileName,publishAt,platform,title
    return {
      fileName: cols[0] ?? '',
      publishAt: cols[1] ?? '',
      platform: cols[2] || undefined,
      title: cols[3] || undefined,
    };
  });
}
