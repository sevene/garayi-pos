'use client';

import { useState, useMemo, useContext, createContext, useCallback } from 'react';
import { Product } from '@/lib/types';
import { toast } from 'sonner';
import { useSettings } from './useSettings';

export interface CartItem {
    product: Product;
    quantity: number;
    price: number;
    itemTotal: number;
    name: string;
    _id: string;
}

interface CartContextType {
    cartItems: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    formatCurrency: (amount: number) => string;
    addItemToCart: (product: Product) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    checkout: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartState = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const { settings, formatCurrency } = useSettings();

    const addItemToCart = useCallback((product: Product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item._id === product._id);
            if (existing) {
                return prev.map(item => item._id === product._id
                    ? { ...item, quantity: item.quantity + 1, itemTotal: (item.quantity + 1) * item.price }
                    : item
                );
            }
            return [...prev, {
                product,
                quantity: 1,
                price: product.price,
                itemTotal: product.price,
                name: product.name,
                _id: product._id
            }];
        });
        toast.success(`Added ${product.name}`);
    }, []);

    const removeItem = useCallback((productId: string) => {
        setCartItems(prev => prev.filter(item => item._id !== productId));
    }, []);

    const clearCart = useCallback(() => setCartItems([]), []);

    const { subtotal, tax, total } = useMemo(() => {
        const sub = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const t = sub * (settings?.taxRate || 0);
        return { subtotal: sub, tax: t, total: sub + t };
    }, [cartItems, settings]);

    const checkout = async () => {
        if (cartItems.length === 0) return;
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems,
                    total
                })
            });
            if (res.ok) {
                toast.success('Transaction Completed!');
                clearCart();
            } else {
                toast.error('Transaction Failed');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error during checkout');
        }
    };

    return {
        cartItems, subtotal, tax, total, formatCurrency,
        addItemToCart, removeItem, clearCart, checkout
    };
};

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const cart = useCartState();
    return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}
