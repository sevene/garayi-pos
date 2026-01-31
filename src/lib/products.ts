// lib/products.ts
// This file handles data fetching for products, using a mock dataset
// if the NEXT_PUBLIC_API_URL is not available.

// =========================================================================
// INTERFACE DEFINITION
// =========================================================================

/**
 * Defines the structure for a single product returned by the API.
 * The price is defined as string | number to handle potential inconsistencies
 * from the MongoDB/Node.js backend (e.g., Decimal128 types).
 */
export interface Product {
  _id: string;
  name: string;
  sku: string;
  volume: number | string;
  price: number | string;
  cost: number | string;
  image?: string; // Optional image URL
  category?: string; // Optional category
  stock?: number; // Optional stock quantity
  showInPOS?: boolean; // Optional flag to show in POS
  soldBy?: 'piece' | 'weight/volume'; // Unit type
}

// =========================================================================
// DATA FETCHING LOGIC
// =========================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetches the list of products from the configured backend API.
 * @returns A promise that resolves to an array of Product objects.
 */
export async function fetchProducts(): Promise<Product[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  // If API URL is not set (e.g., missing .env.local), return mock data (Legacy fallback behavior)
  // Logic update: using logic from admin page to fetch from /api if no env var
  if (!process.env.NEXT_PUBLIC_API_URL && typeof window === 'undefined') {
    // Server-side without explicit URL -> cannot fetch relative path easily without full URL
    // But client-side can use relative path.
    // If we are server side and no API_URL, maybe return mock?
    // Or assume deployed environment has it.
    // Let's stick to simple relative path fallback for fetch call, but keep 'mock' logic if fetch fails.
  }

  if (false) { // Disable hardcoded mock check to force attempt fetch
    return [
      { _id: '1', name: 'Espresso Blend', sku: 'E001', volume: '100ml', price: 12.50, cost: 10.00 },
      { _id: '2', name: 'Milk Frother', sku: 'M005', volume: '100ml', price: 35.00, cost: 30.00 },
      { _id: '3', name: 'Mug Set (4)', sku: 'H101', volume: '100ml', price: 18.00, cost: 15.00 },
      { _id: '4', name: 'French Press', sku: 'A205', volume: '100ml', price: 29.99, cost: 25.00 },
      { _id: '5', name: 'Sugar Packets', sku: 'I101', volume: '100ml', price: 3.50, cost: 3.00 },
      { _id: '6', name: 'Decaf Beans', sku: 'D100', volume: '100ml', price: 14.00, cost: 12.00 },
      { _id: '7', name: 'Latte Syrup Vanilla', sku: 'S001', volume: '100ml', price: 8.75, cost: 8.00 },
      { _id: '8', name: 'Tea Sampler', sku: 'T050', volume: '100ml', price: 11.25, cost: 10.00 },
      { _id: '9', name: 'Cold Brew Maker', sku: 'C100', volume: '100ml', price: 45.00, cost: 40.00 },
      { _id: '10', name: 'Gift Card $25', sku: 'G025', volume: '100ml', price: 25.00, cost: 20.00 },
    ];
  }

  // Attempt to fetch data from the live backend
  const response = await fetch(`${API_URL}/products`, {
    // Ensure fresh data on every request (important for POS systems)
    cache: 'no-store',
  });

  if (!response.ok) {
    // Throw an error that will be caught by the calling POSPage component
    throw new Error(`Failed to fetch products: Status ${response.status} - ${response.statusText}`);
  }

  // Parse and return the data, enforcing the Product[] type
  return response.json();
}