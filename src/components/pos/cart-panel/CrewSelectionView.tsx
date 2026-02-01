'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import {
    ChevronLeftIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    UserGroupIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface CrewSelectionViewProps {
    onBack: () => void;
}

const CrewSelectionView: React.FC<CrewSelectionViewProps> = ({ onBack }) => {
    const {
        employees,
        selectedCrew,
        toggleCrewMember,
        clearCrew
    } = useCart();

    const [searchTerm, setSearchTerm] = useState('');

    // Filter employees (only show staff/crew, not admins)
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

    // Get selected crew details
    const selectedCrewMembers = useMemo(() => {
        return employees.filter((emp: any) => selectedCrew.includes(emp._id));
    }, [employees, selectedCrew]);

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            {/* View Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-lime-600" />
                    <h2 className="text-lg font-bold text-gray-800">Assign Service Crew</h2>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        id="crewSearch"
                        name="crewSearch"
                        type="text"
                        placeholder="Search crew members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-lime-500 outline-none text-gray-700 bg-white shadow-sm transition-all"
                        autoFocus
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {/* Currently Assigned Section */}
                {selectedCrewMembers.length > 0 && (
                    <div className="p-4 border-b border-lime-100 bg-lime-50/50">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-lime-700 uppercase tracking-wider">
                                Currently Assigned ({selectedCrewMembers.length})
                            </h3>
                            <button
                                onClick={clearCrew}
                                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="space-y-2">
                            {selectedCrewMembers.map((emp: any) => (
                                <div
                                    key={emp._id}
                                    className="bg-white p-3 rounded-xl border border-lime-200 shadow-sm flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center text-lime-700 font-bold">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{emp.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{emp.role || 'Staff'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleCrewMember(emp._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Crew List */}
                <div className="p-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-2">
                        {selectedCrewMembers.length > 0 ? 'Add More Crew' : 'Available Crew'}
                    </h3>
                    <div className="space-y-1">
                        {filteredEmployees.map((emp: any) => {
                            const isSelected = selectedCrew.includes(emp._id);
                            return (
                                <button
                                    key={emp._id}
                                    onClick={() => toggleCrewMember(emp._id)}
                                    className={`w-full flex items-center p-3 rounded-xl transition-colors text-left group ${isSelected
                                            ? 'bg-lime-50 border border-lime-200'
                                            : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 transition-all ${isSelected
                                            ? 'bg-lime-500 text-white'
                                            : 'bg-gray-200 text-gray-500 group-hover:bg-white group-hover:shadow-sm'
                                        }`}>
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className={`font-semibold ${isSelected ? 'text-lime-800' : 'text-gray-800'
                                                }`}>
                                                {emp.name}
                                            </span>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5 text-lime-600" />}
                                        </div>
                                        <p className="text-xs text-gray-500 capitalize">{emp.role || 'Staff'}</p>
                                    </div>
                                </button>
                            );
                        })}

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                {searchTerm ? 'No crew members found.' : 'No crew members available.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={onBack}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-[0.98]"
                >
                    {selectedCrewMembers.length > 0
                        ? `Confirm (${selectedCrewMembers.length} Crew)`
                        : 'Done'}
                </button>
            </div>
        </div>
    );
};

export default CrewSelectionView;
