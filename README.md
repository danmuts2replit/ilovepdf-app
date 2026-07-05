# ilovepdf-app

Production-ready Node.js/Express/EJS/MySQL app for `https://app.ilovepdf.shop` — the PDF tools application behind ilovepdf Pro.

This is a **standalone** project (its own GitHub repo) and is completely separate from the marketing site (`ilovepdf.shop`) and the React/Vite/Postgres app in this workspace. No React, Vite, Next.js, TypeScript, Docker, Postgres, or MongoDB — plain Node.js + Express + EJS + MySQL only.

## Stack

- Node.js + Express 4
- EJS templates (server-rendered)
- MySQL (via `mysql2`) — e.g. hosted on Hostinger
- Sessions via `express-session`
- Passwords hashed with `bcryptjs`
- Payments via Paystack (weekly $3 / monthly $6 / yearly $40)

## Features

- Guest visitors get **one free use** of any tool (tracked by device fingerprint + IP)
- Registered users also get **one free use**, then a **3-day free trial** (once per account), then must subscribe
- Paystack subscription checkout (initialize → hosted checkout → callback verify) plus webhook handling
- Usage tracking per tool, per user/guest
- Admin dashboard with usage/revenue stats, protected by an `ADMIN_KEY`

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

`src/services/pdfTools.service.js` currently contains a placeholder pipeline (it records the operation and generates a stub output file) so the full usage/trial/subscription/payment flow can be exercised end-to-end. Wire in real tool-specific PDF processing there per `toolSlug`.

## Deploying to Hostinger

1. Create a MySQL database in hPanel and run `database/schema.sql` against it.
2. Set the environment variables listed above in your hosting environment.
3. Point your Node.js app entrypoint to `server.js` and ensure it listens on the port Hostinger provides (`process.env.PORT`).
4. Set your Paystack callback/webhook URLs to `https://app.ilovepdf.shop/payment/callback` and `https://app.ilovepdf.shop/api/paystack/webhook`.
