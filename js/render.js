// Chooses which top-level screen to draw.
import { S } from './state.js';
import { dashboardView } from './views/dashboard.js';
import { loginView } from './views/login.js';
import { setupView } from './views/setup.js';

const loadingView=()=>`<main class="min-h-screen flex items-center justify-center"><p class="text-[var(--muted)] font-semibold">Loading AssesTrack…</p></main>`;

// New scholars must pick their grade level and section once before they see the schedule.
const needsSetup=()=>S.user.role==='scholar'&&!S.user.grade;

export function render(){
  document.getElementById('app').innerHTML=!S.ready?loadingView():!S.user?loginView():needsSetup()?setupView():dashboardView();
}
