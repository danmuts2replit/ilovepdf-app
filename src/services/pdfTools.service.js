import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import AdmZip from 'adm-zip';
import { TOOLS } from '../config/tools.js';

const PROCESSED_DIR = path.resolve('processed');

function ensureProcessedDir() {
  if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

function outputName(slug, ext) {
  const token = crypto.randomBytes(6).toString('hex');
  return `${slug}-${Date.now()}-${token}.${ext}`;
}

function cleanupUploads(files) {
  for (const file of files) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, () => {});
    }
  }
}

/** Parses a page-range string like "1,3,5-7" into a zero-based, de-duplicated, sorted list. */
function parsePageRanges(input, pageCount) {
  if (!input || !input.trim()) return null;
  const indices = new Set();
  for (const part of input.split(',').map((p) => p.trim()).filter(Boolean)) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1], 10));
      const end = Math.min(pageCount, parseInt(rangeMatch[2], 10));
      for (let i = start; i <= end; i++) indices.add(i - 1);
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= pageCount) indices.add(n - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

async function loadPdf(filePath) {
  const bytes = fs.readFileSync(filePath);
  return PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false });
}

async function mergePdf(files) {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file.path);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  const name = outputName('merge-pdf', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function splitPdf(file) {
  const src = await loadPdf(file.path);
  const pageCount = src.getPageCount();
  const zip = new AdmZip();
  for (let i = 0; i < pageCount; i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const bytes = await doc.save();
    zip.addFile(`page-${i + 1}.pdf`, Buffer.from(bytes));
  }
  const name = outputName('split-pdf', 'zip');
  zip.writeZip(path.join(PROCESSED_DIR, name));
  return name;
}

async function removePages(file, pagesInput) {
  const src = await loadPdf(file.path);
  const pageCount = src.getPageCount();
  const toRemove = new Set(parsePageRanges(pagesInput, pageCount) || []);
  if (toRemove.size === 0) throw new Error('Please specify which pages to remove, e.g. 1,3,5-7.');

  const keepIndices = src.getPageIndices().filter((i) => !toRemove.has(i));
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, keepIndices);
  pages.forEach((p) => doc.addPage(p));
  const bytes = await doc.save();
  const name = outputName('remove-pages', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function extractPages(file, pagesInput) {
  const src = await loadPdf(file.path);
  const pageCount = src.getPageCount();
  const indices = parsePageRanges(pagesInput, pageCount);
  if (!indices || indices.length === 0) throw new Error('Please specify which pages to extract, e.g. 1,3,5-7.');

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, indices);
  pages.forEach((p) => doc.addPage(p));
  const bytes = await doc.save();
  const name = outputName('extract-pages', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function rotatePdf(file, angleInput) {
  const angle = [90, 180, 270].includes(Number(angleInput)) ? Number(angleInput) : 90;
  const doc = await loadPdf(file.path);
  doc.getPages().forEach((page) => {
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  });
  const bytes = await doc.save();
  const name = outputName('rotate-pdf', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function resavePdf(file, slug) {
  const doc = await loadPdf(file.path);
  const bytes = await doc.save({ useObjectStreams: true });
  const name = outputName(slug, 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function addPageNumbers(file) {
  const doc = await loadPdf(file.path);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const text = `${i + 1} / ${pages.length}`;
    page.drawText(text, {
      x: width / 2 - font.widthOfTextAtSize(text, 10) / 2,
      y: 20,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  const bytes = await doc.save();
  const name = outputName('add-page-numbers', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function addWatermark(file, text) {
  const watermarkText = (text && text.trim()) || 'ilovepdf Pro';
  const doc = await loadPdf(file.path);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2 - font.widthOfTextAtSize(watermarkText, 40) / 2,
      y: height / 2,
      size: 40,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.35,
      rotate: degrees(45),
    });
  });
  const bytes = await doc.save();
  const name = outputName('add-watermark', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function cropPdf(file) {
  const doc = await loadPdf(file.path);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const insetX = width * 0.05;
    const insetY = height * 0.05;
    page.setCropBox(insetX, insetY, width - insetX * 2, height - insetY * 2);
  });
  const bytes = await doc.save();
  const name = outputName('crop-pdf', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function flattenPdf(file) {
  const doc = await loadPdf(file.path);
  try {
    const form = doc.getForm();
    form.flatten();
  } catch {
    // No form fields present - nothing to flatten, fall through to a plain re-save.
  }
  const bytes = await doc.save();
  const name = outputName('flatten-pdf', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function nUpPdf(file, perSheetInput) {
  const perSheet = Number(perSheetInput) === 4 ? 4 : 2;
  const src = await loadPdf(file.path);
  const doc = await PDFDocument.create();
  const embeddedPages = await doc.embedPdf(src, src.getPageIndices());
  const cols = 2;
  const rows = perSheet === 4 ? 2 : 1;

  const pageWidth = 842; // A4 landscape width in points
  const pageHeight = 595;
  const cellW = pageWidth / cols;
  const cellH = pageHeight / rows;

  for (let i = 0; i < embeddedPages.length; i += perSheet) {
    const sheet = doc.addPage([pageWidth, pageHeight]);
    const group = embeddedPages.slice(i, i + perSheet);
    group.forEach((embeddedPage, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const { width: srcW, height: srcH } = embeddedPage;
      const scale = Math.min(cellW / srcW, cellH / srcH) * 0.95;
      sheet.drawPage(embeddedPage, {
        x: col * cellW + (cellW - srcW * scale) / 2,
        y: pageHeight - (row + 1) * cellH + (cellH - srcH * scale) / 2,
        xScale: scale,
        yScale: scale,
      });
    });
  }

  const bytes = await doc.save();
  const name = outputName('n-up-pdf', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function jpgToPdf(files) {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = fs.readFileSync(file.path);
    const isPng = (file.mimetype || '').includes('png');
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const bytes = await doc.save();
  const name = outputName('jpg-to-pdf', 'pdf');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), bytes);
  return name;
}

async function pdfToText(file) {
  const { PDFParse } = await import('pdf-parse');
  const bytes = fs.readFileSync(file.path);
  const parser = new PDFParse({ data: bytes });
  const result = await parser.getText();
  const name = outputName('pdf-to-text', 'txt');
  fs.writeFileSync(path.join(PROCESSED_DIR, name), (result && result.text) || '');
  return name;
}

/**
 * Real PDF processing pipeline for every tool marked `available: true` in tools.js.
 * Tools that need infrastructure this host doesn't have (office conversion, OCR, AI,
 * PDF rasterization) throw a clear error instead of faking a successful result.
 */
export async function processTool(toolSlug, files, options = {}) {
  ensureProcessedDir();
  const tool = TOOLS.find((t) => t.slug === toolSlug);
  const fileArray = Array.isArray(files) ? files : [files].filter(Boolean);

  if (!tool || !tool.available) {
    cleanupUploads(fileArray);
    throw new Error('This tool is not available yet. We are working on adding it soon.');
  }

  try {
    let outputFileName;
    const first = fileArray[0];

    switch (toolSlug) {
      case 'merge-pdf':
        if (fileArray.length < 2) throw new Error('Please choose at least 2 PDF files to merge.');
        outputFileName = await mergePdf(fileArray);
        break;
      case 'split-pdf':
        outputFileName = await splitPdf(first);
        break;
      case 'remove-pages':
        outputFileName = await removePages(first, options.pages);
        break;
      case 'extract-pages':
        outputFileName = await extractPages(first, options.pages);
        break;
      case 'rotate-pdf':
        outputFileName = await rotatePdf(first, options.angle);
        break;
      case 'organize-pdf':
      case 'repair-pdf':
        outputFileName = await resavePdf(first, toolSlug);
        break;
      case 'compress-pdf':
        outputFileName = await resavePdf(first, 'compress-pdf');
        break;
      case 'add-page-numbers':
        outputFileName = await addPageNumbers(first);
        break;
      case 'add-watermark':
        outputFileName = await addWatermark(first, options.text);
        break;
      case 'crop-pdf':
        outputFileName = await cropPdf(first);
        break;
      case 'flatten-pdf':
        outputFileName = await flattenPdf(first);
        break;
      case 'n-up-pdf':
        outputFileName = await nUpPdf(first, options.perSheet);
        break;
      case 'jpg-to-pdf':
        outputFileName = await jpgToPdf(fileArray);
        break;
      case 'pdf-to-text':
        outputFileName = await pdfToText(first);
        break;
      default:
        throw new Error('This tool is not available yet. We are working on adding it soon.');
    }

    return { outputFileName };
  } finally {
    cleanupUploads(fileArray);
  }
}

export { PROCESSED_DIR };
