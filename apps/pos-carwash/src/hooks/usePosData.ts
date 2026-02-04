import { useState, useEffect } from 'react';
import { db } from '@/lib/db-client';
import { toast } from 'sonner';

export function usePosData(initialData: any) {
    const [data, setData] = useState(initialData);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // 1. Initial Load Check
        const syncData = async () => {
            console.log("Starting POS Data Sync...");

            try {
                // Try fetching from API with cache busting
                const res = await fetch(`/api/pos/sync?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });

                if (!res.ok) {
                    throw new Error(`Sync failed: ${res.status} ${res.statusText}`);
                }

                const newData = await res.json();
                console.log("Fetched fresh data from API");

                // Update Local DB
                // Dexie transaction takes an array of tables if more than 5? No, it's variadic but recent versions might prefer array.
                // Let's use the array syntax which is safer for many tables.
                const tables = [db.categories, db.products, db.services, db.customers, db.employees, db.inventory];

                await db.transaction('rw', tables, async () => {
                    const payload = newData as any; // Type assertion

                    await db.categories.clear();
                    await db.categories.bulkAdd(payload.categories);

                    await db.products.clear();
                    await db.products.bulkAdd(payload.products);

                    await db.services.clear();
                    await db.services.bulkAdd(payload.services);

                    await db.customers.clear();
                    await db.customers.bulkAdd(payload.customers);

                    await db.employees.clear();
                    await db.employees.bulkAdd(payload.employees);

                    // Convert inventory map to array for Dexie
                    const invArray = Object.entries(payload.inventory).map(([k, v]) => ({ id: k, stock: v }));
                    await db.inventory.clear();
                    await db.inventory.bulkAdd(invArray);
                });

                // Update State
                setData(newData);
                setIsOffline(false);
                toast.success("POS Data Synced");

            } catch (error) {
                console.warn("Offline or Sync Failed, loading from local DB...", error);
                setIsOffline(true);

                // Load from Dexie
                const dCategories = await db.categories.toArray();
                const dProducts = await db.products.toArray();
                const dServices = await db.services.toArray();
                const dCustomers = await db.customers.toArray();
                const dEmployees = await db.employees.toArray();
                const dInventoryArr = await db.inventory.toArray();

                // Reconstruct inventory map
                const dInventory: Record<string, number> = {};
                dInventoryArr.forEach((item: any) => {
                    dInventory[item.id] = item.stock;
                });

                if (dCategories.length > 0) {
                    setData({
                        categories: dCategories,
                        products: dProducts,
                        services: dServices,
                        customers: dCustomers,
                        employees: dEmployees,
                        inventory: dInventory
                    });
                    toast.info("Loaded Offline Data");
                } else {
                    toast.error("Offline and no local data found!");
                }
            }
        };

        const syncPendingOrders = async () => {
            // 1. Check for pending orders
            // Uses the 'status' index we defined in db-client
            const pendingOrders = await db.orders.where('status').equals('pending').toArray();

            if (pendingOrders.length === 0) return;

            console.log(`Found ${pendingOrders.length} pending offline orders. Syncing...`);
            let syncedCount = 0;

            for (const order of pendingOrders) {
                try {
                    // Determine URL based on order ID existence?
                    // Usually offline orders are NEW, so POST /api/tickets
                    const res = await fetch('/api/tickets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(order.payload)
                    });

                    if (res.ok) {
                        // Mark as synced/delete
                        await db.orders.update(order.id!, { status: 'synced' });
                        // Or delete it if we don't want history clutter
                        // await db.orders.delete(order.id!);
                        syncedCount++;
                    } else {
                        console.error("Failed to sync order", order.id, await res.text());
                    }
                } catch (err) {
                    console.error("Network error syncing order", order.id, err);
                }
            }

            if (syncedCount > 0) {
                toast.success(`Synced ${syncedCount} offline orders!`);
                // Trigger re-fetch of tickets if possible?
                // We don't have access to fetchOpenTickets here easily without context.
                // But the data should be safe in the cloud now.
            }
        };

        const syncPendingMutations = async () => {
            const pendingMutations = await db.mutations.where('status').equals('pending').toArray();
            if (pendingMutations.length === 0) return;

            console.log(`Found ${pendingMutations.length} pending mutations. Syncing...`);
            let mutationCount = 0;

            for (const m of pendingMutations) {
                try {
                    let url = '';
                    let method = '';
                    const apiBase = `/api/${m.collection}`;

                    if (m.type === 'create') {
                        method = 'POST';
                        url = apiBase;
                    } else { // update or delete
                        method = m.type === 'update' ? 'PUT' : 'DELETE';
                        url = `${apiBase}/${m.payload.id || m.payload._id}`;

                        // If it was a temp ID, the server won't know it.
                        // Note: Complex handling needed here if we depend on the REAL ID returned by create.
                        // But for now, we assume simple independent updates or user accepts risk.
                    }

                    const res = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: m.type !== 'delete' ? JSON.stringify(m.payload) : undefined
                    });

                    if (res.ok) {
                        await db.mutations.update(m.id!, { status: 'synced' });
                        mutationCount++;
                    } else {
                        console.error("Mutation sync failed", m, await res.text());
                    }
                } catch (e) {
                    console.error("Network error syncing mutation", m, e);
                }
            }

            if (mutationCount > 0) {
                toast.success(`Synced ${mutationCount} offline changes`);
            }
        };

        syncData();
        if (navigator.onLine) {
            syncPendingOrders();
            syncPendingMutations();
        }

        // Listen for online status
        const handleOnline = () => {
            setIsOffline(false);
            syncData(); // Re-sync when back online
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };

    }, []);

    return { data, isOffline };
}
