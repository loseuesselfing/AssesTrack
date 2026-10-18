// Today and this week screen with progress and reminders.
import { TYPES } from '../config.js';
import { S, evOn, pref, secKey } from '../state.js';
import { addDays, esc, fmtD, fmtT, iso, now, pd, todayIso, tomorrowIso, wk } from '../utils.js';
import { chipT, evChips, movedChip, statusCtl } from './shared.js';

export function homeView(){
 const k=secKey(),end=iso(addDays(now,14)),its=S.items.filter(i=>i.sec===k&&i.date>=todayIso&&i.date<=end);
 const dates=[...new Set([todayIso,...its.map(i=>i.date),...S.events.filter(e=>e.date>=todayIso&&e.date<=end).map(e=>e.date)])].sort();
 const soon=its.filter(i=>{const p=pref(i.id);return p.bell&&p.st!=='done'&&i.date<=tomorrowIso}).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const banner=soon.length?`<div class="mt-5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3" role="alert"><p class="font-bold">🔔 Reminders</p>${soon.map(i=>`<p class="text-sm mt-1"><b>${esc(i.subject)}</b> ${TYPES[i.type].label.toLowerCase()} ${i.date===todayIso?'today':'tomorrow'} at ${fmtT(i.time)}</p>`).join('')}</div>`:'';
 const row=it=>`<div class="bg-white border border-[var(--line)] rounded-xl p-3 flex flex-wrap items-center gap-3 ${pref(it.id).st==='done'?'opacity-60':''}">
  <span class="w-1.5 self-stretch rounded ${TYPES[it.type].bar}"></span>
  <div class="flex-1 min-w-[200px]"><button onclick="openPanel('${it.id}')" class="text-left font-bold hover:underline">${esc(it.subject)}</button>
  <div class="flex flex-wrap items-center gap-2 mt-1"><span class="text-sm font-bold text-[var(--brand)]">${fmtT(it.time)}</span>${chipT(it.type)}${movedChip(it)}</div>
  ${it.description?`<p class="text-sm text-[var(--muted)] mt-1">${esc(it.description)}</p>`:''}</div>${statusCtl(it.id)}</div>`;
 const groups=dates.map(d=>{const l=its.filter(i=>i.date===d).sort((a,b)=>a.time.localeCompare(b.time));
  return`<section class="mt-6"><h2 class="fh font-bold text-lg">${d===todayIso?'Today':d===tomorrowIso?'Tomorrow':wk(d,'long')} <span class="text-[var(--muted)] font-semibold text-base">${fmtD(pd(d))}</span></h2>
  <div class="space-y-2 mt-2">${evChips(d)}${l.map(row).join('')||(evOn(d).length?'':`<p class="text-sm text-[var(--muted)] border border-dashed border-[var(--line)] rounded-lg px-3 py-4">No assessments. Good day to review.</p>`)}</div></section>`}).join('');
 return banner+groups;
}
