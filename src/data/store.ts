// ═══════════════════════════════════════════════════════
//  OrderFlow — Data Store (Supabase-backed)
// ═══════════════════════════════════════════════════════

import { supabase } from '../supabase';
import type { Order, PipelineStage, TeamMember, InventoryItem, CustomField, OrderVariant, OrderLog, InventoryVariant } from './seed';

// ── Init (No longer needed to load everything upfront, but can be used for session check) ──
export async function initStore(): Promise<void> {
    // We could check the session here if we had auth
}

// ── Mappers (Snake -> Camel) ──
function mapStage(s: any): PipelineStage {
    if (!s) return s;
    return {
        id: s.id,
        name: s.name,
        orderIndex: s.order_index ?? s.orderIndex,
        color: s.color
    };
}

function mapLog(l: any): OrderLog {
    if (!l) return l;
    return {
        id: l.id,
        userId: l.user_id ?? l.userId,
        userName: l.user_name ?? l.userName,
        action: l.action,
        timestamp: l.timestamp
    };
}

function mapOrder(o: any): Order {
    if (!o) return o;
    return {
        id: o.id,
        orderNumber: o.order_number ?? o.orderNumber,
        clientName: o.client_name ?? o.clientName,
        clientAddress: o.client_address ?? o.clientAddress,
        statusId: o.status_id ?? o.statusId,
        priority: o.priority,
        deadline: o.deadline,
        description: o.description,
        assignedTo: o.assigned_to ?? o.assignedTo,
        variants: (o.variants || []).map(mapVariant),
        files: o.files || [],
        logs: (o.logs || []).map(mapLog),
        createdAt: o.created_at ?? o.createdAt,
        updatedAt: o.updated_at ?? o.updatedAt
    };
}

// ── Mappers (Camel -> Snake) ──
function mapOrderToSnake(o: Partial<Order>): any {
    const s: any = {};
    if (o.orderNumber !== undefined) s.order_number = o.orderNumber;
    if (o.clientName !== undefined) s.client_name = o.clientName;
    if (o.clientAddress !== undefined) s.client_address = o.clientAddress;
    if (o.statusId !== undefined) s.status_id = o.statusId;
    if (o.priority !== undefined) s.priority = o.priority;
    if (o.deadline !== undefined) s.deadline = o.deadline;
    if (o.description !== undefined) s.description = o.description;
    if (o.assignedTo !== undefined) s.assigned_to = o.assignedTo;
    if (o.updatedAt !== undefined) s.updated_at = o.updatedAt;
    if (o.createdAt !== undefined) s.created_at = o.createdAt;
    return s;
}

// ── Getters ──

export async function getStages(): Promise<PipelineStage[]> {
    const { data, error } = await supabase
        .from('stages')
        .select('*')
        .order('order_index', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapStage);
}

export async function getStage(id: string): Promise<PipelineStage | undefined> {
    const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return undefined;
    return mapStage(data);
}

export async function getTeam(): Promise<TeamMember[]> {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
    if (error) throw error;
    return data as TeamMember[];
}

export async function getTeamMember(id: string): Promise<TeamMember | undefined> {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return undefined;
    return data as TeamMember;
}

export async function getInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
        .from('inventory')
        .select('*, variants:inventory_variants(*)')
        .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(item => ({
        ...item,
        variants: (item.variants || []).map((v: any) => ({
            id: v.id,
            color: v.color,
            colorHex: v.color_hex ?? v.colorHex,
            tipSize: v.tip_size ?? v.tipSize,
            sku: v.sku
        }))
    })) as InventoryItem[];
}

function mapVariant(data: any): OrderVariant {
    return {
        id: data.id,
        productId: data.product_id || '',
        productName: data.product_name,
        variantId: data.variant_id || '',
        color: data.color,
        colorHex: data.color_hex,
        quantity: data.quantity,
        completed: data.completed,
        engravingText: data.engraving_text,
        notes: data.notes,
        fileName: data.file_name,
        fileData: data.file_data // This remains for backward compatibility and as the storage for URLs
    };
}

/**
 * Resolves the URL for a file. If it's base64, returns as is.
 * If it's a path, returns the Supabase storage public URL.
 */
export function getFileUrl(fileData: string): string {
    if (!fileData) return '';
    if (fileData.startsWith('data:')) return fileData;

    // Assume it's a storage path (e.g., 'order-attachments/filename.png')
    const { data } = supabase.storage.from('order-attachments').getPublicUrl(fileData);
    return data.publicUrl;
}

/**
 * Uploads a file to Supabase Storage and returns its path.
 */
export async function uploadOrderFile(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from('order-attachments')
        .upload(filePath, file);

    if (error) throw error;
    return filePath;
}

export async function getCustomFields(): Promise<CustomField[]> {
    const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('name', { ascending: true });
    if (error) throw error;
    return data as CustomField[];
}

export async function getCurrentUser(): Promise<TeamMember | undefined> {
    const savedId = localStorage.getItem('orderflow_user_id');
    const team = await getTeam();
    if (savedId) {
        const user = team.find(t => t.id === savedId);
        if (user) return user;
    }
    const defaultUser = team.find(t => t.id === 'u2') || team[0];
    if (defaultUser) {
        localStorage.setItem('orderflow_user_id', defaultUser.id);
    }
    return defaultUser;
}

export function setCurrentUser(id: string): void {
    localStorage.setItem('orderflow_user_id', id);
}

export async function getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            variants:order_variants(
                id, product_name, color, color_hex, quantity, completed, engraving_text, file_name
            ),
            logs:order_logs(*)
        `)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOrder);
}

export async function getOrder(id: string): Promise<Order | undefined> {
    const { data, error } = await supabase
        .from('orders')
        .select('*, variants:order_variants(*), logs:order_logs(*)')
        .eq('id', id)
        .single();
    if (error) return undefined;
    return mapOrder(data);
}

export async function getOrdersByStage(stageId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            variants:order_variants(
                id, product_name, color, color_hex, quantity, completed, engraving_text, file_name
            ),
            logs:order_logs(*)
        `)
        .eq('status_id', stageId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOrder);
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            variants:order_variants(
                id, product_name, color, color_hex, quantity, completed, engraving_text, file_name
            ),
            logs:order_logs(*)
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOrder);
}

export async function getNextStage(currentStageId: string): Promise<PipelineStage | undefined> {
    const stages = await getStages();
    const idx = stages.findIndex(s => s.id === currentStageId);
    return idx < stages.length - 1 ? stages[idx + 1] : undefined;
}

export async function getStageColor(stageId: string): Promise<string> {
    const stage = await getStage(stageId);
    return stage?.color || '#999';
}

export async function getStageName(stageId: string): Promise<string> {
    const stage = await getStage(stageId);
    return stage?.name || 'Nieznany';
}

export async function getStats() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, deadline, priority, status_id');

    if (error) throw error;

    const stages = await getStages();
    const now = new Date();

    const delayed = (orders || []).filter(o =>
        new Date(o.deadline) < now &&
        o.status_id !== stages[stages.length - 1]?.id
    );
    const blocked = (orders || []).filter(o => o.priority === 'CRITICAL');

    const bySt: Record<string, number> = {};
    stages.forEach(s => {
        bySt[s.id] = (orders || []).filter(o => o.status_id === s.id).length;
    });

    return { total: (orders || []).length, delayed: delayed.length, blocked: blocked.length, byStage: bySt };
}

// ── Helpers ──
async function generateOrderNumber(): Promise<string> {
    const { data } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1);

    let next = 4301;
    if (data && data.length > 0) {
        const m = data[0].order_number.match(/ORD-(\d+)/);
        if (m) next = parseInt(m[1]) + 1;
    }
    return `ORD-${next}`;
}

// ── CRUD Operations ──

export async function createOrder(data: {
    clientName: string;
    clientAddress: string;
    priority: Order['priority'];
    deadline: string;
    description: string;
    assignedTo: string;
    variants: Omit<OrderVariant, 'id' | 'completed'>[];
}): Promise<Order> {
    const orderNumber = await generateOrderNumber();
    const stages = await getStages();

    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            client_name: data.clientName,
            client_address: data.clientAddress,
            status_id: stages[0]?.id,
            priority: data.priority,
            deadline: data.deadline,
            description: data.description,
            assigned_to: data.assignedTo,
        })
        .select()
        .single();

    if (error) throw error;

    const { error: vError } = await supabase
        .from('order_variants')
        .insert(data.variants.map(v => ({
            order_id: order.id,
            product_name: v.productName,
            color: v.color,
            color_hex: v.colorHex,
            quantity: v.quantity,
            engraving_text: v.engravingText,
            notes: (v as any).notes,
            file_name: (v as any).fileName,
            file_data: (v as any).fileData
        })));

    if (vError) throw vError;

    await addOrderLog(order.id, 'Utworzono zamówienie');
    return (await getOrder(order.id)) as Order;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    const snakeUpdates = mapOrderToSnake(updates);
    const { error } = await supabase
        .from('orders')
        .update({
            ...snakeUpdates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
}

export async function advanceOrderStatus(id: string): Promise<PipelineStage | undefined> {
    const order = await getOrder(id);
    if (!order) return;
    const next = await getNextStage(order.statusId);
    if (!next) return;

    const { error } = await supabase
        .from('orders')
        .update({
            status_id: next.id,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;

    await addOrderLog(id, `Przeniesiono do ${next.name}`);
    return next;
}

export async function moveOrderToStage(orderId: string, stageId: string): Promise<void> {
    const stage = await getStage(stageId);
    if (!stage) return;

    const { error } = await supabase
        .from('orders')
        .update({
            status_id: stageId,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (error) throw error;

    await addOrderLog(orderId, `Przeniesiono do ${stage.name}`);
}

export async function toggleVariantComplete(orderId: string, variantId: string): Promise<void> {
    const order = await getOrder(orderId);
    if (!order) return;
    const variant = order.variants.find(v => v.id === variantId);
    if (!variant) return;

    const newStatus = !variant.completed;

    const { error } = await supabase
        .from('order_variants')
        .update({ completed: newStatus })
        .eq('id', variantId);

    if (error) throw error;

    const action = newStatus
        ? `Ukończono ${variant.quantity}x ${variant.productName} ${variant.color}`
        : `Odznaczono ${variant.quantity}x ${variant.productName} ${variant.color}`;

    await addOrderLog(orderId, action);
}

export async function addOrderLog(orderId: string, action: string): Promise<void> {
    const user = await getCurrentUser();
    const { error } = await supabase
        .from('order_logs')
        .insert({
            order_id: orderId,
            user_id: user?.id,
            user_name: user?.name || 'System',
            action,
        });
    if (error) throw error;
}

export async function addTeamMember(data: Omit<TeamMember, 'id' | 'avatar'>): Promise<TeamMember> {
    const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const { data: member, error } = await supabase
        .from('teams')
        .insert({ ...data, avatar: initials })
        .select()
        .single();
    if (error) throw error;
    return member as TeamMember;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
    const { error } = await supabase.from('teams').update(updates).eq('id', id);
    if (error) throw error;
}

export async function removeTeamMember(id: string): Promise<void> {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
}

export async function addStage(name: string, color: string): Promise<PipelineStage> {
    const stages = await getStages();
    const maxIdx = stages.reduce((max, s) => (s.orderIndex > max ? s.orderIndex : max), -1);

    const { data, error } = await supabase
        .from('stages')
        .insert({ name, order_index: maxIdx + 1, color })
        .select()
        .single();

    if (error) throw error;
    return mapStage(data);
}

export async function updateStage(id: string, updates: Partial<PipelineStage>): Promise<void> {
    const snakeUpdates: any = {};
    if (updates.name !== undefined) snakeUpdates.name = updates.name;
    if (updates.orderIndex !== undefined) snakeUpdates.order_index = updates.orderIndex;
    if (updates.color !== undefined) snakeUpdates.color = updates.color;

    const { error } = await supabase.from('stages').update(snakeUpdates).eq('id', id);
    if (error) throw error;
}

export async function removeStage(id: string): Promise<void> {
    const { error } = await supabase.from('stages').delete().eq('id', id);
    if (error) throw error;
}

export async function addInventoryItem(name: string): Promise<InventoryItem> {
    const { data, error } = await supabase
        .from('inventory')
        .insert({ name })
        .select()
        .single();
    if (error) throw error;
    return { ...data, variants: [] } as InventoryItem;
}

export async function removeInventoryItem(id: string): Promise<void> {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
}

export async function addInventoryVariant(inventoryId: string, v: Omit<InventoryVariant, 'id'>): Promise<InventoryVariant> {
    const { data, error } = await supabase
        .from('inventory_variants')
        .insert({
            inventory_id: inventoryId,
            color: v.color,
            color_hex: v.colorHex,
            tip_size: v.tipSize,
            sku: v.sku
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        color: data.color,
        colorHex: data.color_hex,
        tipSize: data.tip_size,
        sku: data.sku
    } as InventoryVariant;
}

export async function importInventory(data: any[]): Promise<void> {
    for (const item of data) {
        const { data: newItem, error: itemError } = await supabase
            .from('inventory')
            .insert({ name: item.name })
            .select()
            .single();

        if (itemError) throw itemError;

        if (item.variants && item.variants.length > 0) {
            const variantsToInsert = item.variants.map((v: any) => ({
                inventory_id: newItem.id,
                color: v.color,
                color_hex: v.colorHex,
                tip_size: v.tipSize || '',
                sku: v.sku || ''
            }));

            const { error: vError } = await supabase
                .from('inventory_variants')
                .insert(variantsToInsert);

            if (vError) throw vError;
        }
    }
}

export async function removeInventoryVariant(id: string): Promise<void> {
    const { error } = await supabase.from('inventory_variants').delete().eq('id', id);
    if (error) throw error;
}

export async function addCustomField(data: Omit<CustomField, 'id'>): Promise<CustomField> {
    const { data: field, error } = await supabase
        .from('custom_fields')
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return field as CustomField;
}

export async function removeCustomField(id: string): Promise<void> {
    const { error } = await supabase.from('custom_fields').delete().eq('id', id);
    if (error) throw error;
}

export async function resetData(): Promise<void> {
    await supabase.from('order_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('custom_fields').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    await supabase.from('stages').insert([
        { name: 'Nowe', order_index: 0, color: '#3B82F6' },
        { name: 'Wycena', order_index: 1, color: '#F59E0B' },
        { name: 'Produkcja', order_index: 2, color: '#10B981' },
        { name: 'Gotowe', order_index: 3, color: '#8B5CF6' }
    ]).select();

    await supabase.from('teams').insert([
        { name: 'Admin User', email: 'admin@orderflow.com', role: 'Administrator', active: true, avatar: 'AU' },
        { name: 'Produkcja Team', email: 'prod@orderflow.com', role: 'Produkcja', active: true, avatar: 'PT' }
    ]);

    const { data: invData } = await supabase.from('inventory').insert([
        { name: 'PEN PRO' },
        { name: 'ECO MUG' }
    ]).select();

    if (invData) {
        await supabase.from('inventory_variants').insert([
            { inventory_id: invData[0].id, color: 'Srebrny', color_hex: '#C0C0C0', tip_size: '0.7mm', sku: 'PRO-SLV' },
            { inventory_id: invData[0].id, color: 'Czarny', color_hex: '#000000', tip_size: '0.7mm', sku: 'PRO-BLK' },
            { inventory_id: invData[1].id, color: 'Naturalny', color_hex: '#D2B48C', tip_size: 'N/A', sku: 'ECO-NAT' }
        ]);
    }

    console.log('Database seeded successfully!');
}

export async function exportOrdersCSV(): Promise<string> {
    const orders = await getOrders();
    const stages = await getStages();
    const team = await getTeam();

    const rows = [['Numer zam.', 'Klient', 'Status', 'Priorytet', 'Termin', 'Suma sztuk', 'Przypisano do', 'Utworzono']];

    orders.forEach(o => {
        const stage = stages.find(s => s.id === o.statusId);
        const assignee = team.find(t => t.id === o.assignedTo);
        const totalUnits = o.variants.reduce((s, v) => s + v.quantity, 0);

        rows.push([
            o.orderNumber,
            o.clientName,
            stage?.name || '',
            o.priority,
            new Date(o.deadline).toLocaleDateString('pl-PL'),
            totalUnits.toString(),
            assignee?.name || '',
            new Date(o.createdAt).toLocaleDateString('pl-PL'),
        ]);
    });

    return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
}
