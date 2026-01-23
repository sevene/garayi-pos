'use client';

import React from 'react';
import { Service } from '@/lib/types';
import { useSettings } from '@/hooks/useSettings';

interface VariantSelectorProps {
    service: Service;
    onSelect: (variant: { name: string; price: number }) => void;
    onClose: () => void;
}

export function VariantSelector({ service, onSelect, onClose }: VariantSelectorProps) {
    const { formatCurrency } = useSettings();
    if (!service.variants || service.variants.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                        <p className="text-sm text-gray-500">Select a variation</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    >
                        X
                    </button>
                </div>

                <div className="p-6 grid gap-3 max-h-[60vh] overflow-y-auto">
                    {service.variants.map((variant, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(variant)}
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-500 transition-all group text-left"
                        >
                            <span className="font-medium text-gray-700 group-hover:text-lime-700">
                                {variant.name}
                            </span>
                            <span className="font-bold text-lime-600 bg-lime-50 px-2.5 py-1 rounded-lg text-sm">
                                {formatCurrency(variant.price)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
