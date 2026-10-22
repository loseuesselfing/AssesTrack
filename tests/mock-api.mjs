// Reference implementation of docs/API.md, in memory.
// The front-end tests run against it, and the real server (Netlify Functions + Database) must behave the same way.
// Passwords are kept as plain text here only because this is a throw-away test double; the real server hashes them.
import { MAX, SECTIONS, TYPES } from '../js/config.js';
import { nextDays, todayIso } from '../js/utils.js';

const ZRC=/^[^\s@]+@zrc\.pshs\.edu\.ph$/i,EMOJI=['👍','✅','👀','😰'];
const TABLES=['users','assessments','attachments','comments','reactions','progress','events','exception_requests','audit_log'];

export function createMock({adminUsername,adminPassword}){
 const db={users:[],sessions:new Map(),items:[],events:[],reqs:[],log:[],prefs:{},files:new Map(),version:1};
 let n=0;const id=()=>'id'+(++n),stamp=()=>new Date().toISOString();
 const err=(status,error,extra={})=>({status,data:{error,...extra}}),res=(data,session)=>({status:200,data,session});
 db.users.push({id:id(),name:'Administrator',email:null,username:adminUsername,role:'admin',grade:null,section:null,pw:adminPassword,createdAt:stamp(),lastLoginAt:null});
 const pub=({pw,...u})=>u,bump=()=>{db.version++};
 const logit=(u,act,txt,itemId)=>db.log.unshift({at:stamp(),who:u.name,role:u.role,act,txt,id:itemId});
 const on=(d,g,s)=>db.items.filter(i=>i.date===d&&i.sec===g+'|'+s);
 const holiday=d=>db.events.find(e=>e.date===d&&e.kind==='holiday');
 const allowed=(t,d)=>TYPES[t].ahead?d>todayIso:nextDays.includes(d);
 const canEdit=(u,i)=>u.role!=='scholar'&&i.date>todayIso&&(u.role==='admin'||TYPES[i.type].ahead||nextDays.includes(i.date));
 const sec=i=>{const[g,s]=i.sec.split('|');return'Grade '+g+' · '+s};
 const blank=i=>({id:'',sec:i.sec,date:i.date,time:'00:00',subject:'',type:i.type,description:'',teacher:'',createdAt:'',files:[],reactions:{},comments:[],moves:[]});
 const mine=(u,i)=>u.role!=='scholar'||i.sec===u.grade+'|'+u.section;

 // Business rules R1-R5 of docs/API.md. Returns an error response, or null when the entry is allowed.
 const rules=(f,grade,override,ignoreId)=>{
  const subject=String(f.subject||'').trim();
  if(!subject)return err(400,'Enter the subject name.');
  if(!TYPES[f.type])return err(400,'Choose a type.');
  if(!Array.isArray(f.secs)||!f.secs.length||!f.secs.every(s=>(SECTIONS[grade]||[]).includes(s)))return err(400,'Choose at least one section.');
  if(!/^\d{4}-\d\d-\d\d$/.test(f.date||''))return err(400,'Choose a date.');
  const h=holiday(f.date);if(h)return err(409,`${h.title} is a holiday. Choose another date.`);
  if(!allowed(f.type,f.date))return err(409,TYPES[f.type].ahead?'AA needs a due date after today.':`${TYPES[f.type].label} can only be scheduled for next week. Choose AA for later dates.`);
  const others=s=>on(f.date,grade,s).filter(i=>i.id!==ignoreId);
  if(!override){const full=f.secs.filter(s=>others(s).length>=MAX);if(full.length)return err(409,`Blocked: ${full.join(', ')} already ${full.length>1?'have':'has'} ${MAX} assessments on that date, the daily limit.`,{blocked:full})}
  const dup=f.secs.filter(s=>others(s).some(i=>i.subject.toLowerCase()===subject.toLowerCase()));
  if(dup.length)return err(409,`${subject} already has an entry that day for ${dup.join(', ')}. Each subject counts once per day.`);
  return null;
 };
 const make=(actor,who,f,grade,files,tag='')=>f.secs.map(s=>{
  const item={id:id(),sec:grade+'|'+s,date:f.date,time:f.time||'08:00',subject:String(f.subject).trim(),type:f.type,description:String(f.description||''),teacher:who,createdAt:stamp(),files:[],reactions:{},comments:[],moves:[]};
  for(const x of files){const fid=id();db.files.set(fid,x);item.files.push({id:fid,name:x.name,type:x.type,size:Math.floor(String(x.data).length*3/4)})}
  db.items.push(item);logit(actor,'Added',`${item.subject} ${TYPES[item.type].label} for ${sec(item)} on ${item.date} ${item.time}${tag}`,item.id);return item;
 });
 const boot=u=>({today:todayIso,user:pub(u),items:db.items.map(i=>mine(u,i)?i:blank(i)),events:db.events,
  reqs:u.role==='admin'?db.reqs:u.role==='teacher'?db.reqs.filter(r=>r.by===u.name):[],log:u.role==='scholar'?[]:db.log.slice(0,300),
  prefs:{[u.name]:db.prefs[u.id]||{}},version:String(db.version)});
 const table=name=>({
  users:()=>db.users.map(pub),
  assessments:()=>db.items.map(({files,reactions,comments,moves,...r})=>r),
  attachments:()=>db.items.flatMap(i=>i.files.map(f=>({...f,assessment:i.id}))),
  comments:()=>db.items.flatMap(i=>i.comments.map(c=>({...c,assessment:i.id}))),
  reactions:()=>db.items.flatMap(i=>Object.entries(i.reactions).flatMap(([emoji,l])=>l.map(by=>({assessment:i.id,emoji,by})))),
  progress:()=>Object.entries(db.prefs).flatMap(([user,m])=>Object.entries(m).map(([assessment,v])=>({user,assessment,...v}))),
  events:()=>db.events,
  exception_requests:()=>db.reqs.map(({f,...r})=>({...r,subject:f.subject,type:f.type,date:f.date,sections:f.secs.join(', ')})),
  audit_log:()=>db.log}[name]());

 function handle(sid,method,path,body={}){
  const[p,qs]=path.split('?'),q=new URLSearchParams(qs||''),uidv=sid&&db.sessions.get(sid),u=uidv?db.users.find(x=>x.id===uidv):null;
  const guard=(...roles)=>!u?err(401,'Please sign in.'):roles.length&&!roles.includes(u.role)?err(403,'You do not have permission to do that.'):null;
  const start=user=>{const s='s'+id();db.sessions.set(s,user.id);user.lastLoginAt=stamp();return s};
  let m,bad;
  if(method==='POST'&&p==='/signup'){
   const name=String(body.fullName||'').trim().replace(/\s+/g,' '),email=String(body.email||'').trim().toLowerCase(),pw=String(body.password||'');
   if(name.split(' ').length<2)return err(400,'Enter your full name (first and last name).');
   if(!ZRC.test(email))return err(400,'Use your ZRC email. It must end with @zrc.pshs.edu.ph');
   if(pw.length<8)return err(400,'Password must be at least 8 characters.');
   if(db.users.some(x=>x.email===email))return err(409,'This email is already signed up. Please sign in instead.');
   const user={id:id(),name,email,username:null,role:'scholar',grade:null,section:null,pw,createdAt:stamp(),lastLoginAt:null};db.users.push(user);
   return res({user:pub(user)},start(user));
  }
  if(method==='POST'&&p==='/login'){
   const k=String(body.identifier||'').trim().toLowerCase(),user=db.users.find(x=>x.email===k||(x.username&&x.username.toLowerCase()===k));
   if(!user||user.pw!==body.password)return err(401,'Wrong email/username or password.');
   return res({user:pub(user)},start(user));
  }
  if(method==='POST'&&p==='/logout'){db.sessions.delete(sid);return res({ok:true},null)}
  if((bad=guard()))return bad;
  if(method==='GET'&&p==='/me')return res({user:pub(u)});
  if(method==='GET'&&p==='/version')return res({version:String(db.version)});
  if(method==='GET'&&p==='/bootstrap')return res(boot(u));
  if(method==='POST'&&p==='/profile'){
   if(u.role==='admin')return err(403,'The admin account has no section.');
   if(u.grade)return err(403,'Ask an admin to change your section.');
   if(!(SECTIONS[body.grade]||[]).includes(body.section))return err(400,'Choose a grade level and section.');
   u.grade=+body.grade;u.section=body.section;bump();return res({user:pub(u)});
  }
  if(method==='POST'&&p==='/change-password'){
   if(u.pw!==body.currentPassword)return err(400,'Your current password is not correct.');
   if(String(body.newPassword||'').length<8)return err(400,'New password must be at least 8 characters.');
   u.pw=body.newPassword;return res({ok:true});
  }
  /* assessments */
  if(method==='POST'&&p==='/assessments'){
   if((bad=guard('teacher','admin')))return bad;
   const grade=+body.grade,override=!!body.override;
   if(override&&u.role!=='admin')return err(403,'Only the admin can override the daily limit.');
   const files=body.files||[];
   if(files.length>3)return err(400,'Attach up to 3 files.');
   if(files.some(x=>Math.floor(String(x.data).length*3/4)>700*1024))return err(400,'Each file must be under 700 KB.');
   if((bad=rules(body,grade,override)))return bad;
   const items=make(u,u.name,body,grade,files,override?' (admin override)':'');bump();return res({items});
  }
  if((m=p.match(/^\/assessments\/([^/]+)(?:\/(move|react|comments|progress))?$/))){
   const it=db.items.find(x=>x.id===m[1]);
   if(!it||!mine(u,it))return err(404,'That assessment does not exist.');
   if(method==='DELETE'&&!m[2]){
    if(!canEdit(u,it))return err(403,'You cannot change this assessment.');
    db.items=db.items.filter(x=>x!==it);logit(u,'Removed',`${it.subject} ${TYPES[it.type].label} (${sec(it)}) on ${it.date}`,it.id);bump();return res({ok:true});
   }
   if(method==='POST'&&m[2]==='move'){
    if(!canEdit(u,it))return err(403,'You cannot change this assessment.');
    if(!body.date||body.date===it.date)return err(400,'Pick a different date.');
    const[g,s]=it.sec.split('|');
    if((bad=rules({subject:it.subject,type:it.type,date:body.date,secs:[s]},+g,false,it.id)))return bad;
    const old=it.date;it.moves.push({from:old,to:body.date,by:u.name,at:stamp()});it.date=body.date;
    logit(u,'Moved',`${it.subject} ${TYPES[it.type].label} (${sec(it)}) from ${old} to ${it.date}`,it.id);bump();return res({ok:true});
   }
   if(method==='POST'&&m[2]==='react'){
    if(!EMOJI.includes(body.emoji))return err(400,'That reaction is not available.');
    const l=it.reactions[body.emoji]||[];it.reactions[body.emoji]=l.includes(u.name)?l.filter(x=>x!==u.name):[...l,u.name];bump();return res({ok:true});
   }
   if(method==='POST'&&m[2]==='comments'){
    const text=String(body.text||'').trim();if(!text||text.length>300)return err(400,'A comment must be 1 to 300 characters.');
    it.comments.push({id:id(),author:u.name,role:u.role,text,at:stamp()});bump();return res({ok:true});
   }
   if(method==='PUT'&&m[2]==='progress'){
    if(!['todo','studying','done'].includes(body.st))return err(400,'Choose a status.');
    (db.prefs[u.id]=db.prefs[u.id]||{})[it.id]={st:body.st,bell:!!body.bell};return res({ok:true});
   }
  }
  if(method==='GET'&&(m=p.match(/^\/files\/([^/]+)$/))){
   const f=db.files.get(m[1]),it=db.items.find(i=>i.files.some(x=>x.id===m[1]));
   if(!f||!it||!mine(u,it))return err(404,'That file does not exist.');return res(f);
  }
  /* calendar events (admin) */
  if(method==='POST'&&p==='/events'){
   if((bad=guard('admin')))return bad;
   if(!/^\d{4}-\d\d-\d\d$/.test(body.date||'')||!String(body.title||'').trim()||!['holiday','event'].includes(body.kind))return err(400,'Enter a date, a title and a type.');
   const e={id:id(),date:body.date,title:String(body.title).trim().slice(0,60),kind:body.kind};db.events.push(e);
   logit(u,'Calendar',`Added ${e.kind} "${e.title}" on ${e.date}`);bump();return res({event:e});
  }
  if(method==='DELETE'&&(m=p.match(/^\/events\/([^/]+)$/))){
   if((bad=guard('admin')))return bad;
   const e=db.events.find(x=>x.id===m[1]);if(!e)return err(404,'That event does not exist.');
   db.events=db.events.filter(x=>x!==e);logit(u,'Calendar',`Removed "${e.title}" (${e.date})`);bump();return res({ok:true});
  }
  /* exception requests */
  if(method==='POST'&&p==='/requests'){
   if((bad=guard('teacher')))return bad;
   const r={id:id(),by:u.name,at:stamp(),grade:+body.grade,f:body.f,status:'pending'};db.reqs.push(r);
   logit(u,'Requested exception',`${r.f.subject} ${TYPES[r.f.type].label} for Grade ${r.grade} (${r.f.secs.join(', ')}) on ${r.f.date}`);bump();return res({request:r});
  }
  if(method==='POST'&&(m=p.match(/^\/requests\/([^/]+)\/decide$/))){
   if((bad=guard('admin')))return bad;
   const r=db.reqs.find(x=>x.id===m[1]);if(!r)return err(404,'That request does not exist.');
   if(r.status!=='pending')return err(409,'This request was already decided.');
   if(body.approve){if((bad=rules(r.f,r.grade,true)))return bad;make(u,r.by,r.f,r.grade,[],` (exception approved by ${u.name})`)}
   r.status=body.approve?'approved':'denied';r.by2=u.name;
   logit(u,body.approve?'Approved exception':'Denied exception',`${r.f.subject} requested by ${r.by}`);bump();return res({ok:true});
  }
  /* admin: users and database viewer */
  if(p.startsWith('/admin/')){
   if((bad=guard('admin')))return bad;
   if(method==='GET'&&p==='/admin/users')return res({users:db.users.map(pub)});
   if((m=p.match(/^\/admin\/users\/([^/]+)(?:\/(reset-password))?$/))){
    const t=db.users.find(x=>x.id===m[1]);if(!t)return err(404,'That account does not exist.');
    if(t.role==='admin')return err(403,'The admin account cannot be changed here.');
    if(method==='PATCH'){
     if('role' in body){if(!['scholar','teacher'].includes(body.role))return err(400,'Role must be scholar or teacher.');t.role=body.role}
     if('grade' in body){if(body.grade===null&&body.section===null){t.grade=null;t.section=null}
      else if((SECTIONS[body.grade]||[]).includes(body.section)){t.grade=+body.grade;t.section=body.section}else return err(400,'Choose a valid section.')}
     bump();return res({user:pub(t)});
    }
    if(method==='POST'&&m[2]==='reset-password'){
     const temp=Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,8)+'A1';t.pw=temp;
     for(const[k,v]of db.sessions)if(v===t.id)db.sessions.delete(k);
     logit(u,'Account',`Reset the password of ${t.name}`);return res({temporaryPassword:temp});
    }
    if(method==='DELETE'){db.users=db.users.filter(x=>x!==t);for(const[k,v]of db.sessions)if(v===t.id)db.sessions.delete(k);logit(u,'Account',`Deleted the account of ${t.name}`);bump();return res({ok:true})}
   }
   if(method==='GET'&&(m=p.match(/^\/admin\/tables\/([a-z_]+)$/))){
    if(!TABLES.includes(m[1]))return err(404,'That table is not available.');
    const all=table(m[1]),offset=Math.max(0,+q.get('offset')||0),limit=Math.min(100,+q.get('limit')||25),rows=all.slice(offset,offset+limit);
    return res({name:m[1],columns:[...new Set(all.flatMap(r=>Object.keys(r)))],rows,total:all.length,offset,limit});
   }
  }
  return err(404,'Not found.');
 }
 return{handle,db};
}
