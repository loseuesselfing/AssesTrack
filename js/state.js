// The shared app state object (S), saving, and small queries on it.
import { KD, KT } from './config.js';
import { getUser, load } from './storage.js';
import { nextDays, now, todayIso } from './utils.js';

export const save=()=>{try{localStorage.setItem(KD,JSON.stringify({items:S.items,log:S.log,events:S.events,reqs:S.reqs,prefs:S.prefs}));return true}catch(e){return false}};

const D=load();

export const S={...D,user:getUser(),mode:'home',view:'next',cur:{y:now.getFullYear(),m:now.getMonth()},sel:{grade:7,section:'Ruby'},
 tab:'teacher',ld:{grade:7,section:'Ruby',name:'',username:'',password:'',agree:false},loginErr:'',modal:null,error:'',panel:null,privacy:false};

if(S.user&&S.user.role==='scholar')S.sel={grade:S.user.grade,section:S.user.section};

try{const t=localStorage.getItem(KT);if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}

save();

export const isA=()=>S.user&&S.user.role==='admin',isT=()=>S.user&&S.user.role!=='scholar';

export const secKey=()=>S.sel.grade+'|'+S.sel.section;

export const itemsOn=(d,k)=>S.items.filter(i=>i.date===d&&i.sec===(k||secKey())).sort((a,b)=>a.time.localeCompare(b.time));

export const evOn=d=>S.events.filter(e=>e.date===d),holidayOn=d=>evOn(d).find(e=>e.kind==='holiday');

export const canEdit=it=>isT()&&it.date>todayIso&&(isA()||it.type==='project'||nextDays.includes(it.date));

export const pref=id=>((S.prefs[S.user.name]||{})[id])||{st:'todo',bell:false};

export const recentMove=it=>{const m=(it.moves||[]).slice(-1)[0];return m&&Date.now()-new Date(m.at)<72*36e5?m:null};

export function logit(act,txt,id){S.log.unshift({at:new Date().toISOString(),who:S.user.name,role:S.user.role,act,txt,id});S.log=S.log.slice(0,300)}
