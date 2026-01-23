'use client';

import React, { useState, useMemo } from 'react';
import { CarwashService, Product, Category, isCarwashService } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { CarTypeSelector } from './CarTypeSelector';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/hooks/useSettings';

interface POSGridProps {
    initialServices: CarwashService[];
    initialProducts: Product[];
    initialCategories: Category[];
}

type POSItem = CarwashService | Product;

export function POSGrid({ initialServices, initialProducts, initialCategories }: POSGridProps) {
    const { addItemToCart } = useCart();
    const { formatCurrency } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<CarwashService | null>(null);

    const allItems = useMemo(() => {
        return [...initialServices, ...initialProducts];
    }, [initialServices, initialProducts]);

    const handleItemClick = (item: POSItem) => {
        if (isCarwashService(item)) {
            setSelectedService(item);
        } else {
            addItemToCart(item as Product);
        }
    };

    const addServiceToCart = (service: CarwashService, variant: { name: string; price: number }) => {
        const cartItem: Product = {
            _id: `${service._id}-${variant.name}`,
            name: `${service.name} (${variant.name})`,
            sku: 'SRV',
            price: variant.price,
        };
        addItemToCart(cartItem);
        setSelectedService(null);
    };

    const visibleItems = useMemo(() => {
        let items = allItems;
        if (selectedCategory !== 'all') {
            // Simple category match for now
            items = items.filter(i => i.category === selectedCategory || (typeof i.category === 'object' && (i.category as Category).name === selectedCategory));
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(lower) || ('sku' in i && i.sku?.toLowerCase().includes(lower)));
        }
        return items;
    }, [allItems, selectedCategory, searchTerm]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white h-full">
            {/* Header */}
            <div className="px-6 py-4 flex gap-4 items-center bg-white border-b border-gray-100">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-lime-100 text-lime-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                        All
                    </button>
                    {initialCategories.map(c => (
                        <button
                            key={c._id}
                            onClick={() => setSelectedCategory(c.name)} // Simplified matching by name for PoC
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === c.name ? 'bg-lime-100 text-lime-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visibleItems.map(item => {
                        const isService = isCarwashService(item);
                        // Show lowest price for service or regular price for product
                        const price = isService ? (item as CarwashService).price_sedan : (item as Product).price;
                        return (
                            <button
                                key={item._id}
                                onClick={() => handleItemClick(item)}
                                className="flex flex-col text-left p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-lime-100 transition-all group h-40 justify-between"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-lime-700 transition-colors">{item.name}</h3>
                                    {!isService && <p className="text-xs text-gray-400 mt-1">{(item as Product).sku}</p>}
                                    {isService && <p className="text-xs text-lime-600 mt-1 font-medium">Select Vehicle</p>}
                                </div>
                                <span className="text-lg font-bold text-gray-900">
                                    {isService ? 'from ' : ''}{formatCurrency(price)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedService && (
                <CarTypeSelector
                    service={selectedService}
                    onSelect={(v) => addServiceToCart(selectedService, v)}
                    onClose={() => setSelectedService(null)}
                />
            )}
        </div>
    );
}
