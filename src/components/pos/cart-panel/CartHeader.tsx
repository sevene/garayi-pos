import React from 'react';
import { useCart } from '@/hooks/useCart';
import { UserPlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CartHeaderProps {
    ticketNameInput: string;
    setTicketNameInput: (val: string) => void;
    onCustomerClick: () => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({ ticketNameInput, setTicketNameInput, onCustomerClick }) => {
    const { cartItems, currentCustomer } = useCart();
    const isEmpty = cartItems.length === 0;

    return (
        <div className="flex-none bg-white border-b border-gray-200 px-5 py-5 z-10 space-y-4">
            {/* Title & Count */}
            <div className="flex items-center justify-between gap-4">
                <input
                    id="ticketName"
                    name="ticketName"
                    type="text"
                    value={ticketNameInput}
                    onChange={(e) => setTicketNameInput(e.target.value)}
                    placeholder="Current Sale"
                    className="text-xl font-bold text-gray-800 placeholder-gray-300 outline-none bg-transparent border-transparent border-b p-2 focus:bg-gray-50 focus:ring-0 focus:border-lime-400 focus:border-b w-full"
                />
                {!isEmpty && (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {cartItems.length}
                    </span>
                )}
            </div>

            {/* Customer Card Button */}
            <button
                onClick={onCustomerClick}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all outline-none group"
            >
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${currentCustomer
                        ? 'bg-white text-blue-600 ring-1 ring-gray-100'
                        : 'bg-gray-200 text-gray-500'
                        }`}>
                        {currentCustomer ? (
                            (() => {
                                const names = currentCustomer.name.trim().split(' ');
                                if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                                return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                            })()
                        ) : (
                            <UserPlusIcon className="w-5 h-5" />
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="flex flex-col items-start">
                        <span className={`font-bold text-sm leading-tight ${currentCustomer ? 'text-gray-900' : 'text-gray-500'}`}>
                            {currentCustomer ? currentCustomer.name : 'Add Customer'}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                            {currentCustomer ? (currentCustomer.contactInfo || 'Customer linked') : 'Assign to ticket'}
                        </span>
                    </div>
                </div>

                {/* Chevron */}
                <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
        </div>
    );
};

export default CartHeader;
