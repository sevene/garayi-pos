import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        // 'tickets' table exists in schema.sql
        // We might need to join with ticket_items, but let's start simple
        const { results } = await db.prepare('SELECT * FROM tickets WHERE status != ?').bind('PAID').all();

        // Legacy frontend expects nested 'items' array. D1 returns flat rows.
        // We would need to fetch items for each ticket.
        // Optimization: Fetch all active tickets and all their items in two queries.

        const tickets = results as any[];

        // For now, return empty items array if complexity is high, or implement proper hydration.
        // Let's implement hydration for a better experience.

        if (tickets.length === 0) return NextResponse.json([]);

        const ticketIds = tickets.map(t => t.id).join(',');
        // IN clause query
        // D1 'bind' limitation might exist, but manual string constraint is unsafe.
        // For now, let's just return tickets. Client might load details individually?
        // Legacy `useCart` expects `items` array populated.

        // Simplest approach: Loop (not efficient but works for low volume)
        for (const ticket of tickets) {
            const itemsRes = await db.prepare('SELECT * FROM ticket_items WHERE ticket_id = ?').bind(ticket.id).all();
            ticket.items = itemsRes.results.map((i: any) => ({
                productId: i.product_id ? String(i.product_id) : '0',
                productName: i.product_name,
                quantity: i.quantity,
                unitPrice: i.unit_price,
                _id: i.id // Legacy might need this
            }));
            ticket._id = String(ticket.id); // Legacy uses string _id
        }

        return NextResponse.json(tickets);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        const body = await req.json() as any;

        // Insert Ticket
        const res = await db.prepare(`
            INSERT INTO tickets (created_at, total, status, customer_id, plate_number)
            VALUES (?, ?, ?, ?, ?) RETURNING id
        `).bind(
            new Date().toISOString(),
            body.total || 0,
            body.status || 'QUEUED',
            body.customer || null,
            body.plateNumber || null // Assuming frontend sends this
        ).first();

        if (!res) throw new Error("Insert failed");
        const ticketId = res.id;

        // Insert Items
        if (body.items && Array.isArray(body.items)) {
            const stmt = db.prepare(`
                INSERT INTO ticket_items (ticket_id, product_id, product_name, quantity, unit_price)
                VALUES (?, ?, ?, ?, ?)
            `);
            const batch = body.items.map((item: any) => stmt.bind(
                ticketId,
                item.productId,
                item.productName,
                item.quantity,
                item.unitPrice
            ));
            await db.batch(batch);
        }

        return NextResponse.json({ success: true, _id: String(ticketId), name: body.name || `Order #${ticketId}` });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save ticket' }, { status: 500 });
    }
}
