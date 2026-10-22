// The shared app state object (S) and small queries on it. The data itself comes from the server (docs/API.md).
import { KT, THEMES, TYPES } from './config.js';
import { nextDays, now, todayIso } from './utils.js';

export const S={items:[],log:[],events:[],reqs:[],prefs:{},user:null,ready:false,version:'',
 mode:'home',view:'next',cur:{y:now.getFullYear(),m:now.getMonth()},sel:{grade:7,section:'Ruby'},
 tab:'signin',ld:{identifier:'',password:'',fullName:'',email:'',agree:false,grade:7,section:'Ruby'},loginErr:'',
 modal:null,error:'',panel:null,privacy:false,settings:false,settingsPage:null,theme:'light',
 adminTab:'users',admin:{users:null,table:null,tempPw:null}};

// Theme is the one thing kept in this browser: it is a personal preference, not shared data.
export function applyTheme(id){
  if(!THEMES.some(t=>t.id===id))id='light';
  S.theme=id;document.documentElement.dataset.theme=id;
  try{localStorage.setItem(KT,id)}catch(e){}
}
// First visit: follow the device's light/dark setting. Afterwards: the saved choice.
applyTheme((()=>{try{const t=localStorage.getItem(KT);if(THEMES.some(x=>x.id===t))return t}catch(e){}return matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'})());

export const isA=()=>S.user&&S.user.role==='admin',isT=()=>S.user&&S.user.role!=='scholar';

export const secKey=()=>S.sel.grade+'|'+S.sel.section;

export const itemsOn=(d,k)=>S.items.filter(i=>i.date===d&&i.sec===(k||secKey())).sort((a,b)=>a.time.localeCompare(b.time));

export const evOn=d=>S.events.filter(e=>e.date===d),holidayOn=d=>evOn(d).find(e=>e.kind==='holiday');

export const canEdit=it=>isT()&&it.date>todayIso&&(isA()||TYPES[it.type].ahead||nextDays.includes(it.date));

export const pref=id=>((S.prefs[S.user.name]||{})[id])||{st:'todo',bell:false};

export const recentMove=it=>{const m=(it.moves||[]).slice(-1)[0];return m&&Date.now()-new Date(m.at)<72*36e5?m:null};
