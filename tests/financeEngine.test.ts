import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCashWaitPlan,calculateEmi,calculateScenario,calculateStressScenario,validateScenario,type Scenario} from '../src/lib/financeEngine';

const base:Scenario={
  purchasePrice:149900,monthlyTakeHome:140000,incomeMode:'regular',essentials:60000,debtPayments:15000,plannedMonthlySaving:0,
  emergencySavings:300000,availableSavings:200000,reserveTargetMonths:6,paymentMode:'cash',downPayment:0,upfrontFees:0,financedFees:0,apr:0,termMonths:12,monthlyPurchaseSaving:25000
};
const s=(x:Partial<Scenario>={})=>({...base,...x});

test('cash purchase uses available savings first',()=>{
  const r=calculateScenario(s({purchasePrice:100000}));
  assert.equal(r.availableUsed,100000); assert.equal(r.emergencyUsed,0); assert.equal(r.cashState,'fundable_without_emergency');
});

test('cash purchase can use emergency savings without being blocked',()=>{
  const r=calculateScenario(s({purchasePrice:250000}));
  assert.equal(r.availableUsed,200000); assert.equal(r.emergencyUsed,50000); assert.equal(r.cashState,'uses_emergency');
});

test('insufficient liquid cash is factual state',()=>{
  const r=calculateScenario(s({purchasePrice:600000}));
  assert.equal(r.cashState,'insufficient_liquid_cash'); assert.equal(r.availableAfter,0); assert.equal(r.emergencyAfter,0);
});

test('zero obligations yields N/A runway',()=>{
  const r=calculateScenario(s({essentials:0,debtPayments:0}));
  assert.equal(r.totalLiquidRunway,null); assert.equal(r.dedicatedEmergencyRunway,null);
});

test('zero APR EMI is principal divided by term',()=>assert.equal(calculateEmi(120000,0,12),10000));

test('financed fees are included in principal but not double counted as upfront fees',()=>{
  const r=calculateScenario(s({paymentMode:'emi',purchasePrice:120000,downPayment:20000,financedFees:1200,upfrontFees:500,apr:0,termMonths:10}));
  assert.equal(r.newEmi,10120); assert.equal(r.totalFinancingCost,121700); assert.equal(r.financingPremium,1700);
});

test('EMI increases post-purchase obligations and reserve requirement',()=>{
  const r=calculateScenario(s({paymentMode:'emi',purchasePrice:120000,downPayment:20000,apr:0,termMonths:10}));
  assert.equal(r.postObligations,85000); assert.equal(r.requiredReserve,510000);
});

test('debt percentage is based on take-home and exposed without DTI naming',()=>{
  const r=calculateScenario(s()); assert.equal(r.debtShareTakeHome,15000/140000);
});

test('variable income uses conservative income',()=>{
  const r=calculateScenario(s({incomeMode:'variable',conservativeIncome:90000})); assert.equal(r.analysisIncome,90000); assert.equal(r.cashBuffer,15000);
});

test('variable income requires conservative income',()=>{
  const errors=validateScenario(s({incomeMode:'variable',conservativeIncome:undefined})); assert.ok(errors.some(x=>x.includes('Conservative')));
});

test('negative values are invalid',()=>assert.ok(validateScenario(s({availableSavings:-1})).length>0));
test('purchase price zero is invalid',()=>assert.ok(validateScenario(s({purchasePrice:0})).length>0));
test('down payment above price is invalid',()=>assert.ok(validateScenario(s({paymentMode:'emi',downPayment:200000})).length>0));

test('monthly deficit is surfaced',()=>{
  const r=calculateScenario(s({monthlyTakeHome:50000})); assert.ok(r.warnings.some(x=>x.includes('already exceed')));
});

test('purchase-saving rate above cash buffer gets warning',()=>{
  const r=calculateScenario(s({monthlyPurchaseSaving:100000})); assert.ok(r.warnings.some(x=>x.includes('higher than')));
});

test('months to reserve target rounds up',()=>{
  const r=calculateScenario(s({purchasePrice:250000,reserveTargetMonths:4,monthlyPurchaseSaving:30000}));
  assert.equal(r.monthsToCloseReserveGap,8);
});

test('purchase-ready cash excludes emergency savings',()=>{
  const r=calculateScenario(s()); assert.equal(r.purchaseReadyCash,200000);
});

test('cash while preserving target never goes negative',()=>{
  const r=calculateScenario(s({reserveTargetMonths:18})); assert.equal(r.cashWhilePreservingTarget,0);
});

test('ownership cost separates financing premium from purchase price',()=>{
  const r=calculateScenario(s({paymentMode:'emi',purchasePrice:120000,downPayment:20000,upfrontFees:500,apr:0,termMonths:10,ownershipMonths:24,accessories:5000,maintenance:10000,recurringOwnershipCosts:6000,expectedResaleValue:30000,usesPerWeek:2}));
  assert.equal(r.ownership?.totalOwnershipCost,111500); assert.ok((r.ownership?.costPerUse??0)>0);
});

test('resale above purchase price is allowed but warned',()=>{
  const r=calculateScenario(s({ownershipMonths:12,expectedResaleValue:200000})); assert.ok(r.warnings.some(x=>x.includes('resale value')));
});

test('wait plan solves purchase funding and selected reserve together',()=>{
  const p=calculateCashWaitPlan(s({emergencySavings:0,availableSavings:0,monthlyPurchaseSaving:25000}));
  assert.equal(p.fundingGapWithoutEmergency,149900);
  assert.equal(p.reservePreservationGap,599900);
  assert.equal(p.monthsToFundWithoutEmergency,6);
  assert.equal(p.monthsToPreserveTarget,24);
  assert.equal(p.earliestViableMonth,24);
  assert.equal(p.availableSavingsAtViableMonth,600000);
});

test('wait plan is zero months when purchase and reserve already fit',()=>{
  const p=calculateCashWaitPlan(s({purchasePrice:50000,emergencySavings:500000,availableSavings:200000}));
  assert.equal(p.earliestViableMonth,0);
});

test('wait plan is unavailable with a gap and zero saving rate',()=>{
  const p=calculateCashWaitPlan(s({emergencySavings:0,availableSavings:0,monthlyPurchaseSaving:0}));
  assert.equal(p.earliestViableMonth,null);
});

test('stress scenario is derived from the passed active scenario only',()=>{
  const cash=calculateScenario(s({paymentMode:'cash'}));
  const stress=calculateStressScenario(cash,50000,15000,2);
  assert.equal(stress.monthlyBurn,65000);
  assert.equal(stress.liquidRemaining,220100);
});

test('cash and EMI calculations stay independent for the same base inputs',()=>{
  const baseScenario=s({downPayment:30000,upfrontFees:2000,apr:12,termMonths:12});
  const cash=calculateScenario({...baseScenario,paymentMode:'cash'});
  const emi=calculateScenario({...baseScenario,paymentMode:'emi'});
  assert.equal(cash.newEmi,0);
  assert.ok(emi.newEmi>0);
  assert.notEqual(cash.liquidAfter,emi.liquidAfter);
});
