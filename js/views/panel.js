// Side panel for one assessment: details, progress, move, files, reactions, comments, history.
import { EMOJI, ROLE, TYPES } from '../config.js';
import { bestDays } from '../rules.js';
import { S, canEdit, isT } from '../state.js';
import { esc, fmtAt, fmtLong, fmtT, secName, tomorrowIso } from '../utils.js';
import { chipT, movedChip, statusCtl, sugHtml } from './shared.js';

export function panelView(){
 const it=S.items.find(i=>i.id===S.panel);if(!it)return'';const me=S.user.name,[g,s]=it.sec.split('|');
 const files=it.files.map(f=>`<a href="${f.data}" download="${esc(f.name)}" class="flex items-center justify-between border border-[var(--line)] rounded-lg px-3 py-2 text-sm font-semibold hover:bg-blue-50"><span class="truncate">${esc(f.name)}</span><span class="text-[var(--brand)] ml-2">Download</span></a>`).join('');
 const reacts=EMOJI.map(em=>{const l=it.reactions[em]||[],on=l.includes(me);return`<button onclick="react('${it.id}','${em}')" title="${esc(l.join(', '))}" class="border rounded-full px-3 py-1.5 text-sm font-bold ${on?'bg-blue-100 border-[var(--brand)]':'bg-white border-[var(--line)] hover:bg-slate-50'}">${em} ${l.length||''}</button>`}).join('');
 const cms=it.comments.map(c=>`<div class="bg-[#F2F4F7] rounded-lg px-3 py-2"><p class="text-xs"><b>${esc(c.author)}</b> <span class="${c.role!=='scholar'?'text-emerald-700':'text-[var(--muted)]'} font-semibold">${ROLE[c.role]}</span> · ${fmtAt(c.at)}</p><p class="text-sm mt-1 whitespace-pre-wrap">${esc(c.text)}</p></div>`).join('');
 const hist=isT()?S.log.filter(l=>l.id===it.id):[];
 const move=canEdit(it)?`<form onsubmit="moveItem(event,'${it.id}')"><h3 class="font-bold text-sm mb-2">Move this ${TYPES[it.type].label.toLowerCase()}</h3><div class="flex gap-2"><input type="date" name="date" min="${tomorrowIso}" value="${it.date}" class="inp" style="margin-top:0"><button class="px-4 rounded-lg font-bold text-white bg-[var(--brand)]">Move</button></div>
  <div class="flex flex-wrap gap-2 mt-2">${sugHtml(bestDays(it.type,+g,[s],it.date))}</div></form>`:'';
 return`<div class="fixed inset-0 z-50 bg-slate-900/40 flex justify-end" onclick="if(event.target===this)closePanel()"><aside class="slide bg-white w-full sm:w-[460px] h-full flex flex-col shadow-2xl" role="dialog" aria-modal="true" aria-label="Assessment details">
 <header class="p-5 border-b border-[var(--line)]"><div class="flex justify-between gap-3"><h2 class="fh font-bold text-2xl leading-tight">${esc(it.subject)}</h2><button onclick="closePanel()" class="text-2xl leading-none px-2" aria-label="Close">×</button></div>
  <div class="flex flex-wrap gap-1.5 mt-2">${chipT(it.type)}${movedChip(it)}</div><p class="mt-3 font-semibold">${fmtLong(it.date)}</p><p class="text-[var(--brand)] font-bold">${fmtT(it.time)} · ${secName(it.sec)}</p>
  <p class="text-xs text-[var(--muted)] mt-2">Posted by ${esc(it.teacher)} on ${fmtAt(it.createdAt)}</p></header>
 <div class="flex-1 overflow-y-auto p-5 space-y-5" id="clist">
  <p class="text-sm leading-relaxed whitespace-pre-wrap">${it.description?esc(it.description):'<span class="text-[var(--muted)]">No description.</span>'}</p>
  <div><h3 class="font-bold text-sm mb-2">My progress and reminder</h3>${statusCtl(it.id)}</div>
  ${move}${files?`<div><h3 class="font-bold text-sm mb-2">Files and LGs</h3><div class="space-y-2">${files}</div></div>`:''}
  <div><h3 class="font-bold text-sm mb-2">Reactions</h3><div class="flex flex-wrap gap-2">${reacts}</div></div>
  <div><h3 class="font-bold text-sm mb-2">Comments (${it.comments.length})</h3><div class="space-y-2">${cms||'<p class="text-sm text-[var(--muted)]">No comments yet. Ask a question about this one.</p>'}</div></div>
  ${hist.length?`<div><h3 class="font-bold text-sm mb-2">Edit history</h3><ul class="space-y-1.5">${hist.map(l=>`<li class="text-xs"><b>${l.act}</b> by ${esc(l.who)} · ${fmtAt(l.at)}<br><span class="text-[var(--muted)]">${esc(l.txt)}</span></li>`).join('')}</ul></div>`:''}</div>
 <footer class="p-4 border-t border-[var(--line)]"><form onsubmit="comment(event,'${it.id}')" class="flex gap-2"><input name="text" required maxlength="300" placeholder="Write a comment" class="inp flex-1" style="margin-top:0"><button class="px-4 rounded-lg font-bold text-white bg-[var(--brand)]">Post</button></form>
 ${canEdit(it)?`<button onclick="removeItem('${it.id}')" class="mt-3 text-sm font-semibold text-red-700 underline">Remove this assessment</button>`:''}</footer></aside></div>`;
}
