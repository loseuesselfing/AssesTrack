// Settings drawer (gear icon): a menu with Profile, Appearance and Data Privacy Act.
import { BADGE, MIN_PASSWORD, ROLE, THEMES } from '../config.js';
import { S } from '../state.js';
import { esc, fmtAt, secName } from '../utils.js';
import { privacyBody } from './privacy.js';

const TITLES={profile:'Profile',appearance:'Appearance',privacy:'Data Privacy Act'};

function profilePage(u){
 const initials=u.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
 const row=(k,v)=>`<div class="flex justify-between gap-4 py-2 border-b border-[var(--line)] text-sm"><span class="text-[var(--muted)]">${k}</span><span class="font-semibold text-right break-all">${v}</span></div>`;
 const place=u.grade?secName(u.grade+'|'+u.section):u.role==='scholar'?'Not set':'Any section';
 return`<div class="flex items-center gap-4"><span class="w-16 h-16 shrink-0 rounded-full bg-[var(--brand)] flex items-center justify-center fh font-bold text-2xl" style="color:var(--on-brand)">${esc(initials)}</span>
  <div class="min-w-0"><p class="fh font-bold text-xl break-words">${esc(u.name)}</p><span class="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${u.role==='scholar'?'bg-blue-200 text-blue-950':'bg-emerald-400 text-emerald-950'}">${BADGE[u.role]}</span></div></div>
 <div class="mt-4">${row(u.email?'Email':'Username',esc(u.email||u.username))}${row('Role',ROLE[u.role])}${row('Grade and section',place)}${row('Member since',fmtAt(u.createdAt))}${u.lastLoginAt?row('Last sign-in',fmtAt(u.lastLoginAt)):''}</div>
 ${u.role==='scholar'?'<p class="text-xs text-[var(--muted)] mt-2">Need a different section? Ask an admin.</p>':''}
 <form onsubmit="changePassword(event)" class="mt-6 space-y-3"><h3 class="fh font-bold text-lg">Change password</h3>
  <label class="block text-sm font-semibold">Current password<input class="inp" type="password" name="current" required autocomplete="current-password"></label>
  <label class="block text-sm font-semibold">New password<input class="inp" type="password" name="next" required minlength="${MIN_PASSWORD}" autocomplete="new-password"></label>
  <button class="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dk)]">Update password</button></form>
 <button onclick="logout()" class="mt-6 px-4 py-2 rounded-lg text-sm font-bold border border-[var(--line)] hover:bg-slate-50">Sign out</button>`;
}

function appearancePage(){
 const themes=THEMES.map(t=>{const on=S.theme===t.id;return`<button onclick="setTheme('${t.id}')" aria-pressed="${on}" class="text-left rounded-xl border-2 p-3 ${on?'border-[var(--brand)] bg-blue-100':'border-[var(--line)] bg-white hover:bg-slate-50'}"><span class="block h-12 rounded-lg mb-2 border border-black/10" style="background:linear-gradient(135deg,${t.swatch[0]} 55%,${t.swatch[1]} 55%)"></span><span class="flex items-center justify-between gap-1"><b>${t.label}</b>${on?'<span class="text-xs font-bold text-[var(--brand)]">Selected</span>':''}</span><span class="block text-xs text-[var(--muted)] mt-0.5">${t.desc}</span></button>`}).join('');
 return`<p class="text-sm text-[var(--muted)] mb-3">Choose a theme. It is remembered on this device.</p><div class="grid grid-cols-2 gap-3">${themes}</div>`;
}

export function settingsView(){
 if(!S.settings)return'';
 const u=S.user;let p=S.settingsPage;if(p==='profile'&&!u)p=null;
 const anim=S.settingsFresh?'slide':'';S.settingsFresh=false; // slide in only when first opened, not on every redraw
 const menu=[...(u?[['profile','Profile','Your name, email and role']]:[]),['appearance','Appearance','Themes and dark mode'],['privacy','Data Privacy Act','How your information is handled']];
 const body=p==='profile'?profilePage(u):p==='appearance'?appearancePage():p==='privacy'?privacyBody()
  :`<div class="space-y-2">${menu.map(([k,t,d])=>`<button onclick="setSettingsPage('${k}')" class="w-full text-left rounded-xl border border-[var(--line)] bg-white hover:bg-slate-50 px-4 py-3 flex items-center justify-between gap-3"><span><b class="block">${t}</b><span class="text-sm text-[var(--muted)]">${d}</span></span><span aria-hidden="true" class="text-xl">›</span></button>`).join('')}</div>`;
 return`<div class="fixed inset-0 z-[55] bg-slate-900/40 flex justify-end" onclick="if(event.target===this)closeSettings()"><aside class="${anim} bg-white w-full sm:w-[440px] h-full flex flex-col shadow-2xl" role="dialog" aria-modal="true" aria-label="Settings">
 <header class="p-5 border-b border-[var(--line)] flex items-center justify-between gap-3"><div class="flex items-center gap-2 min-w-0">${p?`<button onclick="setSettingsPage(null)" class="text-2xl leading-none px-2" aria-label="Back to settings">‹</button>`:''}<h2 class="fh font-bold text-2xl truncate">${p?TITLES[p]:'Settings'}</h2></div><button onclick="closeSettings()" class="text-2xl leading-none px-2" aria-label="Close settings">×</button></header>
 <div class="flex-1 overflow-y-auto p-5">${body}</div></aside></div>`;
}
