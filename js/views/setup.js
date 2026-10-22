// First-time screen for new accounts: pick your grade level and section.
import { SECTIONS } from '../config.js';
import { S } from '../state.js';
import { esc } from '../utils.js';
import { privacyView } from './privacy.js';
import { settingsView } from './settings.js';
import { darkToggle, gearBtn } from './shared.js';

export function setupView(){
 const d=S.ld,first=esc(S.user.name.split(' ')[0]);
 return`<main class="min-h-screen flex items-center justify-center p-6 relative"><div class="absolute top-4 right-4 flex items-center gap-2">${darkToggle('text-sm font-bold border border-[var(--line)] rounded-lg px-3 py-1.5 bg-white')}${gearBtn('border border-[var(--line)] rounded-lg p-2 bg-white')}</div>
 <form onsubmit="saveSection(event)" class="bg-white border border-[var(--line)] rounded-xl p-6 w-full max-w-md shadow-sm">
  <h1 class="fh font-bold text-2xl">Welcome, ${first}</h1>
  <p class="text-sm text-[var(--muted)] mt-1">Choose your grade level and section so we can show your schedule. Only an admin can change this later.</p>
  <div class="grid grid-cols-2 gap-3 mt-5">
   <label class="block text-sm font-semibold">Grade level<select class="inp" onchange="setLd('grade',this.value)">${Object.keys(SECTIONS).map(g=>`<option value="${g}" ${+g===+d.grade?'selected':''}>Grade ${g}</option>`).join('')}</select></label>
   <label class="block text-sm font-semibold">Section<select class="inp" onchange="S.ld.section=this.value">${SECTIONS[d.grade].map(s=>`<option ${s===d.section?'selected':''}>${s}</option>`).join('')}</select></label></div>
  <p class="text-xs text-[var(--muted)] mt-3">Teachers: pick any section for now. An admin will switch your account to Teacher.</p>
  <button class="mt-5 w-full bg-[var(--brand)] hover:bg-[var(--brand-dk)] text-white font-bold rounded-lg py-2.5">Save and continue</button>
  <button type="button" onclick="logout()" class="mt-3 w-full text-sm font-semibold underline">Sign out</button>
 </form></main>${settingsView()}${privacyView()}`;
}
