import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        // Assuming 'products' table holds both services and retail products
        // We might filter by category here if needed, or return all
        const { results } = await db.prepare('SELECT * FROM products').all();
        // Normalize IDs for legacy frontend
        const normalizedResults = results.map((p: any) => ({ ...p, _id: String(p.id) }));
        return NextResponse.json(normalizedResults);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
export async function POST(req: Request) {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        const body = await req.json() as {
            name: string;
            sku: string;
            category: string;
            price: number;
            volume: string;
            soldBy: string;
            cost: number;
            stock: number;
            showInPos: boolean;
            image: string;
        };

        // Infer types or basic validation could go here
        const { name, sku, category, price, volume, soldBy, cost, stock, showInPos, image } = body;

        const result = await db.prepare(`
            INSERT INTO products (name, sku, category, price_sedan, price_suv, price_truck, volume, unit_type, cost, stock_quantity, show_in_pos, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            name,
            sku,
            category,
            price, // price_sedan
            price, // price_suv (copy)
            price, // price_truck (copy)
            volume,
            soldBy,
            cost,
            stock,
            showInPos ? 1 : 0,
            image
        ).run();

        if (result.success) {
            return NextResponse.json({ success: true, id: result.meta.last_row_id }, { status: 201 });
        } else {
            return NextResponse.json({ error: 'Failed to insert product' }, { status: 500 });
        }

    } catch (e: any) {
        console.error("Product Creation Error", e);
        return NextResponse.json({ error: e.message || 'Failed to create product' }, { status: 500 });
    }
}
