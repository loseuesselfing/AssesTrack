// Schedule an assessment form.
import { MAX, SECTIONS, SUBJECTS, TYPES } from '../config.js';
import { bestDays } from '../rules.js';
import { S, isA } from '../state.js';
import { esc, tomorrowIso } from '../utils.js';
import { sugHtml } from './shared.js';

export function modalView(){
 const m=S.modal;if(!m)return'';const d=m.draft,g=S.sel.grade;
 const blk=m.blocked?`<div class="mt-3"><div class="flex flex-wrap gap-2">${isA()?`<button type="button" onclick="adminOverride()" class="px-3 py-2 rounded-lg text-sm font-bold text-white bg-red-700">Add anyway (admin override)</button>`:`<button type="button" onclick="requestException()" class="px-3 py-2 rounded-lg text-sm font-bold border border-[var(--brand)] text-[var(--brand)]">Ask admin for an exception</button>`}</div>
  <p class="text-xs font-bold mt-3">Days with room:</p><div class="flex flex-wrap gap-2 mt-1">${sugHtml(bestDays(d.type,g,d.secs))}</div></div>`:'';
 return`<div class="fixed inset-0 z-40 bg-slate-900/50 flex items-end sm:items-center justify-center sm:p-4" onclick="if(event.target===this)closeModal()"><form onsubmit="submitItem(event)" class="pop bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="mt">
 <h2 id="mt" class="fh font-bold text-2xl">Schedule for Grade ${g}</h2><p class="text-sm text-[var(--muted)] mt-1">Max ${MAX} per day for each section. Quizzes and tasks: next week only. Projects: any later date. No assessments on holidays.</p>
 ${S.error?`<div class="mt-4 bg-red-50 border border-red-300 text-red-800 text-sm font-semibold rounded-lg px-3 py-2.5" role="alert">${esc(S.error)}</div>`:''}${blk}
 <div class="mt-4 space-y-4"><label class="block text-sm font-semibold">Subject<input id="f-sub" name="subject" list="subs" maxlength="60" value="${esc(d.subject)}" placeholder="Choose or type a subject" class="inp"><datalist id="subs">${SUBJECTS[g].map(s=>`<option value="${esc(s)}">`).join('')}</datalist></label>
  <fieldset><legend class="text-sm font-semibold">Sections</legend><div class="flex flex-wrap gap-2 mt-1">${SECTIONS[g].map(s=>`<label class="flex items-center gap-2 border border-[var(--line)] rounded-lg px-3 py-2 text-sm"><input type="checkbox" name="sec" value="${s}" ${d.secs.includes(s)?'checked':''}>${s}</label>`).join('')}</div></fieldset>
  <div class="grid grid-cols-2 gap-3"><label class="block text-sm font-semibold">Type<select name="type" class="inp">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${d.type===k?'selected':''}>${v.label}</option>`).join('')}</select></label>
  <label class="block text-sm font-semibold">Time<input type="time" name="time" required value="${d.time}" class="inp"></label></div>
  <div><label class="block text-sm font-semibold">Date<input type="date" name="date" required min="${tomorrowIso}" value="${d.date}" class="inp"></label>
  <button type="button" onclick="suggestForm(this)" class="text-sm font-bold text-[var(--brand)] underline mt-2">Suggest best days</button><div id="sug" class="flex flex-wrap gap-2 mt-2"></div></div>
  <label class="block text-sm font-semibold">Description<textarea name="description" rows="3" maxlength="300" placeholder="Coverage, format, what to bring" class="inp">${esc(d.description)}</textarea></label>
  <label class="block text-sm font-semibold">Attach LGs or files (up to 3, 700 KB each)<input type="file" name="files" multiple class="inp"></label></div>
 <p class="text-xs text-[var(--muted)] mt-3">Who posted it, and the date and time, are recorded automatically.</p>
 <div class="mt-5 flex justify-end gap-2"><button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-lg font-semibold border border-[var(--line)]">Cancel</button><button class="px-5 py-2.5 rounded-lg font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dk)]">Save</button></div></form></div>`;
}
