import React from 'react';
import { useCart } from '@/hooks/useCart';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const CartItemsList = () => {
    const { cartItems, updateItemQuantity, removeItem, formatCurrency } = useCart();
    const isEmpty = cartItems.length === 0;

    return (
        <div className="flex-1 overflow-y-auto p-2 min-h-0 bg-white">
            {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                        <span className="text-4xl opacity-50">🛍️</span>
                    </div>
                    <p className="font-medium">No items in cart</p>
                </div>
            ) : (
                <div>
                    {cartItems.map((item) => (
                        <div key={item._id} className="flex items-center py-4 px-5 animate-in fade-in slide-in-from-bottom-1 duration-200 hover:bg-gray-50 transition-colors group">
                            {/* Quantity Input */}
                            <div className="flex items-center justify-center mr-3 gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item._id, parseInt(e.target.value) || 1)}
                                    className="w-12 h-12 text-center justify-center font-bold text-md text-gray-700 bg-white border border-transparent rounded-md focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none group-hover:border-lime-500 group-hover:ring-lime-500"
                                />
                                <div className='flex flex-col items-center gap-1'>
                                    <button
                                        onClick={() => updateItemQuantity(item._id, item.quantity + 1)}
                                        className="p-1 rounded-full text-transparent hover:text-green-600 hover:bg-green-100 hover:[&>svg]:stroke-2 transition-colors group-hover:text-green-600 group-hover:bg-green-100"
                                    >
                                        <PlusIcon className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => updateItemQuantity(item._id, Math.max(1, item.quantity - 1))}
                                        className="p-1 rounded-full text-transparent hover:text-rose-600 hover:bg-rose-100 hover:[&>svg]:stroke-2 transition-colors group-hover:text-rose-600 group-hover:bg-rose-100"
                                    >
                                        <MinusIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 flex justify-between items-center min-w-0">
                                <div className="flex flex-col min-w-0">
                                    <h4 className="font-semibold text-gray-800 text-lg leading-tight truncate px-1 capitalize" title={item.name}>
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-0.5 px-1">{formatCurrency(item.price)} each</p>
                                </div>
                                <span className="font-bold text-gray-800 whitespace-nowrap ml-3">{formatCurrency(item.itemTotal)}</span>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => removeItem(item._id)}
                                className="ml-3 p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-100 hover:[&>svg]:stroke-2 rounded-full opacity-0 group-hover:opacity-100 transition-all font-medium" // Hidden by default, shown on hover
                                title="Remove Item"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CartItemsList;
