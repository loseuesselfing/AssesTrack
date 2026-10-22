// Talks to the server (Netlify Functions). Every endpoint is described in docs/API.md.
// Resolves with the JSON body; rejects with an Error whose message is safe to show to the user.
export async function api(method,path,body){
  let res;
  try{
    res=await fetch('/api'+path,{method,credentials:'same-origin',
      headers:{'Content-Type':'application/json','X-Requested-With':'AssesTrack'},
      body:body===undefined?undefined:JSON.stringify(body)});
  }catch(e){throw Object.assign(new Error('Cannot reach the server. Check your connection and try again.'),{status:0})}
  let data=null;try{data=await res.json()}catch(e){}
  if(!res.ok)throw Object.assign(new Error((data&&data.error)||'Something went wrong. Please try again.'),{status:res.status,data});
  return data;
}
