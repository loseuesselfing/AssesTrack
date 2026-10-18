// Workload heatmap across all sections.
import { SECTIONS } from '../config.js';
import { S, holidayOn, itemsOn } from '../state.js';
import { addDays, fmtD, iso, nextMon, pd, secName, thisMon, wk } from '../utils.js';

export function heatView(){
 const mon=S.view==='next'?nextMon:thisMon,ds=Array.from({length:5},(_,i)=>iso(addDays(mon,i)));
 const rows=Object.entries(SECTIONS).map(([g,ss])=>ss.map(s=>`<tr><th class="text-left text-sm font-bold px-3 py-1.5 whitespace-nowrap">G${g} · ${s}</th>${ds.map(d=>{const n=itemsOn(d,g+'|'+s).length,h=holidayOn(d);
  return`<td class="p-1"><button onclick="heatGo(${g},'${s}')" class="w-full rounded-md py-2 text-sm font-bold ${h?'hh':'h'+n}" title="Open ${secName(g+'|'+s)}">${h?'Holiday':n+'/3'}</button></td>`}).join('')}</tr>`).join('')).join('');
 const tot=ds.map(d=>S.items.filter(i=>i.date===d).length);
 return`<div class="mt-4 flex flex-wrap gap-3 text-xs font-bold items-center"><span class="h0 border border-[var(--line)] rounded px-2 py-1">0 free</span><span class="h1 rounded px-2 py-1">1</span><span class="h2 rounded px-2 py-1">2 almost full</span><span class="h3 rounded px-2 py-1">3 full</span><span class="hh rounded px-2 py-1">Holiday</span></div>
 <div class="mt-4 overflow-x-auto bg-white border border-[var(--line)] rounded-xl p-2"><table class="w-full min-w-[560px] border-collapse"><thead><tr><th></th>${ds.map(d=>`<th class="text-sm font-bold pb-1">${wk(d)}<span class="block text-xs text-[var(--muted)] font-semibold">${fmtD(pd(d))}</span></th>`).join('')}</tr></thead><tbody>${rows}</tbody>
 <tfoot><tr><th class="text-left text-xs px-3 pt-2 text-[var(--muted)]">All sections</th>${tot.map(n=>`<td class="text-center text-xs font-bold pt-2">${n} items</td>`).join('')}</tr></tfoot></table></div>`;
}
