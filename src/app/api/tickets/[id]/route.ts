import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        const body = await req.json() as any;

        // Parse plate if needed
        let plateNumber = body.plateNumber || null;
        if (!plateNumber && body.name && body.name.includes(' - ')) {
            const parts = body.name.split(' - ');
            if (parts.length > 1) {
                plateNumber = parts[1];
            }
        }

        // Calculate subtotal from items if not provided
        const subtotal = body.subtotal || (body.items?.reduce((sum: number, item: any) =>
            sum + (Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0) || 0);
        const taxRate = body.taxRate ?? 0; // Tax rate as decimal (e.g., 0.12 for 12%)
        const taxAmount = body.tax ?? (subtotal * taxRate);
        const total = body.total || (subtotal + taxAmount);

        // Update Ticket Header
        const res = await db.prepare(`
            UPDATE tickets SET
                subtotal = ?,
                tax_rate = ?,
                tax_amount = ?,
                total = ?,
                status = ?,
                customer_id = ?,
                plate_number = ?,
                name = ?,
                payment_method = ?,
                completed_at = CASE WHEN ? IN ('COMPLETED', 'PAID') AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE id = ?
        `).bind(
            subtotal,
            taxRate,
            taxAmount,
            total,
            body.status || 'PENDING',
            body.customer || null,
            plateNumber,
            body.name || `Order #${id}`,
            body.paymentMethod || null,
            body.status || 'PENDING',
            id
        ).run();

        if (!res.success) {
            return NextResponse.json({ error: 'Failed to update ticket' }, { status: 404 }); // or 500
        }

        // Update Items (delete all and re-insert)
        // Similar to customer vehicles, it's safer to full sync for a cart
        if (body.items && Array.isArray(body.items)) {
            await db.prepare('DELETE FROM ticket_items WHERE ticket_id = ?').bind(id).run();

            const stmt = db.prepare(`
                INSERT INTO ticket_items (ticket_id, product_id, product_name, quantity, unit_price, item_type, item_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            const batch = body.items.map((item: any) => {
                let itemId = item.productId;
                if (itemId && String(itemId).includes('-')) {
                    itemId = String(itemId).split('-')[0];
                }
                return stmt.bind(
                    id,
                    item.productId,
                    item.productName,
                    item.quantity,
                    item.unitPrice,
                    'service',
                    itemId
                );
            });

            for (const b of batch) {
                await b.run();
            }
        }

        return NextResponse.json({ success: true, _id: id, name: body.name });
    } catch (e) {
        console.error("Ticket PUT Error:", e);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;

        // Delete Items
        await db.prepare('DELETE FROM ticket_items WHERE ticket_id = ?').bind(id).run();

        // Delete Ticket
        const res = await db.prepare('DELETE FROM tickets WHERE id = ?').bind(id).run();

        if (!res.success) {
            return NextResponse.json({ error: 'Ticket not found or failed to delete' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Ticket DELETE Error:", e);
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }
}
