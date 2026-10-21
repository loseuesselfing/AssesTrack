// Scheduling rules: best-day suggestions and creating assessments.
import { MAX, TYPES } from './config.js';
import { S, holidayOn, itemsOn, logit } from './state.js';
import { addDays, allowed, fmtD, fmtT, iso, nextDays, now, pd, secName, uid } from './utils.js';

// Workload of a day's items: FA counts 1, Long quiz and AA count 2 (see TYPES in config.js).
export const dayWeight=list=>list.reduce((a,i)=>a+TYPES[i.type].w,0);

export function bestDays(type,grade,secs,skip){
 const base=TYPES[type].ahead?Array.from({length:30},(_,i)=>iso(addDays(now,i+1))):nextDays;
 return base.filter(d=>d!==skip&&allowed(type,d)&&!holidayOn(d)&&secs.every(s=>itemsOn(d,grade+'|'+s).length<MAX))
  .map(d=>({d,load:Math.max(...secs.map(s=>itemsOn(d,grade+'|'+s).length)),w:Math.max(...secs.map(s=>dayWeight(itemsOn(d,grade+'|'+s))))})).sort((a,b)=>a.w-b.w||a.load-b.load||a.d.localeCompare(b.d)).slice(0,4);
}

export function createItems(f,grade,who,att,tag){
 const c=f.secs.map(s=>({id:uid(),sec:grade+'|'+s,subject:f.subject,type:f.type,date:f.date,time:f.time,description:f.description,teacher:who,createdAt:new Date().toISOString(),files:att||[],reactions:{},comments:[],moves:[]}));
 S.items.push(...c);c.forEach(i=>logit('Added',`${i.subject} ${TYPES[i.type].label} for ${secName(i.sec)} on ${fmtD(pd(i.date))} ${fmtT(i.time)}${tag||''}`,i.id));return c;
}
