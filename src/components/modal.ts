// ═══════════════════════════════════════════════════════
//  OrderFlow — Modal / Bottom Sheet
// ═══════════════════════════════════════════════════════

export function showModal(content: HTMLElement): void {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    overlay.classList.add('active');

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', hideModal);

    const sheet = document.createElement('div');
    sheet.className = 'modal-sheet';

    const handle = document.createElement('div');
    handle.className = 'modal-handle';

    sheet.appendChild(handle);
    sheet.appendChild(content);

    overlay.appendChild(backdrop);
    overlay.appendChild(sheet);
}

export function hideModal(): void {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.innerHTML = '';
}
