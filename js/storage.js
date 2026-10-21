// Demo seed data and reading saved data from localStorage.
import { KD, KU, LEGACY_TYPES, TYPES } from './config.js';
import { addDays, fmtD, fmtT, iso, nextDays, now, pd, secName, uid } from './utils.js';

export function seed(){
 const ago=h=>new Date(Date.now()-h*36e5).toISOString(),far=iso(addDays(now,45));
 const mk=(sec,date,time,subject,type,description,teacher,h)=>({id:uid(),sec,date,time,subject,type,description,teacher,createdAt:ago(h),files:[],reactions:{},comments:[],moves:[]});
 const items=[
  mk('7|Ruby',nextDays[0],'08:00','Mathematics 1','fa','Linear equations, lessons 3 to 5','Mr. Santos',30),
  mk('7|Ruby',nextDays[0],'10:30','Integrated Science 1','long','Matter and its properties','Ms. Reyes',26),
  mk('7|Ruby',nextDays[1],'09:00','English 1','aa','Reflection essay, 500 words','Ms. Dela Cruz',22),
  mk('7|Ruby',nextDays[1],'13:00','Filipino 1','fa','Maikling kuwento','Ms. Villanueva',20),
  mk('7|Ruby',nextDays[1],'15:00','Computer Science 1','aa','Spreadsheet worksheet','Ms. Lim',18),
  mk('7|Ruby',far,'17:00','Social Science 1','aa','Poster on local heritage sites (groups of 4)','Ms. Aquino',12),
  mk('7|Diamond',nextDays[2],'08:30','Mathematics 1','fa','Linear equations, lessons 3 to 5','Mr. Santos',30),
  mk('10|Graviton',nextDays[3],'14:00','Physics 2','long','Waves and optics','Mr. Garcia',10),
  mk('10|Graviton',nextDays[4],'10:00','Chemistry 2','aa','Lab report: reaction rates','Ms. Reyes',8)];
 const log=items.map(i=>({at:i.createdAt,who:i.teacher,role:'teacher',act:'Added',id:i.id,txt:`${i.subject} ${TYPES[i.type].label} for ${secName(i.sec)} on ${fmtD(pd(i.date))} ${fmtT(i.time)}`})).sort((a,b)=>b.at.localeCompare(a.at));
 const ev=(date,title,kind)=>({id:uid(),date,title,kind});
 return{items,log,reqs:[],prefs:{},events:[ev('2026-11-01',"All Saints' Day",'holiday'),ev('2026-11-30','Bonifacio Day','holiday'),ev('2026-12-08','Feast of the Immaculate Conception','holiday'),ev('2026-12-25','Christmas Day','holiday'),ev('2026-12-30','Rizal Day','holiday'),ev(nextDays[3],'Sample school event: Science Fair','event')]};
}

export function load(){try{const r=JSON.parse(localStorage.getItem(KD));if(r&&r.items)return migrate(r)}catch(e){}return seed()}

export function getUser(){try{return JSON.parse(localStorage.getItem(KU))}catch(e){return null}}

// Saved data from older versions used Quiz / Task / Project. They are now FA / AA.
function migrate(r){
  const fix=t=>LEGACY_TYPES[t]||t;
  r.items.forEach(i=>{i.type=fix(i.type)});
  (r.reqs||[]).forEach(q=>{if(q.f)q.f.type=fix(q.f.type)});
  return r;
}
