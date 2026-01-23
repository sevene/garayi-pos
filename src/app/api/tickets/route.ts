import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(req: Request) {
    const { env } = getRequestContext();
    const db = env.DB;

    try {
        const body = await req.json() as { items: any[], total: number };
        const { items, total } = body;

        // 1. Insert Ticket
        const ticketRes = await db.prepare(
            'INSERT INTO tickets (total, status) VALUES (?, ?) RETURNING id'
        ).bind(total, 'COMPLETED').run();

        // D1 .run() returns meta, but for RETURNING we might need .first() or similar depending on the exact driver mapping in next-on-pages
        // Usually .run() returns { success, meta: { last_row_id, changes ... } } but D1 also supports returning.
        // Let's use last_row_id from meta if RETURNING isn't easily parsed spread out.
        // Actually, simply:
        const ticketId = ticketRes.meta.last_row_id;

        // 2. Insert Items
        const stmt = db.prepare('INSERT INTO ticket_items (ticket_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)');
        const batch = items.map((item: any) => stmt.bind(ticketId, item._id, item.name, item.quantity, item.price));
        await db.batch(batch);

        return Response.json({ success: true, ticketId });
    } catch (error) {
        return Response.json({ error: 'Failed to create ticket', details: error }, { status: 500 });
    }
}
