// components/pos/POSContent.tsx
'use client';

import React from 'react';
import { Service } from '@/lib/services';
import { Product } from '@/lib/products';
import { Category } from '@/lib/categories';
import { CartProvider } from '@/hooks/useCart';
import { POSGrid } from './POSGrid';
import { CartPanel } from './CartPanel';

interface POSContentProps {
    initialServices: Service[];
    initialProducts: Product[];
    initialCategories: Category[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialCustomers: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialEmployees: any[];
}

/**
 * POSContent serves as the client-side root for the POS terminal.
 * It initializes the CartProvider (state) and lays out the ProductGrid and CartPanel.
 */
export function POSContent({ initialServices, initialProducts, initialCategories, initialCustomers, initialEmployees }: POSContentProps) {
    return (
        <CartProvider initialCustomers={initialCustomers} initialEmployees={initialEmployees}>
            {/* The main content container inherits h-full from the parent <main> tag */}
            <div className="flex flex-col flex-1 w-full bg-gray-200 antialiased overflow-hidden">

                {/* Main Content Area: Products + Cart. Uses flex-1 to fill horizontal space. */}
                <div className="flex flex-1 overflow-hidden shrink-0">

                    {/* Product/Service Area (Grid, fills remaining width) */}
                    <div className="flex-1 overflow-hidden h-full bg-white flex flex-col scrollbar-hide">
                        {/* POSGrid reads products and uses the cart context to add items */}
                        <POSGrid initialServices={initialServices} initialProducts={initialProducts} initialCategories={initialCategories} />
                    </div>

                    {/* Cart & Checkout Panel (Fixed Width) */}
                    {/* CartPanel reads cart state and displays totals */}
                    <CartPanel />

                </div>
            </div>
        </CartProvider>
    );
}