// ═══════════════════════════════════════════════════════
//  OrderFlow — Kanban Pipeline Screen
// ═══════════════════════════════════════════════════════

import { getStages, getOrdersByStage, getTeamMember, moveOrderToStage } from '../data/store';
import { navigate } from '../router';
import { totalUnits, formatDate, formatDeadlineClass } from '../utils';
import { showToast } from '../components/toast';

export async function renderPipeline(): Promise<HTMLElement> {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.padding = '0';

  const stages = await getStages();

  // ── Header ──
  const header = document.createElement('div');
  header.style.padding = 'var(--space-xl) var(--space-lg) var(--space-md)';
  header.innerHTML = `<h1 style="font-size:28px;">Flow Zamówień</h1>`;
  screen.appendChild(header);

  // ── Horizontal Scroll Container ──
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'pipeline-container';
  scrollContainer.style.cssText = `
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: var(--space-md) var(--space-lg);
    gap: var(--space-lg);
    height: calc(100dvh - var(--nav-height) - 70px);
  `;

  // Horizontal scroll with mouse wheel
  scrollContainer.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  for (const stage of stages) {
    const orders = await getOrdersByStage(stage.id);

    const column = document.createElement('div');
    column.className = 'pipeline-column';
    column.style.cssText = `
      flex: 0 0 320px;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-sm);
      overflow: hidden;
    `;

    // Column Header
    const colHeader = document.createElement('div');
    colHeader.style.cssText = `
      padding: var(--space-md) var(--space-lg);
      background: ${stage.color}22;
      border: 1px solid ${stage.color}44;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    colHeader.innerHTML = `
      <span style="font-family:var(--font-display);font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${stage.color}">${stage.name}</span>
      <span id="counter-${stage.id}" style="background:${stage.color}33;color:${stage.color};font-size:12px;font-weight:700;padding:2px 8px;border-radius:2px;font-family:var(--font-mono)">${orders.length}</span>
    `;
    column.appendChild(colHeader);

    // Cards Container
    const cardsContainer = document.createElement('div');
    cardsContainer.id = `cards-${stage.id}`;
    cardsContainer.className = 'column-cards';
    cardsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      background: var(--bg-main);
      border: var(--border-std);
      border-top: none;
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      scrollbar-width: none;
    `;

    // Drop zone for drag-and-drop
    cardsContainer.setAttribute('data-stage-id', stage.id);
    cardsContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      cardsContainer.style.background = 'var(--bg-hover)';
    });
    cardsContainer.addEventListener('dragleave', () => {
      cardsContainer.style.background = 'var(--bg-main)';
    });
    cardsContainer.addEventListener('drop', async (e) => {
      e.preventDefault();
      cardsContainer.style.background = 'var(--bg-main)';
      const orderId = e.dataTransfer?.getData('text/plain');
      if (!orderId) return;

      const card = document.querySelector(`[data-order-id="${orderId}"]`) as HTMLElement;
      if (!card) return;

      const sourceStageId = card.closest('.column-cards')?.getAttribute('data-stage-id');
      const targetStageId = stage.id;

      if (sourceStageId === targetStageId) return;

      // Optimistic Update
      const sourceContainer = card.parentElement!;

      // Update counters
      const updateCount = (id: string, delta: number) => {
        const el = screen.querySelector(`#counter-${id}`);
        if (el) el.textContent = (parseInt(el.textContent || '0') + delta).toString();
      };

      updateCount(sourceStageId!, -1);
      updateCount(targetStageId, 1);

      // If source had "Brak zamówień", remove it
      const targetEmpty = cardsContainer.querySelector('.empty-state-text');
      if (targetEmpty) targetEmpty.remove();

      cardsContainer.appendChild(card);

      // If source is now empty, add "Brak zamówień"
      if (sourceContainer.children.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-muted text-sm text-center empty-state-text';
        empty.style.padding = 'var(--space-xl)';
        empty.textContent = 'Brak zamówień';
        sourceContainer.appendChild(empty);
      }

      // Background sync
      try {
        await moveOrderToStage(orderId, targetStageId);
      } catch (err) {
        // Rollback
        sourceContainer.appendChild(card);
        updateCount(sourceStageId!, 1);
        updateCount(targetStageId, -1);
        // Clean up empty state texts if they were wrongly added/removed
        // (Simplified: just show error and user can refresh)
        showToast('Nie udało się przenieść zamówienia', 'error');
      }
    });

    if (orders.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-muted text-sm text-center empty-state-text';
      empty.style.padding = 'var(--space-xl)';
      empty.textContent = 'Brak zamówień';
      cardsContainer.appendChild(empty);
    }

    for (const order of orders) {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.style.padding = 'var(--space-md)';
      card.setAttribute('data-order-id', order.id);
      card.draggable = true;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', order.id);
        card.style.opacity = '0.4';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });
      card.addEventListener('click', () => navigate(`/order/${order.id}`));

      const assignee = await getTeamMember(order.assignedTo);
      const units = totalUnits(order.variants);

      card.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom:6px;">
          <span style="font-family:var(--font-display);font-weight:600;font-size:13px;" class="truncate">${order.clientName}</span>
          <span class="text-xs text-muted">${order.orderNumber}</span>
        </div>
        <div class="flex flex-wrap gap-xs" style="margin-bottom:8px;">
          ${order.variants.map(v => `
            <span class="pill">
              <span class="color-dot" style="background:${v.colorHex}"></span>
              ${v.productName}: ${v.quantity}
            </span>
          `).join('')}
        </div>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-sm">
            ${assignee ? `<div style="width:22px;height:22px;border-radius:50%;background:var(--bg-input);border:var(--border-std);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:var(--text-secondary)">${assignee.avatar}</div>` : ''}
            <span class="text-xs" style="${formatDeadlineClass(order.deadline)}">${formatDate(order.deadline)}</span>
          </div>
          <span class="text-xs text-muted">${units} sztuk</span>
        </div>
      `;

      cardsContainer.appendChild(card);
    }

    column.appendChild(cardsContainer);
    scrollContainer.appendChild(column);
  }

  screen.appendChild(scrollContainer);

  // ── FAB ──
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.innerHTML = '<span class="material-icons-round">add</span>';
  fab.addEventListener('click', () => navigate('/create'));
  screen.appendChild(fab);

  return screen;
}

