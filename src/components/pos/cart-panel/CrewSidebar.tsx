'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

/**
 * CrewSidebar - Appears when user wants to assign crew to cart items.
 * Shows services from the cart and allows crew assignment per service.
 */
const CrewSidebar = () => {
    const {
        employees,
        cartItems,
        itemCrew,
        toggleItemCrew,
        getItemCrew,
        closeCrewSidebar,
        activeCrewItemId
    } = useCart();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(activeCrewItemId);

    // Filter to only show service items (services have sku === 'SRV')
    const serviceItems = useMemo(() => {
        return cartItems.filter(item => item.sku === 'SRV');
    }, [cartItems]);

    // Filter employees by search
    const filteredEmployees = useMemo(() => {
        const crewList = employees.filter((emp: any) =>
            emp.role !== 'admin' || employees.length <= 1
        );

        if (!searchTerm) return crewList;
        const lower = searchTerm.toLowerCase();
        return crewList.filter((emp: any) =>
            emp.name.toLowerCase().includes(lower)
        );
    }, [searchTerm, employees]);

    // Get crew for currently selected item
    const currentItemCrew = selectedItemId ? getItemCrew(selectedItemId) : [];

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-lime-50">
                <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-lime-600" />
                    <h2 className="text-lg font-bold text-gray-800">Assign Crew</h2>
                </div>
                <button
                    onClick={closeCrewSidebar}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Service Items Selection */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Service</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                    {serviceItems.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-2">No items in cart</p>
                    ) : (
                        serviceItems.map((item) => {
                            const crewCount = getItemCrew(item._id).length;
                            const isSelected = selectedItemId === item._id;
                            return (
                                <button
                                    key={item._id}
                                    onClick={() => setSelectedItemId(item._id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${isSelected
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-white border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <WrenchScrewdriverIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                    {crewCount > 0 && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {crewCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Crew Search */}
            {selectedItemId && (
                <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            id="crewSidebarSearch"
                            name="crewSidebarSearch"
                            type="text"
                            placeholder="Search crew..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-400 outline-none text-sm transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Crew List */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2">
                {!selectedItemId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                        <WrenchScrewdriverIcon className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-sm text-center">Select a service above to assign crew</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredEmployees.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                {searchTerm ? 'No crew found' : 'No crew available'}
                            </div>
                        ) : (
                            filteredEmployees.map((emp: any) => {
                                const isAssigned = currentItemCrew.includes(emp._id);
                                return (
                                    <button
                                        key={emp._id}
                                        onClick={() => toggleItemCrew(selectedItemId, emp._id)}
                                        className={`w-full flex items-center p-3 rounded-xl transition-all text-left ${isAssigned
                                            ? 'bg-green-50 border border-green-200'
                                            : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mr-3 transition-all ${isAssigned
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <span className={`font-semibold text-sm ${isAssigned ? 'text-green-800' : 'text-gray-800'
                                                    }`}>
                                                    {emp.name}
                                                </span>
                                                {isAssigned && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                                            </div>
                                            <p className="text-xs text-gray-400 capitalize">{emp.role || 'Staff'}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
                {selectedItemId && currentItemCrew.length > 0 ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Assigned to this service:</p>
                            <p className="text-sm font-bold text-gray-800">
                                {currentItemCrew.length} crew member{currentItemCrew.length > 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={closeCrewSidebar}
                            className="px-4 py-2 bg-lime-600 text-white text-sm font-bold rounded-lg hover:bg-lime-700 transition-colors shadow-sm shadow-lime-200"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={closeCrewSidebar}
                        className="w-full py-3 bg-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};

export default CrewSidebar;
