// Month calendar view.
import { MAX, TYPES } from '../config.js';
import { S, holidayOn, isT, itemsOn } from '../state.js';
import { addDays, esc, fmtT, iso, todayIso } from '../utils.js';
import { evChips } from './shared.js';

export function monthView(){
 const{y,m}=S.cur,first=new Date(y,m,1),lead=(first.getDay()+6)%7,rows=Math.ceil((lead+new Date(y,m+1,0).getDate())/7),start=addDays(first,-lead);let cells='';
 for(let i=0;i<rows*7;i++){
  const dt=addDays(start,i),d=iso(dt),list=itemsOn(d),inM=dt.getMonth()===m,we=dt.getDay()===0||dt.getDay()===6,h=holidayOn(d);
  const chips=list.map(it=>`<button onclick="openPanel('${it.id}')" class="block w-full text-left truncate text-[10px] sm:text-xs font-semibold border rounded px-1 py-0.5 ${TYPES[it.type].chip}" title="${esc(it.subject)}">${fmtT(it.time).replace(':00','').replace(' ','')} ${esc(it.subject)}</button>`).join('');
  const add=isT()&&d>todayIso&&!h&&list.length<MAX?`<button onclick="openAdd('${d}')" class="text-[var(--brand)] font-bold text-sm leading-none px-1" aria-label="Add on ${d}">+</button>`:'';
  cells+=`<div class="min-h-[92px] sm:min-h-[118px] p-1 border-t border-l border-[var(--line)] ${h?'bg-red-50':we?'bg-slate-100':'bg-white'} ${inM?'':'opacity-45'}">
  <div class="flex items-center justify-between mb-1"><span class="text-xs font-bold ${d===todayIso?'bg-[var(--brand)] text-white rounded-full px-1.5':''}">${dt.getDate()}</span><span class="flex items-center gap-1">${list.length>=MAX?'<span class="text-[10px] font-bold bg-red-600 text-white rounded px-1">Full</span>':''}${add}</span></div>
  <div class="space-y-0.5">${evChips(d)}${chips}</div></div>`;
 }
 return`<div class="mt-5 overflow-x-auto"><div class="min-w-[640px] border-r border-b border-[var(--line)] rounded-lg overflow-hidden"><div class="grid grid-cols-7 bg-[#E9EDF3] text-xs font-bold text-center">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div class="py-2">${x}</div>`).join('')}</div><div class="grid grid-cols-7">${cells}</div></div></div>`;
}
