export interface Product {
    _id: string; // D1 uses numeric IDs usually, but we keep string for compatibility with UI
    name: string;
    sku: string;
    price: number;
    cost?: number;
    volume?: number | string;
    category?: string | Category;
    showInPos?: boolean;
    image?: string;
    stock?: number;
}

export interface Service {
    _id: string;
    name: string;
    servicePrice: number;
    category: string | Category;
    durationMinutes?: number;
    description?: string;
    variants?: { name: string; price: number }[];
    showInPos?: boolean;
}

export interface Category {
    _id: string;
    name: string;
}

// Helper guard
export function isService(item: Product | Service): item is Service {
    return 'servicePrice' in item;
}
