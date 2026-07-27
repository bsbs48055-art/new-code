import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExportFormat, ExportJob, SavedIdea } from '@/types';
import { db } from '@/services/db';
import { downloadBlob, toCsv, uid } from '@/utils/cn';
import { APP_NAME } from '@/utils/constants';

function rowsFromIdeas(ideas: SavedIdea[]) {
  return ideas.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    content: i.content,
    tags: i.tags.join('|'),
    notes: i.notes,
    favorite: i.favorite ? 'yes' : 'no',
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }));
}

async function recordExport(format: ExportFormat, count: number, name: string) {
  const job: ExportJob = {
    id: uid('export'),
    name,
    format,
    itemCount: count,
    createdAt: new Date().toISOString(),
  };
  await db.exports.put(job);
  return job;
}

export async function exportIdeas(ideas: SavedIdea[], format: ExportFormat): Promise<ExportJob> {
  const rows = rowsFromIdeas(ideas);
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `content-hunter-ideas-${stamp}`;

  if (format === 'csv') {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${baseName}.csv`);
  } else if (format === 'json') {
    const blob = new Blob([JSON.stringify(ideas, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${baseName}.json`);
  } else if (format === 'txt') {
    const text = ideas
      .map((i) => `# ${i.title}\nType: ${i.type}\nTags: ${i.tags.join(', ')}\n\n${i.content}\n\nNotes: ${i.notes}\n---`)
      .join('\n\n');
    downloadBlob(new Blob([text], { type: 'text/plain' }), `${baseName}.txt`);
  } else if (format === 'excel') {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Ideas');
    const buffer = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
    downloadBlob(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${baseName}.xlsx`,
    );
  } else if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`${APP_NAME} — Exported Ideas`, 40, 40);
    autoTable(doc, {
      startY: 60,
      head: [['Title', 'Type', 'Tags', 'Updated']],
      body: ideas.map((i) => [i.title, i.type, i.tags.join(', '), i.updatedAt.slice(0, 10)]),
      styles: { fontSize: 9 },
    });
    doc.save(`${baseName}.pdf`);
  }

  return recordExport(format, ideas.length, baseName);
}

export async function exportGenericRows(
  rows: Record<string, unknown>[],
  format: ExportFormat,
  name: string,
): Promise<ExportJob> {
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `${name}-${stamp}`;

  if (format === 'csv') {
    downloadBlob(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), `${baseName}.csv`);
  } else if (format === 'json') {
    downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), `${baseName}.json`);
  } else if (format === 'txt') {
    const text = rows.map((r) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join('\n')).join('\n\n---\n\n');
    downloadBlob(new Blob([text], { type: 'text/plain' }), `${baseName}.txt`);
  } else if (format === 'excel') {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Data');
    const buffer = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
    downloadBlob(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${baseName}.xlsx`,
    );
  } else if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(`${APP_NAME} — ${name}`, 40, 36);
    const keys = rows.length ? Object.keys(rows[0]) : [];
    autoTable(doc, {
      startY: 50,
      head: [keys],
      body: rows.map((r) => keys.map((k) => String(r[k] ?? ''))),
      styles: { fontSize: 8 },
    });
    doc.save(`${baseName}.pdf`);
  }

  return recordExport(format, rows.length, baseName);
}
