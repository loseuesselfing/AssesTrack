// Small HTML pieces reused by several views.
import { EVC, MAX, TYPES } from '../config.js';
import { S, evOn, pref, recentMove } from '../state.js';
import { esc, fmtD, pd, wk } from '../utils.js';

export const sugHtml=l=>l.length?l.map(x=>`<button type="button" onclick="this.closest('form').elements.date.value='${x.d}'" class="border border-[var(--brand)] text-[var(--brand)] rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-blue-50">${wk(x.d)}, ${fmtD(pd(x.d))} · ${x.load}/3 used</button>`).join(''):`<p class="text-sm text-[var(--muted)]">No day has room for these sections. Untick a section or change the type.</p>`;

export const pill=(on,fn,l)=>`<button onclick="${fn}" class="px-3 py-1.5 rounded-lg text-sm font-bold ${on?'bg-[var(--ink)] text-white':'bg-white border border-[var(--line)] hover:bg-slate-50'}">${l}</button>`;

export const chipT=t=>`<span class="inline-block text-[11px] font-bold border rounded-full px-2 py-0.5 ${TYPES[t].chip}">${TYPES[t].label}</span>`;

export const movedChip=it=>{const m=recentMove(it);return m?`<span class="inline-block text-[11px] font-bold border rounded-full px-2 py-0.5 bg-amber-100 text-amber-900 border-amber-300">Moved from ${fmtD(pd(m.from))}</span>`:''};

export const evChips=d=>evOn(d).map(e=>`<p class="text-[11px] font-bold border rounded px-1.5 py-0.5 truncate ${EVC[e.kind]}" title="${esc(e.title)}">${e.kind==='holiday'?'Holiday: ':''}${esc(e.title)}</p>`).join('');

export const statusCtl=id=>{const p=pref(id);return`<div class="flex flex-wrap items-center gap-1.5">${[['todo','To do'],['studying','Studying'],['done','Done']].map(([k,l])=>`<button onclick="setPref('${id}',{st:'${k}'})" aria-pressed="${p.st===k}" class="px-2.5 py-1 rounded-full text-xs font-bold border ${p.st===k?'bg-[var(--brand)] text-white border-transparent':'bg-white border-[var(--line)] hover:bg-slate-50'}">${l}</button>`).join('')}
 <button onclick="setPref('${id}',{bell:${!p.bell}})" aria-pressed="${p.bell}" class="px-2.5 py-1 rounded-full text-xs font-bold border ${p.bell?'bg-amber-100 text-amber-900 border-amber-300':'bg-white border-[var(--line)] hover:bg-slate-50'}">${p.bell?'🔔 Reminder on':'🔕 Remind me'}</button></div>`};

export const slotBadge=n=>n>=MAX?`<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">Full 3/3</span>`:`<span class="text-xs font-bold px-2 py-0.5 rounded-full border ${n===MAX-1?'bg-amber-100 text-amber-900 border-amber-300':'bg-emerald-100 text-emerald-800 border-emerald-300'}">${n}/3 filled</span>`;

export const social=it=>{const r=Object.values(it.reactions).reduce((a,l)=>a+l.length,0),p=pref(it.id),b=[];if(p.st!=='todo')b.push(p.st==='done'?'✓ Done':'Studying');if(r)b.push(r+' reactions');if(it.comments.length)b.push(it.comments.length+' comments');if(it.files.length)b.push(it.files.length+' files');return b.length?`<p class="text-xs text-[var(--muted)] mt-2">${b.join(' · ')}</p>`:''};

// The Dark / Light button (header and sign-in page). Full theme choice lives in Settings.
export const darkToggle=cls=>`<button onclick="toggleDark()" class="${cls}" aria-label="Toggle dark mode" aria-pressed="${S.theme==='dark'}">${S.theme==='dark'?'☀ Light':'☾ Dark'}</button>`;

// Gear (wheel) icon button that opens the Settings drawer.
export const gearBtn=cls=>`<button onclick="openSettings()" class="${cls}" aria-label="Open settings" title="Settings"><svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7"/><path d="M19 12h2.6M16.95 16.95l1.84 1.84M12 19v2.6M7.05 16.95l-1.84 1.84M5 12H2.4M7.05 7.05 5.21 5.21M12 5V2.4M16.95 7.05l1.84-1.84"/></svg></button>`;
