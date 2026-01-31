import { getDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = await getDB();

        const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Normalize ID and map fields for frontend compatibility
        const normalizedProduct = {
            ...product,
            _id: String(product.id),
            price: product.price, // Map price
            soldBy: product.unit_type,  // Map unit_type to soldBy
            showInPOS: Boolean(product.show_in_pos), // Map integer to boolean
            image: product.image_url // Map snake_case to camelCase
        };

        return NextResponse.json(normalizedProduct);
    } catch (e: any) {
        console.error("Product Fetch Error:", e);
        return NextResponse.json({ message: e.message || 'Failed to fetch product' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = await getDB();
        const body = await req.json() as any;

        console.log("Updating Product - Body:", JSON.stringify(body, null, 2));

        // Check if we are doing a partial update (e.g. toggle POS) or full update
        // If 'name' is missing, it's likely a partial update.
        // However, a robust way involves checking keys.

        const updates: string[] = [];
        const values: any[] = [];

        const { name, sku, category, price, volume, soldBy, cost, stock, showInPOS, image } = body;

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (sku !== undefined) { updates.push('sku = ?'); values.push(sku); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }

        if (price !== undefined) {
            const numericPrice = parseFloat(String(price));
            updates.push('price = ?');
            values.push(numericPrice);
        }

        if (volume !== undefined) { updates.push('volume = ?'); values.push(volume); }
        if (soldBy !== undefined) { updates.push('unit_type = ?'); values.push(soldBy); }
        if (cost !== undefined) { updates.push('cost = ?'); values.push(cost); }
        if (stock !== undefined) { updates.push('stock_quantity = ?'); values.push(stock); }

        if (showInPOS !== undefined) {
            updates.push('show_in_pos = ?');
            values.push(showInPOS ? 1 : 0);
        }

        if (image !== undefined) { updates.push('image_url = ?'); values.push(image); }

        if (updates.length > 0) {
            values.push(id); // For WHERE clause
            const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
            console.log("Partial Update Query:", query);
            await db.prepare(query).bind(...values).run();
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Product Update Error:", e);
        return NextResponse.json({
            message: e.message || 'Failed to update product',
            details: e.toString()
        }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = await getDB();

        await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Product Delete Error:", e);
        return NextResponse.json({ message: e.message || 'Failed to delete product' }, { status: 500 });
    }
}
