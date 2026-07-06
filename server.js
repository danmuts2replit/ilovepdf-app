import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './src/routes/auth.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import toolsRoutes, { cleanToolRouter } from './src/routes/tools.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import trialRoutes from './src/routes/trial.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import apiRoutes from './src/routes/api.routes.js';

import { attachUser } from './src/middleware/auth.middleware.js';
import { attachSubscriptionStatus } from './src/middleware/subscription.middleware.js';
import { notFoundHandler, errorHandler } from './src/middleware/error.middleware.js';
import { PLANS } from './src/config/plans.js';
import { TOOLS, CATEGORIES } from './src/config/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: [process.env.APP_URL, process.env.MAIN_SITE_URL].filter(Boolean),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'insecure-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(attachUser);
app.use(attachSubscriptionStatus);

app.locals.MAIN_SITE_URL = process.env.MAIN_SITE_URL || 'https://ilovepdf.shop';
app.locals.APP_URL = process.env.APP_URL || 'https://app.ilovepdf.shop';
app.locals.PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

app.use((req, res, next) => {
  res.locals.canonicalUrl = `${app.locals.APP_URL}${req.originalUrl.split('?')[0]}`;
  next();
});

app.get('/', (req, res) => {
  res.render('index', {
    title: 'ilovepdf Pro App',
    tools: TOOLS,
    categories: CATEGORIES,
    plans: PLANS,
    description:
      'Every PDF tool you need, in one app. Merge, split, compress, convert, edit and secure your PDFs. Your first 7 tool uses are free — no card required.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ilovepdf Pro',
      url: app.locals.APP_URL,
      applicationCategory: 'Utility',
      operatingSystem: 'Any (Web-based)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KES',
        description: 'First 7 tool uses are free, no card required.',
      },
      description:
        'Every PDF tool you need, in one app. Merge, split, compress, convert, edit and secure your PDFs.',
    },
  });
});

app.get('/pricing', (req, res) => {
  res.render('pricing', {
    title: 'Pricing',
    plans: PLANS,
    description: 'Simple, transparent pricing for unlimited access to every PDF tool. Pick a plan that works for you.',
  });
});

app.get('/subscribe', (req, res) => {
  res.render('subscribe', { title: 'Subscribe', plans: PLANS, noindex: true });
});

app.get('/usage-blocked', (req, res) => {
  res.render('usage-blocked', { title: 'Free Use Already Claimed', noindex: true });
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = app.locals.APP_URL;
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0' },
    { loc: `${baseUrl}/pricing`, priority: '0.8' },
  ];
  const toolUrls = TOOLS.filter((t) => t.available).map((t) => ({
    loc: `${baseUrl}/${t.slug}`,
    priority: '0.7',
  }));

  const urls = [...staticUrls, ...toolUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')}\n</urlset>\n`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(toolsRoutes);
app.use(paymentRoutes);
app.use(trialRoutes);
app.use(adminRoutes);
app.use(apiRoutes);

// Flat, long-tail tool URLs (e.g. /word-to-pdf) — mounted last so every named route above
// (/login, /admin, /trial, etc.) is matched first and only genuine tool slugs reach here.
app.use(cleanToolRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ilovepdf-app listening on port ${PORT}`);
});
