// ═══════════════════════════════════════════════════════
//  OrderFlow — Order Detail Screen ("The Job Jacket")
// ═══════════════════════════════════════════════════════

import { getOrder, getStageColor, getStageName, getNextStage, advanceOrderStatus, toggleVariantComplete, addOrderLog, deleteOrder } from '../data/store';
import { navigate } from '../router';
import { timeAgo, formatDate, totalUnits, completionPercent, formatPriority } from '../utils';
import { showToast } from '../components/toast';
import { showModal, hideModal } from '../components/modal';

export async function renderOrderDetail(params: Record<string, string>): Promise<HTMLElement> {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.paddingBottom = 'calc(var(--nav-height) + 80px)';

  const order = await getOrder(params.id);
  if (!order) {
    screen.innerHTML = `<div class="empty-state"><span class="material-icons-round">search_off</span><p>Zamówienie nie znalezione</p></div>`;
    return screen;
  }

  const stageColor = await getStageColor(order.statusId);
  const stageName = await getStageName(order.statusId);
  const completion = completionPercent(order.variants);
  const units = totalUnits(order.variants);
  const nextStage = await getNextStage(order.statusId);

  // ── Back Button + Order Number ──
  const topBar = document.createElement('div');
  topBar.className = 'flex items-center gap-md mb-lg';
  topBar.innerHTML = `
    <button class="btn-icon" id="back-btn"><span class="material-icons-round">arrow_back</span></button>
    <div class="flex-1">
      <h2 style="font-size:20px;">${order.orderNumber}</h2>
    </div>
    <button class="btn-icon" id="delete-btn" style="border-color:var(--status-blocked)">
      <span class="material-icons-round" style="color:var(--status-blocked);font-size:18px">delete</span>
    </button>
  `;
  topBar.querySelector('#back-btn')!.addEventListener('click', () => history.back());
  topBar.querySelector('#delete-btn')!.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Usunąć zamówienie?</h3>
      <p class="text-muted text-sm" style="margin-bottom:var(--space-xl)">To na stałe usunie ${order.orderNumber}. Tej operacji nie można cofnąć.</p>
      <div class="flex gap-sm">
        <button class="btn btn-secondary flex-1" id="cancel-delete">Anuluj</button>
        <button class="btn btn-danger flex-1" id="confirm-delete">Usuń</button>
      </div>
    `;
    showModal(content);
    content.querySelector('#cancel-delete')!.addEventListener('click', hideModal);
    content.querySelector('#confirm-delete')!.addEventListener('click', async () => {
      await deleteOrder(order.id);
      hideModal();
      showToast(`Zamówienie ${order.orderNumber} usunięte`, 'error');
      navigate('/pipeline');
    });
  });
  screen.appendChild(topBar);

  // ── Status Hero ──
  const statusHero = document.createElement('div');
  statusHero.style.cssText = `
    padding: var(--space-md) var(--space-lg);
    background: ${stageColor}22;
    border: 1px solid ${stageColor}44;
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  statusHero.innerHTML = `
    <div>
      <div class="label" style="margin-bottom:2px;">Status</div>
      <div style="color:${stageColor};font-family:var(--font-display);font-weight:700;font-size:16px;text-transform:uppercase">${stageName}</div>
    </div>
    <div style="text-align:right;">
      <div class="label" style="margin-bottom:2px;">Ukończono</div>
      <div id="completion-perc" style="font-family:var(--font-display);font-weight:700;font-size:16px;">${completion}%</div>
    </div>
  `;
  screen.appendChild(statusHero);

  // ── Progress Bar ──
  const progressWrap = document.createElement('div');
  progressWrap.className = 'progress-bar mb-xl';
  progressWrap.innerHTML = `<div id="progress-fill" class="progress-fill" style="width:${completion}%"></div>`;
  screen.appendChild(progressWrap);

  // ── Client Info ──
  const clientBlock = document.createElement('div');
  clientBlock.className = 'card mb-lg';
  clientBlock.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom:8px;">
      <h3>${order.clientName}</h3>
      <span class="badge badge-priority-${order.priority.toLowerCase() === 'critical' || order.priority.toLowerCase() === 'high' ? 'high' : order.priority.toLowerCase() === 'medium' ? 'medium' : 'low'}">${formatPriority(order.priority)}</span>
    </div>
    <div class="text-muted text-sm" style="margin-bottom:4px;">
      <span class="material-icons-round" style="font-size:14px;vertical-align:middle;margin-right:4px;">location_on</span>
      ${order.clientAddress}
    </div>
    <div class="text-sm" style="${(function () { const d = new Date(order.deadline); const now = new Date(); return d < now ? 'color:var(--status-blocked)' : 'color:var(--color-acid)'; })()}">
      <span class="material-icons-round" style="font-size:14px;vertical-align:middle;margin-right:4px;">schedule</span>
      ${formatDate(order.deadline)} • ${units.toLocaleString()} sztuk łącznie
    </div>
    ${order.description ? `<div class="text-muted text-sm" style="margin-top:8px;border-top:var(--border-std);padding-top:8px;">${order.description}</div>` : ''}
  `;
  screen.appendChild(clientBlock);

  // ── Production Manifest ──
  const manifestHeader = document.createElement('div');
  manifestHeader.className = 'section-header';
  manifestHeader.innerHTML = `<h4>Manifest Produkcji</h4><span id="manifest-counter" class="text-xs text-muted">${order.variants.filter(v => v.completed).length}/${order.variants.length}</span>`;
  screen.appendChild(manifestHeader);

  const manifestList = document.createElement('div');
  manifestList.className = 'flex-col gap-sm mb-xl';
  manifestList.style.display = 'flex';

  order.variants.forEach(variant => {
    const row = document.createElement('div');
    row.className = 'card flex items-center gap-md';
    row.style.padding = 'var(--space-md) var(--space-lg)';

    row.innerHTML = `
      <label class="checkbox-custom" style="flex:1;min-width:0;">
        <input type="checkbox" data-variant-id="${variant.id}" ${variant.completed ? 'checked' : ''} />
        <span class="checkbox-mark"><span class="material-icons-round" style="font-size:16px;">${variant.completed ? 'check' : ''}</span></span>
        <div class="flex-1" style="min-width:0;">
          <div class="item-text ${variant.completed ? 'completed' : ''}" style="font-size:13px;">
            <span class="color-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${variant.colorHex};vertical-align:middle;margin-right:4px;"></span>
            ${variant.productName} – ${variant.color}
          </div>
          <div class="text-xs text-muted" style="margin-top:2px;">
            ${variant.quantity.toLocaleString()} szt. ${variant.engravingText ? `• "${variant.engravingText}"` : ''}
          </div>
          ${variant.notes ? `<div class="text-xs" style="margin-top:4px;color:var(--status-blocked);font-weight:600;"><span class="material-icons-round" style="font-size:12px;vertical-align:middle;margin-right:2px;">priority_high</span>UWAGI: ${variant.notes}</div>` : ''}
        </div>
        ${variant.fileData ? `
          <div style="margin-left:auto;text-align:right;">
             <a href="${variant.fileData}" download="${variant.fileName}" title="${variant.fileName}" style="display:block;width:64px;height:64px;padding:4px;border:1px solid var(--border-color);border-radius:8px;background:white;box-shadow:var(--shadow-sm)">
               ${variant.fileData.startsWith('data:image/')
          ? `<img src="${variant.fileData}" style="width:100%;height:100%;object-fit:contain" />`
          : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;"><span class="material-icons-round" style="font-size:32px;color:var(--text-muted)">description</span><span style="font-size:8px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;width:100%">PDF/SVG</span></div>`}
             </a>
          </div>
        ` : ''}
      </label>
    `;

    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const mark = row.querySelector('.checkbox-mark span') as HTMLElement;
    const itemText = row.querySelector('.item-text') as HTMLElement;

    checkbox.addEventListener('change', async () => {
      const isCompleted = checkbox.checked;

      // Optimistic Update
      variant.completed = isCompleted;
      mark.innerHTML = isCompleted ? 'check' : '';
      if (isCompleted) itemText.classList.add('completed');
      else itemText.classList.remove('completed');

      // Update counters and progress bar
      const allVariants = order.variants;
      const completedCount = allVariants.filter(v => v.completed).length;
      const totalCount = allVariants.length;
      const perc = completionPercent(allVariants);

      const counterEl = screen.querySelector('#manifest-counter');
      if (counterEl) counterEl.innerHTML = `${completedCount}/${totalCount}`;

      const percEl = screen.querySelector('#completion-perc');
      if (percEl) percEl.innerHTML = `${perc}%`;

      const fillEl = screen.querySelector('#progress-fill') as HTMLElement;
      if (fillEl) fillEl.style.width = `${perc}%`;

      // Background update
      try {
        await toggleVariantComplete(order.id, variant.id);
        showToast(
          isCompleted ? `Ukończono ${variant.quantity}x ${variant.productName}` : `Odznaczono ${variant.productName}`,
          'success'
        );
      } catch (err) {
        // Rollback on error
        variant.completed = !isCompleted;
        checkbox.checked = !isCompleted;
        mark.innerHTML = (!isCompleted) ? 'check' : '';
        if (!isCompleted) itemText.classList.add('completed');
        else itemText.classList.remove('completed');

        // Re-update counters (simplified rollback)
        const rollbackPerc = completionPercent(allVariants);
        if (counterEl) counterEl.innerHTML = `${allVariants.filter(v => v.completed).length}/${totalCount}`;
        if (percEl) percEl.innerHTML = `${rollbackPerc}%`;
        if (fillEl) fillEl.style.width = `${rollbackPerc}%`;

        showToast('Błąd podczas zapisywania zmian', 'error');
      }
    });

    manifestList.appendChild(row);
  });

  screen.appendChild(manifestList);

  // ── Variant Files Section ──
  const variantFiles = order.variants.filter(v => v.fileName && v.fileData);
  if (variantFiles.length > 0) {
    const filesHeader = document.createElement('div');
    filesHeader.className = 'section-header';
    filesHeader.innerHTML = `<h4>Wykaz plików do graweru</h4><span class="text-xs text-muted">${variantFiles.length} pliki</span>`;
    screen.appendChild(filesHeader);

    const filesContainer = document.createElement('div');
    filesContainer.className = 'flex-col gap-sm mb-xl';
    filesContainer.style.display = 'flex';

    variantFiles.forEach(v => {
      const fileItem = document.createElement('div');
      fileItem.className = 'card flex items-center gap-md';
      fileItem.style.padding = 'var(--space-md) var(--space-lg)';

      const isImage = v.fileData!.startsWith('data:image/');

      fileItem.innerHTML = `
        <div style="width:40px;height:40px;border-radius:4px;overflow:hidden;border:1px solid var(--border-color);background:white;flex-shrink:0">
          ${isImage
          ? `<img src="${v.fileData}" style="width:100%;height:100%;object-fit:contain" />`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--bg-secondary)"><span class="material-icons-round" style="font-size:20px;color:var(--text-muted)">description</span></div>`}
        </div>
        <div class="flex-1" style="min-width:0;">
          <div class="truncate" style="font-size:13px;font-weight:600;">${v.fileName}</div>
          <div class="text-xs text-muted">${v.productName} – ${v.color}</div>
        </div>
        <a href="${v.fileData}" download="${v.fileName}" class="btn-icon" style="width:32px;height:32px;text-decoration:none">
          <span class="material-icons-round" style="font-size:20px;color:var(--color-acid)">download</span>
        </a>
      `;
      filesContainer.appendChild(fileItem);
    });
    screen.appendChild(filesContainer);
  }

  // ── Activity Log ──
  const logHeader = document.createElement('div');
  logHeader.className = 'section-header';
  logHeader.innerHTML = `<h4>Dziennik aktywności</h4>`;
  screen.appendChild(logHeader);

  const timeline = document.createElement('div');
  timeline.className = 'mb-xl';

  const sortedLogs = [...order.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  sortedLogs.forEach(log => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot"><span class="material-icons-round" style="font-size:12px;color:var(--text-muted)">circle</span></div>
      <div class="timeline-content">
        <div class="timeline-text"><strong>${log.userName}</strong> ${log.action}</div>
        <div class="timeline-time">${timeAgo(log.timestamp)}</div>
      </div>
    `;
    timeline.appendChild(item);
  });

  screen.appendChild(timeline);

  // ── Sticky Action Bar ──
  const actionBar = document.createElement('div');
  actionBar.className = 'action-bar';

  // Flag button
  const flagBtn = document.createElement('button');
  flagBtn.className = 'btn btn-danger';
  flagBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px;">flag</span>';
  flagBtn.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Zgłoś problem</h3>
      <div class="input-group">
        <label>Rodzaj problemu</label>
        <select class="input" id="issue-type">
          <option value="Brak towaru">Brak towaru</option>
          <option value="Problem z jakością">Problem z jakością</option>
          <option value="Zmiana klienta">Zmiana klienta</option>
          <option value="Awaria sprzętu">Awaria sprzętu</option>
          <option value="Inne">Inne</option>
        </select>
      </div>
      <div class="input-group">
        <label>Notatka</label>
        <textarea class="input" id="issue-note" placeholder="Opisz problem..." rows="3"></textarea>
      </div>
      <button class="btn btn-danger btn-full" id="submit-flag">Zgłoś problem</button>
    `;
    showModal(content);
    content.querySelector('#submit-flag')!.addEventListener('click', async () => {
      const type = (content.querySelector('#issue-type') as HTMLSelectElement).value;
      const note = (content.querySelector('#issue-note') as HTMLTextAreaElement).value;
      await addOrderLog(order.id, `Zgłoszono problem: "${type}"${note ? ` — ${note}` : ''}`);
      hideModal();
      showToast(`Problem zgłoszony dla ${order.orderNumber}`, 'error');
      const newScreen = await renderOrderDetail(params);
      screen.replaceWith(newScreen);
    });
  });

  // Advance button
  const advanceBtn = document.createElement('button');
  advanceBtn.className = 'btn btn-primary flex-1';
  if (nextStage) {
    advanceBtn.innerHTML = `<span>Przenieś do: ${nextStage.name}</span><span class="material-icons-round" style="font-size:18px;">arrow_forward</span>`;
    advanceBtn.addEventListener('click', () => {
      const content = document.createElement('div');
      content.innerHTML = `
        <h3 style="margin-bottom:var(--space-lg)">Przenieść zamówienie?</h3>
        <p class="text-muted text-sm" style="margin-bottom:var(--space-xl)">Przenieść ${order.orderNumber} do etapu <strong style="color:${nextStage.color}">${nextStage.name}</strong>?</p>
        <div class="flex gap-sm">
          <button class="btn btn-secondary flex-1" id="cancel-advance">Anuluj</button>
          <button class="btn btn-primary flex-1" id="confirm-advance">Przenieś →</button>
        </div>
      `;
      showModal(content);
      content.querySelector('#cancel-advance')!.addEventListener('click', hideModal);
      content.querySelector('#confirm-advance')!.addEventListener('click', async () => {
        await advanceOrderStatus(order.id);
        hideModal();
        showToast(`${order.orderNumber} przeniesione do ${nextStage.name}`, 'success');
        const newScreen = await renderOrderDetail(params);
        screen.replaceWith(newScreen);
      });
    });
  } else {
    advanceBtn.innerHTML = `<span class="material-icons-round" style="font-size:18px;">check_circle</span><span>Ukończono</span>`;
    advanceBtn.disabled = true;
    advanceBtn.style.opacity = '0.5';
  }

  actionBar.appendChild(flagBtn);
  actionBar.appendChild(advanceBtn);
  screen.appendChild(actionBar);

  return screen;
}

