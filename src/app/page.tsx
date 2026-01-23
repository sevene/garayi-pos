import React from 'react';
import { POSGrid } from '@/components/pos/POSGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { CartProvider } from '@/hooks/useCart';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// We can fetch data server-side here
async function getData() {
    try {
        const { env } = getRequestContext();
        const db = env.DB;
        const { results } = await db.prepare('SELECT * FROM products ORDER BY name ASC').all();
        return results as any[];
    } catch {
        return [];
    }
}

export default async function Page() {
    const products = await getData();

    return (
        <CartProvider>
            <main className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
                {/* Left: POS Grid */}
                <div className="flex-1 h-full overflow-hidden">
                    <POSGrid
                        initialProducts={products}
                        initialServices={[]}
                        initialCategories={[
                            { _id: '1', name: 'Coffee' },
                            { _id: '2', name: 'Syrups' },
                            { _id: '3', name: 'Equipment' }
                        ]}
                    />
                </div>

                {/* Right: Cart */}
                <CartPanel />
            </main>
        </CartProvider>
    );
}
