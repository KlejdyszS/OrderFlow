// ═══════════════════════════════════════════════════════
//  OrderFlow — Utility helpers
// ═══════════════════════════════════════════════════════

export function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;

    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Przed chwilą';
    if (mins < 60) return `${mins} min temu`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} godz. temu`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Wczoraj';
    if (days < 7) return `${days} dni temu`;

    return new Date(dateStr).toLocaleDateString();
}

export function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000);

    if (diffDays < -1) return `${Math.abs(diffDays)} dni spóźnienia`;
    if (diffDays === -1) return 'Termin wczoraj';
    if (diffDays === 0) return 'Termin dzisiaj';
    if (diffDays === 1) return 'Termin jutro';
    return `Termin za ${diffDays} dni`;
}

export function formatDeadlineClass(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (d.getTime() - now.getTime()) / 3600000;
    if (diffHours < 0) return 'color: var(--status-blocked)';
    if (diffHours < 24) return 'color: var(--color-acid)';
    return 'color: var(--text-secondary)';
}

export function formatNumber(n: number): string {
    return n.toLocaleString();
}

export function totalUnits(variants: { quantity: number }[]): number {
    return variants.reduce((s, v) => s + v.quantity, 0);
}

export function completionPercent(variants: { completed: boolean }[]): number {
    if (variants.length === 0) return 0;
    return Math.round((variants.filter(v => v.completed).length / variants.length) * 100);
}

export function el(tag: string, attrs?: Record<string, string>, ...children: (string | HTMLElement)[]): HTMLElement {
    const elem = document.createElement(tag);
    if (attrs) {
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === 'className') elem.className = v;
            else if (k.startsWith('data-')) elem.setAttribute(k, v);
            else elem.setAttribute(k, v);
        });
    }
    children.forEach(c => {
        if (typeof c === 'string') elem.appendChild(document.createTextNode(c));
        else if (c) elem.appendChild(c);
    });
    return elem;
}

export function icon(name: string, size?: string): HTMLElement {
    const i = document.createElement('span');
    i.className = 'material-icons-round';
    i.textContent = name;
    if (size) i.style.fontSize = size;
    return i;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export function priorityBadgeClass(priority: string): string {
    switch (priority) {
        case 'CRITICAL': case 'HIGH': return 'badge badge-priority-high';
        case 'MEDIUM': return 'badge badge-priority-medium';
        case 'LOW': return 'badge badge-priority-low';
        default: return 'badge';
    }
}

export function statusBadgeClass(stageId: string): string {
    // Map based on stage order index
    const map: Record<string, string> = {
        's1': 'badge-new', 's2': 'badge-production', 's3': 'badge-packing', 's4': 'badge-done',
    };
    return `badge ${map[stageId] || 'badge-new'}`;
}
