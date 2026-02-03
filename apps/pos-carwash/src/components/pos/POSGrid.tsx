'use client';

import React, { useState, useMemo } from 'react';
import { Service } from '@/lib/services';
import { useCart } from '@/hooks/useCart';
import { VariantSelector } from './VariantSelector';
import { Product } from '@/lib/products';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Category } from '@/lib/categories';

interface POSGridProps {
    // Initial services are passed from the Server Component (app/page.tsx)
    initialServices: Service[];
    initialProducts: Product[];
    initialCategories: Category[];
}

// Union type for items in the grid
type POSItem = Service | Product;

/**
 * POSGrid handles displaying the service catalog, filtering by search term,
 * and managing the click event to add items to the shared cart state.
 */
export function POSGrid({ initialServices, initialProducts, initialCategories }: POSGridProps) {
    const { addItemToCart, formatCurrency } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [isScrolled, setIsScrolled] = useState(false);

    // Combine and memoize items
    const allItems = useMemo(() => {
        const services = initialServices.filter(s => s.showInPOS !== false);
        const products = initialProducts.filter(p => p.showInPOS !== false);
        return [...services, ...products];
    }, [initialServices, initialProducts]);

    // Derive categories that interact with visible items
    const visibleCategories = useMemo(() => {
        const usedCategoryIds = new Set<string>();

        allItems.forEach(item => {
            const cat = item.category;
            if (!cat) return;

            // Handle string ID or populated object (backend sends object for products, string for services)
            const catId = typeof cat === 'object' ? (cat as any)._id : cat;
            if (catId) {
                usedCategoryIds.add(catId);
            }
        });

        // Return only categories strictly present in the items list
        return initialCategories.filter(cat => usedCategoryIds.has(cat._id));
    }, [allItems, initialCategories]);

    const handleItemClick = (item: POSItem) => {
        if ('variants' in item && item.variants && item.variants.length > 0) {
            // It's a service with variants
            setSelectedService(item as Service);
        } else {
            // Add directly
            addItemToCart(item as Product); // Service is compatible with Product interface for cart purposes mostly, but let's be safe
        }
    };

    const addServiceToCart = (service: Service, variant?: { name: string; price: number }) => {
        // Map Service/Variant to Product structure for Cart
        const cartItem: Product = {
            _id: variant ? `${service._id}-${variant.name}` : service._id,
            name: variant ? `${service.name} - ${variant.name}` : service.name,
            sku: 'SRV', // Placeholder
            price: variant ? variant.price : service.servicePrice,
            cost: 0, // Not needed for POS display
            volume: 0, // Not needed
            showInPOS: true
        };

        addItemToCart(cartItem);
        setSelectedService(null);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop > 10 && !isScrolled) {
            setIsScrolled(true);
        } else if (scrollTop <= 10 && isScrolled) {
            setIsScrolled(false);
        }
    };

    // Helper to get category ID
    const getCategoryId = (item: POSItem) => {
        const cat = item.category;
        if (!cat) return 'uncategorized';
        // Handle complex case where category might be populated object (Product) or ID string (Service)
        return typeof cat === 'object' ? (cat as any)._id : cat;
    };

    // Filter items based on search term ONLY (Category filtering happens at section level if 'all', or strict if specific)
    const searchedItems = useMemo(() => {
        let items = allItems;
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(lowerSearchTerm) ||
                ('sku' in item && item.sku.toLowerCase().includes(lowerSearchTerm))
            );
        }
        return items;
    }, [allItems, searchTerm]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, POSItem[]> = {};

        searchedItems.forEach(item => {
            const catId = getCategoryId(item);
            if (!groups[catId]) {
                groups[catId] = [];
            }
            groups[catId].push(item);
        });

        return groups;
    }, [searchedItems]);

    // Prepare sections to render
    const sectionsToRender = useMemo(() => {
        const sections: { id: string; name: string; items: POSItem[] }[] = [];

        // If a specific category is selected, only that one
        if (selectedCategory !== 'all') {
            const items = groupedItems[selectedCategory] || [];
            if (items.length > 0) {
                const catName = initialCategories.find(c => c._id === selectedCategory)?.name || 'Unknown Category';
                sections.push({ id: selectedCategory, name: catName, items });
            }
        } else {
            // If 'all', we want to show ALL items in a SINGLE grid to use the space efficiently.
            // Include ALL items from groupedItems, not just those with matching categories
            let combinedItems: POSItem[] = [];

            // First, add items from known categories in order
            visibleCategories.forEach(cat => {
                const items = groupedItems[cat._id];
                if (items && items.length > 0) {
                    combinedItems.push(...items);
                }
            });

            // Then, add items from any other category groups (including 'uncategorized' and unmatched category IDs)
            Object.keys(groupedItems).forEach(catId => {
                // Skip if already added via visibleCategories
                if (visibleCategories.some(vc => vc._id === catId)) return;

                const items = groupedItems[catId];
                if (items && items.length > 0) {
                    combinedItems.push(...items);
                }
            });

            if (combinedItems.length > 0) {
                // Return one single section
                sections.push({ id: 'all', name: 'All Items', items: combinedItems });
            }
        }
        return sections;
    }, [groupedItems, selectedCategory, visibleCategories, initialCategories]);

    const renderItemCard = (item: POSItem) => {
        const isService = 'servicePrice' in item;
        const price = isService ? (item as Service).servicePrice : (item as Product).price;
        const hasVariants = isService && (item as Service).variants && (item as Service).variants!.length > 0;

        // Create unique key by prefixing with item type
        const itemKey = isService ? `svc-${item._id}` : `prd-${item._id}`;

        let priceDisplay: React.ReactNode;

        if (hasVariants) {
            const variants = (item as Service).variants!;
            const prices = variants.map(v => typeof v.price === 'number' ? v.price : parseFloat(String(v.price)));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            if (minPrice === maxPrice) {
                priceDisplay = formatCurrency(minPrice);
            } else {
                priceDisplay = `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
            }
        } else {
            priceDisplay = formatCurrency(typeof price === 'number' ? price : parseFloat(String(price)));
        }

        return (
            <button
                key={itemKey}
                onClick={() => handleItemClick(item)}
                className="p-4 outline-none bg-gray-100 w-full h-[150px]
                border border-transparent rounded-md
                transform transition-all duration-200
                hover:bg-gray-50 hover:scale-[1.02] hover:shadow-lg
                text-left flex flex-col justify-between
                active:cursor-pointer"
            >
                <div>
                    <h3 className="font-semibold text-lg tracking-medium truncate capitalize">{item.name}</h3>
                    {isService && ((item as Service).durationMinutes ?? 0) > 0 && (
                        <p className="text-xs text-gray-400 mt-1">{(item as Service).durationMinutes} mins</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 mb-2 line-clamp-2">
                        {isService ? (item as Service).description : `SKU: ${(item as Product).sku}`}
                    </p>
                </div>
                <div className="mt-2">
                    {hasVariants && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-sky-100 text-sky-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                            {(item as Service).variants!.length} Variants
                        </span>
                    )}
                    <p className="text-md font-medium text-gray-700">
                        {priceDisplay}
                    </p>
                </div>
            </button>
        );
    };

    return (
        // The main container is now a flex column to stack the header and the grid
        <div className="flex-1 flex flex-col overflow-hidden bg-white">

            {/* 1. PRODUCT GRID HEADER (Fixed Height, Non-Scrolling) */}
            <div className="px-6 py-4 shrink-0 flex flex-col z-10 transition-all duration-300 ease-in-out overflow-hidden border-b border-transparent">

                {/* Category Filter Pills & Search */}
                <div className="flex justify-between items-center h-[52px]">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide p-1.5 bg-gray-100 font-base min-w-0 rounded-full items-center">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-1.5 rounded-full text-sm transition whitespace-nowrap shrink-0
                                ${selectedCategory === 'all'
                                    ? 'bg-white text-gray-900 font-medium shadow-sm'
                                    : 'bg-transparent text-gray-500 hover:bg-white/50 hover:text-gray-700'}`}
                        >
                            All ({allItems.length})
                        </button>
                        {visibleCategories.map(cat => (
                            <button
                                key={cat._id}
                                onClick={() => setSelectedCategory(cat._id)}
                                className={`px-4 py-1.5 rounded-full text-sm transition whitespace-nowrap shrink-0 capitalize
                                    ${selectedCategory === cat._id
                                        ? 'bg-white text-gray-900 font-medium shadow-sm'
                                        : 'bg-transparent text-gray-500 hover:bg-white/50 hover:text-gray-700'
                                    }
                                `}
                            >
                                {cat.name} ({groupedItems[cat._id]?.length || 0})
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-72 shrink-0 ml-4 group">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        <input
                            name="search"
                            type="search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 border border-transparent rounded-full
                                       text-gray-700 placeholder-gray-400
                                       focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-100 focus:outline-none
                                       transition-all duration-200 ease-in-out shadow-sm hover:bg-gray-100/80"
                        />
                    </div>
                </div>
            </div>

            {/* 2. PRODUCT ITEMS AREA (Scrollable Area, Fills Remaining Space) */}
            {sectionsToRender.length === 0 ? (
                <div className="flex justify-center items-center flex-1 p-6">
                    <div className="text-center max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                        <p className="text-gray-500">
                            {searchTerm
                                ? `We couldn't find any items matching "${searchTerm}"`
                                : "There are no items available in this category."}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-lime-600 font-medium hover:text-lime-700 hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                // This div handles the scrolling for the product cards
                <div
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto p-6 space-y-8 bg-white scrollbar-hide"
                >
                    {sectionsToRender.map(section => (
                        <div key={section.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                                {section.items.map(item => renderItemCard(item))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedService && (
                <VariantSelector
                    service={selectedService}
                    onSelect={(variant) => addServiceToCart(selectedService, variant)}
                    onClose={() => setSelectedService(null)}
                />
            )}
        </div>
    );
}