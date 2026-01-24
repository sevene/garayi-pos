import { getCloudflareContext } from '@opennextjs/cloudflare';
import { POSContent } from '@/components/pos/POSContent';
import { MainNav } from '@/components/MainNav';

// We need to define interfaces since we are casting raw DB results
interface DBProduct {
    id: number;
    name: string;
    description: string;
    price_sedan: number;
    price_suv: number;
    price_truck: number;
    category: string;
    duration_minutes: number;
}

export default async function POSPage() {
    let services: any[] = [];
    let products: any[] = [];
    let categories: any[] = [];
    let customers: any[] = [];
    let employees: any[] = [];

    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;

        // 1. Fetch Categories (Static or DB?)
        categories = [
            { _id: 'cat_wash', name: 'Wash' },
            { _id: 'cat_detail', name: 'Detail' },
            { _id: 'cat_addon', name: 'Addon' }
        ];

        // 2. Fetch Products/Services
        const productsRes = await db.prepare('SELECT * FROM products').all();
        const allProducts = productsRes.results as unknown as DBProduct[];

        // Map DB result to Legacy Interface
        services = allProducts.map(p => {
            const catIdMap: Record<string, string> = {
                'Wash': 'cat_wash',
                'Detail': 'cat_detail',
                'Addon': 'cat_addon'
            };
            const catId = catIdMap[p.category] || 'uncategorized';

            return {
                _id: String(p.id),
                name: p.name,
                description: p.description,
                category: { _id: catId, name: p.category },
                sku: 'SVC-' + p.id,
                servicePrice: p.price_sedan,
                price: p.price_sedan,
                prices: {
                    sedan: p.price_sedan,
                    suv: p.price_suv,
                    truck: p.price_truck
                },
                duration: p.duration_minutes,
                showInPos: true
            };
        });

        // 3. Fetch Customers
        const customersRes = await db.prepare('SELECT * FROM customers').all();
        customers = customersRes.results.map((c: any) => ({
            _id: String(c.id),
            name: c.name,
            phone: c.phone,
            plateNumber: c.plate_number,
            vehicleType: c.vehicle_type
        }));

        // 4. Employees
        employees = [
            { _id: 'E001', name: 'Staff 1', role: 'Staff' }
        ];

    } catch (e) {
        console.error("Failed to load POS data", e);
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            <MainNav />
            <POSContent
                initialServices={services}
                initialProducts={products}
                initialCategories={categories}
                initialCustomers={customers}
                initialEmployees={employees}
            />
        </div>
    );
}
