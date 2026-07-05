import fs from 'fs';
import path from 'path';
import { TOOLS } from '../config/tools.js';
import { processTool, PROCESSED_DIR } from '../services/pdfTools.service.js';
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

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).render('tool', { title: tool.name, tool, result: null, error: 'Please choose a file to upload.' });
    }

    let result;
    try {
      result = await processTool(slug, files, {
        pages: req.body.pages,
        angle: req.body.angle,
        text: req.body.text,
        perSheet: req.body.perSheet,
      });
    } catch (processingError) {
      return res.status(422).render('tool', {
        title: tool.name,
        tool,
        result: null,
        error: processingError.message || 'We could not process that file.',
      });
    }

    const { userId, fingerprint, ipAddress, type } = req.accessInfo;
    await recordUsage({ userId, fingerprint, ipAddress, toolSlug: slug, usageType: type });

    if (req.session) {
      if (!Array.isArray(req.session.ownedDownloads)) req.session.ownedDownloads = [];
      req.session.ownedDownloads.push(result.outputFileName);
      // Keep this list bounded so the session doesn't grow unbounded over a long browsing session.
      if (req.session.ownedDownloads.length > 50) {
        req.session.ownedDownloads = req.session.ownedDownloads.slice(-50);
      }
    }

    res.render('tool', {
      title: tool.name,
      tool,
      result: { fileName: result.outputFileName, usageType: type },
    });
  } catch (err) {
    next(err);
  }
}

export function downloadResult(req, res) {
  const { fileName } = req.params;
  const safeName = path.basename(fileName);

  const owned = req.session && Array.isArray(req.session.ownedDownloads) && req.session.ownedDownloads.includes(safeName);
  if (!owned) {
    return res.status(404).render('404', { title: 'File Not Found' });
  }

  const filePath = path.join(PROCESSED_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).render('404', { title: 'File Not Found' });
  }

  res.download(filePath, safeName);
}
