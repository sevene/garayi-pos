'use client';

export const useSettings = () => {
    // Default values for the PoC
    const settings = {
        currency: 'PHP',
        taxRate: 0.12
    };

    const formatCurrency = (amount: number) => {
        return `₱${amount.toFixed(2)}`;
    };

    return { settings, loading: false, error: null, formatCurrency };
};
