import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;

        const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Normalize ID to string for legacy frontend compatibility
        const normalizedProduct = { ...product, _id: String(product.id) };

        return NextResponse.json(normalizedProduct);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        const body = await req.json() as any;

        const { name, sku, category, price, volume, soldBy, cost, stock, showInPos, image } = body;

        // Note: D1 doesn't support easy dynamic updates without building the query manually
        // For simplicity, we update all fields, assuming full object availability or handling undefined
        // A better approach is dynamic query building.

        await db.prepare(`
            UPDATE products SET
                name = ?,
                sku = ?,
                category = ?,
                price_sedan = ?,
                price_suv = ?,
                price_truck = ?,
                volume = ?,
                unit_type = ?,
                cost = ?,
                stock_quantity = ?,
                show_in_pos = ?,
                image_url = ?
            WHERE id = ?
        `).bind(
            name,
            sku,
            category,
            price, price, price, // basic implementation updates all prices
            volume,
            soldBy,
            cost,
            stock,
            showInPos ? 1 : 0,
            image,
            id
        ).run();

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;

        await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
