# Commodity Intelligence System — v7.0
### Full-stack trading platform: COT screening · Live data · AI coach · Chart workspace

---

## What's included

**Three top-level sections:**
- **COMMODITIES** — 9-stage COT screening framework with live data (18 tabs)
- **MARKETS** — Financial futures dashboard: indices, sectors, yield curve, VIX, earnings (7 tabs)  
- **CHART WORKSPACE** — TradingView charts with linked notes, AI, and key levels

**18 commodity tools:**
Screener · Watchlist · Seasonal · COT Index · Trade Calc · Journal · Positions · Ideas · Calendar · Analytics · Alerts · Checklist · Community · Reference · Notes · Weekly Review · AI Coach · Settings

**Data sources (all free, no extra API keys):**
- Yahoo Finance: prices, USDX, 10Y yield, VIX, sectors, 15yr seasonal history
- CFTC Public API: COT commercial positions, open interest, 3yr history
- TradingView: full charting (embedded widget, free)

---

## Deploy to Vercel (~20 minutes)

### 1. Supabase — Database + Storage (free)
1. supabase.com → New Project
2. Settings → Database → copy "Connection string (URI)" → DATABASE_URL
3. Settings → API → copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL
4. Settings → API → copy "service_role" key → SUPABASE_SERVICE_KEY
5. Storage → New Bucket → name: "trade-media" → Public: ON

### 2. Anthropic API Key
1. console.anthropic.com → API Keys → Create Key → ANTHROPIC_API_KEY

### 3. NextAuth secrets
Run in terminal: openssl rand -base64 32 (twice)
- First output → NEXTAUTH_SECRET
- Second output → CRON_SECRET

### 4. Stripe (payments)
1. dashboard.stripe.com → Developers → API Keys → Secret key → STRIPE_SECRET_KEY
2. Products → Create "Pro Plan" → $29/month recurring → copy Price ID → STRIPE_PRO_PRICE_ID
3. Products → Create "Trader Plan" → $79/month recurring → copy Price ID → STRIPE_TRADER_PRICE_ID
4. After deploying: Developers → Webhooks → Add endpoint → https://YOUR_URL/api/stripe/webhook
   Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
   → copy Signing secret → STRIPE_WEBHOOK_SECRET

### 5. Resend — Email (free tier)
1. resend.com → API Keys → Create → RESEND_API_KEY
2. Domains → Add your domain → verify → EMAIL_FROM=alerts@yourdomain.com
   (Or use onboarding@resend.dev for testing)

### 6. GitHub + Vercel
1. Push all files to a new GitHub repo
2. vercel.com → Add New Project → import repo
3. Environment Variables — add ALL of the above plus:
   - NEXTAUTH_URL = https://your-app.vercel.app (your actual Vercel URL)
4. Deploy

### 7. Initialize database (one-time after first deploy)
In Vercel terminal or locally with DATABASE_URL set:
```
npx prisma db push
```

---

## Run locally

```bash
cp .env.example .env.local
# Fill in all values in .env.local
# Set NEXTAUTH_URL=http://localhost:3000

npm install
npx prisma db push
npm run dev
```
Open http://localhost:3000

---

## Environment variables

See .env.example for full list with descriptions.

---

## Plans & pricing

| Plan    | Price   | Screenings | Watchlist | Alerts | AI Coach |
|---------|---------|------------|-----------|--------|----------|
| Free    | $0      | 3/day      | —         | —      | ✓        |
| Pro     | $29/mo  | Unlimited  | ✓ (20)   | ✓      | ✓        |
| Trader  | $79/mo  | Unlimited  | ✓ (20)   | ✓      | ✓        |

All paid plans: 14-day free trial, cancel anytime via Stripe.

---

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Supabase (Prisma ORM)
- **Auth**: NextAuth.js (email/password, JWT sessions)
- **Payments**: Stripe (subscriptions + webhooks)
- **Email**: Resend
- **Charts**: TradingView widget (free embed)
- **Data**: Yahoo Finance + CFTC Public API (both free, no keys)
- **AI**: Anthropic Claude (claude-sonnet-4-20250514)
- **Hosting**: Vercel (free tier sufficient for personal/small team use)
- **Storage**: Supabase Storage (chart image uploads)
