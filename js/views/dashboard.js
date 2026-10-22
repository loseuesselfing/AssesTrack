// Main screen after sign-in: header, section picker, mode tabs and the active view.
import { BADGE, DAYS, MAX, SECTIONS, TYPES } from '../config.js';
import { S, isA, isT, itemsOn, secKey } from '../state.js';
import { addDays, esc, fmtD, iso, nextMon, secName, thisMon } from '../utils.js';
import { adminView } from './admin.js';
import { heatView } from './heat.js';
import { homeView } from './home.js';
import { modalView } from './modal.js';
import { monthView } from './month.js';
import { panelView } from './panel.js';
import { privacyView } from './privacy.js';
import { settingsView } from './settings.js';
import { darkToggle, gearBtn, pill } from './shared.js';
import { dayColumn } from './week.js';

export function dashboardView(){
 const u=S.user,t=isT(),m=S.mode,mon=S.view==='next'?nextMon:thisMon,pend=S.reqs.filter(r=>r.status==='pending').length;
 const modes=[['home','Home'],['week','Week'],['month','Calendar'],['heat','Heatmap'],...(isA()?[['admin','Admin'+(pend?` (${pend})`:'')]]:[])];
 const showPick=['home','week','month'].includes(m);
 const picker=!showPick?'':t?`<div class="flex flex-wrap gap-2">${Object.keys(SECTIONS).map(g=>pill(+g===S.sel.grade,`selGrade(${g})`,'Grade '+g)).join('')}</div><div class="flex flex-wrap gap-2 mt-2">${SECTIONS[S.sel.grade].map(s=>pill(s===S.sel.section,`selSec('${s}')`,s)).join('')}</div>`:`<p class="font-bold">Showing ${secName(secKey())}</p>`;
 let body,title,sub;
 if(m==='home'){title='Today and this week';sub=`Next 14 days for ${secName(secKey())}`;body=homeView()}
 else if(m==='week'){const ds=DAYS.map((_,i)=>addDays(mon,i)),n=ds.reduce((a,d)=>a+itemsOn(iso(d)).length,0);title=S.view==='next'?'Next week':'This week';sub=`${fmtD(mon)} to ${fmtD(addDays(mon,4))} · ${n} item${n===1?'':'s'} for ${secName(secKey())}`;
  body=`${t&&S.view==='this'?`<p class="mt-4 text-sm bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-3 py-2.5">This week is locked. FA and Long quiz can only be scheduled for next week. AA can be scheduled further ahead.</p>`:''}<div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5 items-start">${ds.map((d,i)=>dayColumn(d,DAYS[i])).join('')}</div>`}
 else if(m==='month'){title=new Date(S.cur.y,S.cur.m,1).toLocaleDateString('en-PH',{month:'long',year:'numeric'});sub=`Calendar for ${secName(secKey())}. AA can be planned months ahead.`;body=monthView()}
 else if(m==='heat'){title='Workload heatmap';sub=`All sections, ${fmtD(mon)} to ${fmtD(addDays(mon,4))}. Click a cell to open that section.`;body=heatView()}
 else{title='Admin panel';sub='Users, database, calendar, requests and history';body=adminView()}
 const wkNav=`<nav class="flex gap-2">${pill(S.view==='this',"setView('this')",'This week')}${pill(S.view==='next',"setView('next')",'Next week')}</nav>`;
 const ctl=m==='week'||m==='heat'?wkNav:m==='month'?`<div class="flex flex-wrap items-center gap-2"><button onclick="moveMonth(-1)" class="px-3 py-1.5 rounded-lg bg-white border border-[var(--line)] font-bold" aria-label="Previous month">‹</button><button onclick="goToday()" class="px-3 py-1.5 rounded-lg bg-white border border-[var(--line)] text-sm font-bold">Today</button><button onclick="moveMonth(1)" class="px-3 py-1.5 rounded-lg bg-white border border-[var(--line)] font-bold" aria-label="Next month">›</button>
  <input type="month" value="${S.cur.y}-${String(S.cur.m+1).padStart(2,'0')}" onchange="jumpMonth(this.value)" class="border border-[var(--line)] rounded-lg px-2 py-1.5 text-sm bg-white" aria-label="Jump to month"></div>`:'';
 const legend=Object.values(TYPES).map(x=>`<span class="inline-flex items-center gap-1.5 text-sm"><span class="w-3 h-3 rounded-sm ${x.bar}"></span>${x.label}</span>`).join('');
 return`<header class="bg-[var(--ink)] text-white"><div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
  <div><p class="fh font-extrabold text-xl leading-none">AssesTrack</p><p class="text-xs text-blue-200 mt-1">PSHS-ZRC · Max ${MAX} subjects per day per section</p></div>
  <div class="flex items-center gap-3"><div class="text-right leading-tight"><p class="text-sm font-semibold">${esc(u.name)}</p><span class="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${t?'bg-emerald-400 text-emerald-950':'bg-blue-200 text-blue-950'}">${BADGE[u.role]}</span></div>
  ${darkToggle('text-sm font-semibold border border-white/30 rounded-lg px-3 py-2 hover:bg-white/10')}
  <button onclick="logout()" class="text-sm font-semibold border border-white/30 rounded-lg px-3 py-2 hover:bg-white/10">Sign out</button>
  ${gearBtn('border border-white/30 rounded-lg p-2 hover:bg-white/10')}</div></div></header>
 <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6">${picker?`<div>${picker}</div>`:''}
  <div class="${picker?'mt-5':''} flex flex-wrap items-end justify-between gap-4"><div><h1 class="fh font-extrabold text-3xl">${title}</h1><p class="text-[var(--muted)] mt-1">${sub}</p></div>
  <div class="flex flex-wrap items-center gap-3"><div class="flex flex-wrap gap-2">${modes.map(([k,l])=>pill(m===k,`setMode('${k}')`,l)).join('')}</div>${ctl}${t&&showPick?`<button onclick="openAdd()" class="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dk)]">+ New</button>`:''}</div></div>
  ${!['admin','heat'].includes(m)?`<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2">${legend}</div>`:''}${body}
  <footer class="mt-10 pt-4 border-t border-[var(--line)] text-xs text-[var(--muted)] flex flex-wrap justify-between gap-2"><span>PSHS-ZRC AssesTrack · <button class="underline font-semibold" onclick="S.privacy=true;render()">Data Privacy Act</button></span></footer></main>${modalView()}${panelView()}${settingsView()}${privacyView()}`;
}
