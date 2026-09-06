import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCashWaitPlan,calculateScenario,calculateStressScenario,validateScenario,type Scenario} from '../src/lib/financeEngine';

const base:Scenario={purchasePrice:149900,monthlyTakeHome:140000,incomeMode:'regular',essentials:60000,debtPayments:15000,plannedMonthlySaving:0,emergencySavings:300000,availableSavings:200000,reserveTargetMonths:6,paymentMode:'cash',downPayment:0,upfrontFees:0,financedFees:0,apr:0,termMonths:12,monthlyPurchaseSaving:25000};
const s=(x:Partial<Scenario>={})=>({...base,...x});

test('production baseline: cash purchase preserves emergency bucket but falls below selected reserve',()=>{const r=calculateScenario(s());assert.equal(r.cashState,'fundable_without_emergency');assert.equal(r.emergencyUsed,0);assert.equal(r.liquidAfter,350100);assert.equal(r.requiredReserve,450000);assert.equal(r.reserveGap,99900);assert.ok(Math.abs((r.liquidRunwayAfter??0)-4.668)<0.01);});

test('zero savings: cash is unavailable and wait plan solves both funding and reserve',()=>{const z=s({emergencySavings:0,availableSavings:0});const r=calculateScenario(z);const w=calculateCashWaitPlan(z);assert.equal(r.cashState,'insufficient_liquid_cash');assert.equal(r.liquidAfter,0);assert.equal(r.reserveGap,450000);assert.equal(w.earliestViableMonth,24);});

test('emergency draw is exact and remaining emergency cash never displays negative',()=>{const r=calculateScenario(s({purchasePrice:250000}));assert.equal(r.emergencyUsed,50000);assert.equal(r.emergencyAfter,250000);assert.equal(r.availableAfter,0);assert.equal(r.cashState,'uses_emergency');});

test('purchase larger than all liquid savings reports insufficiency without negative balances',()=>{const r=calculateScenario(s({purchasePrice:600000}));assert.equal(r.cashState,'insufficient_liquid_cash');assert.equal(r.availableAfter,0);assert.equal(r.emergencyAfter,0);assert.equal(r.liquidAfter,0);});

test('EMI scenario changes monthly flexibility and reserve independently from cash',()=>{const x=s({downPayment:30000,upfrontFees:2000,apr:12,termMonths:12});const cash=calculateScenario({...x,paymentMode:'cash'});const emi=calculateScenario({...x,paymentMode:'emi'});assert.equal(cash.newEmi,0);assert.ok(emi.newEmi>0);assert.ok((emi.cashBufferAfter??0)<(cash.cashBufferAfter??0));assert.ok(emi.requiredReserve>cash.requiredReserve);assert.notEqual(emi.liquidAfter,cash.liquidAfter);});

test('0% EMI still includes upfront fees in true financing cost',()=>{const r=calculateScenario(s({paymentMode:'emi',purchasePrice:120000,downPayment:20000,upfrontFees:1000,apr:0,termMonths:10}));assert.equal(r.newEmi,10000);assert.equal(r.totalFinancingCost,121000);assert.equal(r.financingPremium,1000);});

test('variable income uses conservative income throughout cash-flow analysis',()=>{const r=calculateScenario(s({incomeMode:'variable',monthlyTakeHome:140000,conservativeIncome:90000}));assert.equal(r.analysisIncome,90000);assert.equal(r.cashBuffer,15000);assert.equal(r.cashBufferAfter,15000);});

test('variable income without conservative value is blocked',()=>{assert.ok(validateScenario(s({incomeMode:'variable',conservativeIncome:undefined})).some(e=>e.includes('Conservative')));});

test('existing monthly deficit is surfaced before purchase',()=>{const r=calculateScenario(s({monthlyTakeHome:50000}));assert.equal(r.cashBuffer,-25000);assert.ok(r.warnings.some(w=>w.includes('already exceed')));});

test('wait plan does not increase savings when saving rate is zero',()=>{const w=calculateCashWaitPlan(s({emergencySavings:0,availableSavings:0,monthlyPurchaseSaving:0}));assert.equal(w.earliestViableMonth,null);assert.equal(w.availableSavingsAtViableMonth,null);});

test('stress test uses active EMI and never shows negative remaining liquid cash',()=>{const r=calculateScenario(s({paymentMode:'emi',downPayment:30000,apr:12,termMonths:12}));const stress=calculateStressScenario(r,50000,15000,24);assert.ok(stress.monthlyBurn>65000);assert.equal(stress.liquidRemaining,0);});

test('ownership cost handles zero usage as N/A cost per use',()=>{const r=calculateScenario(s({ownershipMonths:24,usesPerWeek:0}));assert.equal(r.ownership?.costPerUse,null);assert.ok((r.ownership?.costPerMonth??0)>0);});

test('zero core obligations produce N/A runways instead of Infinity',()=>{const r=calculateScenario(s({essentials:0,debtPayments:0}));assert.equal(r.totalLiquidRunway,null);assert.equal(r.dedicatedEmergencyRunway,null);});

test('invalid negative values and invalid down payment are rejected',()=>{assert.ok(validateScenario(s({availableSavings:-1})).length>0);assert.ok(validateScenario(s({paymentMode:'emi',downPayment:200000})).length>0);});
