// Everything a user can do: log in, navigate, add, move, remove, comment, react.
// main.js exposes these to the inline onclick/onsubmit handlers in the views.
import { ACC, KT, KU, MAX, SECTIONS, TYPES } from './config.js';
import { render } from './render.js';
import { bestDays, createItems } from './rules.js';
import { S, canEdit, holidayOn, isT, itemsOn, logit, pref, save, secKey } from './state.js';
import { seed } from './storage.js';
import { addDays, allowed, fmtD, nextDays, nextMon, now, pd, secName, toast, uid } from './utils.js';
import { sugHtml } from './views/shared.js';

export function setPref(id,p){const u=S.prefs[S.user.name]=S.prefs[S.user.name]||{};u[id]={...pref(id),...p};save();render()}

export function toggleTheme(){const d=document.documentElement.classList.toggle('dark');try{localStorage.setItem(KT,d?'dark':'light')}catch(e){}render()}

export function suggestForm(b){const f=b.closest('form'),secs=[...f.querySelectorAll('[name=sec]:checked')].map(x=>x.value);document.getElementById('sug').innerHTML=sugHtml(bestDays(f.elements.type.value,S.sel.grade,secs.length?secs:[S.sel.section]))}

export function setLd(k,v){S.ld[k]=v;if(k==='grade'){S.ld.grade=+v;S.ld.section=SECTIONS[v][0];render()}}

export function login(e){
 e.preventDefault();const d=S.ld;
 if(S.tab!=='scholar'){const a=ACC[S.tab];if(d.username.trim().toLowerCase()!==S.tab||d.password!==a.pw){S.loginErr=`Wrong username or password. Demo: ${S.tab} / ${a.pw}`;return render()}S.user={role:S.tab,name:a.name}}
 else{if(!d.name.trim()){S.loginErr='Enter your name.';return render()}if(d.password!==ACC.scholar.pw){S.loginErr='Wrong password. Demo: scholar123';return render()}
  S.user={role:'scholar',name:d.name.trim(),grade:+d.grade,section:d.section};S.sel={grade:+d.grade,section:d.section}}
 S.loginErr='';S.mode='home';localStorage.setItem(KU,JSON.stringify(S.user));render();
}

export function logout(){S.user=null;S.modal=null;S.panel=null;localStorage.removeItem(KU);render()}

export const selGrade=g=>{S.sel={grade:+g,section:SECTIONS[g][0]};render()},selSec=s=>{S.sel.section=s;render()};

export const setMode=m=>{S.mode=m;render()},setView=v=>{S.view=v;render()};

export const moveMonth=n=>{const d=new Date(S.cur.y,S.cur.m+n,1);S.cur={y:d.getFullYear(),m:d.getMonth()};render()};

export const jumpMonth=v=>{if(!v)return;const[y,m]=v.split('-').map(Number);S.cur={y,m:m-1};render()};

export const goToday=()=>{S.cur={y:now.getFullYear(),m:now.getMonth()};render()};

export const openPanel=id=>{S.panel=id;render()},closePanel=()=>{S.panel=null;render()};

export const heatGo=(g,s)=>{S.sel={grade:+g,section:s};S.mode='week';render()};

export function openAdd(date){
 if(!isT())return;
 if(date&&holidayOn(date))return toast(`${holidayOn(date).title} is a holiday. No assessments.`,'error');
 if(date&&itemsOn(date).length>=MAX)return toast(`${secName(secKey())} already has ${MAX} assessments that day.`,'error');
 S.modal={draft:{date:date||nextDays[0],type:date&&!nextDays.includes(date)?'project':'quiz',secs:[S.sel.section],subject:'',time:'08:00',description:''}};S.error='';render();
 setTimeout(()=>{const s=document.getElementById('f-sub');if(s)s.focus()},30);
}

export const closeModal=()=>{S.modal=null;S.error='';render()};

export const readFile=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r({name:f.name,type:f.type,data:x.result});x.readAsDataURL(f)});

export async function submitItem(e){
 e.preventDefault();const fd=new FormData(e.target);
 const f={subject:String(fd.get('subject')).trim(),type:fd.get('type'),date:fd.get('date'),time:fd.get('time'),description:String(fd.get('description')).trim(),secs:fd.getAll('sec')};
 const files=[...e.target.files.files],grade=S.sel.grade;S.modal={draft:f};
 const fail=m=>{S.error=m;render()};
 if(!f.subject)return fail('Enter the subject name.');
 if(!f.secs.length)return fail('Choose at least one section.');
 if(!f.date)return fail('Choose a date.');
 if(holidayOn(f.date))return fail(`${holidayOn(f.date).title} is a holiday. Choose another date.`);
 if(!allowed(f.type,f.date))return fail(f.type==='project'?'Projects need a due date after today.':`Quizzes and tasks can only be scheduled for next week (${fmtD(nextMon)} to ${fmtD(addDays(nextMon,4))}). Choose Project for later dates.`);
 const full=f.secs.filter(s=>itemsOn(f.date,grade+'|'+s).length>=MAX);
 if(full.length){S.modal.blocked=full;toast('Daily limit reached. Nothing was saved.','error');return fail(`Blocked: ${full.join(', ')} already ${full.length>1?'have':'has'} ${MAX} assessments on ${fmtD(pd(f.date))}, the daily limit. Pick one of the suggested days, or request an exception.`)}
 const dup=f.secs.filter(s=>itemsOn(f.date,grade+'|'+s).some(i=>i.subject.toLowerCase()===f.subject.toLowerCase()));
 if(dup.length)return fail(`${f.subject} already has an entry that day for ${dup.join(', ')}. Each subject counts once per day.`);
 if(files.length>3)return fail('Attach up to 3 files.');
 if(files.some(x=>x.size>700*1024))return fail('Each file must be under 700 KB (browser storage is limited).');
 const att=await Promise.all(files.map(readFile)),c=createItems(f,grade,S.user.name,att);
 if(!save()){S.items=S.items.filter(i=>!c.includes(i));S.log.splice(0,c.length);return fail('Browser storage is full. Remove some entries or attach smaller files.')}
 S.modal=null;S.error='';toast(`${f.subject} ${TYPES[f.type].label.toLowerCase()} scheduled for ${f.secs.length} section${f.secs.length>1?'s':''}.`);render();
}

export function requestException(){
 const d=S.modal.draft;S.reqs.push({id:uid(),by:S.user.name,at:new Date().toISOString(),grade:S.sel.grade,f:d,status:'pending'});
 logit('Requested exception',`${d.subject} ${TYPES[d.type].label} for Grade ${S.sel.grade} (${d.secs.join(', ')}) on ${fmtD(pd(d.date))}`);save();closeModal();toast('Sent to the admin for approval.');
}

export function adminOverride(){const d=S.modal.draft;createItems(d,S.sel.grade,S.user.name,[],' (admin override)');save();closeModal();toast('Added with admin override.')}

export function decide(id,ok){
 const r=S.reqs.find(x=>x.id===id);if(!r)return;r.status=ok?'approved':'denied';r.by2=S.user.name;
 if(ok)createItems(r.f,r.grade,r.by,[],` (exception approved by ${S.user.name})`);
 logit(ok?'Approved exception':'Denied exception',`${r.f.subject} requested by ${r.by}`);save();toast(ok?'Approved and scheduled.':'Request denied.');render();
}

export function moveItem(e,id){
 e.preventDefault();const it=S.items.find(i=>i.id===id),nd=new FormData(e.target).get('date'),bad=m=>toast(m,'error');
 if(!nd||nd===it.date)return bad('Pick a different date.');
 if(!allowed(it.type,nd))return bad(it.type==='project'?'Pick a date after today.':'Quizzes and tasks can only move within next week.');
 if(holidayOn(nd))return bad(`${holidayOn(nd).title} is a holiday.`);
 if(itemsOn(nd,it.sec).length>=MAX)return bad(`${secName(it.sec)} is already full on ${fmtD(pd(nd))}. Try a suggested day.`);
 const old=it.date;it.moves=it.moves||[];it.moves.push({from:old,to:nd,by:S.user.name,at:new Date().toISOString()});it.date=nd;
 logit('Moved',`${it.subject} ${TYPES[it.type].label} (${secName(it.sec)}) from ${fmtD(pd(old))} to ${fmtD(pd(nd))}`,id);save();toast(`Moved to ${fmtD(pd(nd))}.`);render();
}

export function removeItem(id){
 const it=S.items.find(i=>i.id===id);if(!it||!canEdit(it)||!confirm(`Remove ${it.subject} ${TYPES[it.type].label.toLowerCase()}?`))return;
 S.items=S.items.filter(i=>i.id!==id);logit('Removed',`${it.subject} ${TYPES[it.type].label} (${secName(it.sec)}) on ${fmtD(pd(it.date))}`,id);save();S.panel=null;toast('Assessment removed.');render();
}

export function react(id,em){const it=S.items.find(i=>i.id===id),l=it.reactions[em]||[],me=S.user.name;it.reactions[em]=l.includes(me)?l.filter(x=>x!==me):[...l,me];save();render()}

export function comment(e,id){
 e.preventDefault();const t=String(new FormData(e.target).get('text')).trim();if(!t)return;
 S.items.find(i=>i.id===id).comments.push({id:uid(),author:S.user.name,role:S.user.role,text:t,at:new Date().toISOString()});save();render();
 setTimeout(()=>{const l=document.getElementById('clist');if(l)l.scrollTop=l.scrollHeight},20);
}

export function addEvent(e){
 e.preventDefault();const f=new FormData(e.target),title=String(f.get('title')).trim(),date=f.get('date'),kind=f.get('kind');if(!title||!date)return;
 S.events.push({id:uid(),date,title,kind});logit('Calendar',`Added ${kind==='holiday'?'holiday':'event'} "${title}" on ${fmtD(pd(date))}`);save();toast('Calendar updated.');render();
}

export function removeEvent(id){const v=S.events.find(x=>x.id===id);S.events=S.events.filter(x=>x.id!==id);logit('Calendar',`Removed "${v.title}" (${fmtD(pd(v.date))})`);save();render()}

export function resetDemo(){if(confirm('Reset everything (assessments, history, calendar, requests) to demo data?')){Object.assign(S,seed());save();toast('Demo data restored.');render()}}
