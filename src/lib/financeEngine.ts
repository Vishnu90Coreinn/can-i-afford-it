export type IncomeMode='regular'|'variable';
export type PaymentMode='cash'|'emi';

export interface Scenario {
  purchasePrice:number; monthlyTakeHome:number; conservativeIncome?:number; incomeMode:IncomeMode;
  essentials:number; debtPayments:number; plannedMonthlySaving:number;
  emergencySavings:number; availableSavings:number; reserveTargetMonths:number;
  paymentMode:PaymentMode; downPayment:number; upfrontFees:number; financedFees:number; apr:number; termMonths:number;
  monthlyPurchaseSaving:number; emergencyModeExpenses?:number;
  ownershipMonths?:number; accessories?:number; maintenance?:number; recurringOwnershipCosts?:number; expectedResaleValue?:number; usesPerWeek?:number;
}

export interface FinanceResult {
  analysisIncome:number|null; coreObligations:number; cashBuffer:number|null; discretionaryCapacity:number|null;
  dedicatedEmergencyRunway:number|null; totalLiquidRunway:number|null;
  cashState:'fundable_without_emergency'|'uses_emergency'|'insufficient_liquid_cash';
  availableUsed:number; emergencyUsed:number; availableAfter:number; emergencyAfter:number; liquidAfter:number;
  newEmi:number; postObligations:number; liquidRunwayAfter:number|null; requiredReserve:number; reserveGap:number;
  cashBufferAfter:number|null; discretionaryCapacityAfter:number|null; debtShareTakeHome:number|null;
  totalFinancingCost:number; financingPremium:number; monthsToCloseReserveGap:number|null;
  purchaseReadyCash:number; cashWhilePreservingTarget:number; warnings:string[];
  ownership?:{totalOwnershipCost:number;costPerMonth:number|null;costPerUse:number|null};
}

export interface CashWaitPlan {
  monthlySaving:number;
  fundingGapWithoutEmergency:number;
  reservePreservationGap:number;
  monthsToFundWithoutEmergency:number|null;
  monthsToPreserveTarget:number|null;
  earliestViableMonth:number|null;
  availableSavingsAtViableMonth:number|null;
}

export interface StressResult {
  monthlyBurn:number;
  runwayMonths:number|null;
  interruptionMonths:number;
  liquidRemaining:number;
}

const finite=(n:number)=>Number.isFinite(n);
const nonNegative=(n:number)=>finite(n)&&n>=0;
const safeDiv=(a:number,b:number)=>b>0&&finite(a)&&finite(b)?a/b:null;

export function calculateEmi(principal:number,apr:number,months:number){
  if(!nonNegative(principal)||!nonNegative(apr)||!Number.isFinite(months)||months<=0) return 0;
  if(principal===0) return 0;
  if(apr===0) return principal/months;
  const r=apr/1200; const p=Math.pow(1+r,months);
  return principal*r*p/(p-1);
}

export function validateScenario(s:Scenario){
  const errors:string[]=[];
  const fields:[string,number|undefined][]=[['Purchase price',s.purchasePrice],['Take-home income',s.monthlyTakeHome],['Essentials',s.essentials],['Debt payments',s.debtPayments],['Planned monthly saving',s.plannedMonthlySaving],['Emergency savings',s.emergencySavings],['Available savings',s.availableSavings],['Down payment',s.downPayment],['Upfront fees',s.upfrontFees],['Financed fees',s.financedFees],['APR',s.apr],['Monthly purchase saving',s.monthlyPurchaseSaving],['Emergency-mode expenses',s.emergencyModeExpenses],['Accessories',s.accessories],['Maintenance',s.maintenance],['Recurring ownership costs',s.recurringOwnershipCosts],['Expected resale value',s.expectedResaleValue],['Uses per week',s.usesPerWeek]];
  for(const [name,value] of fields) if(value!==undefined&&!nonNegative(value)) errors.push(`${name} must be zero or greater.`);
  if(!finite(s.purchasePrice)||s.purchasePrice<=0) errors.push('Purchase price must be greater than zero.');
  if(s.reserveTargetMonths<1||s.reserveTargetMonths>18) errors.push('Reserve target must be between 1 and 18 months.');
  if(s.paymentMode==='emi'){
    if(s.downPayment>s.purchasePrice) errors.push('Down payment cannot exceed purchase price.');
    if(!finite(s.termMonths)||s.termMonths<=0) errors.push('EMI term must be greater than zero.');
  }
  if(s.incomeMode==='variable'&&(!finite(s.conservativeIncome??NaN)||Number(s.conservativeIncome)<0)) errors.push('Conservative monthly income is required for variable income.');
  if(s.ownershipMonths!==undefined&&s.ownershipMonths<=0) errors.push('Ownership duration must be greater than zero.');
  return errors;
}

export function calculateScenario(s:Scenario):FinanceResult {
  const errors=validateScenario(s); if(errors.length) throw new Error(errors.join(' '));
  const warnings:string[]=[];
  const analysisIncome=s.incomeMode==='variable'?(s.conservativeIncome??null):s.monthlyTakeHome;
  const core=s.essentials+s.debtPayments;
  const cashBuffer=analysisIncome===null?null:analysisIncome-core;
  const discretionary=cashBuffer===null?null:cashBuffer-s.plannedMonthlySaving;
  if(cashBuffer!==null&&cashBuffer<0) warnings.push('Your current monthly obligations already exceed the income used for analysis.');
  if(s.monthlyPurchaseSaving>(cashBuffer??-Infinity)) warnings.push('Planned purchase saving is higher than the current monthly cash buffer.');

  const upfront=s.paymentMode==='cash'?s.purchasePrice:s.downPayment+s.upfrontFees;
  const availableUsed=Math.min(s.availableSavings,upfront);
  const remainder=Math.max(0,upfront-availableUsed);
  const emergencyUsed=Math.min(s.emergencySavings,remainder);
  const shortfall=Math.max(0,remainder-emergencyUsed);
  const availableAfter=Math.max(0,s.availableSavings-availableUsed);
  const emergencyAfter=Math.max(0,s.emergencySavings-emergencyUsed);
  const liquidAfter=availableAfter+emergencyAfter;
  const cashState=shortfall>0?'insufficient_liquid_cash':emergencyUsed>0?'uses_emergency':'fundable_without_emergency';

  const financedPrincipal=s.paymentMode==='emi'?Math.max(0,s.purchasePrice-s.downPayment+s.financedFees):0;
  const newEmi=s.paymentMode==='emi'?calculateEmi(financedPrincipal,s.apr,s.termMonths):0;
  const postObligations=core+newEmi;
  const requiredReserve=s.reserveTargetMonths*postObligations;
  const reserveGap=Math.max(0,requiredReserve-liquidAfter);
  const cashBufferAfter=analysisIncome===null?null:analysisIncome-postObligations;
  const discretionaryAfter=cashBufferAfter===null?null:cashBufferAfter-s.plannedMonthlySaving;
  if(cashBufferAfter!==null&&cashBufferAfter<0) warnings.push('This purchase creates a monthly deficit at the income used for analysis.');
  if(emergencyUsed>0) warnings.push(`This purchase uses ${emergencyUsed.toFixed(2)} from money designated as emergency savings.`);
  if(liquidAfter<requiredReserve) warnings.push('Post-purchase liquid savings fall below your selected reserve target.');
  if(s.apr>40) warnings.push('APR is unusually high; verify the financing terms.');

  const totalFinancingCost=s.paymentMode==='emi'?s.downPayment+s.upfrontFees+(newEmi*s.termMonths):s.purchasePrice;
  const financingPremium=totalFinancingCost-s.purchasePrice;
  const monthsToCloseReserveGap=reserveGap===0?0:s.monthlyPurchaseSaving>0?Math.ceil(reserveGap/s.monthlyPurchaseSaving):null;
  const debtShare=analysisIncome&&analysisIncome>0?(s.debtPayments+newEmi)/analysisIncome:null;

  const result:FinanceResult={
    analysisIncome,coreObligations:core,cashBuffer,discretionaryCapacity:discretionary,
    dedicatedEmergencyRunway:safeDiv(s.emergencySavings,core),
    totalLiquidRunway:safeDiv(s.emergencySavings+s.availableSavings,core),cashState,
    availableUsed,emergencyUsed,availableAfter,emergencyAfter,liquidAfter,newEmi,postObligations,
    liquidRunwayAfter:safeDiv(liquidAfter,postObligations),requiredReserve,reserveGap,
    cashBufferAfter,discretionaryCapacityAfter:discretionaryAfter,debtShareTakeHome:debtShare,
    totalFinancingCost,financingPremium,monthsToCloseReserveGap,
    purchaseReadyCash:s.availableSavings,
    cashWhilePreservingTarget:Math.max(0,s.emergencySavings+s.availableSavings-s.reserveTargetMonths*core),warnings
  };

  if(s.ownershipMonths!==undefined){
    const extraFinancing=Math.max(0,financingPremium);
    const totalOwnershipCost=s.purchasePrice+extraFinancing+(s.accessories??0)+(s.maintenance??0)+(s.recurringOwnershipCosts??0)-(s.expectedResaleValue??0);
    if((s.expectedResaleValue??0)>s.purchasePrice) warnings.push('Expected resale value is higher than purchase price; verify that assumption.');
    const uses=(s.usesPerWeek??0)*52*(s.ownershipMonths/12);
    result.ownership={totalOwnershipCost,costPerMonth:s.ownershipMonths>0?totalOwnershipCost/s.ownershipMonths:null,costPerUse:uses>0?totalOwnershipCost/uses:null};
  }
  return result;
}

export function calculateCashWaitPlan(s:Scenario):CashWaitPlan {
  const monthlySaving=Math.max(0,s.monthlyPurchaseSaving);
  const core=s.essentials+s.debtPayments;
  const requiredReserve=s.reserveTargetMonths*core;
  const totalLiquid=s.availableSavings+s.emergencySavings;
  const fundingGapWithoutEmergency=Math.max(0,s.purchasePrice-s.availableSavings);
  const reservePreservationGap=Math.max(0,s.purchasePrice+requiredReserve-totalLiquid);
  const months=(gap:number)=>gap===0?0:monthlySaving>0?Math.ceil(gap/monthlySaving):null;
  const monthsToFundWithoutEmergency=months(fundingGapWithoutEmergency);
  const monthsToPreserveTarget=months(reservePreservationGap);
  const earliestViableMonth=monthsToFundWithoutEmergency===null||monthsToPreserveTarget===null?null:Math.max(monthsToFundWithoutEmergency,monthsToPreserveTarget);
  return {
    monthlySaving,fundingGapWithoutEmergency,reservePreservationGap,monthsToFundWithoutEmergency,monthsToPreserveTarget,earliestViableMonth,
    availableSavingsAtViableMonth:earliestViableMonth===null?null:s.availableSavings+monthlySaving*earliestViableMonth
  };
}

export function calculateStressScenario(result:FinanceResult,emergencyModeExpenses:number,debtPayments:number,interruptionMonths:number):StressResult {
  const monthlyBurn=Math.max(0,emergencyModeExpenses)+Math.max(0,debtPayments)+Math.max(0,result.newEmi);
  const months=Math.max(0,interruptionMonths);
  return {monthlyBurn,runwayMonths:safeDiv(result.liquidAfter,monthlyBurn),interruptionMonths:months,liquidRemaining:Math.max(0,result.liquidAfter-monthlyBurn*months)};
}
