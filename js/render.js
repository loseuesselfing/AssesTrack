// Chooses which top-level screen to draw.
import { S } from './state.js';
import { dashboardView } from './views/dashboard.js';
import { loginView } from './views/login.js';

export function render(){document.getElementById('app').innerHTML=S.user?dashboardView():loginView()}
