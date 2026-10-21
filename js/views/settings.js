// Settings drawer, opened by the gear icon: appearance (themes), account and the Data Privacy Notice.
import { BADGE, THEMES } from '../config.js';
import { S } from '../state.js';
import { esc, secName } from '../utils.js';
import { privacyBody } from './privacy.js';

export function settingsView(){
 if(!S.settings)return'';
 const u=S.user;
 const anim=S.settingsFresh?'slide':'';S.settingsFresh=false; // slide in only when first opened, not on every redraw
 const sec=(t,b)=>`<section><h3 class="fh font-bold text-lg mb-3">${t}</h3>${b}</section>`;
 const themes=THEMES.map(t=>{const on=S.theme===t.id;return`<button onclick="setTheme('${t.id}')" aria-pressed="${on}" class="text-left rounded-xl border-2 p-3 ${on?'border-[var(--brand)] bg-blue-100':'border-[var(--line)] bg-white hover:bg-slate-50'}"><span class="block h-12 rounded-lg mb-2 border border-black/10" style="background:linear-gradient(135deg,${t.swatch[0]} 55%,${t.swatch[1]} 55%)"></span><span class="flex items-center justify-between gap-1"><b>${t.label}</b>${on?'<span class="text-xs font-bold text-[var(--brand)]">Selected</span>':''}</span><span class="block text-xs text-[var(--muted)] mt-0.5">${t.desc}</span></button>`}).join('');
 const account=u?sec('Account',`<p class="font-bold">${esc(u.name)}</p><span class="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${u.role==='scholar'?'bg-blue-200 text-blue-950':'bg-emerald-400 text-emerald-950'}">${BADGE[u.role]}</span>${u.role==='scholar'?`<p class="text-sm mt-2">Section: <b>${secName(u.grade+'|'+u.section)}</b></p>`:''}<div class="mt-3"><button onclick="logout()" class="px-4 py-2 rounded-lg text-sm font-bold border border-[var(--line)] hover:bg-slate-50">Sign out</button></div>`):'';
 return`<div class="fixed inset-0 z-[55] bg-slate-900/40 flex justify-end" onclick="if(event.target===this)closeSettings()"><aside class="${anim} bg-white w-full sm:w-[440px] h-full flex flex-col shadow-2xl" role="dialog" aria-modal="true" aria-label="Settings">
 <header class="p-5 border-b border-[var(--line)] flex items-center justify-between"><h2 class="fh font-bold text-2xl">Settings</h2><button onclick="closeSettings()" class="text-2xl leading-none px-2" aria-label="Close settings">×</button></header>
 <div class="flex-1 overflow-y-auto p-5 space-y-7">${sec('Appearance',`<p class="text-sm text-[var(--muted)] mb-3">Choose a theme. It is remembered on this device.</p><div class="grid grid-cols-2 gap-3">${themes}</div>`)}${account}${sec('Data Privacy',privacyBody())}</div></aside></div>`;
}
