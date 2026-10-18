// Admin tools: holidays and events, exception requests, edit history.
import { EVC, ROLE, TYPES } from '../config.js';
import { S } from '../state.js';
import { esc, fmtAt, fmtD, fmtT, pd } from '../utils.js';

export function adminView(){
 const card=(t,b)=>`<section class="bg-white border border-[var(--line)] rounded-xl p-4"><h2 class="fh font-bold text-xl mb-3">${t}</h2>${b}</section>`;
 const ev=[...S.events].sort((a,b)=>a.date.localeCompare(b.date)),pend=S.reqs.filter(r=>r.status==='pending'),done=S.reqs.filter(r=>r.status!=='pending').slice(-4);
 const reqRow=r=>`<div class="border border-[var(--line)] rounded-lg p-3 text-sm"><p><b>${esc(r.by)}</b> asks to add <b>${esc(r.f.subject)}</b> (${TYPES[r.f.type].label}) to Grade ${r.grade}: ${esc(r.f.secs.join(', '))} on ${fmtD(pd(r.f.date))}, ${fmtT(r.f.time)}.</p><p class="text-xs text-[var(--muted)] mt-1">Requested ${fmtAt(r.at)}. Files are not carried over.</p>
  <div class="flex gap-2 mt-2"><button onclick="decide('${r.id}',true)" class="px-3 py-1.5 rounded-lg font-bold text-white bg-emerald-700">Approve</button><button onclick="decide('${r.id}',false)" class="px-3 py-1.5 rounded-lg font-bold border border-[var(--line)]">Deny</button></div></div>`;
 return`<div class="mt-5 grid lg:grid-cols-2 gap-4 items-start">
 ${card('Holidays and school events',`<form onsubmit="addEvent(event)" class="grid sm:grid-cols-2 gap-3"><label class="text-sm font-semibold">Date<input class="inp" type="date" name="date" required></label>
  <label class="text-sm font-semibold">Type<select class="inp" name="kind"><option value="holiday">Holiday (no assessments)</option><option value="event">School event (shown only)</option></select></label>
  <label class="text-sm font-semibold sm:col-span-2">Title<input class="inp" name="title" required maxlength="60" placeholder="e.g. Foundation Day"></label>
  <button class="sm:col-span-2 px-4 py-2.5 rounded-lg font-bold text-white bg-[var(--brand)]">Add to calendar</button></form>
  <div class="mt-4 max-h-64 overflow-y-auto space-y-1.5">${ev.map(e=>`<div class="flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-1.5 ${EVC[e.kind]}"><span><b>${fmtD(pd(e.date))}</b> ${esc(e.title)}</span><button onclick="removeEvent('${e.id}')" class="font-bold underline text-xs">Remove</button></div>`).join('')}</div>
  <p class="text-xs text-[var(--muted)] mt-2">Seeded holidays are fixed-date national holidays. Add movable holidays and school events yourself.</p>`)}
 ${card(`Exception requests (${pend.length} pending)`,`<div class="space-y-2">${pend.map(reqRow).join('')||'<p class="text-sm text-[var(--muted)]">No pending requests. Teachers can ask for one when a day is full.</p>'}</div>${done.length?`<p class="text-xs font-bold mt-4 mb-1">Recently decided</p>${done.map(r=>`<p class="text-xs text-[var(--muted)]">${esc(r.f.subject)} (${esc(r.by)}): ${r.status} by ${esc(r.by2||'')}</p>`).join('')}`:''}`)}
 <div class="lg:col-span-2">${card('Edit history',`<div class="overflow-x-auto max-h-96 overflow-y-auto"><table class="w-full text-sm min-w-[620px]"><thead><tr class="text-left text-xs text-[var(--muted)]"><th class="py-1 pr-3">When</th><th class="pr-3">Who</th><th class="pr-3">Action</th><th>Details</th></tr></thead><tbody>
  ${S.log.slice(0,80).map(l=>`<tr class="border-t border-[var(--line)] align-top"><td class="py-1.5 pr-3 whitespace-nowrap">${fmtAt(l.at)}</td><td class="pr-3 whitespace-nowrap">${esc(l.who)} <span class="text-xs text-[var(--muted)]">${ROLE[l.role]}</span></td><td class="pr-3 font-bold whitespace-nowrap">${l.act}</td><td>${esc(l.txt)}</td></tr>`).join('')}</tbody></table></div>`)}</div></div>`;
}
