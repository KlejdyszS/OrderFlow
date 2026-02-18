// ═══════════════════════════════════════════════════════
//  OrderFlow — Main Entry Point
// ═══════════════════════════════════════════════════════

import './styles/global.css';
import { initStore } from './data/store';
import { route, startRouter } from './router';
import { mountNav } from './components/bottomNav';

// Import screens
import { renderDashboard } from './screens/dashboard';
import { renderPipeline } from './screens/pipeline';
import { renderOrderDetail } from './screens/orderDetail';
import { renderCreateOrder } from './screens/createOrder'; // Screen confirmed valid by tsc
import { renderAdmin } from './screens/admin';

// ── Theme Initialization ──
const savedTheme = localStorage.getItem('orderflow_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ── Initialize ──
initStore();

// ── Register routes ──
route('/dashboard', () => renderDashboard());
route('/pipeline', () => renderPipeline());
route('/order/:id', (params) => renderOrderDetail(params));
route('/create', () => renderCreateOrder());
route('/admin', () => renderAdmin());

// ── Mount navigation ──
window.addEventListener('hashchange', () => mountNav());

// ── Start ──
startRouter();
mountNav();
