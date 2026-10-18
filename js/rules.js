// Scheduling rules: best-day suggestions and creating assessments.
import { MAX, TYPES } from './config.js';
import { S, holidayOn, itemsOn, logit } from './state.js';
import { load } from './storage.js';
import { addDays, allowed, fmtD, fmtT, iso, nextDays, now, pd, secName, uid } from './utils.js';

export function bestDays(type,grade,secs,skip){
 const base=type==='project'?Array.from({length:30},(_,i)=>iso(addDays(now,i+1))):nextDays;
 return base.filter(d=>d!==skip&&allowed(type,d)&&!holidayOn(d)&&secs.every(s=>itemsOn(d,grade+'|'+s).length<MAX))
  .map(d=>({d,load:Math.max(...secs.map(s=>itemsOn(d,grade+'|'+s).length))})).sort((a,b)=>a.load-b.load||a.d.localeCompare(b.d)).slice(0,4);
}

export function createItems(f,grade,who,att,tag){
 const c=f.secs.map(s=>({id:uid(),sec:grade+'|'+s,subject:f.subject,type:f.type,date:f.date,time:f.time,description:f.description,teacher:who,createdAt:new Date().toISOString(),files:att||[],reactions:{},comments:[],moves:[]}));
 S.items.push(...c);c.forEach(i=>logit('Added',`${i.subject} ${TYPES[i.type].label} for ${secName(i.sec)} on ${fmtD(pd(i.date))} ${fmtT(i.time)}${tag||''}`,i.id));return c;
}
