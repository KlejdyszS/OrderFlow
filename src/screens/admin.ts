// ═══════════════════════════════════════════════════════
//  OrderFlow — Admin Hub Screen
// ═══════════════════════════════════════════════════════

import {
  getTeam, addTeamMember, updateTeamMember, removeTeamMember,
  getInventory, addInventoryItem, removeInventoryItem, addInventoryVariant, removeInventoryVariant, updateInventoryVariant, reorderInventoryVariants,
  getStages, addStage, updateStage, removeStage,
  getCustomFields, addCustomField, removeCustomField,
  getCurrentUser, setCurrentUser,
  importInventory
} from '../data/store';
import type { PipelineStage } from '../data/seed';
import { showToast } from '../components/toast';
import { showModal, hideModal } from '../components/modal';

export async function renderAdmin(): Promise<HTMLElement> {
  const screen = document.createElement('div');
  screen.className = 'screen';

  // ── Header ──
  screen.innerHTML = `<h1 style="margin-bottom:var(--space-xl);">Panel Administratora</h1>`;

  // ═══ ACTIVE USER ═══
  await renderUserContextSection(screen);

  // ═══ TEAM ROSTER ═══
  await renderTeamSection(screen);

  // ═══ INVENTORY ═══
  await renderInventorySection(screen);

  // ═══ PIPELINE STAGES ═══
  await renderStagesSection(screen);

  // ═══ CUSTOM FIELDS ═══
  await renderFieldsSection(screen);

  // ═══ ACTIONS ═══
  await renderActionsSection(screen);

  return screen;
}

async function renderUserContextSection(screen: HTMLElement) {
  const team = await getTeam();
  const currentUser = await getCurrentUser();
  const section = document.createElement('div');
  section.className = 'mb-xl';
  section.innerHTML = `
    <div class="section-header"><h4>Aktywny Użytkownik</h4></div>
    <div class="card flex items-center gap-md" style="padding:var(--space-md) var(--space-lg);background:var(--bg-input)">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--color-acid);color:#111;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">${currentUser?.avatar || '?'}</div>
      <div class="flex-1">
        <div class="text-xs text-muted mb-xs">Pracujesz jako:</div>
        <select class="input" id="active-user-select" style="border:none;background:transparent;padding:0;font-weight:600;font-size:15px;color:var(--text-main)">
          ${team.map(t => `<option value="${t.id}" ${t.id === currentUser?.id ? 'selected' : ''}>${t.name} (${t.role})</option>`).join('')}
        </select>
      </div>
    </div>
  `;
  const select = section.querySelector('#active-user-select') as HTMLSelectElement;
  select.addEventListener('change', async () => {
    setCurrentUser(select.value);
    showToast('Zmieniono aktywnego użytkownika', 'success');
    await refreshAdmin(screen);
  });
  screen.appendChild(section);
}

async function renderTeamSection(screen: HTMLElement) {
  const team = await getTeam();
  const section = document.createElement('div');
  section.className = 'mb-xl';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<h4>Zespół (${team.filter(t => t.active).length.toString().padStart(2, '0')})</h4>`;
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-icon';
  addBtn.style.cssText = 'width:28px;height:28px;';
  addBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">person_add</span>';
  addBtn.addEventListener('click', () => showAddTeamModal(screen));
  header.appendChild(addBtn);
  section.appendChild(header);

  team.forEach(member => {
    const row = document.createElement('div');
    row.className = 'card flex items-center gap-md mb-sm';
    row.style.padding = 'var(--space-md) var(--space-lg)';
    row.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:${member.active ? 'var(--color-acid)' : 'var(--bg-input)'};color:${member.active ? '#111' : 'var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:var(--font-display)">${member.avatar}</div>
      <div class="flex-1" style="min-width:0">
        <div class="truncate" style="font-size:13px;font-weight:600;${!member.active ? 'opacity:0.5' : ''}">${member.name}</div>
        <div class="text-xs text-muted truncate">${member.email}</div>
      </div>
      <span class="badge" style="font-size:9px;">${member.role}</span>
    `;
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => showEditTeamModal(member, screen));
    section.appendChild(row);
  });

  screen.appendChild(section);
}

function showAddTeamModal(screen: HTMLElement) {
  const content = document.createElement('div');
  content.innerHTML = `
    <h3 style="margin-bottom:var(--space-lg)">Dodaj członka zespołu</h3>
    <div class="input-group"><label>Imię i nazwisko</label><input type="text" class="input" id="tm-name" placeholder="np. Jan Kowalski" /></div>
    <div class="input-group"><label>Email</label><input type="email" class="input" id="tm-email" placeholder="email@firma.pl" /></div>
    <div class="input-group"><label>Rola</label>
      <select class="input" id="tm-role"><option value="Administrator">Administrator</option><option value="Produkcja">Produkcja</option><option value="Sprzedaż">Sprzedaż</option></select>
    </div>
    <button class="btn btn-primary btn-full" id="tm-submit">Dodaj członka</button>
  `;
  showModal(content);
  content.querySelector('#tm-submit')!.addEventListener('click', async () => {
    const name = (content.querySelector('#tm-name') as HTMLInputElement).value.trim();
    const email = (content.querySelector('#tm-email') as HTMLInputElement).value.trim();
    const role = (content.querySelector('#tm-role') as HTMLSelectElement).value as any;

    if (!name) { showToast('Imię jest wymagane', 'error'); return; }
    if (!email) { showToast('Email jest wymagany', 'error'); return; }

    try {
      await addTeamMember({ name, email, role, active: true });
      hideModal();
      showToast(`Członek ${name} dodany`, 'success');
      await refreshAdmin(screen);
    } catch (error: any) {
      console.error(error);
      if (error.code === '23505') {
        showToast('Ten adres email jest już zajęty', 'error');
      } else {
        showToast('Błąd podczas dodawania członka', 'error');
      }
    }
  });
}

function showEditTeamModal(member: Awaited<ReturnType<typeof getTeam>>[0], screen: HTMLElement) {
  const content = document.createElement('div');
  content.innerHTML = `
    <h3 style="margin-bottom:var(--space-lg)">Edytuj: ${member.name}</h3>
    <div class="input-group"><label>Role</label>
      <select class="input" id="tm-role"><option value="Administrator" ${member.role === 'Administrator' ? 'selected' : ''}>Administrator</option><option value="Produkcja" ${member.role === 'Produkcja' ? 'selected' : ''}>Produkcja</option><option value="Sprzedaż" ${member.role === 'Sprzedaż' ? 'selected' : ''}>Sprzedaż</option></select>
    </div>
    <div class="input-group"><label>Status</label>
      <select class="input" id="tm-active"><option value="true" ${member.active ? 'selected' : ''}>Aktywny</option><option value="false" ${!member.active ? 'selected' : ''}>Nieaktywny</option></select>
    </div>
    <div class="flex gap-sm">
      <button class="btn btn-danger flex-1" id="tm-delete">Usuń</button>
      <button class="btn btn-primary flex-1" id="tm-save">Zapisz</button>
    </div>
  `;
  showModal(content);
  content.querySelector('#tm-save')!.addEventListener('click', async () => {
    try {
      await updateTeamMember(member.id, {
        role: (content.querySelector('#tm-role') as HTMLSelectElement).value as any,
        active: (content.querySelector('#tm-active') as HTMLSelectElement).value === 'true',
      });
      hideModal(); showToast('Zaktualizowano', 'success'); await refreshAdmin(screen);
    } catch (error) {
      console.error(error);
      showToast('Błąd podczas aktualizacji', 'error');
    }
  });
  content.querySelector('#tm-delete')!.addEventListener('click', async () => {
    await removeTeamMember(member.id);
    hideModal(); showToast(`${member.name} usunięty`, 'info'); await refreshAdmin(screen);
  });
}

async function renderInventorySection(screen: HTMLElement) {
  const inventory = await getInventory();
  const section = document.createElement('div');
  section.className = 'mb-xl';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<h4>Produkty i zapasy</h4>`;

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-icon';
  addBtn.style.cssText = 'width:28px;height:28px;';
  addBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">add_circle</span>';
  addBtn.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Dodaj produkt</h3>
      <div class="input-group"><label>Nazwa produktu</label><input type="text" class="input" id="inv-name" placeholder="np. PEN PRO" /></div>
      <button class="btn btn-primary btn-full" id="inv-submit">Dodaj</button>
    `;
    showModal(content);
    content.querySelector('#inv-submit')!.addEventListener('click', async () => {
      const name = (content.querySelector('#inv-name') as HTMLInputElement).value.trim();
      if (!name) { showToast('Nazwa jest wymagana', 'error'); return; }
      await addInventoryItem(name);
      hideModal(); showToast(`${name} dodany`, 'success'); await refreshAdmin(screen);
    });
  });

  const importBtn = document.createElement('button');
  importBtn.className = 'btn-icon';
  importBtn.style.cssText = 'width:28px;height:28px;margin-left:var(--space-sm);';
  importBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">file_upload</span>';
  importBtn.title = 'Importuj modele (JSON)';
  importBtn.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Importuj modele i kolory</h3>
      <p class="text-xs text-muted mb-md">Wklej strukturę JSON poniżej:</p>
      <textarea class="input" id="import-json" rows="10" placeholder='[{"name": "Produkt", "variants": [...]}]' style="font-family:var(--font-mono);font-size:11px"></textarea>
      <button class="btn btn-primary btn-full mt-lg" id="import-confirm">Importuj dane</button>
    `;
    showModal(content);
    content.querySelector('#import-confirm')!.addEventListener('click', async () => {
      const json = (content.querySelector('#import-json') as HTMLTextAreaElement).value.trim();
      if (!json) return;
      try {
        const data = JSON.parse(json);
        await importInventory(data);
        hideModal(); showToast('Dane zaimportowane', 'success'); await refreshAdmin(screen);
      } catch (err) {
        showToast('Błąd formatu JSON', 'error');
      }
    });
  });

  header.appendChild(addBtn);
  header.appendChild(importBtn);
  section.appendChild(header);

  inventory.forEach(item => {
    const row = document.createElement('div');
    row.className = 'card flex items-center justify-between mb-sm';
    row.style.padding = 'var(--space-md) var(--space-lg)';
    row.style.cursor = 'pointer';
    row.innerHTML = `
      <div class="flex-1">
        <div style="font-size:14px;font-weight:600;font-family:var(--font-display)">${item.name}</div>
        <div class="text-xs text-muted">${item.variants.length} wariantów</div>
      </div>
      <div class="flex gap-sm">
        <button class="btn-icon manage-v" style="width:28px;height:28px;border-color:var(--color-acid)"><span class="material-icons-round" style="font-size:16px;color:var(--color-acid)">palette</span></button>
        <button class="btn-icon del-item" style="width:28px;height:28px;border-color:var(--status-blocked)"><span class="material-icons-round" style="font-size:16px;color:var(--status-blocked)">delete</span></button>
      </div>
    `;
    row.querySelector('.manage-v')!.addEventListener('click', (e) => {
      e.stopPropagation();
      showProductVariantsModal(item, screen);
    });
    row.addEventListener('click', () => showProductVariantsModal(item, screen));
    row.querySelector('.del-item')!.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeInventoryItem(item.id);
      showToast(`${item.name} usunięty`, 'info'); await refreshAdmin(screen);
    });
    section.appendChild(row);
  });

  screen.appendChild(section);
}

function showProductVariantsModal(item: Awaited<ReturnType<typeof getInventory>>[0], screen: HTMLElement) {
  // Make a mutable copy of variants for reordering
  const variants = [...item.variants];

  const content = document.createElement('div');
  content.style.maxWidth = '440px';

  function renderVariantList() {
    const vList = content.querySelector('#v-list') as HTMLElement;
    if (!vList) return;
    vList.innerHTML = '';

    if (variants.length === 0) {
      vList.innerHTML = '<div class="text-center text-muted text-sm" style="padding:var(--space-lg)">Brak wariantów</div>';
      return;
    }

    variants.forEach((v, idx) => {
      const row = document.createElement('div');
      row.className = 'card';
      row.style.cssText = 'padding:var(--space-sm) var(--space-md);background:var(--bg-input);margin-bottom:var(--space-sm);';
      row.innerHTML = `
        <div class="flex items-center gap-sm" style="margin-bottom:var(--space-sm)">
          <input type="color" class="ev-hex" value="${v.colorHex}" style="width:28px;height:28px;border:none;padding:0;cursor:pointer;border-radius:50%;flex-shrink:0" />
          <input type="text" class="input ev-color" value="${v.color}" placeholder="Nazwa koloru" style="flex:1;font-size:12px;padding:4px 8px;height:28px" />
          <div class="flex gap-xs" style="flex-shrink:0">
            <button class="btn-icon mv-up" style="width:24px;height:24px;border:none;${idx === 0 ? 'opacity:0.2;pointer-events:none' : ''}" title="W górę"><span class="material-icons-round" style="font-size:16px">arrow_upward</span></button>
            <button class="btn-icon mv-down" style="width:24px;height:24px;border:none;${idx === variants.length - 1 ? 'opacity:0.2;pointer-events:none' : ''}" title="W dół"><span class="material-icons-round" style="font-size:16px">arrow_downward</span></button>
            <button class="btn-icon del-v" style="width:24px;height:24px;border:none" title="Usuń"><span class="material-icons-round" style="font-size:16px;color:var(--status-blocked)">close</span></button>
          </div>
        </div>
        <div class="flex gap-sm">
          <input type="text" class="input ev-sku" value="${v.sku || ''}" placeholder="SKU" style="flex:1;font-size:11px;padding:4px 8px;height:26px" />
          <input type="text" class="input ev-tip" value="${v.tipSize || ''}" placeholder="Rozmiar" style="flex:1;font-size:11px;padding:4px 8px;height:26px" />
        </div>
      `;

      // Inline edit listeners — update the mutable array
      row.querySelector('.ev-color')!.addEventListener('input', (e) => { v.color = (e.target as HTMLInputElement).value; });
      row.querySelector('.ev-hex')!.addEventListener('input', (e) => { v.colorHex = (e.target as HTMLInputElement).value; });
      row.querySelector('.ev-sku')!.addEventListener('input', (e) => { v.sku = (e.target as HTMLInputElement).value; });
      row.querySelector('.ev-tip')!.addEventListener('input', (e) => { v.tipSize = (e.target as HTMLInputElement).value; });

      // Move up
      row.querySelector('.mv-up')!.addEventListener('click', () => {
        if (idx === 0) return;
        [variants[idx - 1], variants[idx]] = [variants[idx], variants[idx - 1]];
        renderVariantList();
      });

      // Move down
      row.querySelector('.mv-down')!.addEventListener('click', () => {
        if (idx === variants.length - 1) return;
        [variants[idx], variants[idx + 1]] = [variants[idx + 1], variants[idx]];
        renderVariantList();
      });

      // Delete
      row.querySelector('.del-v')!.addEventListener('click', async () => {
        try {
          await removeInventoryVariant(v.id);
          variants.splice(idx, 1);
          renderVariantList();
          showToast('Wariant usunięty', 'info');
        } catch (e) {
          console.error(e);
          showToast('Błąd usuwania wariantu', 'error');
        }
      });

      vList.appendChild(row);
    });
  }

  content.innerHTML = `
    <h3 style="margin-bottom:var(--space-md)">Warianty: ${item.name}</h3>
    <div id="v-list" style="max-height:350px;overflow-y:auto;padding-right:4px;margin-bottom:var(--space-md)"></div>
    <button class="btn btn-primary btn-full mb-lg" id="save-variants"><span class="material-icons-round" style="font-size:16px">save</span> Zapisz zmiany</button>
    <div class="divider"></div>
    <h4 style="margin-bottom:var(--space-sm)">Dodaj nowy wariant</h4>
    <div class="grid col-2 gap-sm mb-md">
      <div class="input-group" style="margin-bottom:0"><label>Nazwa koloru</label><input type="text" class="input" id="nv-name" placeholder="np. Srebrny" /></div>
      <div class="input-group" style="margin-bottom:0"><label>Kolor HEX</label><input type="color" class="input" id="nv-hex" value="#3B82F6" style="height:40px;padding:4px;" /></div>
    </div>
    <div class="grid col-2 gap-sm mb-lg">
      <div class="input-group" style="margin-bottom:0"><label>SKU</label><input type="text" class="input" id="nv-sku" placeholder="PRO-SLV" /></div>
      <div class="input-group" style="margin-bottom:0"><label>Rozmiar/Tip</label><input type="text" class="input" id="nv-tip" placeholder="0.7mm" /></div>
    </div>
    <button class="btn btn-secondary btn-full" id="nv-add"><span class="material-icons-round" style="font-size:16px">add</span> Dodaj wariant</button>
  `;

  showModal(content);
  renderVariantList();

  // Save all edits + reorder
  content.querySelector('#save-variants')!.addEventListener('click', async () => {
    try {
      // Save each variant's field edits + sort order
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        await updateInventoryVariant(v.id, { color: v.color, colorHex: v.colorHex, sku: v.sku, tipSize: v.tipSize });
        await reorderInventoryVariants([{ id: v.id, sortOrder: i }]);
      }
      showToast('Warianty zapisane', 'success');
      hideModal();
      await refreshAdmin(screen);
    } catch (e) {
      console.error(e);
      showToast('Błąd zapisywania wariantów', 'error');
    }
  });

  // Add new variant
  content.querySelector('#nv-add')!.addEventListener('click', async () => {
    const color = (content.querySelector('#nv-name') as HTMLInputElement).value.trim();
    const colorHex = (content.querySelector('#nv-hex') as HTMLInputElement).value;
    const sku = (content.querySelector('#nv-sku') as HTMLInputElement).value.trim();
    const tipSize = (content.querySelector('#nv-tip') as HTMLInputElement).value.trim();

    if (!color) { showToast('Nazwa koloru jest wymagana', 'error'); return; }

    try {
      const newVariant = await addInventoryVariant(item.id, { color, colorHex, sku, tipSize });
      variants.push(newVariant);
      renderVariantList();
      // Clear inputs
      (content.querySelector('#nv-name') as HTMLInputElement).value = '';
      (content.querySelector('#nv-sku') as HTMLInputElement).value = '';
      (content.querySelector('#nv-tip') as HTMLInputElement).value = '';
      showToast('Wariant dodany', 'success');
    } catch (e) {
      console.error(e);
      showToast('Błąd dodawania wariantu', 'error');
    }
  });
}

async function renderStagesSection(screen: HTMLElement) {
  const stages = await getStages();
  const section = document.createElement('div');
  section.className = 'mb-xl';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<h4>Etapy produkcji</h4>`;
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-icon';
  addBtn.style.cssText = 'width:28px;height:28px;';
  addBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">add_circle</span>';
  addBtn.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Dodaj etap</h3>
      <div class="input-group"><label>Nazwa</label><input type="text" class="input" id="st-name" placeholder="np. Kontrola jakości" /></div>
      <div class="input-group"><label>Kolor</label><input type="color" class="input" id="st-color" value="#3B82F6" style="height:40px;padding:4px;" /></div>
      <button class="btn btn-primary btn-full" id="st-submit">Dodaj etap</button>
    `;
    showModal(content);
    content.querySelector('#st-submit')!.addEventListener('click', async () => {
      const name = (content.querySelector('#st-name') as HTMLInputElement).value.trim();
      const color = (content.querySelector('#st-color') as HTMLInputElement).value;
      if (!name) { showToast('Nazwa wymagana', 'error'); return; }
      await addStage(name, color);
      hideModal(); showToast(`Etap "${name}" dodany`, 'success'); await refreshAdmin(screen);
    });
  });
  header.appendChild(addBtn);
  section.appendChild(header);

  stages.forEach(stage => {
    const row = document.createElement('div');
    row.className = 'sortable-item mb-sm';
    row.innerHTML = `
      <span class="material-icons-round drag-handle" style="font-size:18px;">drag_indicator</span>
      <span style="width:12px;height:12px;border-radius:50%;background:${stage.color};flex-shrink:0;"></span>
      <span class="flex-1" style="font-size:13px;">${stage.name}</span>
      <button class="btn-icon edit-stage" style="width:24px;height:24px;border:none;"><span class="material-icons-round" style="font-size:16px;color:var(--text-muted)">edit</span></button>
      <button class="btn-icon del-stage" style="width:24px;height:24px;border:none;"><span class="material-icons-round" style="font-size:16px;color:var(--status-blocked)">close</span></button>
    `;
    row.querySelector('.edit-stage')!.addEventListener('click', () => showEditStageModal(stage, screen));
    row.querySelector('.del-stage')!.addEventListener('click', async () => {
      await removeStage(stage.id);
      showToast(`Etap usunięty`, 'info'); await refreshAdmin(screen);
    });
    section.appendChild(row);
  });

  screen.appendChild(section);
}

async function renderFieldsSection(screen: HTMLElement) {
  const fields = await getCustomFields();
  const section = document.createElement('div');
  section.className = 'mb-xl';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<h4>Dodatkowe pola</h4>`;
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-icon';
  addBtn.style.cssText = 'width:28px;height:28px;';
  addBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">add_circle</span>';
  addBtn.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Dodaj pole</h3>
      <div class="input-group"><label>Nazwa pola</label><input type="text" class="input" id="cf-name" /></div>
      <div class="input-group"><label>Typ</label>
        <select class="input" id="cf-type"><option value="text">Tekst</option><option value="number">Liczba</option><option value="select">Lista rozwijana</option><option value="file">Plik</option><option value="date">Data</option><option value="textarea">Pole tekstowe</option></select>
      </div>
      <button class="btn btn-primary btn-full" id="cf-submit">Dodaj pole</button>
    `;
    showModal(content);
    content.querySelector('#cf-submit')!.addEventListener('click', async () => {
      const name = (content.querySelector('#cf-name') as HTMLInputElement).value.trim();
      const type = (content.querySelector('#cf-type') as HTMLSelectElement).value as any;
      if (!name) { showToast('Nazwa wymagana', 'error'); return; }
      await addCustomField({ name, type, required: false });
      hideModal(); showToast(`Pole "${name}" dodane`, 'success'); await refreshAdmin(screen);
    });
  });
  header.appendChild(addBtn);
  section.appendChild(header);

  fields.forEach(field => {
    const row = document.createElement('div');
    row.className = 'card flex items-center justify-between mb-sm';
    row.style.padding = 'var(--space-md) var(--space-lg)';
    row.innerHTML = `
      <div class="flex items-center gap-md">
        <span class="material-icons-round" style="font-size:18px;color:var(--text-muted)">${field.type === 'file' ? 'attach_file' : field.type === 'select' ? 'list' : field.type === 'date' ? 'calendar_today' : 'text_fields'}</span>
        <div><div style="font-size:13px;">${field.name}</div><div class="text-xs text-muted">${field.type}</div></div>
      </div>
      <button class="btn-icon del-field" style="width:24px;height:24px;border:none;"><span class="material-icons-round" style="font-size:16px;color:var(--status-blocked)">close</span></button>
    `;
    row.querySelector('.del-field')!.addEventListener('click', async () => {
      await removeCustomField(field.id);
      showToast('Pole usunięte', 'info'); await refreshAdmin(screen);
    });
    section.appendChild(row);
  });

  screen.appendChild(section);
}

async function renderActionsSection(screen: HTMLElement) {
  const section = document.createElement('div');
  section.className = 'mb-xl';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<h4>Ustawienia aplikacji</h4>`;
  section.appendChild(header);

  const themeCard = document.createElement('div');
  themeCard.className = 'card flex items-center justify-between';
  themeCard.style.padding = 'var(--space-md) var(--space-lg)';

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  themeCard.innerHTML = `
    <div class="flex items-center gap-md">
      <span class="material-icons-round" style="color:var(--text-muted)">contrast</span>
      <div>
        <div style="font-size:13px;">Tryb kolorów</div>
        <div class="text-xs text-muted">Zmień wygląd aplikacji</div>
      </div>
    </div>
    <button class="btn btn-secondary" id="theme-toggle" style="min-width:100px;">
      ${currentTheme === 'light' ? 'Tryb Ciemny' : 'Tryb Jasny'}
    </button>
  `;

  themeCard.querySelector('#theme-toggle')!.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = active === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('orderflow_theme', next);

    // Refresh UI button
    const btn = themeCard.querySelector('#theme-toggle')!;
    btn.textContent = next === 'light' ? 'Tryb Ciemny' : 'Tryb Jasny';
    showToast(`Tryb ${next === 'light' ? 'jasny' : 'ciemny'} aktywowany`, 'info');
  });

  section.appendChild(themeCard);

  // ── Data and Export Section ──
  const exportHeader = document.createElement('div');
  exportHeader.className = 'section-header';
  exportHeader.innerHTML = `<h4>Dane i Eksport</h4>`;
  section.appendChild(exportHeader);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary btn-full mb-md';
  exportBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">download</span> Eksportuj zamówienia (CSV)';
  exportBtn.addEventListener('click', async () => {
    // Note: These functions like exportOrdersCSV need to be imported or available
    // Assuming they are available in the scope or imported at the top
    const { exportOrdersCSV } = await import('../data/store');
    const csv = await exportOrdersCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'orderflow_export.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV wyeksportowany', 'success');
  });
  section.appendChild(exportBtn);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-danger btn-full';
  resetBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px">restart_alt</span> Resetuj do danych demo';
  resetBtn.addEventListener('click', () => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Resetować wszystkie dane?</h3>
      <p class="text-muted text-sm mb-xl">To przywróci domyślne dane demonstracyjne. Wszystkie zmiany zostaną utracone.</p>
      <div class="flex gap-sm">
        <button class="btn btn-secondary flex-1" id="cancel-reset">Anuluj</button>
        <button class="btn btn-danger flex-1" id="confirm-reset">Resetuj</button>
      </div>
    `;
    showModal(content);
    content.querySelector('#cancel-reset')!.addEventListener('click', hideModal);
    content.querySelector('#confirm-reset')!.addEventListener('click', async () => {
      const { resetData } = await import('../data/store');
      await resetData(); hideModal();
      showToast('Dane zresetowane', 'success'); await refreshAdmin(screen);
    });
  });
  section.appendChild(resetBtn);

  // Timestamp
  const ts = document.createElement('div');
  ts.className = 'text-xs text-muted text-center mt-lg';
  ts.textContent = `Ostatnia kopia: ${new Date().toLocaleString('pl-PL')}`;
  section.appendChild(ts);

  screen.appendChild(section);
}

function showEditStageModal(stage: PipelineStage, screen: HTMLElement) {
  const content = document.createElement('div');
  content.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Edytuj etap: ${stage.name}</h3>
      <div class="input-group"><label>Nazwa etapu</label><input type="text" class="input" id="st-name" value="${stage.name}" /></div>
      <div class="input-group"><label>Kolor</label><input type="color" class="input" id="st-color" value="${stage.color}" style="height:40px;padding:4px;" /></div>
      <button class="btn btn-primary btn-full" id="st-save">Zapisz zmiany</button>
    `;
  showModal(content);
  content.querySelector('#st-save')!.addEventListener('click', async () => {
    const name = (content.querySelector('#st-name') as HTMLInputElement).value.trim();
    const color = (content.querySelector('#st-color') as HTMLInputElement).value;
    if (!name) { showToast('Nazwa jest wymagana', 'error'); return; }
    try {
      await updateStage(stage.id, { name, color });
      hideModal(); showToast('Zapisano zmiany', 'success'); await refreshAdmin(screen);
    } catch (e) {
      console.error(e);
      showToast('Błąd zapisywania etapu', 'error');
    }
  });
}

async function refreshAdmin(screen: HTMLElement) {
  const newScreen = await renderAdmin();
  screen.replaceWith(newScreen);
}
