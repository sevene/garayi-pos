import Dexie, { Table } from 'dexie';

export interface OfflineOrder {
    id?: number;
    tempId: string; // UUID for local identification
    ticketNumber?: string;
    items: any[];
    total: number;
    customerId?: string;
    vehicleId?: string;
    status: 'pending' | 'synced' | 'error';
    createdAt: number;
    payload: any; // The full JSON payload we would send to the API
}

export class POSDatabase extends Dexie {
    // Master Data
    categories!: Table<any>;
    products!: Table<any>;
    services!: Table<any>;
    customers!: Table<any>;
    employees!: Table<any>;
    inventory!: Table<any>; // Map structure stored as key-value items or single object? Dexie likes arrays.
    // We can store { id: productId, stock: number }

    // Transactions
    orders!: Table<OfflineOrder>;

    constructor() {
        super('GarayiPOS_DB');
        this.version(1).stores({
            categories: '_id',
            products: '_id, category', // Indexed by id and category
            services: '_id, category',
            customers: '_id, name, phone', // searchable by name/phone
            employees: '_id',
            inventory: 'id', // productId
            orders: '++id, tempId, status, createdAt' // 'status' index for finding pending orders
        });
    }
}

export const db = new POSDatabase();
