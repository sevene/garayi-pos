'use client';

import React from 'react';
import { useCart } from '@/hooks/useCart';
import { TrashIcon } from '@heroicons/react/24/outline';

export function CartPanel() {
    const { cartItems, formatCurrency, removeItem, total, subtotal, tax, checkout, clearCart } = useCart();

    return (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
                <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium">Clear</button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <span className="text-2xl">🛒</span>
                        </div>
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    cartItems.map(item => (
                        <div key={item._id} className="bg-white border boundary-gray-100 rounded-xl p-3 shadow-sm flex justify-between items-center">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                                <div className="text-sm text-gray-500">{formatCurrency(item.price)} x {item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">{formatCurrency(item.itemTotal)}</span>
                                <button onClick={() => removeItem(item._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>Tax</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                <button
                    onClick={checkout}
                    disabled={cartItems.length === 0}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    <span>Charge</span>
                    <span>{formatCurrency(total)}</span>
                </button>
            </div>
        </div>
    );
}
