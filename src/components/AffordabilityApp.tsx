'use client';

import {useMemo,useState} from 'react';
import {calculateScenario,validateScenario,type Scenario} from '@/lib/financeEngine';

const fmt=(n:number|null|undefined)=>n===null||n===undefined||!Number.isFinite(n)?'N/A':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const months=(n:number|null)=>n===null?'N/A':`${n.toFixed(1)} months`;
const pct=(n:number|null)=>n===null?'N/A':`${(n*100).toFixed(1)}%`;

const initial:Scenario={
  purchasePrice:149900,monthlyTakeHome:140000,incomeMode:'regular',conservativeIncome:110000,
  essentials:60000,debtPayments:15000,plannedMonthlySaving:10000,
  emergencySavings:300000,availableSavings:200000,reserveTargetMonths:6,
  paymentMode:'cash',downPayment:30000,upfrontFees:2000,financedFees:0,apr:12,termMonths:12,
  monthlyPurchaseSaving:25000,emergencyModeExpenses:50000,
  ownershipMonths:24,accessories:0,maintenance:0,recurringOwnershipCosts:0,expectedResaleValue:0,usesPerWeek:2
};

export default function AffordabilityApp(){
  const [v,setV]=useState<Scenario>(initial);
  const [wait,setWait]=useState(3);
  const [stress,setStress]=useState(2);
  const set=<K extends keyof Scenario>(k:K,x:Scenario[K])=>setV(s=>({...s,[k]:x}));
  const errors=useMemo(()=>validateScenario(v),[v]);
  const r=useMemo(()=>errors.length?null:calculateScenario(v),[v,errors.length]);

  const funding=r?.cashState==='fundable_without_emergency'?'Fully fundable without touching emergency savings.':r?.cashState==='uses_emergency'?`Requires ${fmt(r.emergencyUsed)} from emergency savings.`:r?'Current liquid cash is insufficient for the upfront amount.':'Complete the required inputs to see the impact.';
  const waitAvailable=v.availableSavings+Math.max(0,v.monthlyPurchaseSaving)*wait;
  const stressBurn=(v.emergencyModeExpenses??v.essentials)+v.debtPayments+(r?.newEmi??0);
  const stressRunway=r&&stressBurn>0?r.liquidAfter/stressBurn:null;
  const stressRemaining=r?Math.max(0,r.liquidAfter-stressBurn*stress):null;

  return <main className="appShell">
    <nav className="nav"><div className="brand"><div className="brandMark">₹</div><div><b>BeforeYouBuy</b><small>Purchase impact simulator</small></div></div><div className="navActions"><button onClick={()=>localStorage.setItem('cai-scenario',JSON.stringify(v))}>Save on device</button><button onClick={()=>{const x=localStorage.getItem('cai-scenario');if(x)setV(JSON.parse(x))}}>Load</button></div></nav>

    <section className="hero"><div><div className="eyebrow">PRIVATE • LOCAL • DETERMINISTIC</div><h1>Can I afford it?</h1><p>See what changes before you decide. No score, no bank connection, and no buy/don’t-buy verdict.</p></div><div className="heroCard"><span>Purchase</span><strong>{fmt(v.purchasePrice)}</strong><small>Your numbers stay in this browser.</small></div></section>

    <section className="workspace">
      <aside className="card inputPanel">
        <div className="sectionTitle"><span>01</span><h2>First-use numbers</h2></div>
        {[
          ['Purchase price','purchasePrice'],['Monthly take-home','monthlyTakeHome'],['Essential + mandatory expenses','essentials'],['Existing debt payments','debtPayments'],['Emergency savings','emergencySavings'],['Available savings','availableSavings']
        ].map(([label,key])=><label className="field" key={key}>{label}<input type="number" min="0" value={v[key as keyof Scenario] as number} onChange={e=>set(key as keyof Scenario,+e.target.value as never)}/></label>)}

        <label className="field">Reserve target: {v.reserveTargetMonths} months<input type="range" min="1" max="18" value={v.reserveTargetMonths} onChange={e=>set('reserveTargetMonths',+e.target.value)}/><small>6 months is a common reference point; your appropriate reserve depends on your circumstances.</small></label>

        <div className="sectionTitle"><span>02</span><h2>Advanced assumptions</h2></div>
        <div className="segmented"><button className={v.incomeMode==='regular'?'active':''} onClick={()=>set('incomeMode','regular')}>Regular income</button><button className={v.incomeMode==='variable'?'active':''} onClick={()=>set('incomeMode','variable')}>Variable income</button></div>
        {v.incomeMode==='variable'&&<label className="field">Conservative monthly income<input type="number" min="0" value={v.conservativeIncome??''} onChange={e=>set('conservativeIncome',+e.target.value)}/></label>}
        <label className="field">Planned monthly saving<input type="number" min="0" value={v.plannedMonthlySaving} onChange={e=>set('plannedMonthlySaving',+e.target.value)}/></label>

        <div className="segmented"><button className={v.paymentMode==='cash'?'active':''} onClick={()=>set('paymentMode','cash')}>Cash</button><button className={v.paymentMode==='emi'?'active':''} onClick={()=>set('paymentMode','emi')}>EMI</button></div>
        {v.paymentMode==='emi'&&<><div className="two"><label className="field">Down payment<input type="number" min="0" value={v.downPayment} onChange={e=>set('downPayment',+e.target.value)}/></label><label className="field">Upfront fees<input type="number" min="0" value={v.upfrontFees} onChange={e=>set('upfrontFees',+e.target.value)}/></label></div><div className="two"><label className="field">Financed fees<input type="number" min="0" value={v.financedFees} onChange={e=>set('financedFees',+e.target.value)}/></label><label className="field">Term (months)<input type="number" min="1" value={v.termMonths} onChange={e=>set('termMonths',+e.target.value)}/></label></div><label className="field">APR %<input type="number" min="0" step="0.1" value={v.apr} onChange={e=>set('apr',+e.target.value)}/></label></>}

        {errors.length>0&&<div className="note">{errors.map(x=><div key={x}>• {x}</div>)}</div>}
      </aside>

      <div className="results">
        <section className="card resultHero"><div><div className="eyebrow">PURCHASE IMPACT</div><h2>{funding}</h2><p className="note">The app reports consequences against boundaries you chose. It does not classify the purchase as safe, good, bad, or recommended.</p></div>{r&&<div className="status">{r.liquidAfter>=r.requiredReserve?'Emergency target preserved':'Below selected reserve target'}</div>}</section>

        {r&&<>
          <div className="metricGrid"><div className="card metric"><small>Available savings after</small><strong>{fmt(r.availableAfter)}</strong></div><div className="card metric"><small>Emergency savings after</small><strong>{fmt(r.emergencyAfter)}</strong></div><div className="card metric"><small>Liquid runway after</small><strong>{months(r.liquidRunwayAfter)}</strong></div><div className="card metric"><small>Reserve gap</small><strong>{fmt(r.reserveGap)}</strong></div></div>

          <section className="card detail"><div className="sectionTitle"><span>03</span><h2>Savings & runway</h2></div><div className="rows"><div><span>Available savings used</span><b>{fmt(r.availableUsed)}</b></div><div><span>Emergency savings used</span><b>{fmt(r.emergencyUsed)}</b></div><div><span>Total liquid savings</span><b>{fmt(v.availableSavings+v.emergencySavings)} → {fmt(r.liquidAfter)}</b></div><div><span>Dedicated emergency runway</span><b>{months(r.dedicatedEmergencyRunway)}</b></div><div><span>Total liquid runway</span><b>{months(r.totalLiquidRunway)} → {months(r.liquidRunwayAfter)}</b></div><div><span>Selected reserve requirement after purchase</span><b>{fmt(r.requiredReserve)}</b></div></div></section>

          <section className="card detail"><div className="sectionTitle"><span>04</span><h2>Monthly cash-flow impact</h2></div><div className="rows"><div><span>Income used for analysis</span><b>{fmt(r.analysisIncome)}</b></div><div><span>Cash buffer</span><b>{fmt(r.cashBuffer)} → {fmt(r.cashBufferAfter)}</b></div><div><span>After planned monthly saving</span><b>{fmt(r.discretionaryCapacity)} → {fmt(r.discretionaryCapacityAfter)}</b></div><div><span>Core monthly obligations</span><b>{fmt(r.coreObligations)} → {fmt(r.postObligations)}</b></div>{v.paymentMode==='emi'&&<><div><span>New EMI</span><b>{fmt(r.newEmi)}/mo</b></div><div><span>Debt share of take-home</span><b>{pct(r.debtShareTakeHome)}</b></div><div><span>Total financing cost</span><b>{fmt(r.totalFinancingCost)}</b></div><div><span>Extra paid vs cash price</span><b>{fmt(r.financingPremium)}</b></div></>}</div></section>

          <section className="card detail"><div className="sectionTitle"><span>05</span><h2>What happens if I wait?</h2></div><div className="two"><label className="field">Realistic monthly purchase saving<input type="number" min="0" value={v.monthlyPurchaseSaving} onChange={e=>set('monthlyPurchaseSaving',+e.target.value)}/></label><label className="field">Wait: {wait} months<input type="range" min="0" max="36" value={wait} onChange={e=>setWait(+e.target.value)}/></label></div><p>At {fmt(v.monthlyPurchaseSaving)}/month, available savings would be <b>{fmt(waitAvailable)}</b> after {wait} months. Price, income and expenses are assumed unchanged.</p><p>{r.reserveGap===0?'Your selected reserve target is already preserved in this scenario.':r.monthsToCloseReserveGap===null?'No target date can be calculated without a positive monthly purchase-saving amount.':`About ${r.monthsToCloseReserveGap} months of saving would close the current reserve gap, assuming other inputs stay unchanged.`}</p></section>

          <section className="card detail"><div className="sectionTitle"><span>06</span><h2>Purchase limits & make-it-work</h2></div><div className="metricGrid"><div className="metric"><small>Purchase-ready cash without touching emergency savings</small><strong>{fmt(r.purchaseReadyCash)}</strong></div><div className="metric"><small>Cash while preserving selected reserve</small><strong>{fmt(r.cashWhilePreservingTarget)}</strong></div></div><div className="rows"><div><span>Additional liquid savings required to restore selected reserve</span><b>{fmt(r.reserveGap)}</b></div><div><span>Equivalent cash price reduction, holding everything else constant</span><b>{fmt(Math.min(v.purchasePrice,r.reserveGap))}</b></div></div></section>

          <section className="card detail"><div className="sectionTitle"><span>07</span><h2>Stress test</h2></div><label className="field">Emergency-mode monthly expenses<input type="number" min="0" value={v.emergencyModeExpenses??0} onChange={e=>set('emergencyModeExpenses',+e.target.value)}/></label><label className="field">Income interruption: {stress} months<input type="range" min="0" max="12" value={stress} onChange={e=>setStress(+e.target.value)}/></label><div className="rows"><div><span>Stress monthly burn</span><b>{fmt(stressBurn)}</b></div><div><span>Stress runway immediately after purchase</span><b>{months(stressRunway)}</b></div><div><span>Liquid cash after simulated interruption</span><b>{fmt(stressRemaining)}</b></div></div><p className="note">Existing debt obligations and the new EMI are assumed unchanged throughout the interruption.</p></section>

          <section className="card detail"><div className="sectionTitle"><span>08</span><h2>Ownership cost</h2></div><div className="two"><label className="field">Ownership months<input type="number" min="1" value={v.ownershipMonths??24} onChange={e=>set('ownershipMonths',+e.target.value)}/></label><label className="field">Uses per week<input type="number" min="0" step="0.5" value={v.usesPerWeek??0} onChange={e=>set('usesPerWeek',+e.target.value)}/></label></div><div className="two"><label className="field">Accessories<input type="number" min="0" value={v.accessories??0} onChange={e=>set('accessories',+e.target.value)}/></label><label className="field">Maintenance<input type="number" min="0" value={v.maintenance??0} onChange={e=>set('maintenance',+e.target.value)}/></label></div><div className="two"><label className="field">Recurring ownership costs<input type="number" min="0" value={v.recurringOwnershipCosts??0} onChange={e=>set('recurringOwnershipCosts',+e.target.value)}/></label><label className="field">Expected resale value<input type="number" min="0" value={v.expectedResaleValue??0} onChange={e=>set('expectedResaleValue',+e.target.value)}/></label></div>{r.ownership&&<div className="rows"><div><span>Total ownership cost</span><b>{fmt(r.ownership.totalOwnershipCost)}</b></div><div><span>Cost per month</span><b>{fmt(r.ownership.costPerMonth)}</b></div><div><span>Cost per expected use</span><b>{fmt(r.ownership.costPerUse)}</b></div></div>}</section>

          {r.warnings.length>0&&<section className="card detail"><div className="sectionTitle"><span>09</span><h2>Facts to notice</h2></div>{r.warnings.map(w=><p className="note" key={w}>• {w}</p>)}</section>}
        </>}
      </div>
    </section>
    <footer>No account. No database. Your financial values are calculated locally in this browser.</footer>
  </main>;
}
