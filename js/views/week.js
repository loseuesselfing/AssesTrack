// One day column of the week view.
import { MAX, TYPES } from '../config.js';
import { S, holidayOn, isT, itemsOn } from '../state.js';
import { esc, fmtD, fmtT, iso, todayIso } from '../utils.js';
import { chipT, evChips, movedChip, slotBadge, social } from './shared.js';

export function dayColumn(date,name){
 const d=iso(date),list=itemsOn(d),full=list.length>=MAX,h=holidayOn(d);
 const cards=list.map(it=>`<button onclick="openPanel('${it.id}')" class="relative text-left bg-white border border-[var(--line)] rounded-lg pl-4 pr-3 py-3 overflow-hidden hover:border-[var(--brand)] w-full"><span class="absolute left-0 top-0 bottom-0 w-1.5 ${TYPES[it.type].bar}"></span>
  <p class="text-xs font-bold text-[var(--brand)]">${fmtT(it.time)}</p><h4 class="font-bold leading-tight">${esc(it.subject)}</h4><div class="flex flex-wrap gap-1 mt-1.5">${chipT(it.type)}${movedChip(it)}</div>
  ${it.description?`<p class="text-sm text-[var(--muted)] mt-2 leading-snug line-clamp-2">${esc(it.description)}</p>`:''}${social(it)}</button>`).join('');
 const dis='border-[var(--line)] text-[var(--muted)] bg-slate-100 cursor-not-allowed';
 const add=S.view==='next'&&isT()?`<button onclick="openAdd('${d}')" class="w-full text-sm font-bold rounded-lg py-2 border ${h||full?dis:'border-[var(--brand)] text-[var(--brand)] hover:bg-blue-50'}">${h?'Holiday':full?'Day is full':'+ Add'}</button>`:'';
 return`<section class="bg-[#E9EDF3] rounded-xl p-3 flex flex-col gap-3 ${d===todayIso?'ring-2 ring-[var(--brand)]':''}"><header class="px-1 pt-1">
  <div class="flex items-baseline justify-between"><h3 class="fh font-bold text-lg">${name}</h3><span class="text-sm text-[var(--muted)] font-semibold">${fmtD(date)}${d===todayIso?' · Today':''}</span></div>
  <div class="space-y-1 mt-1">${evChips(d)}</div>
  <div class="flex items-center justify-between mt-2"><div class="flex gap-1" aria-hidden="true">${[0,1,2].map(i=>`<span class="pip ${i<list.length?(full?'full':'on'):''}"></span>`).join('')}</div>${slotBadge(list.length)}</div></header>
  <div class="flex flex-col gap-2.5 flex-1">${cards||`<p class="text-sm text-[var(--muted)] border border-dashed border-[var(--line)] rounded-lg px-3 py-6 text-center">Nothing scheduled.</p>`}</div>${add}</section>`;
}
