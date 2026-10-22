// Runs the real front-end (js/) against the reference server (tests/mock-api.mjs).
// The tests follow one story: sign up, pick a section, admin tools, scheduling rules, and shared (global) data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMock } from './mock-api.mjs';

const ADMIN={username:'testadmin',password:'testadmin-password'}; // test-only values, not the real admin login
const mock=createMock({adminUsername:ADMIN.username,adminPassword:ADMIN.password});
let sid=null;const store={};
const appEl={innerHTML:''},other={innerHTML:'',classList:{add(){},remove(){}},focus(){}};
globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
globalThis.document={getElementById:i=>i==='app'?appEl:other,documentElement:{dataset:{}},addEventListener(){},hidden:false,activeElement:null};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.matchMedia=()=>({matches:false});globalThis.confirm=()=>true;globalThis.setInterval=()=>0;
globalThis.fetch=async(url,{method='GET',body}={})=>{
  const r=mock.handle(sid,method,url.replace(/^\/api/,''),body?JSON.parse(body):undefined);
  if(r.session!==undefined)sid=r.session;
  return{ok:r.status<400,status:r.status,json:async()=>structuredClone(r.data)}; // a real server sends copies, never shared objects
};
globalThis.FormData=class{constructor(f){this.v=f.v}get(k){return this.v[k]}getAll(k){return[].concat(this.v[k]??[])}};
const ev=(v={})=>({preventDefault(){},target:{v,files:{files:[]},reset(){}}});

await import('../js/main.js');
const G=globalThis,S=G.S;
const {nextDays,todayIso,addDays,iso,now}=await import('../js/utils.js');
await G.boot();

// Draws the screen and checks it: no demo wording, no broken values, every inline handler exists.
const screen=label=>{
  G.render();const h=appEl.innerHTML;
  assert.doesNotMatch(h,/demo/i,label+': demo wording');
  assert.doesNotMatch(h,/undefined|NaN|\[object|teacher123|scholar123|admin123/,label+': broken or leaked value');
  for(const m of h.matchAll(/ on(?:click|submit|change|input)="([^"]*)"/g))
    for(const f of m[1].matchAll(/(?<![\w.$])([A-Za-z_]\w*)\(/g)){if(['if','String'].includes(f[1]))continue;assert.equal(typeof G[f[1]],'function',`${label}: missing handler ${f[1]}`)}
  return h;
};
const as=async(identifier,password)=>{await G.logout();S.tab='signin';Object.assign(S.ld,{identifier,password});await G.login(ev())};
const direct=(who,method,path,body)=>mock.handle(who,method,path,body);
const join=(name,email)=>{const r=direct(null,'POST','/signup',{fullName:name,email,password:'password1'});return{sid:r.session,id:r.data.user.id}};
const EMAIL='ana@zrc.pshs.edu.ph';
let tempPw,anaId,ben,cara,firstItem;

test('the sign-in screen has no demo wording and offers sign up',()=>{
  const h=screen('login');assert.match(h,/Sign in/);assert.match(h,/Create account/);assert.match(h,/ZRC email or username/);
});

test('sign-up only accepts a ZRC email, a full name and a decent password',async()=>{
  S.tab='signup';
  const tryUp=async(fullName,email,password='password1',agree=true)=>{Object.assign(S.ld,{fullName,email,password,agree});await G.signup(ev());return S.loginErr};
  assert.match(await tryUp('Ana Reyes','ana@gmail.com'),/@zrc\.pshs\.edu\.ph/);
  assert.match(await tryUp('Ana Reyes','ana@zrc.pshs.edu.ph.evil.com'),/@zrc\.pshs\.edu\.ph/);
  assert.match(await tryUp('Ana Reyes','ana@zrc.pshs.edu.ph','short'),/at least 8/);
  assert.match(await tryUp('Ana','ana@zrc.pshs.edu.ph'),/full name/);
  assert.match(await tryUp('Ana Reyes','ana@zrc.pshs.edu.ph','password1',false),/Data Privacy Act/);
  assert.equal(S.user,null);assert.match(screen('signup error'),/role="alert"/);
});

test('a ZRC sign-up works, and the same email cannot sign up twice',async()=>{
  assert.equal(await (async()=>{Object.assign(S.ld,{fullName:'Ana Reyes',email:'Ana@ZRC.pshs.edu.ph',password:'password1',agree:true});await G.signup(ev());return S.loginErr})(),'');
  assert.equal(S.user.email,EMAIL);assert.equal(S.user.role,'scholar');
  assert.match(screen('setup'),/Welcome, Ana/);
  await G.logout();S.tab='signup';
  Object.assign(S.ld,{fullName:'Someone Else',email:'ANA@zrc.pshs.edu.ph',password:'password2',agree:true});await G.signup(ev());
  assert.match(S.loginErr,/already signed up/);assert.match(screen('duplicate'),/Go to sign in/);
});

test('a new scholar picks a grade and section once, then sees the schedule',async()=>{
  await as(EMAIL.toUpperCase(),'password1');
  assert.equal(S.user.name,'Ana Reyes');assert.match(screen('setup'),/Choose your grade level/);
  G.setLd('grade','8');assert.equal(S.ld.section,'Waling waling');S.ld.section='Jasmin';
  await G.saveSection(ev());assert.deepEqual([S.user.grade,S.user.section],[8,'Jasmin']);
  assert.match(screen('home'),/Today and this week/);
  assert.equal(direct(sid,'POST','/profile',{grade:7,section:'Ruby'}).status,403); // only an admin can change it later
});

test('settings opens a menu with Profile, Appearance and Data Privacy Act',()=>{
  G.openSettings();const h=screen('settings menu');
  for(const k of ['profile','appearance','privacy'])assert.ok(h.includes(`setSettingsPage('${k}')`),k);
  assert.match(h,/>Profile</);assert.match(h,/>Appearance</);assert.match(h,/>Data Privacy Act</);
  G.setSettingsPage('profile');let p=screen('profile');
  assert.match(p,/Ana Reyes/);assert.match(p,/ana@zrc\.pshs\.edu\.ph/);assert.match(p,/Grade 8 · Jasmin/);assert.match(p,/Change password/);
  G.setSettingsPage('privacy');p=screen('privacy');
  assert.match(p,/Republic Act No\. 10173/);assert.doesNotMatch(p,/template|should review|Data Protection Officer should/i);
  G.setSettingsPage('appearance');p=screen('appearance');
  for(const t of ['light','dark','forest','blueprint','sunset'])assert.ok(p.includes(`setTheme('${t}')`),t);
  G.setTheme('forest');assert.equal(document.documentElement.dataset.theme,'forest');G.setTheme('light');
  G.closeSettings();assert.equal(S.settings,false);
});

test('a user can change their own password',async()=>{
  const bad=ev({current:'wrong-pass',next:'newpassword1'});await G.changePassword(bad);
  assert.equal(direct(null,'POST','/login',{identifier:EMAIL,password:'newpassword1'}).status,401);
  await G.changePassword(ev({current:'password1',next:'newpassword1'}));
  assert.equal(direct(null,'POST','/login',{identifier:EMAIL,password:'newpassword1'}).status,200);
  assert.equal(direct(null,'POST','/login',{identifier:EMAIL,password:'password1'}).status,401);
});

test('the admin sees every account but never a password',async()=>{
  await as(ADMIN.username,ADMIN.password);assert.equal(S.user.role,'admin');
  await G.setMode('admin');let h=screen('admin users');
  assert.match(h,/ana@zrc\.pshs\.edu\.ph/);assert.match(h,/Reset password/);assert.match(h,/nobody can read them/);
  for(const secret of ['newpassword1','password1',ADMIN.password])assert.ok(!h.includes(secret),'password leaked: '+secret);
  await G.setAdminTab('database');h=screen('admin database');
  for(const t of ['users','audit_log','comments','exception_requests'])assert.ok(h.includes(`loadTable('${t}',0)`),t);
  assert.ok(S.admin.table.columns.includes('email'));
  assert.ok(!S.admin.table.columns.some(c=>/pw|pass|hash/i.test(c)),'password column exposed');
  assert.ok(!JSON.stringify(S.admin.table).includes('newpassword1'));
  await G.loadTable('audit_log',0);assert.equal(S.admin.table.name,'audit_log');
  for(const t of ['calendar','requests','history'])await G.setAdminTab(t),screen('admin '+t);
  await G.setAdminTab('users');anaId=S.admin.users.find(u=>u.email===EMAIL).id;
});

test('the admin can reset a password (shown once) instead of reading it',async()=>{
  await G.resetUserPassword(anaId);tempPw=S.admin.tempPw.pw;
  assert.ok(tempPw.length>=10);assert.ok(screen('temp password').includes(tempPw));
  assert.equal(direct(null,'POST','/login',{identifier:EMAIL,password:'newpassword1'}).status,401);
  G.dismissTempPw();assert.ok(!screen('after dismiss').includes(tempPw));
});

test('there is only one admin: roles can be scholar or teacher, never admin',async()=>{
  await G.setUserRole(anaId,'teacher');assert.equal(S.admin.users.find(u=>u.id===anaId).role,'teacher');
  assert.equal(direct(sid,'PATCH',`/admin/users/${anaId}`,{role:'admin'}).status,400);
  assert.equal(mock.db.users.filter(u=>u.role==='admin').length,1);
  assert.equal(direct(sid,'DELETE',`/admin/users/${mock.db.users.find(u=>u.role==='admin').id}`).status,403);
});

test('a teacher schedules, and the daily limit of 3 holds',async()=>{
  await as(EMAIL,tempPw);assert.equal(S.user.role,'teacher');S.sel={grade:8,section:'Jasmin'};
  const add=async(subject,type,date)=>{G.openAdd();await G.submitItem(ev({subject,type,date,time:'08:00',description:'',sec:['Jasmin']}))};
  await add('Mathematics 2','fa',nextDays[1]);await add('English 2','long',nextDays[1]);await add('Filipino 2','fa',nextDays[1]);
  assert.equal(S.items.filter(i=>i.date===nextDays[1]).length,3);
  G.openAdd();await G.submitItem(ev({subject:'Biology 2',type:'fa',date:nextDays[1],time:'08:00',description:'',sec:['Jasmin']}));
  assert.deepEqual(S.modal.blocked,['Jasmin']);assert.match(S.error,/daily limit/);assert.match(screen('blocked'),/Ask admin for an exception/);
  G.closeModal();assert.equal(S.items.length,3);
  const serverSays=direct(sid,'POST','/assessments',{subject:'Biology 2',type:'fa',date:nextDays[1],time:'08:00',grade:8,secs:['Jasmin'],files:[]});
  assert.equal(serverSays.status,409);assert.deepEqual(serverSays.data.blocked,['Jasmin']); // the server enforces it too
  firstItem=S.items[0].id;
});

test('date rules: FA and Long quiz next week only, AA any later date, no holidays',async()=>{
  const far=iso(addDays(now,40)),add=async(subject,type,date)=>{G.openAdd();await G.submitItem(ev({subject,type,date,time:'09:00',description:'',sec:['Jasmin']}))};
  const n=S.items.length;
  await add('Research 2','fa',far);assert.equal(S.items.length,n);assert.match(S.error,/FA can only be scheduled for next week/);
  await add('Research 2','long',far);assert.equal(S.items.length,n);assert.match(S.error,/Long quiz can only/);
  await add('Research 2','aa',far);assert.equal(S.items.length,n+1);
  assert.equal(direct(sid,'POST','/assessments',{subject:'X Y',type:'fa',date:far,time:'09:00',grade:8,secs:['Jasmin'],files:[]}).status,409);
  await as(ADMIN.username,ADMIN.password);await G.addEvent(ev({date:nextDays[3],title:'Test Holiday',kind:'holiday'}));
  await as(EMAIL,tempPw);S.sel={grade:8,section:'Jasmin'};
  await add('Science 2','fa',nextDays[3]);assert.match(S.error,/Test Holiday is a holiday/);
  assert.equal(direct(sid,'POST','/assessments',{subject:'Science 2',type:'fa',date:nextDays[3],time:'09:00',grade:8,secs:['Jasmin'],files:[]}).status,409);
  G.closeModal();
});

test('teachers can move an assessment, but not onto a full day',async()=>{
  const math=S.items.find(i=>i.subject==='Mathematics 2'),english=S.items.find(i=>i.subject==='English 2');
  await G.moveItem(ev({date:nextDays[2]}),math.id);
  assert.equal(S.items.find(i=>i.id===math.id).date,nextDays[2]);assert.equal(S.items.find(i=>i.id===math.id).moves.length,1);
  // fill the target day to 3, then a further move there must be refused by the client and the server
  for(const subject of ['Temp A','Temp B'])assert.equal(direct(sid,'POST','/assessments',{subject,type:'fa',date:nextDays[2],time:'10:00',grade:8,secs:['Jasmin'],files:[]}).status,200);
  await G.loadData();assert.equal(S.items.filter(i=>i.date===nextDays[2]&&i.sec==='8|Jasmin').length,3);
  await G.moveItem(ev({date:nextDays[2]}),english.id);
  assert.equal(S.items.find(i=>i.id===english.id).date,nextDays[1]);
  const server=direct(sid,'POST',`/assessments/${english.id}/move`,{date:nextDays[2]});
  assert.equal(server.status,409);assert.deepEqual(server.data.blocked,['Jasmin']);
  assert.equal(direct(sid,'POST',`/assessments/${english.id}/move`,{date:todayIso}).status,409); // not allowed: today is not next week
});

test('everyone shares one database: other people’s changes show up',async()=>{
  ben=join('Ben Cruz','ben@zrc.pshs.edu.ph');direct(ben.sid,'POST','/profile',{grade:8,section:'Jasmin'});
  cara=join('Cara Lim','cara@zrc.pshs.edu.ph');direct(cara.sid,'POST','/profile',{grade:7,section:'Ruby'});
  await G.loadData();const target=S.items.find(i=>i.subject==='English 2');
  const benView=direct(ben.sid,'GET','/bootstrap').data.items,caraView=direct(cara.sid,'GET','/bootstrap').data.items;
  assert.ok(benView.some(i=>i.subject==='English 2'),'Ben (same section) sees the details');
  assert.ok(caraView.filter(i=>i.sec==='8|Jasmin').every(i=>i.subject===''&&i.description===''&&i.id===''),'Cara (other section) sees blank rows only');
  assert.equal(direct(cara.sid,'POST','/assessments',{subject:'Nope Nope',type:'fa',date:nextDays[0],time:'08:00',grade:7,secs:['Ruby'],files:[]}).status,403);
  assert.equal(direct(cara.sid,'POST',`/assessments/${target.id}/comments`,{text:'hi'}).status,404);
  // Ben comments from his own device; Ana's open page picks it up
  direct(ben.sid,'POST',`/assessments/${target.id}/comments`,{text:'Is this open notes?'});
  await G.refresh();assert.equal(S.items.find(i=>i.id===target.id).comments.length,1);
  G.openPanel(target.id);assert.match(screen('panel'),/Is this open notes\?/);
  // …but a refresh never wipes what someone is typing
  direct(ben.sid,'POST',`/assessments/${target.id}/comments`,{text:'Second question'});
  document.activeElement={tagName:'TEXTAREA'};await G.refresh();assert.equal(S.items.find(i=>i.id===target.id).comments.length,1);
  document.activeElement=null;await G.refresh();assert.equal(S.items.find(i=>i.id===target.id).comments.length,2);
  G.closePanel();
});

test('a scholar sees their own section and cannot schedule',async()=>{
  await as('ben@zrc.pshs.edu.ph','password1');assert.equal(S.user.role,'scholar');assert.equal(S.sel.section,'Jasmin');
  let h=screen('scholar home');assert.match(h,/Mathematics 2|English 2|Filipino 2/);assert.ok(!h.includes('openAdd()'));
  await G.setMode('heat');h=screen('scholar heatmap');assert.match(h,/heatGo/);
  for(const m of ['week','month'])await G.setMode(m),screen('scholar '+m);
  await G.react(S.items.find(i=>i.subject==='English 2').id,'👍');
  assert.deepEqual(S.items.find(i=>i.subject==='English 2').reactions['👍'],['Ben Cruz']);
  await G.setPref(S.items.find(i=>i.subject==='English 2').id,{st:'studying'});
  assert.equal(S.prefs['Ben Cruz'][S.items.find(i=>i.subject==='English 2').id].st,'studying');
});

test('every screen renders for every role and theme, with no demo wording',async()=>{
  for(const who of [[EMAIL,tempPw],[ADMIN.username,ADMIN.password],['ben@zrc.pshs.edu.ph','password1']]){
    await as(...who);
    for(const m of ['home','week','month','heat'])for(const v of ['this','next']){S.mode=m;S.view=v;screen(`${who[0]}/${m}/${v}`)}
    for(const th of ['light','dark','forest','blueprint','sunset']){G.setTheme(th);screen(`${who[0]}/${th}`)}
    G.openSettings();for(const p of [null,'profile','appearance','privacy']){S.settingsPage=p;screen(`${who[0]}/settings/${p}`)}G.closeSettings();
  }
  await G.logout();S.tab='signin';G.openSettings();assert.ok(!screen('logged-out settings').includes("setSettingsPage('profile')"));G.closeSettings();
});
