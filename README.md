# DBS Building Services — Pricing Suite

A scalable **Next.js 14 + TypeScript + Tailwind** web app that handles the four
jobs DBS needs when closing profitable work:

1. **Budget Calculator** — price recurring janitorial contracts from square
   footage, cleaning frequency, and real ISSA production rates.
2. **Extra Services** — quote add-on jobs (window cleaning, power washing, floor
   care, carpet) with a full cost buildup **and** a live market-rate check.
3. **Scope of Work** — build an itemized scope by area and frequency, with
   one-click templates.
4. **BID / Proposal** — assemble a print-ready proposal (Print → Save as PDF)
   pulling pricing, scope, and terms together.

All defaults are seeded from **US 2025–2026 market data** and are fully editable
under **Rates & Settings**. Everything you enter is saved in your browser
(localStorage), so the app works offline and needs no backend to start.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

## How the pricing works

Every price is produced by one engine (`src/lib/pricing.ts`) using this buildup:

```
base labor      = labor hours × base wage
+ labor burden  = base labor × burden %        (payroll tax, workers' comp)
+ supplies      = burdened labor × supplies %
+ materials / equipment / trip (extra services only)
= direct cost
+ overhead      = direct cost × overhead %
= total cost
SELL PRICE      = total cost ÷ (1 − target margin %)   ← true net margin
```

- **Recurring**: labor hours come from `area sqft ÷ production rate`, multiplied
  by `frequency/week × weeks/month`.
- **Extra services**: labor hours come from `quantity ÷ productivity` (or entered
  directly for hourly jobs), and the recommended price never drops below the
  service's minimum charge.

Default rates and their sources live in `src/lib/rates.ts`.

## Project structure

```
src/
  app/                 # routes: dashboard, calculator, extra-services,
                       #         scope-of-work, bid, settings
  components/          # Sidebar, PageHeader, ProposalDocument, ui/primitives
  lib/
    types.ts           # domain types
    rates.ts           # market defaults & catalogs (editable seeds)
    pricing.ts         # pure pricing engine — single source of truth
    store.ts           # Zustand store + localStorage persistence
    format.ts          # currency / number helpers
```

## Scaling up later

The pricing engine is pure and UI-agnostic, so the natural next steps are:
save estimates to a database, add user accounts, generate server-side PDFs, and
expose the engine as an API. Because all money logic is isolated in
`lib/pricing.ts`, none of that requires touching the calculators.

> Rates are **starting points** from published market averages — always confirm
> against your real labor cost and local market before sending a bid.
