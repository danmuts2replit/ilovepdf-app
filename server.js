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
import toolsRoutes from './src/routes/tools.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import trialRoutes from './src/routes/trial.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import apiRoutes from './src/routes/api.routes.js';

import { attachUser } from './src/middleware/auth.middleware.js';
import { attachSubscriptionStatus } from './src/middleware/subscription.middleware.js';
import { notFoundHandler, errorHandler } from './src/middleware/error.middleware.js';
import { PLANS } from './src/config/plans.js';
import { TOOLS, CATEGORIES } from './src/config/tools.js';
import { getToolIcon } from './src/config/toolIcons.js';

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
app.locals.getToolIcon = getToolIcon;

app.get('/', (req, res) => {
  res.render('index', { title: 'ilovepdf Pro App', tools: TOOLS, categories: CATEGORIES, plans: PLANS });
});

app.get('/pricing', (req, res) => {
  res.render('pricing', { title: 'Pricing', plans: PLANS });
});

app.get('/subscribe', (req, res) => {
  res.render('subscribe', { title: 'Subscribe', plans: PLANS });
});

app.get('/usage-blocked', (req, res) => {
  res.render('usage-blocked', { title: 'Free Use Already Claimed' });
});

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(toolsRoutes);
app.use(paymentRoutes);
app.use(trialRoutes);
app.use(adminRoutes);
app.use(apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ilovepdf-app listening on port ${PORT}`);
});
