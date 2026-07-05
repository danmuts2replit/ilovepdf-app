import fs from 'fs';
import path from 'path';

const PROCESSED_DIR = path.resolve('processed');

/**
 * Placeholder PDF processing pipeline.
 * Real tool-specific PDF manipulation (merge, split, compress, convert, etc.) should be
 * plugged in here per `toolSlug`. For now this simulates a completed job so the full
 * usage-tracking / trial / subscription / payment flow can be exercised end-to-end.
 */
export async function processTool(toolSlug, file) {
  if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

  const outputFileName = `${toolSlug}-${Date.now()}.pdf`;
  const outputPath = path.join(PROCESSED_DIR, outputFileName);

  const placeholder = [
    `Placeholder output for tool: ${toolSlug}`,
    `Original file: ${file ? file.originalname : 'none provided'}`,
    `Generated at: ${new Date().toISOString()}`,
  ].join('\n');

  fs.writeFileSync(outputPath, placeholder);

  if (file && file.path && fs.existsSync(file.path)) {
    fs.unlink(file.path, () => {});
  }

  return { outputFileName, outputPath };
}
