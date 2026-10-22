// Admin panel: users, database viewer, holidays and events, exception requests, edit history.
import { DB_TABLES, EVC, ROLE, SECTIONS, TYPES } from '../config.js';
import { S } from '../state.js';
import { esc, fmtAt, fmtD, fmtT, pd } from '../utils.js';
import { pill } from './shared.js';

const card=(t,b)=>`<section class="bg-white border border-[var(--line)] rounded-xl p-4"><h2 class="fh font-bold text-xl mb-3">${t}</h2>${b}</section>`;
const secOptions=cur=>`<option value="">Not set</option>${Object.entries(SECTIONS).flatMap(([g,ss])=>ss.map(s=>`<option value="${g}|${s}" ${cur===g+'|'+s?'selected':''}>Grade ${g} · ${s}</option>`)).join('')}`;
const th=l=>`<th class="py-1 pr-3 font-semibold">${l}</th>`;

function usersView(){
 const us=S.admin.users,t=S.admin.tempPw;
 const temp=t?`<div class="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 text-sm mb-4" role="alert"><b>New temporary password for ${esc(t.name)}:</b> <code class="font-bold text-base select-all">${esc(t.pw)}</code><p class="mt-1">Give it to them privately. It is shown only once. They can change it in Settings, then Profile.</p><button onclick="dismissTempPw()" class="underline font-bold mt-1">Done</button></div>`:'';
 const rows=!us?`<tr><td colspan="6" class="py-6 text-center text-[var(--muted)]">Loading…</td></tr>`:us.map(u=>`<tr class="border-t border-[var(--line)] align-top">
  <td class="py-2 pr-3 font-semibold">${esc(u.name)}</td><td class="pr-3 break-all">${esc(u.email||u.username)}</td>
  <td class="pr-3">${u.role==='admin'?'<b>Admin</b>':`<select class="inp !mt-0 !py-1.5" onchange="setUserRole('${u.id}',this.value)" aria-label="Role for ${esc(u.name)}"><option value="scholar" ${u.role==='scholar'?'selected':''}>Scholar</option><option value="teacher" ${u.role==='teacher'?'selected':''}>Teacher</option></select>`}</td>
  <td class="pr-3">${u.role==='admin'?'—':`<select class="inp !mt-0 !py-1.5" onchange="setUserSection('${u.id}',this.value)" aria-label="Section for ${esc(u.name)}">${secOptions(u.grade?u.grade+'|'+u.section:'')}</select>`}</td>
  <td class="pr-3 whitespace-nowrap text-xs">${fmtAt(u.createdAt)}<br><span class="text-[var(--muted)]">${u.lastLoginAt?'Last in '+fmtAt(u.lastLoginAt):'Never signed in'}</span></td>
  <td class="whitespace-nowrap">${u.role==='admin'?'':`<button onclick="resetUserPassword('${u.id}')" class="text-xs font-bold underline mr-3">Reset password</button><button onclick="deleteUser('${u.id}')" class="text-xs font-bold underline text-red-700">Delete</button>`}</td></tr>`).join('');
 return card(`Users${us?` (${us.length})`:''}`,`${temp}<p class="text-sm text-[var(--muted)] mb-3">Everyone who signed up with a ZRC email. Passwords are stored scrambled (hashed), so nobody can read them, including you. If someone forgets theirs, use Reset password. New accounts start as Scholar; switch teachers to Teacher here.</p>
 <div class="overflow-x-auto"><table class="w-full text-sm min-w-[860px]"><thead><tr class="text-left text-xs text-[var(--muted)]">${th('Name')}${th('Email / username')}${th('Role')}${th('Section')}${th('Joined')}${th('Actions')}</tr></thead><tbody>${rows}</tbody></table></div>
 <button onclick="loadUsers()" class="mt-3 text-sm font-bold underline">Refresh list</button>`);
}

function dbView(){
 const t=S.admin.table;
 const tabs=DB_TABLES.map(n=>`<button onclick="loadTable('${n}',0)" class="px-3 py-1.5 rounded-lg text-sm font-bold ${t&&t.name===n?'bg-[var(--ink)] text-white':'bg-white border border-[var(--line)] hover:bg-slate-50'}">${n}</button>`).join('');
 const cell=v=>{if(v===null||v===undefined)return'<span class="text-[var(--muted)]">—</span>';const s=typeof v==='object'?JSON.stringify(v):String(v);return esc(s.length>80?s.slice(0,80)+'…':s)};
 let body='<p class="text-sm text-[var(--muted)]">Loading…</p>';
 if(t){
  const to=Math.min(t.offset+t.rows.length,t.total);
  body=t.rows.length?`<div class="overflow-x-auto max-h-[28rem] overflow-y-auto"><table class="w-full text-xs min-w-[640px]"><thead><tr class="text-left text-[var(--muted)]">${t.columns.map(th).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr class="border-t border-[var(--line)] align-top">${t.columns.map(c=>`<td class="py-1.5 pr-3 break-words">${cell(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="text-sm text-[var(--muted)]">No rows in this table yet.</p>';
  body+=`<div class="mt-3 flex items-center gap-3 text-sm"><span class="text-[var(--muted)]">${t.total?`Showing ${t.offset+1} to ${to} of ${t.total}`:'0 rows'}</span>
   <button onclick="loadTable('${t.name}',${Math.max(0,t.offset-t.limit)})" ${t.offset?'':'disabled'} class="font-bold underline disabled:opacity-40 disabled:no-underline">Previous</button>
   <button onclick="loadTable('${t.name}',${t.offset+t.limit})" ${to<t.total?'':'disabled'} class="font-bold underline disabled:opacity-40 disabled:no-underline">Next</button>
   <button onclick="loadTable('${t.name}',${t.offset})" class="font-bold underline">Refresh</button></div>`;
 }
 return card('Database',`<p class="text-sm text-[var(--muted)] mb-3">A read-only view of what is stored. Password hashes and sign-in sessions are never shown.</p><div class="flex flex-wrap gap-2 mb-4">${tabs}</div>${body}`);
}

function calendarView(){
 const ev=[...S.events].sort((a,b)=>a.date.localeCompare(b.date));
 return card('Holidays and school events',`<form onsubmit="addEvent(event)" class="grid sm:grid-cols-2 gap-3"><label class="text-sm font-semibold">Date<input class="inp" type="date" name="date" required></label>
  <label class="text-sm font-semibold">Type<select class="inp" name="kind"><option value="holiday">Holiday (no assessments)</option><option value="event">School event (shown only)</option></select></label>
  <label class="text-sm font-semibold sm:col-span-2">Title<input class="inp" name="title" required maxlength="60" placeholder="e.g. Foundation Day"></label>
  <button class="sm:col-span-2 px-4 py-2.5 rounded-lg font-bold text-white bg-[var(--brand)]">Add to calendar</button></form>
  <div class="mt-4 max-h-80 overflow-y-auto space-y-1.5">${ev.map(e=>`<div class="flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-1.5 ${EVC[e.kind]}"><span><b>${fmtD(pd(e.date))}</b> ${esc(e.title)}</span><button onclick="removeEvent('${e.id}')" class="font-bold underline text-xs">Remove</button></div>`).join('')||'<p class="text-sm text-[var(--muted)]">Nothing on the calendar yet. Holidays block scheduling; events are only shown.</p>'}</div>`);
}

function requestsView(){
 const pend=S.reqs.filter(r=>r.status==='pending'),done=S.reqs.filter(r=>r.status!=='pending').slice(-6);
 const row=r=>`<div class="border border-[var(--line)] rounded-lg p-3 text-sm"><p><b>${esc(r.by)}</b> asks to add <b>${esc(r.f.subject)}</b> (${TYPES[r.f.type].label}) to Grade ${r.grade}: ${esc(r.f.secs.join(', '))} on ${fmtD(pd(r.f.date))}, ${fmtT(r.f.time)}.</p><p class="text-xs text-[var(--muted)] mt-1">Requested ${fmtAt(r.at)}. Files are not carried over.</p>
  <div class="flex gap-2 mt-2"><button onclick="decide('${r.id}',true)" class="px-3 py-1.5 rounded-lg font-bold text-white bg-emerald-700">Approve</button><button onclick="decide('${r.id}',false)" class="px-3 py-1.5 rounded-lg font-bold border border-[var(--line)]">Deny</button></div></div>`;
 return card(`Exception requests (${pend.length} pending)`,`<div class="space-y-2">${pend.map(row).join('')||'<p class="text-sm text-[var(--muted)]">No pending requests. Teachers can ask for one when a day is full.</p>'}</div>${done.length?`<p class="text-xs font-bold mt-4 mb-1">Recently decided</p>${done.map(r=>`<p class="text-xs text-[var(--muted)]">${esc(r.f.subject)} (${esc(r.by)}): ${r.status} by ${esc(r.by2||'')}</p>`).join('')}`:''}`);
}

function historyView(){
 return card('Edit history',`<div class="overflow-x-auto max-h-[32rem] overflow-y-auto"><table class="w-full text-sm min-w-[620px]"><thead><tr class="text-left text-xs text-[var(--muted)]">${th('When')}${th('Who')}${th('Action')}${th('Details')}</tr></thead><tbody>
  ${S.log.slice(0,100).map(l=>`<tr class="border-t border-[var(--line)] align-top"><td class="py-1.5 pr-3 whitespace-nowrap">${fmtAt(l.at)}</td><td class="pr-3 whitespace-nowrap">${esc(l.who)} <span class="text-xs text-[var(--muted)]">${ROLE[l.role]}</span></td><td class="pr-3 font-bold whitespace-nowrap">${esc(l.act)}</td><td>${esc(l.txt)}</td></tr>`).join('')||'<tr><td colspan="4" class="py-4 text-[var(--muted)]">No activity yet.</td></tr>'}</tbody></table></div>`);
}

export function adminView(){
 const pend=S.reqs.filter(r=>r.status==='pending').length;
 const tabs=[['users','Users'],['database','Database'],['calendar','Calendar'],['requests','Requests'+(pend?` (${pend})`:'')],['history','History']];
 const body={users:usersView,database:dbView,calendar:calendarView,requests:requestsView,history:historyView}[S.adminTab]();
 return`<nav class="mt-5 flex flex-wrap gap-2" aria-label="Admin sections">${tabs.map(([k,l])=>pill(S.adminTab===k,`setAdminTab('${k}')`,l)).join('')}</nav><div class="mt-4">${body}</div>`;
}
