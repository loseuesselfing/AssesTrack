// Date and time helpers, formatting, HTML escaping, ids and toast messages.

export const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

export const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};

const mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const w=x.getDay();return addDays(x,w===0?-6:1-w)};

export const now=new Date(),todayIso=iso(now),tomorrowIso=iso(addDays(now,1)),thisMon=mondayOf(now),nextMon=addDays(thisMon,7);

export const nextDays=Array.from({length:5},(_,i)=>iso(addDays(nextMon,i)));

export const pd=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};

export const fmtD=d=>d.toLocaleDateString('en-PH',{month:'short',day:'numeric'});

export const wk=(s,l)=>pd(s).toLocaleDateString('en-PH',{weekday:l||'short'});

export const fmtLong=s=>pd(s).toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

export const fmtT=t=>{if(!t)return'';const[h,m]=t.split(':').map(Number);return((h+11)%12+1)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM')};

export const fmtAt=s=>new Date(s).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});

export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

export const secName=k=>{const[g,s]=k.split('|');return'Grade '+g+' · '+s};

export const allowed=(type,d)=>type==='project'?d>todayIso:nextDays.includes(d);

let tt;

export function toast(m,k){const e=document.getElementById('toast');e.innerHTML=`<div class="${k==='error'?'bg-red-700':'bg-[#16233B]'} text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-lg" role="status">${esc(m)}</div>`;e.classList.remove('hidden');clearTimeout(tt);tt=setTimeout(()=>e.classList.add('hidden'),4200)}
