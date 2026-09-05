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
  const [purchaseName,setPurchaseName]=useState('MacBook Pro');
  const [showResult,setShowResult]=useState(false);
  const [wait,setWait]=useState(3);
  const [stress,setStress]=useState(2);
  const set=<K extends keyof Scenario>(k:K,x:Scenario[K])=>setV(s=>({...s,[k]:x}));
  const errors=useMemo(()=>validateScenario(v),[v]);
  const r=useMemo(()=>errors.length?null:calculateScenario(v),[v,errors.length]);

  const funding=r?.cashState==='fundable_without_emergency'?'Fundable without touching emergency savings':r?.cashState==='uses_emergency'?`Uses ${fmt(r.emergencyUsed)} of emergency savings`:r?'Current liquid cash is insufficient':'Complete the required numbers';
  const totalBefore=v.availableSavings+v.emergencySavings;
  const waitAvailable=v.availableSavings+Math.max(0,v.monthlyPurchaseSaving)*wait;
  const stressBurn=(v.emergencyModeExpenses??v.essentials)+v.debtPayments+(r?.newEmi??0);
  const stressRunway=r&&stressBurn>0?r.liquidAfter/stressBurn:null;
  const stressRemaining=r?Math.max(0,r.liquidAfter-stressBurn*stress):null;

  const saveScenario=()=>localStorage.setItem('cai-scenario',JSON.stringify({scenario:v,purchaseName}));
  const loadScenario=()=>{
    const raw=localStorage.getItem('cai-scenario');
    if(!raw)return;
    try{
      const parsed=JSON.parse(raw);
      if(parsed?.scenario){setV(parsed.scenario);setPurchaseName(parsed.purchaseName??'');}
      else setV(parsed);
    }catch{}
  };

  return <main className="appShell">
    <nav className="nav">
      <div className="brand"><div className="brandMark">₹</div><div><b>BeforeYouBuy</b><small>See what changes before you decide</small></div></div>
      <div className="navActions"><button onClick={saveScenario}>Save</button><button onClick={loadScenario}>Load</button></div>
    </nav>

    {!showResult&&<>
      <section className="intro">
        <div className="eyebrow">PRIVATE • LOCAL • NO ACCOUNT</div>
        <h1>Can I afford it?</h1>
        <p>Put in six numbers. We’ll show what this purchase changes in your cash, emergency reserve and monthly flexibility.</p>
      </section>

      <section className="questionCard">
        <div className="stepHeader"><span>01</span><div><h2>What are you thinking of buying?</h2><p>Start with the purchase, then your current money.</p></div></div>
        <label className="field bigField">Purchase name<input type="text" value={purchaseName} onChange={e=>setPurchaseName(e.target.value)} placeholder="e.g. MacBook Pro"/></label>
        <label className="field bigField">Purchase price<input type="number" min="0" value={v.purchasePrice} onChange={e=>set('purchasePrice',+e.target.value)}/></label>

        <div className="divider"/>
        <div className="stepHeader"><span>02</span><div><h2>Your monthly money</h2><p>Use take-home income and required monthly commitments.</p></div></div>
        <div className="formGrid">
          <label className="field">Monthly take-home<input type="number" min="0" value={v.monthlyTakeHome} onChange={e=>set('monthlyTakeHome',+e.target.value)}/></label>
          <label className="field">Essential + mandatory expenses<input type="number" min="0" value={v.essentials} onChange={e=>set('essentials',+e.target.value)}/></label>
          <label className="field">Existing debt payments<input type="number" min="0" value={v.debtPayments} onChange={e=>set('debtPayments',+e.target.value)}/></label>
        </div>

        <div className="divider"/>
        <div className="stepHeader"><span>03</span><div><h2>Your cash</h2><p>Keep emergency money separate from purchase-ready savings.</p></div></div>
        <div className="formGrid twoCols">
          <label className="field">Emergency savings<input type="number" min="0" value={v.emergencySavings} onChange={e=>set('emergencySavings',+e.target.value)}/><small>Money you intend to protect for unexpected needs.</small></label>
          <label className="field">Available savings<input type="number" min="0" value={v.availableSavings} onChange={e=>set('availableSavings',+e.target.value)}/><small>Liquid money you could reasonably use for this purchase.</small></label>
        </div>

        <details className="preResultAdvanced">
          <summary>Adjust reserve target</summary>
          <label className="field">Reserve target: {v.reserveTargetMonths} months<input type="range" min="1" max="18" value={v.reserveTargetMonths} onChange={e=>set('reserveTargetMonths',+e.target.value)}/><small>6 months is a common reference point, not a universal rule.</small></label>
        </details>

        {errors.length>0&&<div className="validationBox">{errors.map(x=><div key={x}>• {x}</div>)}</div>}
        <button className="primaryCta" disabled={errors.length>0} onClick={()=>setShowResult(true)}>See the impact <span>→</span></button>
        <p className="privacyLine">No account. No database. Your numbers stay in this browser.</p>
      </section>
    </>}

    {showResult&&r&&<>
      <section className="resultTop">
        <button className="backButton" onClick={()=>setShowResult(false)}>← Edit numbers</button>
        <div className="purchaseContext"><span>{purchaseName||'This purchase'}</span><strong>{fmt(v.purchasePrice)}</strong></div>
      </section>

      <section className="resultReveal">
        <div className="eyebrow">PURCHASE IMPACT</div>
        <h1>{funding}</h1>
        <p>{r.cashState==='uses_emergency'?`Your available savings cover ${fmt(r.availableUsed)}. The remaining ${fmt(r.emergencyUsed)} comes from money you designated as emergency savings.`:r.cashState==='fundable_without_emergency'?`Your available savings cover the upfront cost without drawing from your emergency bucket.`:`The upfront amount is higher than your current available and emergency savings combined.`}</p>
        <div className={`reserveBanner ${r.liquidAfter>=r.requiredReserve?'ok':'warn'}`}>
          <span>{r.liquidAfter>=r.requiredReserve?'Selected reserve target preserved':'Below your selected reserve target'}</span>
          <b>{months(r.liquidRunwayAfter)} after purchase vs {v.reserveTargetMonths} month target</b>
        </div>
      </section>

      <section className="headlineMetrics">
        <article><span>Total liquid savings</span><strong>{fmt(totalBefore)} <i>→</i> {fmt(r.liquidAfter)}</strong><small>{fmt(totalBefore-r.liquidAfter)} used upfront</small></article>
        <article><span>Liquid runway</span><strong>{months(r.totalLiquidRunway)} <i>→</i> {months(r.liquidRunwayAfter)}</strong><small>Based on required monthly obligations</small></article>
        <article><span>Monthly free cash</span><strong>{fmt(r.cashBufferAfter)}</strong><small>{v.paymentMode==='emi'?`${fmt(r.newEmi)}/month new EMI included`:'Unchanged by a cash purchase'}</small></article>
      </section>

      <section className="reserveCard">
        <div><span>Your selected reserve</span><strong>{v.reserveTargetMonths} months</strong></div>
        <div><span>Required liquid reserve after purchase</span><strong>{fmt(r.requiredReserve)}</strong></div>
        <div><span>Reserve gap</span><strong>{fmt(r.reserveGap)}</strong></div>
        <div className="reserveTrack"><span style={{width:`${Math.min(100,r.requiredReserve>0?(r.liquidAfter/r.requiredReserve)*100:100)}%`}}/></div>
        <p>{r.reserveGap===0?'Your remaining liquid cash still meets the reserve target you selected.':`You would need ${fmt(r.reserveGap)} more liquid savings to restore that target under the current assumptions.`}</p>
      </section>

      <div className="exploreHeading"><div><span>Explore the decision</span><h2>Change one assumption at a time</h2></div><p>The core answer stays visible above. Open only the questions that matter to you.</p></div>

      <section className="accordionStack">
        <details className="detailAccordion">
          <summary><div><span>Cash & reserve breakdown</span><b>Where does the money come from?</b></div><em>+</em></summary>
          <div className="accordionBody rows"><div><span>Available savings used</span><b>{fmt(r.availableUsed)}</b></div><div><span>Emergency savings used</span><b>{fmt(r.emergencyUsed)}</b></div><div><span>Available savings after</span><b>{fmt(r.availableAfter)}</b></div><div><span>Emergency savings after</span><b>{fmt(r.emergencyAfter)}</b></div><div><span>Dedicated emergency runway after</span><b>{months(r.dedicatedEmergencyRunway)}</b></div></div>
        </details>

        <details className="detailAccordion">
          <summary><div><span>Cash vs EMI</span><b>Would financing change the pressure?</b></div><em>+</em></summary>
          <div className="accordionBody">
            <div className="segmented"><button className={v.paymentMode==='cash'?'active':''} onClick={()=>set('paymentMode','cash')}>Cash</button><button className={v.paymentMode==='emi'?'active':''} onClick={()=>set('paymentMode','emi')}>EMI</button></div>
            {v.paymentMode==='emi'&&<div className="formGrid twoCols"><label className="field">Down payment<input type="number" min="0" value={v.downPayment} onChange={e=>set('downPayment',+e.target.value)}/></label><label className="field">Upfront fees<input type="number" min="0" value={v.upfrontFees} onChange={e=>set('upfrontFees',+e.target.value)}/></label><label className="field">Financed fees<input type="number" min="0" value={v.financedFees} onChange={e=>set('financedFees',+e.target.value)}/></label><label className="field">Term (months)<input type="number" min="1" value={v.termMonths} onChange={e=>set('termMonths',+e.target.value)}/></label><label className="field">APR %<input type="number" min="0" step="0.1" value={v.apr} onChange={e=>set('apr',+e.target.value)}/></label></div>}
            {v.paymentMode==='emi'&&<div className="rows"><div><span>New EMI</span><b>{fmt(r.newEmi)}/mo</b></div><div><span>Total financing cost</span><b>{fmt(r.totalFinancingCost)}</b></div><div><span>Extra paid vs cash price</span><b>{fmt(r.financingPremium)}</b></div><div><span>Debt share of take-home</span><b>{pct(r.debtShareTakeHome)}</b></div></div>}
          </div>
        </details>

        <details className="detailAccordion">
          <summary><div><span>Monthly flexibility</span><b>What happens to your month-to-month room?</b></div><em>+</em></summary>
          <div className="accordionBody">
            <div className="segmented"><button className={v.incomeMode==='regular'?'active':''} onClick={()=>set('incomeMode','regular')}>Regular income</button><button className={v.incomeMode==='variable'?'active':''} onClick={()=>set('incomeMode','variable')}>Variable income</button></div>
            {v.incomeMode==='variable'&&<label className="field">Conservative monthly income<input type="number" min="0" value={v.conservativeIncome??''} onChange={e=>set('conservativeIncome',+e.target.value)}/></label>}
            <label className="field">Planned monthly saving<input type="number" min="0" value={v.plannedMonthlySaving} onChange={e=>set('plannedMonthlySaving',+e.target.value)}/></label>
            <div className="rows"><div><span>Income used for analysis</span><b>{fmt(r.analysisIncome)}</b></div><div><span>Cash buffer</span><b>{fmt(r.cashBuffer)} → {fmt(r.cashBufferAfter)}</b></div><div><span>After planned monthly saving</span><b>{fmt(r.discretionaryCapacity)} → {fmt(r.discretionaryCapacityAfter)}</b></div></div>
          </div>
        </details>

        <details className="detailAccordion">
          <summary><div><span>What if I wait?</span><b>See what time changes</b></div><em>+</em></summary>
          <div className="accordionBody"><div className="formGrid twoCols"><label className="field">Realistic monthly purchase saving<input type="number" min="0" value={v.monthlyPurchaseSaving} onChange={e=>set('monthlyPurchaseSaving',+e.target.value)}/></label><label className="field">Wait: {wait} months<input type="range" min="0" max="36" value={wait} onChange={e=>setWait(+e.target.value)}/></label></div><div className="callout"><strong>{fmt(waitAvailable)}</strong><span>available savings after {wait} months at {fmt(v.monthlyPurchaseSaving)}/month</span></div><p className="note">Price, income and expenses are assumed unchanged. {r.reserveGap===0?'Your selected reserve target is already preserved.':r.monthsToCloseReserveGap===null?'A target date needs a positive monthly purchase-saving amount.':`About ${r.monthsToCloseReserveGap} months of saving would close the current reserve gap.`}</p></div>
        </details>

        <details className="detailAccordion">
          <summary><div><span>Make it fit your target</span><b>What would have to change?</b></div><em>+</em></summary>
          <div className="accordionBody"><div className="miniMetricGrid"><article><span>Purchase-ready cash without emergency savings</span><strong>{fmt(r.purchaseReadyCash)}</strong></article><article><span>Cash while preserving selected reserve</span><strong>{fmt(r.cashWhilePreservingTarget)}</strong></article></div><div className="rows"><div><span>Additional liquid savings required</span><b>{fmt(r.reserveGap)}</b></div><div><span>Equivalent cash price reduction</span><b>{fmt(Math.min(v.purchasePrice,r.reserveGap))}</b></div></div></div>
        </details>

        <details className="detailAccordion">
          <summary><div><span>Stress test</span><b>What if income stopped temporarily?</b></div><em>+</em></summary>
          <div className="accordionBody"><div className="formGrid twoCols"><label className="field">Emergency-mode monthly expenses<input type="number" min="0" value={v.emergencyModeExpenses??0} onChange={e=>set('emergencyModeExpenses',+e.target.value)}/></label><label className="field">Income interruption: {stress} months<input type="range" min="0" max="12" value={stress} onChange={e=>setStress(+e.target.value)}/></label></div><div className="rows"><div><span>Stress monthly burn</span><b>{fmt(stressBurn)}</b></div><div><span>Stress runway immediately after purchase</span><b>{months(stressRunway)}</b></div><div><span>Liquid cash after simulated interruption</span><b>{fmt(stressRemaining)}</b></div></div><p className="note">Existing debt obligations and the new EMI are assumed unchanged throughout the interruption.</p></div>
        </details>

        <details className="detailAccordion">
          <summary><div><span>Ownership cost</span><b>What does the purchase cost over time?</b></div><em>+</em></summary>
          <div className="accordionBody"><div className="formGrid twoCols"><label className="field">Ownership months<input type="number" min="1" value={v.ownershipMonths??24} onChange={e=>set('ownershipMonths',+e.target.value)}/></label><label className="field">Uses per week<input type="number" min="0" step="0.5" value={v.usesPerWeek??0} onChange={e=>set('usesPerWeek',+e.target.value)}/></label><label className="field">Accessories<input type="number" min="0" value={v.accessories??0} onChange={e=>set('accessories',+e.target.value)}/></label><label className="field">Maintenance<input type="number" min="0" value={v.maintenance??0} onChange={e=>set('maintenance',+e.target.value)}/></label><label className="field">Recurring ownership costs<input type="number" min="0" value={v.recurringOwnershipCosts??0} onChange={e=>set('recurringOwnershipCosts',+e.target.value)}/></label><label className="field">Expected resale value<input type="number" min="0" value={v.expectedResaleValue??0} onChange={e=>set('expectedResaleValue',+e.target.value)}/></label></div>{r.ownership&&<div className="miniMetricGrid three"><article><span>Total ownership cost</span><strong>{fmt(r.ownership.totalOwnershipCost)}</strong></article><article><span>Cost per month</span><strong>{fmt(r.ownership.costPerMonth)}</strong></article><article><span>Cost per expected use</span><strong>{fmt(r.ownership.costPerUse)}</strong></article></div>}</div>
        </details>
      </section>

      {r.warnings.length>0&&<section className="factsBox"><span>Facts to notice</span>{r.warnings.map(w=><p key={w}>• {w}</p>)}</section>}
      <p className="resultDisclaimer">These are consequences of the numbers and boundaries you entered, not a recommendation to buy or not buy.</p>
    </>}

    <footer>No account. No database. Your financial values are calculated locally in this browser.</footer>
  </main>;
}
