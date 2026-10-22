// Scheduling helpers on the client: workload weight and best-day suggestions.
// The real rules are enforced by the server and database (docs/API.md); these only give instant feedback.
import { MAX, TYPES } from './config.js';
import { holidayOn, itemsOn } from './state.js';
import { addDays, allowed, iso, nextDays, now } from './utils.js';

// Workload of a day's items: FA counts 1, Long quiz and AA count 2 (see TYPES in config.js).
export const dayWeight=list=>list.reduce((a,i)=>a+TYPES[i.type].w,0);

export function bestDays(type,grade,secs,skip){
 const base=TYPES[type].ahead?Array.from({length:30},(_,i)=>iso(addDays(now,i+1))):nextDays;
 return base.filter(d=>d!==skip&&allowed(type,d)&&!holidayOn(d)&&secs.every(s=>itemsOn(d,grade+'|'+s).length<MAX))
  .map(d=>({d,load:Math.max(...secs.map(s=>itemsOn(d,grade+'|'+s).length)),w:Math.max(...secs.map(s=>dayWeight(itemsOn(d,grade+'|'+s))))})).sort((a,b)=>a.w-b.w||a.load-b.load||a.d.localeCompare(b.d)).slice(0,4);
}
