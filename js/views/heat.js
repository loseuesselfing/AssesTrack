// Workload heatmap across all sections.
// Shade = workload: FA counts 1 (light); Long quiz and AA count 2 (heavy). Weights live in TYPES (config.js).
import { MAX, SECTIONS, TYPES } from '../config.js';
import { dayWeight } from '../rules.js';
import { S, holidayOn, itemsOn } from '../state.js';
import { addDays, fmtD, iso, nextMon, pd, secName, thisMon, wk } from '../utils.js';

const LEVELS=['Free','Light','Moderate','Busy','Heavy'];

export function heatView(){
 const mon=S.view==='next'?nextMon:thisMon,ds=Array.from({length:5},(_,i)=>iso(addDays(mon,i)));
 const cell=(g,s,d)=>{
  const list=itemsOn(d,g+'|'+s),h=holidayOn(d),lvl=Math.min(dayWeight(list),4);
  const names=list.map(i=>TYPES[i.type].label).join(', ');
  const tip=`${secName(g+'|'+s)}: ${h?'Holiday':LEVELS[lvl]+(names?' ('+names+')':'')}`;
  const inner=h?'Holiday':`<span class="block text-sm">${list.length}/3</span><span class="block text-[10px] font-semibold opacity-80">${list.map(i=>TYPES[i.type].short).join(' · ')||'&nbsp;'}</span>`;
  return`<td class="p-1"><button onclick="heatGo(${g},'${s}')" class="w-full rounded-md py-1.5 font-bold ${h?'hh text-sm':'h'+lvl}" title="${tip}">${inner}</button></td>`;
 };
 const rows=Object.entries(SECTIONS).map(([g,ss])=>ss.map(s=>`<tr><th class="text-left text-sm font-bold px-3 py-1.5 whitespace-nowrap">G${g} · ${s}</th>${ds.map(d=>cell(g,s,d)).join('')}</tr>`).join('')).join('');
 const tot=ds.map(d=>S.items.filter(i=>i.date===d).length);
 const legend=LEVELS.map((l,i)=>`<span class="h${i} ${i===0?'border border-[var(--line)] ':''}rounded px-2 py-1">${l}</span>`).join('');
 return`<div class="mt-4 flex flex-wrap gap-3 text-xs font-bold items-center">${legend}<span class="hh rounded px-2 py-1">Holiday</span></div>
 <p class="mt-2 text-xs text-[var(--muted)]">Shade shows workload: FA counts 1, Long quiz and AA count 2. Each cell lists what is scheduled. The limit of ${MAX} per section per day still applies.</p>
 <div class="mt-4 overflow-x-auto bg-white border border-[var(--line)] rounded-xl p-2"><table class="w-full min-w-[560px] border-collapse"><thead><tr><th></th>${ds.map(d=>`<th class="text-sm font-bold pb-1">${wk(d)}<span class="block text-xs text-[var(--muted)] font-semibold">${fmtD(pd(d))}</span></th>`).join('')}</tr></thead><tbody>${rows}</tbody>
 <tfoot><tr><th class="text-left text-xs px-3 pt-2 text-[var(--muted)]">All sections</th>${tot.map(n=>`<td class="text-center text-xs font-bold pt-2">${n} items</td>`).join('')}</tr></tfoot></table></div>`;
}
