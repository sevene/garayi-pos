'use client';

import { useState, useMemo, useContext, createContext, useEffect, useCallback } from 'react';
import { Product } from '../lib/products';
import { toast } from 'sonner';

// =========================================================================
// TYPES
// =========================================================================

export interface CartItem {
    product: Product;
    quantity: number;
    price: number;
    itemTotal: number;
    name: string;
    sku: string;
    _id: string;
}

export interface OpenTicket {
    _id: string;
    name: string;
    total: number;
    cashierId: string;
    timestamp: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
    }[];
    createdAt: string;
    updatedAt: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customer?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crew?: any[];
}

type CartViewMode = 'TICKETS' | 'CART';

interface CartContextType {
    // State
    cartItems: CartItem[];
    viewMode: CartViewMode;
    openTickets: OpenTicket[];
    currentTicketId: string | null;
    currentTicketName: string;
    isProcessing: boolean;
    isTicketsLoading: boolean;
    checkoutError: string | null;

    // Totals
    subtotal: number;
    tax: number;
    total: number;
    taxRate: number;
    currency: string;
    formatCurrency: (amount: number) => string;

    // Actions
    addItemToCart: (product: Product) => void;
    updateItemQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    setCurrentTicketName: (name: string) => void;
    switchToCartView: () => void;
    switchToTicketsView: () => void;

    // API / Tickets
    fetchOpenTickets: () => Promise<void>;
    loadTicket: (ticket: OpenTicket) => void;
    checkout: (paymentMethod: string) => Promise<void>;
    saveTicket: (name: string) => Promise<void>;
    deleteTicket: (ticketId: string) => Promise<void>;
    // Customer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCustomer: (customer: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentCustomer: any;

    // Crew
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    employees: any[];
    selectedCrew: string[]; // IDs
    toggleCrewMember: (employeeId: string) => void;
}

// =========================================================================
// HOOK IMPLEMENTATION
// =========================================================================

const CartContext = createContext<CartContextType | undefined>(undefined);
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const safeFloat = (val: string | number | undefined | null): number => {
    const num = parseFloat(String(val));
    return isNaN(num) ? 0 : num;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useCartState = (initialCustomers: any[] = [], initialEmployees: any[] = []) => {
    // --- State ---
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [taxRate, setTaxRate] = useState(0);
    const [currency, setCurrency] = useState('PHP');

    // Status Flags
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Ticket / View Management
    const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
    const [currentTicketName, setCurrentTicketName] = useState('New Order');
    const [viewMode, setViewMode] = useState<CartViewMode>('TICKETS');
    const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);

    // Customer Management
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const [customers, setCustomers] = useState<any[]>(initialCustomers);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentCustomer, setCurrentCustomer] = useState<any | null>(null);

    // Crew Management
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employees] = useState<any[]>(initialEmployees);
    const [selectedCrew, setSelectedCrew] = useState<string[]>([]);

    // --- Fetch Settings (Tax Rate) ---
    useEffect(() => {
        const fetchSettings = async () => {
            if (!API_URL) return;
            try {
                const res = await fetch(`${API_URL}/settings`);
                if (res.ok) {
                    const data = await res.json() as { tax_rate?: number; currency?: string };
                    if (data.tax_rate !== undefined) {
                        setTaxRate(data.tax_rate);
                    }
                    if (data.currency) {
                        setCurrency(data.currency);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };
        fetchSettings();
    }, []);

    // --- Computed Totals (Memoized) ---
    const { subtotal, tax, total } = useMemo(() => {
        const sub = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const t = sub * taxRate;
        return {
            subtotal: sub,
            tax: t,
            total: sub + t
        };
    }, [cartItems, taxRate]);

    const formatCurrency = useCallback((amount: number) => {
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₱';
        return `${symbol}${amount.toFixed(2)}`;
    }, [currency]);

    // --- Actions ---

    const addItemToCart = useCallback((product: Product) => {
        const price = safeFloat(product.price);

        if (cartItems.length === 0) {
            setCurrentTicketId(null);
            setCurrentTicketName('New Order');
        }

        setViewMode('CART');

        setCartItems(prev => {
            const existing = prev.find(item => item._id === product._id);

            if (existing) {
                return prev.map(item => item._id === product._id
                    ? { ...item, quantity: item.quantity + 1, itemTotal: (item.quantity + 1) * price }
                    : item
                );
            }

            return [...prev, {
                product,
                quantity: 1,
                price,
                itemTotal: price,
                name: product.name,
                sku: product.sku,
                _id: product._id
            }];
        });
    }, [cartItems.length]);

    const updateItemQuantity = useCallback((productId: string, quantity: number) => {
        const safeQty = Math.max(1, quantity);
        setCartItems(prev => prev.map(item => {
            if (item._id === productId) {
                return { ...item, quantity: safeQty, itemTotal: safeQty * item.price };
            }
            return item;
        }));
    }, []);

    const removeItem = useCallback((productId: string) => {
        setCartItems(prev => prev.filter(item => item._id !== productId));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        setCurrentTicketId(null);
        setCurrentTicketName('New Order');
        setCurrentCustomer(null);
        setSelectedCrew([]);
        setCheckoutError(null);
    }, []);

    // --- View Switching ---
    const switchToCartView = useCallback(() => setViewMode('CART'), []);
    const switchToTicketsView = useCallback(() => setViewMode('TICKETS'), []);

    const toggleCrewMember = useCallback((employeeId: string) => {
        setSelectedCrew(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    }, []);

    // --- API Helpers ---

    const fetchOpenTickets = useCallback(async () => {
        if (!API_URL) return;
        setIsTicketsLoading(true);
        try {
            const res = await fetch(`${API_URL}/tickets`, { cache: 'no-store' });
            if (!res.ok) throw new Error("Failed to fetch tickets");
            const data = await res.json() as OpenTicket[];
            setOpenTickets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsTicketsLoading(false);
        }
    }, []);

    // Load tickets on mount
    useEffect(() => {
        fetchOpenTickets();
    }, [fetchOpenTickets]);

    const loadTicket = useCallback((ticket: OpenTicket) => {
        const loadedItems: CartItem[] = ticket.items.map(item => {
            const displayName = item.productName || `Item ${item.productId.slice(0, 4)}`;
            return {
                product: {
                    _id: item.productId,
                    name: displayName,
                    sku: 'TICKET',
                    price: item.unitPrice,
                    cost: 0,
                    volume: 0,
                    showInPOS: true
                },
                quantity: item.quantity,
                price: item.unitPrice,
                itemTotal: item.unitPrice * item.quantity,
                _id: item.productId,
                name: displayName,
                sku: 'TICKET'
            };
        });

        setCartItems(loadedItems);
        setCurrentTicketName(ticket.name);
        setCurrentTicketId(ticket._id);

        // Find and set customer if exists
        if (ticket.customer) {
            if (typeof ticket.customer === 'object' && ticket.customer._id) {
                // Populated customer object
                setCurrentCustomer(ticket.customer);
            } else if (typeof ticket.customer === 'string') {
                // ID Reference (Fallback)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const found = customers.find((c: any) => c._id === ticket.customer);
                setCurrentCustomer(found || null);
            } else {
                setCurrentCustomer(null);
            }
        } else {
            setCurrentCustomer(null);
        }

        // Set Crew
        if (ticket.crew && Array.isArray(ticket.crew)) {
            // Check if populated objects or IDs
            const crewIds = ticket.crew.map((c: any) => typeof c === 'object' ? c._id : c);
            setSelectedCrew(crewIds);
        } else {
            setSelectedCrew([]);
        }

        setViewMode('CART');
    }, [customers]);

    const buildPayload = useCallback((status: 'PENDING' | 'COMPLETED', nameOverride?: string, paymentMethod?: string) => ({
        status,
        items: cartItems.map(i => ({
            productId: i._id,
            productName: i.name,
            quantity: i.quantity,
            unitPrice: i.price
        })),
        subtotal,
        tax,
        taxRate, // Include tax rate for historical accuracy
        total,
        cashierId: 'POS-T1',
        paymentMethod: paymentMethod || 'Cash',
        timestamp: new Date().toISOString(),
        name: nameOverride || currentTicketName,
        customer: currentCustomer?._id,
        crew: selectedCrew
    }), [cartItems, subtotal, tax, taxRate, total, currentTicketName, currentCustomer, selectedCrew]);

    const saveTicket = useCallback(async (nameToSave: string) => {
        if (cartItems.length === 0 || isProcessing) return;
        if (!API_URL) return setCheckoutError("API Not Configured");

        setIsProcessing(true);
        setCheckoutError(null);

        try {
            const isNew = !currentTicketId;
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew ? (`${API_URL}/tickets`) : (`${API_URL}/tickets/${currentTicketId}`);

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPayload('PENDING', nameToSave))
            });

            if (!res.ok) throw new Error("Save failed");

            const data = await res.json() as { _id: string; name: string };

            setCurrentTicketId(data._id);
            setCurrentTicketName(data.name);

            toast.success(`Ticket ${isNew ? 'Created' : 'Updated'}`);

            fetchOpenTickets();
            switchToTicketsView();
            clearCart();

        } catch (error: unknown) {
            let message = "Error saving ticket";
            if (error instanceof Error) message = error.message;
            setCheckoutError(message);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    }, [cartItems.length, isProcessing, currentTicketId, buildPayload, fetchOpenTickets, switchToTicketsView, clearCart]);

    const deleteTicket = useCallback(async (ticketId: string) => {
        if (!API_URL) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/tickets/${ticketId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete ticket");

            // If we deleted the currently open ticket, clear the cart
            if (currentTicketId === ticketId) {
                clearCart();
            }

            await fetchOpenTickets();
            toast.success("Ticket deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete ticket");
        } finally {
            setIsProcessing(false);
        }
    }, [API_URL, currentTicketId, clearCart, fetchOpenTickets]);

    const checkout = useCallback(async (paymentMethod: string) => {
        if (cartItems.length === 0 || isProcessing) return;
        if (!API_URL) return setCheckoutError("API Not Configured");

        setIsProcessing(true);
        setCheckoutError(null);

        try {
            const isNew = !currentTicketId;
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew ? (`${API_URL}/tickets`) : (`${API_URL}/tickets/${currentTicketId}`);

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPayload('COMPLETED', undefined, paymentMethod))
            });

            if (!res.ok) throw new Error("Checkout failed");

            toast.success(`Checkout Complete (${paymentMethod}): ${formatCurrency(total)}`);

            setCurrentTicketId(null);
            setCurrentTicketName('New Order');
            clearCart();
            await fetchOpenTickets();
            switchToTicketsView();

        } catch (error: unknown) {
            let message = "Checkout Error";
            if (error instanceof Error) message = error.message;
            setCheckoutError(message);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    }, [cartItems.length, isProcessing, currentTicketId, buildPayload, total, clearCart, fetchOpenTickets, switchToTicketsView, formatCurrency]);


    // --- Final Context Value (Memoized) ---
    const contextValue = useMemo<CartContextType>(() => ({
        cartItems,
        viewMode,
        openTickets,
        currentTicketId,
        currentTicketName,
        isProcessing,
        isTicketsLoading,
        checkoutError,
        subtotal,
        tax,
        total,
        taxRate,
        currency,
        formatCurrency,
        addItemToCart,
        updateItemQuantity,
        removeItem,
        clearCart,
        setCurrentTicketName,
        switchToCartView,
        switchToTicketsView,
        fetchOpenTickets,
        loadTicket,
        checkout,
        saveTicket,
        deleteTicket,
        customers,
        setCustomer: setCurrentCustomer,
        currentCustomer,
        employees,
        selectedCrew,
        toggleCrewMember
    }), [
        cartItems, viewMode, openTickets, currentTicketId, currentTicketName,
        isProcessing, isTicketsLoading, checkoutError, subtotal, tax, total, taxRate, currency, formatCurrency,
        addItemToCart, updateItemQuantity, removeItem, clearCart, setCurrentTicketName,
        switchToCartView, switchToTicketsView,
        fetchOpenTickets, loadTicket, checkout, saveTicket, deleteTicket,
        customers, currentCustomer, employees, selectedCrew, toggleCrewMember
    ]);

    return contextValue;
};

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export function CartProvider({ children, initialCustomers, initialEmployees }: { children: React.ReactNode, initialCustomers: any[], initialEmployees: any[] }) {
    const cart = useCartState(initialCustomers, initialEmployees);
    return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}