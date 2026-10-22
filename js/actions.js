// Everything a user can do. Each action asks the server (js/api.js), reloads the shared data, then redraws.
// main.js exposes these to the inline onclick/onsubmit handlers in the views.
import { api } from './api.js';
import { DB_TABLES, MAX, MIN_PASSWORD, SECTIONS, TYPES, ZRC_DOMAIN, ZRC_EMAIL } from './config.js';
import { render } from './render.js';
import { bestDays } from './rules.js';
import { S, applyTheme, canEdit, holidayOn, isA, isT, itemsOn, pref, secKey } from './state.js';
import { addDays, allowed, fmtD, nextDays, nextMon, now, pd, secName, toast } from './utils.js';
import { sugHtml } from './views/shared.js';

/* ---------- plumbing ---------- */
const SESSION_ENDED='Your session ended. Please sign in again.';

function reset(){
  Object.assign(S,{user:null,items:[],log:[],events:[],reqs:[],prefs:{},modal:null,panel:null,settings:false,settingsPage:null,
    mode:'home',adminTab:'users',admin:{users:null,table:null,tempPw:null},tab:'signin',version:''});
  S.ld.password='';
}
// True (and back to the sign-in screen) when the server says the session has ended.
const expired=e=>{if(e.status===401&&S.user){reset();S.loginErr=SESSION_ENDED;render();return true}return false};
// Wraps an action: errors become a toast.
const act=fn=>async(...a)=>{try{await fn(...a)}catch(e){if(!expired(e))toast(e.message,'error')}};
// Same, for the sign-in / sign-up forms: errors show inside the form.
const authAct=fn=>async e=>{e.preventDefault();S.loginErr='';try{await fn(S.ld)}catch(x){S.loginErr=x.message;render()}};

/* ---------- loading shared data ---------- */
export async function loadData(){
  const d=await api('GET','/bootstrap');
  Object.assign(S,{user:d.user,items:d.items,events:d.events,reqs:d.reqs||[],log:d.log||[],prefs:d.prefs||{},version:d.version||''});
  if(S.user.role==='scholar'&&S.user.grade)S.sel={grade:S.user.grade,section:S.user.section};
}
// Runs once when the page opens: restores the session if there is one.
export async function boot(){
  try{await loadData()}catch(e){S.user=null;if(e.status!==401)S.loginErr=e.message}
  S.ready=true;render();
}
// Called on a timer and when the tab regains focus, so other people's changes appear without reloading.
export async function refresh(){
  if(!S.user||document.hidden||S.modal||S.settings||S.privacy)return;
  const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return; // never wipe what someone is typing
  try{const v=await api('GET','/version');if(v.version!==S.version){await loadData();render()}}catch(e){expired(e)}
}

/* ---------- accounts ---------- */
export const login=authAct(async d=>{
  if(!d.identifier.trim()||!d.password)throw new Error('Enter your ZRC email (or username) and your password.');
  await api('POST','/login',{identifier:d.identifier.trim(),password:d.password});
  await loadData();S.mode='home';d.password='';render();
});

export const signup=authAct(async d=>{
  const name=d.fullName.trim().replace(/\s+/g,' '),email=d.email.trim().toLowerCase();
  if(name.split(' ').length<2)throw new Error('Enter your full name (first and last name).');
  if(!ZRC_EMAIL.test(email))throw new Error(`Use your ZRC email. It must end with ${ZRC_DOMAIN}`);
  if(d.password.length<MIN_PASSWORD)throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
  if(!d.agree)throw new Error('Please confirm that you have read the Data Privacy Act notice.');
  await api('POST','/signup',{fullName:name,email,password:d.password});
  await loadData();S.mode='home';d.password='';render();
});

export const saveSection=act(async e=>{
  e.preventDefault();
  await api('POST','/profile',{grade:+S.ld.grade,section:S.ld.section});
  await loadData();toast('Saved. Welcome to AssesTrack!');render();
});

export const logout=act(async()=>{try{await api('POST','/logout')}catch(e){}reset();render()});

export const changePassword=act(async e=>{
  e.preventDefault();const f=new FormData(e.target),next=String(f.get('next'));
  if(next.length<MIN_PASSWORD)throw new Error(`New password must be at least ${MIN_PASSWORD} characters.`);
  await api('POST','/change-password',{currentPassword:String(f.get('current')),newPassword:next});
  e.target.reset();toast('Password changed.');
});

export function setLd(k,v){S.ld[k]=v;if(k==='grade'){S.ld.grade=+v;S.ld.section=SECTIONS[v][0];render()}}

/* ---------- appearance and settings ---------- */
export function setTheme(id){applyTheme(id);render()}
// Header button: jump to Dark, and back to the theme you had before.
export function toggleDark(){
  if(S.theme==='dark')applyTheme(S.prevTheme&&S.prevTheme!=='dark'?S.prevTheme:'light');
  else{S.prevTheme=S.theme;applyTheme('dark')}
  render();
}
export const openSettings=()=>{S.settings=true;S.settingsPage=null;S.settingsFresh=true;render()},closeSettings=()=>{S.settings=false;render()};
export const setSettingsPage=p=>{S.settingsPage=p;render()};

/* ---------- navigation ---------- */
export const selGrade=g=>{S.sel={grade:+g,section:SECTIONS[g][0]};render()},selSec=s=>{S.sel.section=s;render()};
export const setMode=m=>{S.mode=m;render();if(m==='admin'&&isA())return setAdminTab(S.adminTab)},setView=v=>{S.view=v;render()};
export const moveMonth=n=>{const d=new Date(S.cur.y,S.cur.m+n,1);S.cur={y:d.getFullYear(),m:d.getMonth()};render()};
export const jumpMonth=v=>{if(!v)return;const[y,m]=v.split('-').map(Number);S.cur={y,m:m-1};render()};
export const goToday=()=>{S.cur={y:now.getFullYear(),m:now.getMonth()};render()};
export const openPanel=id=>{S.panel=id;S.panelFresh=true;render()},closePanel=()=>{S.panel=null;render()};
export const heatGo=(g,s)=>{S.sel={grade:+g,section:s};S.mode='week';render()};

/* ---------- scheduling ---------- */
export function suggestForm(b){const f=b.closest('form'),secs=[...f.querySelectorAll('[name=sec]:checked')].map(x=>x.value);document.getElementById('sug').innerHTML=sugHtml(bestDays(f.elements.type.value,S.sel.grade,secs.length?secs:[S.sel.section]))}

export function openAdd(date){
  if(!isT())return;
  if(date&&holidayOn(date))return toast(`${holidayOn(date).title} is a holiday. No assessments.`,'error');
  if(date&&itemsOn(date).length>=MAX)return toast(`${secName(secKey())} already has ${MAX} assessments that day.`,'error');
  S.modal={draft:{date:date||nextDays[0],type:date&&!nextDays.includes(date)?'aa':'fa',secs:[S.sel.section],subject:'',time:'08:00',description:''}};S.error='';render();
  setTimeout(()=>{const s=document.getElementById('f-sub');if(s)s.focus()},30);
}
export const closeModal=()=>{S.modal=null;S.error='';render()};
export const readFile=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r({name:f.name,type:f.type,data:x.result});x.readAsDataURL(f)});

// The checks below give instant feedback. The server repeats every one of them and has the final say.
export async function submitItem(e){
  e.preventDefault();const fd=new FormData(e.target);
  const f={subject:String(fd.get('subject')).trim(),type:fd.get('type'),date:fd.get('date'),time:fd.get('time'),description:String(fd.get('description')).trim(),secs:fd.getAll('sec')};
  const files=[...e.target.files.files],grade=S.sel.grade;S.modal={draft:f};
  const fail=m=>{S.error=m;render()};
  if(!f.subject)return fail('Enter the subject name.');
  if(!f.secs.length)return fail('Choose at least one section.');
  if(!f.date)return fail('Choose a date.');
  if(holidayOn(f.date))return fail(`${holidayOn(f.date).title} is a holiday. Choose another date.`);
  if(!allowed(f.type,f.date))return fail(TYPES[f.type].ahead?'AA needs a due date after today.':`${TYPES[f.type].label} can only be scheduled for next week (${fmtD(nextMon)} to ${fmtD(addDays(nextMon,4))}). Choose AA for later dates.`);
  const full=f.secs.filter(s=>itemsOn(f.date,grade+'|'+s).length>=MAX);
  if(full.length){S.modal.blocked=full;toast('Daily limit reached. Nothing was saved.','error');return fail(`Blocked: ${full.join(', ')} already ${full.length>1?'have':'has'} ${MAX} assessments on ${fmtD(pd(f.date))}, the daily limit. Pick one of the suggested days, or request an exception.`)}
  const dup=f.secs.filter(s=>itemsOn(f.date,grade+'|'+s).some(i=>i.subject.toLowerCase()===f.subject.toLowerCase()));
  if(dup.length)return fail(`${f.subject} already has an entry that day for ${dup.join(', ')}. Each subject counts once per day.`);
  if(files.length>3)return fail('Attach up to 3 files.');
  if(files.some(x=>x.size>700*1024))return fail('Each file must be under 700 KB.');
  try{
    const att=await Promise.all(files.map(readFile));
    await api('POST','/assessments',{...f,grade,files:att});
    await loadData();S.modal=null;S.error='';toast(`${f.subject} ${TYPES[f.type].label} scheduled for ${f.secs.length} section${f.secs.length>1?'s':''}.`);render();
  }catch(x){
    if(expired(x))return;
    if(x.data&&x.data.blocked)S.modal.blocked=x.data.blocked;
    fail(x.message);
  }
}

export const requestException=act(async()=>{
  await api('POST','/requests',{grade:S.sel.grade,f:S.modal.draft});
  await loadData();closeModal();toast('Sent to the admin for approval.');
});

export const adminOverride=act(async()=>{
  await api('POST','/assessments',{...S.modal.draft,grade:S.sel.grade,files:[],override:true});
  await loadData();closeModal();toast('Added with admin override.');
});

export const decide=act(async(id,ok)=>{
  await api('POST',`/requests/${id}/decide`,{approve:ok});
  await loadData();toast(ok?'Approved and scheduled.':'Request denied.');render();
});

export const moveItem=act(async(e,id)=>{
  e.preventDefault();const it=S.items.find(i=>i.id===id),nd=new FormData(e.target).get('date'),bad=m=>toast(m,'error');
  if(!nd||nd===it.date)return bad('Pick a different date.');
  if(!allowed(it.type,nd))return bad(TYPES[it.type].ahead?'Pick a date after today.':`${TYPES[it.type].label} can only move within next week.`);
  if(holidayOn(nd))return bad(`${holidayOn(nd).title} is a holiday.`);
  if(itemsOn(nd,it.sec).length>=MAX)return bad(`${secName(it.sec)} is already full on ${fmtD(pd(nd))}. Try a suggested day.`);
  await api('POST',`/assessments/${id}/move`,{date:nd});
  await loadData();toast(`Moved to ${fmtD(pd(nd))}.`);render();
});

export const removeItem=act(async id=>{
  const it=S.items.find(i=>i.id===id);if(!it||!canEdit(it)||!confirm(`Remove ${it.subject} ${TYPES[it.type].label}?`))return;
  await api('DELETE',`/assessments/${id}`);
  S.panel=null;await loadData();toast('Assessment removed.');render();
});

/* ---------- collaboration ---------- */
export const react=act(async(id,em)=>{await api('POST',`/assessments/${id}/react`,{emoji:em});await loadData();render()});

export const comment=act(async(e,id)=>{
  e.preventDefault();const t=String(new FormData(e.target).get('text')).trim();if(!t)return;
  await api('POST',`/assessments/${id}/comments`,{text:t});await loadData();render();
  setTimeout(()=>{const l=document.getElementById('clist');if(l)l.scrollTop=l.scrollHeight},20);
});

export const setPref=act(async(id,p)=>{
  const cur=pref(id);
  await api('PUT',`/assessments/${id}/progress`,{st:p.st??cur.st,bell:p.bell??cur.bell});
  await loadData();render();
});

/* ---------- admin ---------- */
export const addEvent=act(async e=>{
  e.preventDefault();const f=new FormData(e.target),title=String(f.get('title')).trim(),date=f.get('date'),kind=f.get('kind');if(!title||!date)return;
  await api('POST','/events',{date,title,kind});await loadData();toast('Calendar updated.');render();
});
export const removeEvent=act(async id=>{await api('DELETE',`/events/${id}`);await loadData();render()});

export const loadUsers=act(async()=>{S.admin.users=(await api('GET','/admin/users')).users;render()});
export const loadTable=act(async(name,offset=0)=>{S.admin.table=await api('GET',`/admin/tables/${name}?offset=${offset}&limit=25`);render()});
export const setAdminTab=act(async t=>{
  S.adminTab=t;render();
  if(t==='users')await loadUsers();
  if(t==='database')await loadTable(S.admin.table?S.admin.table.name:DB_TABLES[0],0);
});
export const setUserRole=act(async(id,role)=>{await api('PATCH',`/admin/users/${id}`,{role});await loadUsers();toast('Role updated.')});
export const setUserSection=act(async(id,v)=>{
  const[g,s]=v?v.split('|'):[null,null];
  await api('PATCH',`/admin/users/${id}`,{grade:g?+g:null,section:s});await loadUsers();toast('Section updated.');
});
export const resetUserPassword=act(async id=>{
  const u=S.admin.users.find(x=>x.id===id);if(!confirm(`Reset the password for ${u.name}? Their old password will stop working.`))return;
  const d=await api('POST',`/admin/users/${id}/reset-password`);S.admin.tempPw={name:u.name,pw:d.temporaryPassword};render();
});
export const deleteUser=act(async id=>{
  const u=S.admin.users.find(x=>x.id===id);if(!confirm(`Delete the account of ${u.name}? This cannot be undone.`))return;
  await api('DELETE',`/admin/users/${id}`);await loadUsers();toast('Account deleted.');
});
export const dismissTempPw=()=>{S.admin.tempPw=null;render()};
