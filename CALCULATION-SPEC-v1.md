# BeforeYouBuy — Calculation Specification V1.0

Status: **Frozen**

This specification is the source of truth for the financial engine. Product code may evolve, but calculation behavior must not silently diverge from these rules.

## Product principle

The app does not decide whether a purchase is good, bad, safe, recommended, or universally affordable. It shows what changes and whether the purchase remains inside financial boundaries selected by the user.

## Core monthly inputs

- `N` — monthly take-home income used for analysis.
- `E` — essential and mandatory non-debt living expenses.
- `D` — existing required monthly debt payments.
- `S` — planned monthly saving.
- `P` — purchase price.
- `C = E + D` — core monthly obligations.
- `CashBuffer = N - E - D`.
- `DiscretionaryCapacity = N - E - D - S`.

For variable income, analysis uses the user's conservative monthly income. Analysis is incomplete if that value is missing.

## Savings buckets

Savings must remain separate:

- `EmergencySavings` — money intentionally protected for emergencies.
- `AvailableSavings` — liquid money reasonably available for the purchase.

Do not collapse these into a single input.

## Runway

- `DedicatedEmergencyRunway = EmergencySavings / CoreMonthlyObligations`.
- `TotalLiquidRunway = (EmergencySavings + AvailableSavings) / CoreMonthlyObligations`.
- After financing: denominator includes the new EMI while it is active.
- If the denominator is zero, runway is `N/A`, never Infinity.

## Cash purchase allocation

Available savings are used first:

- `AvailableSavingsAfter = max(0, AvailableSavings - PurchasePrice)`.
- `EmergencyDraw = max(0, PurchasePrice - AvailableSavings)`.
- `EmergencySavingsAfter = EmergencySavings - EmergencyDraw`.

States:

1. `P <= AvailableSavings` → fully fundable without touching emergency savings.
2. `AvailableSavings < P <= AvailableSavings + EmergencySavings` → requires an explicit emergency-savings draw.
3. `P > AvailableSavings + EmergencySavings` → insufficient current liquid cash for a full cash purchase.

Never label state 3 as “you cannot afford this.”

## Reserve target

The reserve target is user-selected from 1–18 months. The UI may default to 6 months, but must say that six months is a common reference point rather than a universal rule.

- `RequiredReserve = TargetMonths * CoreMonthlyObligations`.
- During financing, use `TargetMonths * (E + D + NewEMI)` for the initial post-purchase comparison.

## EMI

Use the standard reducing-balance formula:

`M = principal * r * (1+r)^n / ((1+r)^n - 1)`

where `r = APR / 12 / 100`.

If APR is zero, `M = principal / n`.

Upfront fees reduce liquidity now. Financed fees, when used, are added to financed principal and must not be double-counted in financing cost.

## Financing cost

- `TotalFinancingCost = DownPayment + TotalEMIPayments + UpfrontFees`.
- `FinancingPremium = TotalFinancingCost - CashPurchasePrice`.

Show cash price, financed total, and the extra amount paid. Do not imply that 0% APR guarantees zero extra cost.

## Monthly impact

- `CashBufferAfter = N - E - D - NewEMI`.
- `DiscretionaryCapacityAfter = N - E - D - NewEMI - S`.

If a debt percentage is shown, label it **Debt share of take-home**. Do not call it DTI because the denominator is take-home income rather than gross income.

## Wait simulator

Ask how much the user realistically expects to add to available savings each month:

- `AvailableSavings(t) = CurrentAvailableSavings + MonthlyPurchaseSaving * t`.

Emergency savings remains unchanged unless explicitly modeled. Warn if planned purchase saving exceeds the current cash buffer.

## Target date

- `ReserveGap = max(0, RequiredReserve - PostPurchaseLiquidAssets)`.
- If `MonthlyPurchaseSaving > 0`, `MonthsToCloseGap = ceil(ReserveGap / MonthlyPurchaseSaving)`.

For a cash purchase, the eventual “fits target” date must satisfy both purchase funding and reserve preservation constraints.

## Purchase-limit wording

Expose two factual quantities, never “maximum affordable purchase”:

- Purchase-ready cash without touching emergency savings = `AvailableSavings`.
- Cash available while preserving selected reserve = `max(0, TotalLiquidSavings - RequiredReserve)`.

## Make-it-work solver

Solve one variable at a time and state assumptions. Permitted outputs include additional savings required, waiting time, price reduction required, and a maximum new EMI that preserves the selected constraints. These are calculations, not recommendations.

## Stress test

- `StressMonthlyBurn = EmergencyModeExpenses + ExistingDebtPayments + NewEMI`.
- If emergency-mode expenses are unavailable, use regular essential expenses and state that assumption.
- `StressRunway = PostPurchaseLiquidAssets / StressMonthlyBurn`.

Assume existing obligations remain unchanged during the simulated interruption unless an advanced model explicitly changes them.

## Ownership cost

Affordability and ownership value are separate.

`TotalOwnershipCost = PurchasePrice + FinancingPremium + Accessories + ExpectedMaintenance + RecurringOwnershipCosts - ExpectedResaleValue`

- `CostPerMonth = TotalOwnershipCost / OwnershipMonths`.
- `CostPerUse = TotalOwnershipCost / ExpectedUses`.
- `ExpectedUses = UsesPerWeek * 52 * YearsOwned`.

Never classify cost per use as good or bad.

## Result language

Reject arbitrary scores and magic labels such as “73/100”, “comfortable”, “manageable”, “tight”, “safe”, “recommended”, “good purchase”, or “bad purchase”.

Use factual states such as:

- Emergency target preserved.
- Below selected reserve target.
- Uses emergency savings.
- Creates monthly deficit.
- Insufficient liquid cash.
- Within your selected targets.

## Edge rules

- Negative monetary values are invalid.
- Purchase price must be greater than zero.
- `E + D = 0` → runway is N/A.
- Existing monthly deficit must be surfaced before purchase impact.
- Down payment greater than purchase price is invalid.
- EMI term must be greater than zero.
- APR cannot be negative; unusually high APR may produce a warning.
- Emergency savings = 0 is valid.
- Available savings = 0 is valid.
- Never display negative savings balances.
- Resale value greater than purchase price is allowed with a warning.
- Ownership duration must be greater than zero.
- Uses/week = 0 → cost/use is N/A.
- Variable income without conservative income is incomplete/invalid for analysis.
- NaN and Infinity must never be displayed.
- Currency formatting is presentation-only and must remain separate from calculation logic.
- Wait calculations assume price, income, and expenses stay constant unless explicitly modeled otherwise.

## First-use UX

Initial financial inputs:

1. Purchase price.
2. Monthly take-home income.
3. Essential + mandatory expenses.
4. Existing debt payments.
5. Emergency savings.
6. Available savings.

Advanced inputs appear only after the first result, including planned savings, EMI details, variable income, emergency-mode expenses, ownership costs, and other optional assumptions.

## Result hierarchy

1. Can current cash fund the purchase?
2. Does it touch emergency savings?
3. Savings before → after.
4. Liquid runway before → after.
5. Selected reserve-target comparison.
6. Monthly cash-flow impact.
7. Cash vs EMI.
8. Wait simulator.
9. What would make the purchase fit the selected target?
10. Stress test.
11. Ownership cost.

No result screen may output an absolute “YOU CAN AFFORD IT” verdict.
