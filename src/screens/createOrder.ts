import { getTeam, getInventory, createOrder, uploadOrderFile } from '../data/store';
import { navigate } from '../router';
import { showToast } from '../components/toast';

interface VR {
  productId: string;
  productName: string;
  variantId: string;
  color: string;
  colorHex: string;
  quantity: number;
  engravingText: string;
  notes: string;
  fileName: string;
  fileData: string;
  file?: File; // Stores the local File object before upload
}

export async function renderCreateOrder(): Promise<HTMLElement> {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.paddingBottom = 'calc(var(--nav-height) + 40px)';
  const team = (await getTeam()).filter(t => t.active);
  const inventory = await getInventory();
  const rows: VR[] = [];

  screen.innerHTML = `
    <div class="flex items-center gap-md mb-xl">
      <button class="btn-icon" id="back-btn"><span class="material-icons-round">arrow_back</span></button>
      <h1 style="font-size:24px;">Nowe Zamówienie</h1>
    </div>
    <form id="order-form">
      <div class="input-group"><label>Nazwa klienta *</label><input type="text" class="input" id="f-client" placeholder="np. Cyberdyne Systems" required /></div>
      
      <div class="section-header"><h4>Warianty produktu</h4><span class="text-xs text-muted" id="v-count">0 sztuk</span></div>
      <div id="v-list" class="flex-col gap-md mb-lg" style="display:flex"></div>
      <button type="button" class="btn btn-secondary btn-full mb-lg" id="add-v-btn"><span class="material-icons-round" style="font-size:18px">add</span> Dodaj wariant</button>
      
      <div class="card mb-xl" style="text-align:center" id="total-box"><div class="label">Suma sztuk</div><div class="data-lg text-acid">0</div></div>

      <button type="button" class="btn btn-secondary btn-full mb-xl" id="toggle-extra-btn" style="border-style:dashed;color:var(--text-secondary)">
        <span class="material-icons-round">expand_more</span> Więcej opcji
      </button>

      <div id="extra-options" style="display:none;margin-bottom:var(--space-xl);border:1px dashed var(--border-color);padding:var(--space-lg);border-radius:var(--radius-sm)">
        <div class="input-group"><label>Adres klienta</label><input type="text" class="input" id="f-addr" placeholder="np. ul. Marszałkowska 1" /></div>
        <div class="input-group"><label>Opis</label><textarea class="input" id="f-desc" placeholder="Dodatkowe instrukcje..." rows="2"></textarea></div>
        <div class="flex gap-md">
          <div class="input-group flex-1"><label>Priorytet *</label>
            <select class="input" id="f-priority"><option value="LOW">Niski</option><option value="MEDIUM" selected>Średni</option><option value="HIGH">Wysoki</option><option value="CRITICAL">Krytyczny</option></select>
          </div>
          <div class="input-group flex-1"><label>Termin *</label><input type="date" class="input" id="f-deadline" required /></div>
        </div>
        <div class="input-group" style="margin-bottom:0"><label>Przypisz do</label>
          <select class="input" id="f-assign">${team.map(t => `<option value="${t.id}">${t.name} (${t.role})</option>`).join('')}</select>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-full" style="padding:var(--space-lg)" id="submit-btn"><span class="material-icons-round" style="font-size:20px">rocket_launch</span> Utwórz zamówienie</button>
    </form>
  `;

  screen.querySelector('#back-btn')!.addEventListener('click', () => history.back());
  screen.querySelector('#add-v-btn')!.addEventListener('click', addRow);
  screen.querySelector('#submit-btn')!.addEventListener('click', submit);

  const extraToggle = screen.querySelector('#toggle-extra-btn')!;
  const extraContent = screen.querySelector('#extra-options') as HTMLElement;
  extraToggle.addEventListener('click', () => {
    const isHidden = extraContent.style.display === 'none';
    extraContent.style.display = isHidden ? 'block' : 'none';
    extraToggle.innerHTML = isHidden
      ? '<span class="material-icons-round">expand_less</span> Ukryj dodatkowe opcje'
      : '<span class="material-icons-round">expand_more</span> Więcej opcji';
  });

  const dl = screen.querySelector('#f-deadline') as HTMLInputElement;
  const d = new Date(); d.setDate(d.getDate() + 1);
  dl.value = d.toISOString().split('T')[0];

  function addRow() {
    if (inventory.length === 0) {
      showToast('Brak produktów w magazynie', 'error');
      return;
    }
    const p = inventory[0];
    const v = p.variants[0];
    const newRow: VR = {
      productId: p.id,
      productName: p.name,
      variantId: v?.id || '',
      color: v?.color || 'Brak koloru',
      colorHex: v?.colorHex || '#999',
      quantity: 100,
      engravingText: '',
      notes: '',
      fileName: '',
      fileData: ''
    };
    rows.push(newRow);

    // Targeted insertion instead of full render
    const list = screen.querySelector('#v-list')!;
    const card = createCard(newRow, rows.length - 1);
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    list.appendChild(card);

    // Trigger animation
    requestAnimationFrame(() => {
      card.style.transition = 'all var(--transition-base)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });

    updateTotal();
    screen.querySelector('#v-count')!.textContent = `${rows.length} szt.`;
  }

  function createCard(r: VR, i: number) {
    const prod = inventory.find(p => p.id === r.productId);
    const vars = prod?.variants || [];
    const card = document.createElement('div');
    card.className = 'card';
    card.style.position = 'relative';
    card.style.marginBottom = 'var(--space-md)';
    card.innerHTML = `
    <button type="button" class="btn-icon rm" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border:none"><span class="material-icons-round" style="font-size:16px;color:var(--text-muted)">close</span></button>
    <div class="flex gap-md" style="margin-bottom:var(--space-md)">
      <div class="input-group flex-1" style="margin-bottom:0"><label>Model</label><select class="input p-sel">${inventory.map(p => `<option value="${p.id}" ${p.id === r.productId ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
      <div class="input-group flex-1" style="margin-bottom:0"><label>Kolor</label><select class="input v-sel">${vars.map(v => `<option value="${v.id}" ${v.id === r.variantId ? 'selected' : ''}>${v.color}</option>`).join('')}</select></div>
    </div>
    <div class="flex gap-md" style="margin-bottom:var(--space-md)">
      <div class="input-group flex-1" style="margin-bottom:0"><label>Ilość</label><input type="number" class="input q-in" min="1" value="${r.quantity}"/></div>
      <div class="input-group flex-1" style="margin-bottom:0"><label>Grawer</label><input type="text" class="input e-in" value="${r.engravingText}" placeholder="Tekst logo"/></div>
    </div>
    <div class="input-group" style="margin-bottom:var(--space-md)">
      <label>Uwagi do produktu</label>
      <input type="text" class="input n-in" value="${r.notes}" placeholder="np. grawer z dwóch stron, kolor specjalny..." style="border-color:var(--status-blocked)33" />
    </div>
    <div class="flex items-center gap-sm mt-md">
      <input type="file" class="f-in" accept="*/*" style="display:none" />
      <button type="button" class="btn btn-secondary btn-sm f-btn" style="height:28px;font-size:11px;padding:0 12px;display:flex;align-items:center;gap:4px">
        <span class="material-icons-round" style="font-size:14px">attach_file</span> 
        <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fileName || 'Załącz logo'}</span>
      </button>
      <div class="preview-box">
          ${r.fileData ? `
            <div style="width:28px;height:28px;border-radius:4px;overflow:hidden;border:1px solid var(--color-acid);background:white">
              ${r.fileData.startsWith('data:image/')
          ? `<img src="${r.fileData}" style="width:100%;height:100%;object-fit:contain" />`
          : `<span class="material-icons-round text-acid" style="font-size:18px;display:block;text-align:center;line-height:28px">check_circle</span>`}
            </div>
          ` : ''}
      </div>
    </div>`;

    card.querySelector('.rm')!.addEventListener('click', () => {
      card.style.transition = 'all var(--transition-base)';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        rows.splice(i, 1);
        render();
      }, 200);
    });

    card.querySelector('.p-sel')!.addEventListener('change', (e) => {
      const pid = (e.target as HTMLSelectElement).value;
      const np = inventory.find(p => p.id === pid)!;
      r.productId = pid; r.productName = np.name;
      r.variantId = np.variants[0]?.id || ''; r.color = np.variants[0]?.color || ''; r.colorHex = np.variants[0]?.colorHex || '#999';
      render(); // Still need render for color dropdown update
    });

    card.querySelector('.v-sel')!.addEventListener('change', (e) => {
      const vid = (e.target as HTMLSelectElement).value;
      const nv = vars.find(v => v.id === vid);
      r.variantId = vid; r.color = nv?.color || ''; r.colorHex = nv?.colorHex || '#999';
    });

    card.querySelector('.q-in')!.addEventListener('input', (e) => { r.quantity = parseInt((e.target as HTMLInputElement).value) || 0; updateTotal(); });
    card.querySelector('.e-in')!.addEventListener('input', (e) => { r.engravingText = (e.target as HTMLInputElement).value; });
    card.querySelector('.n-in')!.addEventListener('input', (e) => { r.notes = (e.target as HTMLInputElement).value; });

    const fIn = card.querySelector('.f-in') as HTMLInputElement;
    const fBtn = card.querySelector('.f-btn') as HTMLElement;
    const previewBox = card.querySelector('.preview-box') as HTMLElement;

    fBtn.addEventListener('click', () => fIn.click());
    fIn.addEventListener('change', async () => {
      const file = fIn.files?.[0];
      if (!file) return;

      r.file = file;
      r.fileName = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        r.fileData = data; // Preview only
        fBtn.querySelector('span:last-child')!.textContent = file.name;
        previewBox.innerHTML = `
                    <div style="width:28px;height:28px;border-radius:4px;overflow:hidden;border:1px solid var(--color-acid);background:white">
                      ${data.startsWith('data:image/')
            ? `<img src="${data}" style="width:100%;height:100%;object-fit:contain" />`
            : `<span class="material-icons-round text-acid" style="font-size:18px;display:block;text-align:center;line-height:28px">check_circle</span>`}
                    </div>
                `;
      };
      reader.readAsDataURL(file);
    });

    return card;
  }

  function render() {
    const list = screen.querySelector('#v-list')!;
    list.innerHTML = '';
    rows.forEach((r, i) => {
      list.appendChild(createCard(r, i));
    });
    updateTotal();
    screen.querySelector('#v-count')!.textContent = `${rows.length} szt.`;
  }

  function updateTotal() {
    const t = rows.reduce((s, r) => s + (r.quantity || 0), 0);
    const totalBox = screen.querySelector('#total-box');
    if (totalBox) totalBox.innerHTML = `<div class="label">Suma sztuk</div><div class="data-lg text-acid">${t.toLocaleString()}</div>`;
  }

  async function submit() {
    const cn = (screen.querySelector('#f-client') as HTMLInputElement).value.trim();
    const addr = (screen.querySelector('#f-addr') as HTMLInputElement).value.trim();
    const desc = (screen.querySelector('#f-desc') as HTMLTextAreaElement).value.trim();
    const pri = (screen.querySelector('#f-priority') as HTMLSelectElement).value as any;
    const dead = (screen.querySelector('#f-deadline') as HTMLInputElement).value;
    const assign = (screen.querySelector('#f-assign') as HTMLSelectElement).value;
    if (!cn) { showToast('Nazwa klienta jest wymagana', 'error'); return; }
    if (!dead) { showToast('Termin jest wymagany', 'error'); return; }
    if (rows.length === 0) { showToast('Dodaj przynajmniej jeden wariant', 'error'); return; }

    try {
      showToast('Zapisywanie zamówienia...', 'info');

      // Upload files first
      const variantsToSubmit = await Promise.all(rows.map(async (row) => {
        let finalFileData = row.fileData;

        if (row.file) {
          try {
            finalFileData = await uploadOrderFile(row.file);
          } catch (e) {
            console.error('File upload error:', e);
            showToast(`Błąd wysyłania pliku: ${row.fileName}`, 'error');
            // Fallback to base64 if upload fails, or handle as error
            // For now we'll continue with base64 if upload fails to be safe
          }
        }

        return {
          ...row,
          fileData: finalFileData
        };
      }));

      const ord = await createOrder({
        clientName: cn,
        clientAddress: addr,
        description: desc,
        priority: pri,
        deadline: new Date(dead).toISOString(),
        assignedTo: assign,
        variants: variantsToSubmit
      });

      showToast(`Utworzono zamówienie ${ord.orderNumber}! 🚀`, 'success');
      navigate('/pipeline');
    } catch (error) {
      console.error(error);
      showToast('Błąd podczas tworzenia zamówienia', 'error');
    }
  }

  return screen;
}
