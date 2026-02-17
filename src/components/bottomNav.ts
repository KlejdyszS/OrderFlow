// ═══════════════════════════════════════════════════════
//  OrderFlow — Bottom Navigation
// ═══════════════════════════════════════════════════════

import { getActiveRoute, navigate } from '../router';

const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Pulpit', path: '/dashboard' },
    { id: 'pipeline', icon: 'view_kanban', label: 'Flow', path: '/pipeline' },
    { id: 'create', icon: 'add_circle', label: 'Dodaj', path: '/create' },
    { id: 'admin', icon: 'settings', label: 'Panel', path: '/admin' },
];

export function renderBottomNav(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    const active = getActiveRoute();

    navItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = `nav-item ${active === item.id ? 'active' : ''}`;
        btn.innerHTML = `<span class="material-icons-round">${item.icon}</span><span>${item.label}</span>`;
        btn.addEventListener('click', () => navigate(item.path));
        nav.appendChild(btn);
    });

    return nav;
}

export function mountNav(): void {
    // Remove old nav
    document.querySelectorAll('.bottom-nav').forEach(n => n.remove());
    document.body.appendChild(renderBottomNav());
}
