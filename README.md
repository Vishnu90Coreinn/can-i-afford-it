# BeforeYouBuy — Can I Afford It?

Before you buy it, see what it does to your money.

**BeforeYouBuy** is a privacy-first purchase impact simulator built with Next.js and TypeScript. It helps you compare the consequences of a purchase without pretending to give financial advice or reducing the decision to a fake affordability score.

Production: https://can-i-afford-it-core90.vercel.app

## What it shows

- Whether a cash purchase is fully fundable from current liquid savings
- Whether the purchase touches money you designated as emergency savings
- Liquid savings and financial runway before vs after purchase
- Whether your own selected reserve target is preserved
- Cash vs EMI, including financing cost and monthly pressure
- How long it may take for the purchase and reserve target to fit together
- Stress and ownership-cost scenarios

## Product principles

- Separate available savings from emergency savings
- Explain consequences instead of issuing universal buy / don't-buy verdicts
- Never label take-home debt share as DTI
- Keep thresholds user-selected rather than hidden in an arbitrary score
- Keep financial values on the device
- Treat cash and EMI as independent scenarios derived from the same base inputs

## Privacy

There is no account, database, bank connection or backend persistence. Calculations run in the browser. A scenario is stored only when the user explicitly chooses **Save on this device**, using local browser storage.

## Tech

- Next.js 16
- React 19
- TypeScript
- Client-side finance engine
- `localStorage` for optional on-device scenario persistence
- GitHub Actions for tests + production build verification
- Vercel deployment

## Development

```bash
npm install
npm run dev
```

Run the finance-engine regression suite:

```bash
npm test
```

Run the full verification used by CI:

```bash
npm run check
```

## Calculation rules

The calculation engine is intentionally separated from presentation logic. The frozen financial behavior and edge-case rules are documented in [`CALCULATION-SPEC-v1.md`](./CALCULATION-SPEC-v1.md).

Regression tests include cash funding, emergency-fund use, insufficient liquidity, zero-obligation runway, EMI and fees, variable income, monthly deficits, wait-to-target logic, stress scenarios, ownership costs and invalid inputs.

## Scope

This project is a decision simulator, not a budget tracker, bank integration, credit-scoring product, investment adviser or financial adviser. Its job is to answer:

> What changes if I make this purchase, and does that still fit the financial boundaries I chose?
