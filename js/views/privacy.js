// Data Privacy Act notice: the text (shown in Settings) and the dialog (sign-in page and footer links).
import { S } from '../state.js';

export function privacyBody(){
 const li=(t,b)=>`<li><b>${t}</b> ${b}</li>`;
 return`<p class="text-sm text-[var(--muted)]">Data Privacy Act of 2012 (Republic Act No. 10173)</p>
 <ul class="mt-3 space-y-3 text-sm leading-relaxed">
 ${li('What we collect.','Your full name, ZRC email address, role, grade level and section, comments, reactions, your own study status and reminders, and a record of who added, moved or removed each assessment and when.')}
 ${li('Why.','To create your account, to schedule and announce assessments, to apply the limit of 3 subjects per day, and to keep the schedule accountable and accurate.')}
 ${li('Who can see it.','Scholars see their own section’s schedule. Comments and reactions are visible to people viewing that assessment. Your study status and reminders are private to your account. Teachers and the admin can see the edit history. The admin can see account details (name, email, role, section) but never passwords.')}
 ${li('Passwords.','Passwords are stored in scrambled (hashed) form. Nobody, including the admin, can read them.')}
 ${li('Where it is kept.','In AssesTrack’s online database, hosted on Netlify. Access is limited to authorized staff.')}
 ${li('How long.','Records should be deleted or archived at the end of the school year.')}
 ${li('Minors.','Scholars are minors. Use of AssesTrack follows the school’s existing consent process with parents and guardians.')}
 ${li('Your rights.','You may ask to be informed, to access and correct your data, to object, to request erasure, and to complain to the National Privacy Commission.')}
 ${li('Questions.','Contact the school’s Data Protection Officer.')}</ul>`;
}

export function privacyView(){
 if(!S.privacy)return'';
 return`<div class="fixed inset-0 z-[80] bg-slate-900/60 flex items-center justify-center p-4" onclick="if(event.target===this){S.privacy=false;render()}"><div class="pop bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6" role="dialog" aria-modal="true" aria-labelledby="pt">
 <h2 id="pt" class="fh font-bold text-2xl mb-1">Data Privacy Act</h2>${privacyBody()}
 <button onclick="S.privacy=false;render()" class="mt-5 px-5 py-2.5 rounded-lg font-bold text-white bg-[var(--brand)]">Close</button></div></div>`;
}
