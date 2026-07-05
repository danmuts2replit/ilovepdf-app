# ilovepdf-app

Production-ready Node.js/Express/EJS/MySQL app for `https://app.ilovepdf.shop` — the PDF tools application behind ilovepdf Pro.

This is a **standalone** project (its own GitHub repo) and is completely separate from the marketing site (`ilovepdf.shop`) and the React/Vite/Postgres app in this workspace. No React, Vite, Next.js, TypeScript, Docker, Postgres, or MongoDB — plain Node.js + Express + EJS + MySQL only.

## Stack

- Node.js + Express 4
- EJS templates (server-rendered)
- MySQL (via `mysql2`) — e.g. hosted on Hostinger
- Sessions via `express-session`
- Passwords hashed with `bcryptjs`
- Payments via Paystack (weekly KES 390 / monthly KES 779 / yearly KES 5,179)
- PDF processing via `pdf-lib`, `pdf-parse`, and `adm-zip`

## Features

- Guest visitors get **7 free uses** across any tools (tracked by device fingerprint + IP)
- Registered users also get **7 free uses**, then must subscribe (no separate trial period)
- Paystack subscription checkout (initialize → hosted checkout → callback verify) plus webhook handling
- Real PDF processing for merge, split, remove/extract pages, rotate, organize, repair, compress,
  add page numbers, watermark, crop, flatten, n-up, jpg-to-pdf, and pdf-to-text. Tools requiring
  infrastructure this host doesn't provide (office-format conversion, OCR, AI features, etc.) are
  clearly marked "not available yet" instead of faking a result.
- Usage tracking per tool, per user/guest
- Admin dashboard with usage/revenue stats, protected by an `ADMIN_KEY`

## Requirements

- **Node.js >= 20.16.0** (required by `pdf-parse@2.x`). If your Hostinger Node.js App is set to an
  older Node version, switch it to 20.16+ (or a later LTS) in hPanel's Node.js App settings before
  deploying, or PDF-to-text extraction (and possibly `npm install` itself) will fail.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create your database and run the schema:
   ```
   mysql -u <user> -p <database> < database/schema.sql
   ```
3. Copy `.env.example` to `.env` and fill in real values (never commit `.env`):
   ```
   cp .env.example .env
   ```
4. Start the app:
   ```
   npm start
   ```

## Environment variables

See `.env.example` for the full list. Required:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — your MySQL connection (e.g. Hostinger credentials)
- `SESSION_SECRET` — random string used to sign session cookies
- `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` — from your Paystack dashboard (test or live)
- `PAYSTACK_WEBHOOK_SECRET` — optional extra check for webhook events
- `ADMIN_KEY` — shared secret required to view `/admin` (append `?key=your-admin-key` or send it as `x-admin-key` header)

## Project structure

```
ilovepdf-app/
├── server.js                  # App entrypoint
├── database/schema.sql        # MySQL schema
├── src/
│   ├── config/                # database, plans, tools
│   ├── controllers/           # route handlers
│   ├── middleware/            # auth, usage limits, admin auth, errors
│   ├── routes/                # Express routers
│   ├── services/              # Paystack, usage, subscriptions, trials, PDF processing
│   └── utils/                 # fingerprinting, dates, validation
├── views/                     # EJS templates
├── public/                    # CSS, JS, images
├── uploads/                   # temporary uploaded files (gitignored)
├── processed/                 # processed output files (gitignored)
└── logs/                      # application logs (gitignored)
```

## PDF processing

`src/services/pdfTools.service.js` implements real PDF processing (via `pdf-lib`, `pdf-parse`,
and `adm-zip`) for every tool marked `available: true` in `src/config/tools.js`. Tools not yet
implemented are marked `available: false` there and return a clear "not available yet" message
instead of a fake result — update both files together when adding a new tool.

## Deploying to Hostinger

1. Create a MySQL database in hPanel and run `database/schema.sql` against it.
2. Set the environment variables listed above in your hosting environment.
3. Point your Node.js app entrypoint to `server.js` and ensure it listens on the port Hostinger provides (`process.env.PORT`).
4. Set your Paystack callback/webhook URLs to `https://app.ilovepdf.shop/payment/callback` and `https://app.ilovepdf.shop/api/paystack/webhook`.
5. If your database was created before `database/migrations/001_payments_success_reference_unique.sql` existed, run that migration once against it (fresh installs already get it via `database/schema.sql`).
