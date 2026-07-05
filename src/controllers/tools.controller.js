import { TOOLS } from '../config/tools.js';
import { processTool } from '../services/pdfTools.service.js';
import { recordUsage } from '../services/usage.service.js';

export function renderToolPage(req, res) {
  const { slug } = req.params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return res.status(404).render('404', { title: 'Tool Not Found' });

  res.render('tool', { title: tool.name, tool, result: null });
}

export async function processToolUpload(req, res, next) {
  try {
    const { slug } = req.params;
    const tool = TOOLS.find((t) => t.slug === slug);
    if (!tool) return res.status(404).render('404', { title: 'Tool Not Found' });

    if (!req.file) {
      return res.status(400).render('tool', { title: tool.name, tool, result: null, error: 'Please choose a PDF file to upload.' });
    }

    const result = await processTool(slug, req.file);

    const { userId, fingerprint, ipAddress, type } = req.accessInfo;
    await recordUsage({ userId, fingerprint, ipAddress, toolSlug: slug, usageType: type });

    res.render('tool', {
      title: tool.name,
      tool,
      result: { fileName: result.outputFileName, usageType: type },
    });
  } catch (err) {
    next(err);
  }
}
