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

export interface CarwashService {
    _id: string;
    name: string;
    description?: string;
    category?: string | Category;
    // Carwash specific pricing
    price_sedan: number;
    price_suv: number;
    price_truck: number;
    duration_minutes: number;
}

export interface Category {
    _id: string;
    name: string;
}

// Helper guard
export function isCarwashService(item: Product | CarwashService): item is CarwashService {
    return 'price_sedan' in item;
}
