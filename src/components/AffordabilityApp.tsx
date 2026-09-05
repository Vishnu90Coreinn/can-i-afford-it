'use client';

import {useMemo,useState} from 'react';
import {calculateScenario,validateScenario,type Scenario} from '@/lib/financeEngine';

const money=(n:number|null|undefined)=>n==null||!Number.isFinite(n)?'N/A':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const num=(n:number)=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(n);
const months=(n:number|null)=>n===null?'N/A':`${n.toFixed(1)} months`;
const pct=(n:number|null)=>n===null?'N/A':`${(n*100).toFixed(1)}%`;
const parseMoney=(s:string)=>Number(s.replace(/[^0-9.]/g,''))||0;

const initial:Scenario={purchasePrice:149900,monthlyTakeHome:140000,incomeMode:'regular',conservativeIncome:110000,essentials:60000,debtPayments:15000,plannedMonthlySaving:10000,emergencySavings:300000,availableSavings:200000,reserveTargetMonths:6,paymentMode:'cash',downPayment:30000,upfrontFees:2000,financedFees:0,apr:12,termMonths:12,monthlyPurchaseSaving:25000,emergencyModeExpenses:50000,ownershipMonths:24,accessories:0,maintenance:0,recurringOwnershipCosts:0,expectedResaleValue:0,usesPerWeek:2};

function MoneyInput({value,onChange}:{value:number,onChange:(n:number)=>void}){
  return <div className="moneyInput"><span>₹</span><input inputMode="decimal" value={num(value)} onChange={e=>onChange(parseMoney(e.target.value))}/></div>;
}
function Row({label,value,sub}:{label:string,value:string,sub?:string}){
  return <div><span>{label}{sub&&<small>{sub}</small>}</span><b>{value}</b></div>;
}

export default function AffordabilityApp(){
  const [v,setV]=useState<Scenario>(initial);
  const [purchaseName,setPurchaseName]=useState('MacBook Pro');
  const [showResult,setShowResult]=useState(false);
  const [wait,setWait]=useState(3);
  const [stress,setStress]=useState(3);
  const [saved,setSaved]=useState(false);
  const set=<K extends keyof Scenario>(k:K,x:Scenario[K])=>setV(s=>({...s,[k]:x}));
  const errors=useMemo(()=>validateScenario(v),[v]);
  const r=useMemo(()=>errors.length?null:calculateScenario(v),[v,errors.length]);
  const cashR=useMemo(()=>{try{return calculateScenario({...v,paymentMode:'cash'});}catch{return null;}},[v]);
  const emiR=useMemo(()=>{try{return calculateScenario({...v,paymentMode:'emi'});}catch{return null;}},[v]);
  const totalBefore=v.availableSavings+v.emergencySavings;
  const waitAvailable=v.availableSavings+Math.max(0,v.monthlyPurchaseSaving)*wait;
  const stressBurn=(v.emergencyModeExpenses??v.essentials)+v.debtPayments+(r?.newEmi??0);
  const stressRunway=r&&stressBurn>0?r.liquidAfter/stressBurn:null;
  const stressRemaining=r?Math.max(0,r.liquidAfter-stressBurn*stress):null;
  const targetMonths=r?.monthsToCloseReserveGap??null;
  const save=()=>{localStorage.setItem('cai-scenario',JSON.stringify({scenario:v,purchaseName}));setSaved(true);setTimeout(()=>setSaved(false),1600)};
  const load=()=>{const raw=localStorage.getItem('cai-scenario');if(!raw)return;try{const p=JSON.parse(raw);if(p?.scenario){setV(p.scenario);setPurchaseName(p.purchaseName??'')}else setV(p)}catch{}};
  const MI=({k}:{k:keyof Scenario})=><MoneyInput value={Number(v[k]??0)} onChange={n=>set(k,n as never)}/>;
  const fundingFact=!r?'':r.cashState==='fundable_without_emergency'?'No emergency savings used':r.cashState==='uses_emergency'?`${money(r.emergencyUsed)} comes from emergency savings`:'Current liquid cash is insufficient';
  const fundingClass=r?.cashState==='fundable_without_emergency'?'ok':'warn';

  return <main className="appShell">
    <nav className="nav"><div className="brand"><div className="brandMark">₹</div><div><b>BeforeYouBuy</b><small>See what changes before you decide</small></div></div><details className="moreMenu"><summary aria-label="Scenario options">•••</summary><div><button onClick={save}>{saved?'Saved ✓':'Save on this device'}</button><button onClick={load}>Load saved scenario</button></div></details></nav>

    {!showResult&&<><section className="intro"><div className="eyebrow">PRIVATE • LOCAL • NO ACCOUNT</div><h1>Can I afford it?</h1><p>Six numbers. One clear view of what this purchase changes.</p></section><section className="questionCard"><div className="stepHeader"><span>01</span><div><h2>What are you thinking of buying?</h2><p>Start with the purchase.</p></div></div><label className="field bigField">Purchase name<input value={purchaseName} onChange={e=>setPurchaseName(e.target.value)} placeholder="e.g. MacBook Pro"/></label><label className="field bigField">Purchase price<MI k="purchasePrice"/></label><div className="divider"/><div className="stepHeader"><span>02</span><div><h2>Your monthly money</h2><p>Take-home income and required commitments.</p></div></div><div className="formGrid"><label className="field">Monthly take-home<MI k="monthlyTakeHome"/></label><label className="field">Essential + mandatory expenses<MI k="essentials"/></label><label className="field">Existing debt payments<MI k="debtPayments"/></label></div><div className="divider"/><div className="stepHeader"><span>03</span><div><h2>Your cash</h2><p>Separate protected money from purchase-ready money.</p></div></div><div className="formGrid twoCols"><label className="field">Emergency savings<MI k="emergencySavings"/><small>Money you intend to protect for unexpected needs.</small></label><label className="field">Available savings<MI k="availableSavings"/><small>Liquid money you could reasonably use now.</small></label></div><details className="preResultAdvanced"><summary>Reserve target · {v.reserveTargetMonths} months</summary><label className="field"><input type="range" min="1" max="18" value={v.reserveTargetMonths} onChange={e=>set('reserveTargetMonths',+e.target.value)}/><small>6 months is a common reference point, not a universal rule.</small></label></details>{errors.length>0&&<div className="validationBox">{errors.map(x=><div key={x}>• {x}</div>)}</div>}<button className="primaryCta" disabled={errors.length>0} onClick={()=>{setShowResult(true);window.scrollTo({top:0,behavior:'smooth'})}}>See the impact <span>→</span></button><p className="privacyLine">Calculated locally. Nothing is stored unless you choose Save.</p></section></>}

    {showResult&&r&&<>
      <section className="resultTop"><button className="backButton" onClick={()=>setShowResult(false)}>← Edit numbers</button><div className="purchaseContext"><span>{purchaseName||'This purchase'}</span><strong>{money(v.purchasePrice)}</strong></div></section>
      <section className="impactHero"><div className="eyebrow">AFTER THIS PURCHASE</div><div className="heroRunway"><strong>{r.liquidRunwayAfter===null?'—':r.liquidRunwayAfter.toFixed(1)}</strong><span>{r.liquidRunwayAfter===null?'Runway unavailable':'months of liquid runway remain'}</span></div><div className="runwayJourney"><span>{r.totalLiquidRunway===null?'N/A':`${r.totalLiquidRunway.toFixed(1)} mo`} before</span><i>→</i><b>{r.liquidRunwayAfter===null?'N/A':`${r.liquidRunwayAfter.toFixed(1)} mo`} after</b></div><div className={`targetStatus ${r.reserveGap>0?'warn':'ok'}`}><div><span>Your target</span><b>{v.reserveTargetMonths} months</b></div><div><span>{r.reserveGap>0?'Gap to target':'Target status'}</span><b>{r.reserveGap>0?money(r.reserveGap):'Preserved'}</b></div></div><p className={`fundingFact ${fundingClass}`}>{r.cashState==='fundable_without_emergency'?'✓ ':r.cashState==='uses_emergency'?'⚠ ':''}{fundingFact}</p></section>

      <section className="beforeAfter"><div className="baHead"><span>What changes</span><b>Before</b><strong>After</strong></div><div><span>Liquid savings</span><b>{money(totalBefore)}</b><strong>{money(r.liquidAfter)}</strong></div><div><span>Liquid runway</span><b>{r.totalLiquidRunway===null?'N/A':`${r.totalLiquidRunway.toFixed(1)} mo`}</b><strong>{r.liquidRunwayAfter===null?'N/A':`${r.liquidRunwayAfter.toFixed(1)} mo`}</strong></div><div><span>Monthly free cash</span><b>{money(r.cashBuffer)}</b><strong>{money(r.cashBufferAfter)}</strong></div>{v.paymentMode==='cash'&&<p className="tableNote">Monthly free cash is unchanged because this scenario is a cash purchase.</p>}</section>

      <div className="exploreHeading"><div><span>OPTIONAL</span><h2>Test the decision</h2></div><p>Explore alternatives without changing your original numbers.</p></div>
      <section className="accordionStack grouped">
        <details className="detailAccordion"><summary><div><span>01 · Payment</span><b>Cash, reserve & financing</b><small>Compare the trade-off, not just the EMI</small></div><em>+</em></summary><div className="accordionBody">
          <div className="compareGrid">
            <article><div className="compareTitle"><span>Cash</span><b>Pay now</b></div>{cashR&&<><strong className="compareBig">{money(v.purchasePrice)}</strong><Row label="Savings left" value={money(cashR.liquidAfter)}/><Row label="Runway after" value={months(cashR.liquidRunwayAfter)}/><Row label="Emergency savings touched" value={cashR.emergencyUsed>0?money(cashR.emergencyUsed):'No'}/><Row label="Monthly free cash" value={money(cashR.cashBufferAfter)}/></>}</article>
            <article><div className="compareTitle"><span>EMI</span><b>{v.termMonths} months</b></div>{emiR&&<><strong className="compareBig">{money(emiR.newEmi)}<small>/mo</small></strong><Row label="Pay now" value={money(v.downPayment+v.upfrontFees)}/><Row label="Total paid" value={money(emiR.totalFinancingCost)}/><Row label="Extra vs cash" value={money(emiR.financingPremium)}/><Row label="Savings left now" value={money(emiR.liquidAfter)}/><Row label="Monthly free cash" value={money(emiR.cashBufferAfter)}/></>}</article>
          </div>
          <details className="inlineAdvanced"><summary>Adjust EMI assumptions</summary><div className="formGrid twoCols"><label className="field">Down payment<MI k="downPayment"/></label><label className="field">Upfront fees<MI k="upfrontFees"/></label><label className="field">Financed fees<MI k="financedFees"/></label><label className="field">Term (months)<input type="number" min="1" value={v.termMonths} onChange={e=>set('termMonths',+e.target.value)}/></label><label className="field">APR %<input type="number" min="0" step="0.1" value={v.apr} onChange={e=>set('apr',+e.target.value)}/></label></div>{emiR&&<p className="note">Debt share of take-home with this EMI: {pct(emiR.debtShareTakeHome)}.</p>}</details>
        </div></details>

        <details className="detailAccordion"><summary><div><span>02 · Timing & target</span><b>Wait or change the purchase</b><small>See what would actually close the gap</small></div><em>+</em></summary><div className="accordionBody">
          <div className="targetAnswer"><span>{r.reserveGap===0?'Your selected target is already preserved':targetMonths===null?'Set a monthly saving amount to estimate timing':`About ${targetMonths} months to restore your target`}</span><strong>{r.reserveGap===0?money(0):money(r.reserveGap)}</strong><p>{r.reserveGap===0?'No additional reserve is required under the current assumptions.':`At ${money(v.monthlyPurchaseSaving)}/month, this is the current reserve gap to close.`}</p></div>
          <label className="field">Monthly amount you can realistically add<MI k="monthlyPurchaseSaving"/></label>
          <div className="quickWait"><span>Explore a different wait</span><div>{[1,3,6,12].map(m=><button key={m} className={wait===m?'active':''} onClick={()=>setWait(m)}>{m} mo</button>)}</div></div>
          <div className="waitPreview"><span>After {wait} months</span><strong>{money(waitAvailable)}</strong><small>available savings, assuming price, income and expenses stay unchanged</small></div>
          <div className="subDivider"/>
          <h3>What would make it fit your target?</h3>
          <div className="solutionGrid"><article><span>Save more</span><strong>{money(r.reserveGap)}</strong><small>additional liquid savings</small></article><article><span>Wait</span><strong>{targetMonths===null?'—':`${targetMonths} mo`}</strong><small>at {money(v.monthlyPurchaseSaving)}/month</small></article><article><span>Lower the price</span><strong>{money(Math.min(v.purchasePrice,r.reserveGap))}</strong><small>equivalent reduction, all else unchanged</small></article></div>
        </div></details>

        <details className="detailAccordion secondary"><summary><div><span>03 · Deeper analysis</span><b>Flexibility, stress & ownership</b><small>Open only the analysis you actually need</small></div><em>+</em></summary><div className="accordionBody nestedStack">
          <details className="nestedDetail"><summary><div><span>Monthly flexibility</span><b>{money(r.cashBufferAfter)} free cash after purchase</b></div><em>+</em></summary><div className="nestedBody"><div className="segmented"><button className={v.incomeMode==='regular'?'active':''} onClick={()=>set('incomeMode','regular')}>Regular income</button><button className={v.incomeMode==='variable'?'active':''} onClick={()=>set('incomeMode','variable')}>Variable income</button></div>{v.incomeMode==='variable'&&<label className="field">Conservative monthly income<MI k="conservativeIncome"/></label>}<label className="field">Planned monthly saving<MI k="plannedMonthlySaving"/></label><div className="rows"><Row label="Income used for analysis" value={money(r.analysisIncome)}/><Row label="Monthly free cash" value={`${money(r.cashBuffer)} → ${money(r.cashBufferAfter)}`}/><Row label="After planned saving" value={`${money(r.discretionaryCapacity)} → ${money(r.discretionaryCapacityAfter)}`}/></div></div></details>

          <details className="nestedDetail"><summary><div><span>Income interruption</span><b>{stressRunway===null?'N/A':`${stressRunway.toFixed(1)} months coverage`}</b></div><em>+</em></summary><div className="nestedBody"><div className="stressLead"><span>If income stopped today</span><strong>{stressRunway===null?'N/A':`${stressRunway.toFixed(1)} months`}</strong><small>of post-purchase liquid coverage under emergency-mode spending</small></div><div className="quickWait stressButtons"><span>Test an interruption</span><div>{[1,3,6,12].map(m=><button key={m} className={stress===m?'active':''} onClick={()=>setStress(m)}>{m} mo</button>)}</div></div><div className="rows"><Row label={`Liquid cash after ${stress} months`} value={money(stressRemaining)}/><Row label="Stress monthly burn" value={money(stressBurn)}/></div><details className="inlineAdvanced"><summary>Adjust emergency-mode spending</summary><label className="field">Emergency-mode expenses<MI k="emergencyModeExpenses"/></label></details><p className="note">Existing debt obligations and any new EMI are assumed unchanged during the interruption.</p></div></details>

          <details className="nestedDetail"><summary><div><span>Ownership cost</span><b>{r.ownership?`${money(r.ownership.costPerMonth)}/month`:'Add ownership assumptions'}</b></div><em>+</em></summary><div className="nestedBody"><div className="formGrid twoCols"><label className="field">How long will you keep it? <small>months</small><input type="number" min="1" value={v.ownershipMonths??24} onChange={e=>set('ownershipMonths',+e.target.value)}/></label><label className="field">How often will you use it? <small>times/week</small><input type="number" min="0" value={v.usesPerWeek??0} onChange={e=>set('usesPerWeek',+e.target.value)}/></label></div><details className="inlineAdvanced"><summary>+ Add ownership costs</summary><div className="formGrid twoCols"><label className="field">Accessories<MI k="accessories"/></label><label className="field">Maintenance<MI k="maintenance"/></label><label className="field">Recurring costs<MI k="recurringOwnershipCosts"/></label><label className="field">Expected resale<MI k="expectedResaleValue"/></label></div></details>{r.ownership&&<div className="ownershipSummary"><div><span>Estimated total over {v.ownershipMonths} months</span><strong>{money(r.ownership.totalOwnershipCost)}</strong></div><div><span>Approx. per month</span><b>{money(r.ownership.costPerMonth)}</b></div><div><span>Approx. per expected use</span><b>{money(r.ownership.costPerUse)}</b></div></div>}</div></details>
        </div></details>
      </section>
      <p className="resultDisclaimer">These are consequences of the numbers and boundaries you entered, not a recommendation to buy or not buy.</p>
    </>}
  </main>;
}
