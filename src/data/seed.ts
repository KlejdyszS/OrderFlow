// ═══════════════════════════════════════════════════════
//  OrderFlow — Seed Data
//  Pen engraving company sample data
// ═══════════════════════════════════════════════════════

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'Administrator' | 'Produkcja' | 'Sprzedaż';
    active: boolean;
    avatar: string; // initials
}

export interface PipelineStage {
    id: string;
    name: string;
    orderIndex: number;
    color: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    variants: InventoryVariant[];
}

export interface InventoryVariant {
    id: string;
    color: string;
    colorHex: string;
    tipSize: string;
    sku: string;
}

export interface OrderVariant {
    id: string;
    productId: string;
    productName: string;
    variantId: string;
    color: string;
    colorHex: string;
    quantity: number;
    completed: boolean;
    engravingText?: string;
    notes?: string;
    fileName?: string;
    fileData?: string; // base64
}

export interface OrderFile {
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    uploadedAt: string;
}

export interface OrderLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    clientName: string;
    clientAddress: string;
    statusId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    deadline: string;
    description: string;
    assignedTo: string;
    variants: OrderVariant[];
    files: OrderFile[];
    logs: OrderLog[];
    createdAt: string;
    updatedAt: string;
}

export interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'file' | 'date' | 'textarea';
    options?: string[]; // for select type
    required: boolean;
}

export interface AppData {
    team: TeamMember[];
    stages: PipelineStage[];
    inventory: InventoryItem[];
    orders: Order[];
    customFields: CustomField[];
    currentUser: string;
}

// ── Team Members ──
const team: TeamMember[] = [
    { id: 'u1', name: 'Alex Chen', email: 'alex@orderflow.net', role: 'Administrator', active: true, avatar: 'AC' },
    { id: 'u2', name: 'Sarah Miller', email: 'sarah@orderflow.net', role: 'Produkcja', active: true, avatar: 'SM' },
    { id: 'u3', name: 'John Maker', email: 'john@orderflow.net', role: 'Produkcja', active: true, avatar: 'JM' },
    { id: 'u4', name: 'Tom Wilson', email: 'tom@orderflow.net', role: 'Sprzedaż', active: true, avatar: 'TW' },
    { id: 'u5', name: 'Eva Kowalska', email: 'eva@orderflow.net', role: 'Produkcja', active: false, avatar: 'EK' },
];

// ── Pipeline Stages ──
const stages: PipelineStage[] = [
    { id: 's1', name: 'Nowe', orderIndex: 0, color: '#3B82F6' },
    { id: 's2', name: 'W Produkcji', orderIndex: 1, color: '#F59E0B' },
    { id: 's3', name: 'Pakowanie', orderIndex: 2, color: '#D4FF00' },
    { id: 's4', name: 'Wysłane', orderIndex: 3, color: '#10B981' },
];

// ── Pen Inventory ──
const inventory: InventoryItem[] = [
    {
        id: 'p1', name: 'COSMO',
        variants: [
            { id: 'v1', color: 'Electric Blue', colorHex: '#3B82F6', tipSize: '0.7mm', sku: 'COS-BLU-07' },
            { id: 'v2', color: 'Alert Red', colorHex: '#EF4444', tipSize: '0.7mm', sku: 'COS-RED-07' },
            { id: 'v3', color: 'Matte Black', colorHex: '#333333', tipSize: '0.7mm', sku: 'COS-BLK-07' },
            { id: 'v4', color: 'Matte White', colorHex: '#E5E5E5', tipSize: '0.7mm', sku: 'COS-WHT-07' },
            { id: 'v5', color: 'Silver', colorHex: '#C0C0C0', tipSize: '0.7mm', sku: 'COS-SLV-07' },
            { id: 'v6', color: 'Gold', colorHex: '#FFD700', tipSize: '0.7mm', sku: 'COS-GLD-07' },
        ],
    },
    {
        id: 'p2', name: 'CURV PEN',
        variants: [
            { id: 'v7', color: 'Electric Blue', colorHex: '#3B82F6', tipSize: '0.5mm', sku: 'CRV-BLU-05' },
            { id: 'v8', color: 'Alert Red', colorHex: '#EF4444', tipSize: '0.5mm', sku: 'CRV-RED-05' },
            { id: 'v9', color: 'Matte Black', colorHex: '#333333', tipSize: '0.5mm', sku: 'CRV-BLK-05' },
            { id: 'v10', color: 'Matte White', colorHex: '#E5E5E5', tipSize: '0.5mm', sku: 'CRV-WHT-05' },
            { id: 'v11', color: 'Rose Gold', colorHex: '#B76E79', tipSize: '0.5mm', sku: 'CRV-RSG-05' },
            { id: 'v12', color: 'Navy', colorHex: '#1E3A5F', tipSize: '0.5mm', sku: 'CRV-NAV-05' },
        ],
    },
    {
        id: 'p3', name: 'GEL GRIP',
        variants: [
            { id: 'v13', color: 'Alert Red', colorHex: '#EF4444', tipSize: '0.5mm', sku: 'GEL-RED-05' },
            { id: 'v14', color: 'Matte Black', colorHex: '#333333', tipSize: '0.5mm', sku: 'GEL-BLK-05' },
            { id: 'v15', color: 'Ocean Blue', colorHex: '#0077B6', tipSize: '0.5mm', sku: 'GEL-OCN-05' },
        ],
    },
    {
        id: 'p4', name: 'STANDARD',
        variants: [
            { id: 'v16', color: 'Matte White', colorHex: '#E5E5E5', tipSize: '1.0mm', sku: 'STD-WHT-10' },
            { id: 'v17', color: 'Matte Black', colorHex: '#333333', tipSize: '1.0mm', sku: 'STD-BLK-10' },
            { id: 'v18', color: 'Silver', colorHex: '#C0C0C0', tipSize: '1.0mm', sku: 'STD-SLV-10' },
        ],
    },
];

// ── Helper: generate date strings ──
function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

function daysFromNow(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
}

function hoursAgo(n: number): string {
    const d = new Date();
    d.setHours(d.getHours() - n);
    return d.toISOString();
}

// ── Sample Orders ──
const orders: Order[] = [
    {
        id: 'o1', orderNumber: 'ORD-4292', clientName: 'Cyberdyne Systems',
        clientAddress: '8008 State St, Floor 42', statusId: 's2', priority: 'HIGH',
        deadline: daysFromNow(0), description: 'Engraved pens for annual corporate event. Logo on clip.',
        assignedTo: 'u2',
        variants: [
            { id: 'ov1', productId: 'p1', productName: 'COSMO', variantId: 'v1', color: 'Electric Blue', colorHex: '#3B82F6', quantity: 500, completed: true, engravingText: 'Cyberdyne Systems 2026' },
            { id: 'ov2', productId: 'p3', productName: 'GEL GRIP', variantId: 'v13', color: 'Alert Red', colorHex: '#EF4444', quantity: 200, completed: false, engravingText: 'Cyberdyne Systems' },
            { id: 'ov3', productId: 'p4', productName: 'STANDARD', variantId: 'v16', color: 'Matte White', colorHex: '#E5E5E5', quantity: 300, completed: false, engravingText: 'CS' },
        ],
        files: [],
        logs: [
            { id: 'l1', userId: 'u4', userName: 'Tom Wilson', action: 'Created order', timestamp: daysAgo(2) },
            { id: 'l2', userId: 'u2', userName: 'Sarah Miller', action: 'Started production', timestamp: hoursAgo(5) },
            { id: 'l3', userId: 'u2', userName: 'Sarah Miller', action: 'Completed 500x COSMO Blue', timestamp: hoursAgo(1) },
        ],
        createdAt: daysAgo(2), updatedAt: hoursAgo(1),
    },
    {
        id: 'o2', orderNumber: 'ORD-4295', clientName: 'Umbrella Corp',
        clientAddress: '1 Raccoon Plaza, Apt 600', statusId: 's2', priority: 'CRITICAL',
        deadline: daysFromNow(-1), description: 'URGENT: Custom engraving with bio-hazard logo. Rush order.',
        assignedTo: 'u3',
        variants: [
            { id: 'ov4', productId: 'p2', productName: 'CURV PEN', variantId: 'v8', color: 'Alert Red', colorHex: '#EF4444', quantity: 200, completed: false, engravingText: 'Umbrella Corporation' },
        ],
        files: [],
        logs: [
            { id: 'l4', userId: 'u4', userName: 'Tom Wilson', action: 'Created order', timestamp: daysAgo(3) },
            { id: 'l5', userId: 'u3', userName: 'John Maker', action: 'Flagged issue: "Out of red ink"', timestamp: hoursAgo(2) },
        ],
        createdAt: daysAgo(3), updatedAt: hoursAgo(2),
    },
    {
        id: 'o3', orderNumber: 'ORD-4298', clientName: 'Weyland-Yutani',
        clientAddress: '700 Galaxy Way', statusId: 's1', priority: 'MEDIUM',
        deadline: daysFromNow(1), description: 'Standard corporate pens, laser-etched logo.',
        assignedTo: 'u2',
        variants: [
            { id: 'ov5', productId: 'p2', productName: 'CURV PEN', variantId: 'v9', color: 'Matte Black', colorHex: '#333333', quantity: 1000, completed: false, engravingText: 'W-Y Corp' },
        ],
        files: [],
        logs: [
            { id: 'l6', userId: 'u4', userName: 'Tom Wilson', action: 'Created order', timestamp: daysAgo(1) },
        ],
        createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
        id: 'o4', orderNumber: 'ORD-4299', clientName: 'Tyrell Corp',
        clientAddress: '12 Replicant Drive', statusId: 's1', priority: 'LOW',
        deadline: daysFromNow(5), description: 'Executive gift set. Premium finish required.',
        assignedTo: 'u3',
        variants: [
            { id: 'ov6', productId: 'p1', productName: 'COSMO', variantId: 'v6', color: 'Gold', colorHex: '#FFD700', quantity: 50, completed: false, engravingText: 'Tyrell Corporation' },
            { id: 'ov7', productId: 'p1', productName: 'COSMO', variantId: 'v5', color: 'Silver', colorHex: '#C0C0C0', quantity: 50, completed: false, engravingText: 'Tyrell Corporation' },
        ],
        files: [],
        logs: [
            { id: 'l7', userId: 'u1', userName: 'Alex Chen', action: 'Created order', timestamp: hoursAgo(12) },
        ],
        createdAt: hoursAgo(12), updatedAt: hoursAgo(12),
    },
    {
        id: 'o5', orderNumber: 'ORD-4300', clientName: 'Acme Corp',
        clientAddress: '42 Desert Road', statusId: 's2', priority: 'MEDIUM',
        deadline: daysFromNow(2), description: 'Trade show giveaways. Logo on barrel.',
        assignedTo: 'u2',
        variants: [
            { id: 'ov8', productId: 'p4', productName: 'STANDARD', variantId: 'v17', color: 'Matte Black', colorHex: '#333333', quantity: 2000, completed: false, engravingText: 'ACME' },
            { id: 'ov9', productId: 'p4', productName: 'STANDARD', variantId: 'v16', color: 'Matte White', colorHex: '#E5E5E5', quantity: 1000, completed: false, engravingText: 'ACME' },
        ],
        files: [],
        logs: [
            { id: 'l8', userId: 'u4', userName: 'Tom Wilson', action: 'Created order', timestamp: daysAgo(4) },
            { id: 'l9', userId: 'u2', userName: 'Sarah Miller', action: 'Moved to production. Waiting on Red Refill shipment. ETA 2pm.', timestamp: daysAgo(1) },
        ],
        createdAt: daysAgo(4), updatedAt: daysAgo(1),
    },
    {
        id: 'o6', orderNumber: 'ORD-4301', clientName: 'Massive Dynamic',
        clientAddress: '33 Tower Blvd', statusId: 's1', priority: 'HIGH',
        deadline: daysFromNow(3), description: 'R&D department order. Fine tip pens only.',
        assignedTo: 'u3',
        variants: [
            { id: 'ov10', productId: 'p3', productName: 'GEL GRIP', variantId: 'v14', color: 'Matte Black', colorHex: '#333333', quantity: 150, completed: false, engravingText: 'Massive Dynamic Labs' },
            { id: 'ov11', productId: 'p3', productName: 'GEL GRIP', variantId: 'v15', color: 'Ocean Blue', colorHex: '#0077B6', quantity: 150, completed: false, engravingText: 'Massive Dynamic' },
        ],
        files: [],
        logs: [
            { id: 'l10', userId: 'u4', userName: 'Tom Wilson', action: 'System received order', timestamp: hoursAgo(1) },
        ],
        createdAt: hoursAgo(1), updatedAt: hoursAgo(1),
    },
    {
        id: 'o7', orderNumber: 'ORD-4288', clientName: 'Globex Corp',
        clientAddress: '1 Globex Way', statusId: 's3', priority: 'LOW',
        deadline: daysFromNow(0), description: 'Quarterly restock order.',
        assignedTo: 'u2',
        variants: [
            { id: 'ov12', productId: 'p2', productName: 'CURV PEN', variantId: 'v7', color: 'Electric Blue', colorHex: '#3B82F6', quantity: 400, completed: true, engravingText: 'Globex' },
        ],
        files: [],
        logs: [
            { id: 'l11', userId: 'u4', userName: 'Tom Wilson', action: 'Created order', timestamp: daysAgo(6) },
            { id: 'l12', userId: 'u3', userName: 'John Maker', action: 'Production complete', timestamp: daysAgo(1) },
            { id: 'l13', userId: 'u2', userName: 'Sarah Miller', action: 'Marked as Packed', timestamp: hoursAgo(3) },
        ],
        createdAt: daysAgo(6), updatedAt: hoursAgo(3),
    },
    {
        id: 'o8', orderNumber: 'ORD-4280', clientName: 'Stark Industries',
        clientAddress: '10880 Malibu Point', statusId: 's4', priority: 'HIGH',
        deadline: daysAgo(1), description: 'VIP client. Tony wants gold engraving.',
        assignedTo: 'u2',
        variants: [
            { id: 'ov13', productId: 'p1', productName: 'COSMO', variantId: 'v3', color: 'Matte Black', colorHex: '#333333', quantity: 100, completed: true, engravingText: 'Stark Industries' },
            { id: 'ov14', productId: 'p1', productName: 'COSMO', variantId: 'v6', color: 'Gold', colorHex: '#FFD700', quantity: 50, completed: true, engravingText: 'Stark Industries' },
        ],
        files: [],
        logs: [
            { id: 'l14', userId: 'u4', userName: 'Tom Wilson', action: 'Created order', timestamp: daysAgo(8) },
            { id: 'l15', userId: 'u2', userName: 'Sarah Miller', action: 'Shipped via DHL Express', timestamp: daysAgo(1) },
        ],
        createdAt: daysAgo(8), updatedAt: daysAgo(1),
    },
];

// ── Custom Fields (admin-configurable) ──
const customFields: CustomField[] = [
    { id: 'cf1', name: 'Tekst Graweru', type: 'text', required: false },
    { id: 'cf2', name: 'Plik Logo', type: 'file', required: false },
    { id: 'cf3', name: 'Rodzaj Wykończenia', type: 'select', options: ['Matowy', 'Błyszczący', 'Szczotkowany', 'Polerowany'], required: false },
];

export function getDefaultData(): AppData {
    return {
        team,
        stages,
        inventory,
        orders,
        customFields,
        currentUser: 'u2', // Sarah Miller — production
    };
}
