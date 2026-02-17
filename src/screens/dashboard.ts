// ═══════════════════════════════════════════════════════
//  OrderFlow — Dashboard Screen ("Air Traffic Control")
// ═══════════════════════════════════════════════════════

import { getOrders, getStages, getCurrentUser, getOrdersForUser, getStats, getStageColor } from '../data/store';
import { navigate } from '../router';
import { timeAgo, formatDate, formatDeadlineClass } from '../utils';

export async function renderDashboard(): Promise<HTMLElement> {
  const screen = document.createElement('div');
  screen.className = 'screen';

  const user = await getCurrentUser();
  const stats = await getStats();
  const stages = await getStages();
  const myOrders = user ? await getOrdersForUser(user.id) : [];
  const allOrders = await getOrders();

  // Filter out shipped for my active queue
  const lastStageId = stages.length > 0 ? stages[stages.length - 1].id : null;
  const activeOrders = myOrders.filter(o => o.statusId !== lastStageId);


  // ── Header ──
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center mb-xl';
  header.innerHTML = `
    <div>
      <h4 style="margin-bottom: 4px;">OrderFlow</h4>
      <h1>Cześć, ${user?.name.split(' ')[0] || 'Operatorze'}</h1>
    </div>
    <div style="width:40px;height:40px;border-radius:50%;background:var(--color-acid);color:#111;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:14px;">
      ${user?.avatar || 'OP'}
    </div>
  `;
  screen.appendChild(header);

  // ── Metric Ticker ──
  const ticker = document.createElement('div');
  ticker.className = 'metric-ticker mb-xl';

  stages.forEach(stage => {
    const count = stats.byStage[stage.id] || 0;
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-value" style="color: ${stage.color}">${count}</div>
      <div class="metric-label">${stage.name}</div>
    `;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => navigate('/pipeline'));
    ticker.appendChild(card);
  });

  // Delayed count
  if (stats.delayed > 0) {
    const delayCard = document.createElement('div');
    delayCard.className = 'metric-card';
    delayCard.style.borderColor = 'var(--status-blocked)';
    delayCard.innerHTML = `
      <div class="metric-value" style="color: var(--status-blocked)">${stats.delayed}</div>
      <div class="metric-label">Spóźnione</div>
    `;
    ticker.appendChild(delayCard);
  }

  screen.appendChild(ticker);

  // ── My Queue ──
  const queueHeader = document.createElement('div');
  queueHeader.className = 'section-header';
  queueHeader.innerHTML = `
    <h4>Przypisane do Ciebie (${activeOrders.length})</h4>
  `;
  screen.appendChild(queueHeader);

  if (activeOrders.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <span class="material-icons-round">coffee</span>
      <p style="font-family: var(--font-display); font-size: 16px; margin-bottom: 4px;">Wszystko gotowe</p>
      <p class="text-muted text-sm">Brak oczekujących zadań. Czas na kawę.</p>
    `;
    screen.appendChild(empty);
  } else {
    const queue = document.createElement('div');
    queue.className = 'flex-col gap-md';
    queue.style.display = 'flex';

    for (const order of activeOrders.slice(0, 6)) {
      const stageColor = await getStageColor(order.statusId);
      const card = document.createElement('div');

      card.className = 'card card-interactive flex gap-md';
      card.style.padding = 'var(--space-md) var(--space-lg)';
      card.addEventListener('click', () => navigate(`/order/${order.id}`));

      card.innerHTML = `
        <div class="status-bar" style="background: ${stageColor}"></div>
        <div class="flex-1" style="min-width:0">
          <div class="flex justify-between items-center mb-sm">
            <span style="font-family:var(--font-display);font-weight:600;font-size:14px;" class="truncate">${order.clientName}</span>
            <span class="${order.priority === 'CRITICAL' || order.priority === 'HIGH' ? 'badge badge-priority-high' : 'text-muted text-xs'}">${order.priority}</span>
          </div>
          <div class="text-muted text-sm truncate" style="margin-bottom:4px;">
            ${order.variants.map(v => `${v.quantity}x ${v.productName} ${v.color}`).join(' | ')}
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs" style="${formatDeadlineClass(order.deadline)}">${formatDate(order.deadline)}</span>
            <span class="text-xs text-muted">${order.orderNumber}</span>
          </div>
        </div>
      `;

      queue.appendChild(card);
    }

    screen.appendChild(queue);
  }

  // ── Live Feed ──
  const feedHeader = document.createElement('div');
  feedHeader.className = 'section-header mt-xl';
  queueHeader.innerHTML = `<h4>Aktualności</h4>`;
  screen.appendChild(feedHeader);

  // Gather recent logs from all orders
  const allLogs: { orderId: string; orderNum: string; log: typeof allOrders[0]['logs'][0] }[] = [];
  allOrders.forEach(o => {
    o.logs.forEach(l => allLogs.push({ orderId: o.id, orderNum: o.orderNumber, log: l }));
  });
  allLogs.sort((a, b) => new Date(b.log.timestamp).getTime() - new Date(a.log.timestamp).getTime());

  const feed = document.createElement('div');
  feed.className = 'flex-col gap-md mt-md';
  feed.style.display = 'flex';

  allLogs.slice(0, 8).forEach(({ orderId, orderNum, log }) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => navigate(`/order/${orderId}`));

    item.innerHTML = `
      <div class="timeline-dot"><span class="material-icons-round" style="font-size:12px;color:var(--text-muted)">radio_button_checked</span></div>
      <div class="timeline-content">
        <div class="timeline-text">${log.userName} ${log.action.toLowerCase().includes('created') ? 'created' : ''} <span style="color:var(--color-acid)">${orderNum}</span> — ${log.action}</div>
        <div class="timeline-time">${timeAgo(log.timestamp)}</div>
      </div>
    `;
    feed.appendChild(item);
  });

  if (allLogs.length === 0) {
    feed.innerHTML = `<div class="text-muted text-sm text-center" style="padding:var(--space-xl)">Brak aktywności</div>`;
  }

  screen.appendChild(feed);

  // ── Stats Summary ──
  const today = new Date().toISOString().split('T')[0];
  const completedTodayCount = allOrders.filter(o =>
    o.statusId === lastStageId &&
    o.updatedAt.startsWith(today)
  ).length;

  const systemStatus = document.createElement('div');
  systemStatus.className = 'card mt-xl';
  systemStatus.style.display = 'flex';
  systemStatus.style.alignItems = 'center';
  systemStatus.style.gap = 'var(--space-md)';
  systemStatus.innerHTML = `
    <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--color-acid-dim);color:var(--color-acid);display:flex;align-items:center;justify-content:center;">
      <span class="material-icons-round">bolt</span>
    </div>
    <div>
      <div style="font-family:var(--font-display);font-weight:600;font-size:14px;">Zamówienia wykonane dziś: ${completedTodayCount}</div>
      <div class="text-muted text-xs">System działa stabilnie. Dobra robota!</div>
    </div>
  `;
  screen.appendChild(systemStatus);

  return screen;
}
