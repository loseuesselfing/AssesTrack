// Sign-in and Create account screen.
import { MAX, MIN_PASSWORD, ZRC_DOMAIN } from '../config.js';
import { S } from '../state.js';
import { esc } from '../utils.js';
import { privacyView } from './privacy.js';
import { settingsView } from './settings.js';
import { darkToggle, gearBtn } from './shared.js';

export function loginView(){
 const d=S.ld,up=S.tab==='signup';
 const tab=(k,l)=>`<button type="button" onclick="S.tab='${k}';S.loginErr='';render()" class="flex-1 py-2 rounded-lg text-sm font-bold ${S.tab===k?'bg-[var(--ink)] text-white':'bg-white border border-[var(--line)]'}">${l}</button>`;
 const fld=(l,n,type,v,extra='')=>`<label class="block text-sm font-semibold">${l}<input class="inp" type="${type}" value="${esc(v)}" oninput="S.ld.${n}=this.value" required ${extra}></label>`;
 const taken=up&&/already signed up/.test(S.loginErr);
 return`<main class="min-h-screen grid lg:grid-cols-2">
 <section class="bg-[var(--ink)] text-white p-8 sm:p-14 flex flex-col justify-between">
  <div><p class="fh font-bold text-lg text-blue-200">PSHS-ZRC</p><h1 class="fh font-extrabold text-5xl sm:text-6xl leading-none mt-8">AssesTrack</h1>
  <p class="mt-5 text-blue-100/90 max-w-md leading-relaxed">One shared schedule for every grade and section. FA, long quizzes and AA in one place, with no more than ${MAX} subjects per day for any section.</p></div>
  <div class="mt-10 flex gap-2" aria-hidden="true">${[1,2,3].map(n=>`<div class="flex flex-col gap-1.5">${[1,2,3].map(k=>`<span class="block w-14 h-2 rounded-sm ${k<=n?'bg-white':'bg-white/20'}"></span>`).join('')}</div>`).join('')}</div>
 </section>
 <section class="flex items-center justify-center p-6 sm:p-12 relative"><div class="absolute top-4 right-4 flex items-center gap-2">${darkToggle('text-sm font-bold border border-[var(--line)] rounded-lg px-3 py-1.5 bg-white')}${gearBtn('border border-[var(--line)] rounded-lg p-2 bg-white')}</div>
 <div class="w-full max-w-sm"><h2 class="fh font-bold text-2xl">${up?'Create your account':'Welcome back'}</h2>
  <div class="flex gap-2 mt-4">${tab('signin','Sign in')}${tab('signup','Create account')}</div>
  <form onsubmit="${up?'signup':'login'}(event)" class="mt-5 space-y-4" novalidate>
   ${up?`${fld('Full name','fullName','text',d.fullName,'autocomplete="name" placeholder="First and last name"')}
   ${fld('ZRC email','email','email',d.email,`autocomplete="email" placeholder="yourname${ZRC_DOMAIN}"`)}
   ${fld('Password','password','password',d.password,`autocomplete="new-password" minlength="${MIN_PASSWORD}"`)}
   <p class="text-xs text-[var(--muted)] -mt-2">At least ${MIN_PASSWORD} characters. Only ${ZRC_DOMAIN} emails can sign up.</p>
   <label class="flex items-start gap-2 text-sm"><input type="checkbox" class="mt-1" ${d.agree?'checked':''} onchange="S.ld.agree=this.checked"><span>I have read the <button type="button" class="underline font-bold text-[var(--brand)]" onclick="S.privacy=true;render()">Data Privacy Act</button> notice.</span></label>`
   :`${fld('ZRC email or username','identifier','text',d.identifier,'autocomplete="username"')}
   ${fld('Password','password','password',d.password,'autocomplete="current-password"')}`}
   ${S.loginErr?`<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">${esc(S.loginErr)}${taken?` <button type="button" class="underline font-bold" onclick="S.tab='signin';S.ld.identifier=S.ld.email;S.loginErr='';render()">Go to sign in</button>`:''}</div>`:''}
   <button class="w-full bg-[var(--brand)] hover:bg-[var(--brand-dk)] text-white font-bold rounded-lg py-2.5">${up?'Create account':'Sign in'}</button></form>
 </div></section></main>${settingsView()}${privacyView()}`;
}
