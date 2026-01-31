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

            // Populate Customer Details (needed for Orders page)
            if (ticket.customer_id) {
                try {
                    const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(ticket.customer_id).first();
                    if (customer) {
                        // Also fetch cars for snapshot if needed, but let's keep it light
                        // Fetch vehicles for this customer to show car details
                        const vehicles = await db.prepare('SELECT * FROM customer_vehicles WHERE customer_id = ?').bind(customer.id).all();

                        ticket.customer = {
                            _id: String(customer.id),
                            name: customer.name,
                            contactInfo: customer.phone || customer.email,
                            cars: vehicles.results.map((v: any) => ({
                                plateNumber: v.plate_number,
                                makeModel: v.vehicle_type,
                                color: v.vehicle_color,
                                size: v.vehicle_size
                            }))
                        };
                    } else {
                        ticket.customer = null;
                    }
                } catch (e) {
                    console.error("Failed to populate customer", e);
                    ticket.customer = null;
                }
            } else {
                ticket.customer = null;
            }

            // Map timestamps for frontend
            ticket.createdAt = ticket.created_at;
            ticket.finishedAt = ticket.completed_at; // Renamed DB column
            ticket.completedAt = ticket.completed_at;
            ticket.paymentMethod = ticket.payment_method;

            // Map tax snapshot fields for historical accuracy
            ticket.subtotal = ticket.subtotal ?? 0;
            ticket.taxRate = ticket.tax_rate ?? 0;
            ticket.taxAmount = ticket.tax_amount ?? 0;

            // Ensure name is set (fallback if null for old tickets)
            if (!ticket.name) {
                ticket.name = `Order #${ticket.id}`;
            }
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

        console.log("Creating Ticket. Body:", JSON.stringify(body)); // Debug log

        // Insert Ticket
        // Insert Ticket
        // Attempt to parse plate number from name if not provided (Format: Name - Plate1, Plate2)
        let plateNumber = body.plateNumber || null;
        if (!plateNumber && body.name && body.name.includes(' - ')) {
            const parts = body.name.split(' - ');
            if (parts.length > 1) {
                plateNumber = parts[1];
            }
        }

        const status = body.status || 'QUEUED';
        let completedAt = null;
        if (status === 'COMPLETED' || status === 'PAID') {
            completedAt = new Date().toISOString();
        }

        // Calculate subtotal from items if not provided
        const subtotal = body.subtotal || (body.items?.reduce((sum: number, item: any) =>
            sum + (Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0) || 0);
        const taxRate = body.taxRate ?? 0; // Tax rate as decimal (e.g., 0.12 for 12%)
        const taxAmount = body.tax ?? (subtotal * taxRate);
        const total = body.total || (subtotal + taxAmount);

        const res = await db.prepare(`
            INSERT INTO tickets (created_at, subtotal, tax_rate, tax_amount, total, status, customer_id, plate_number, name, payment_method, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
        `).bind(
            new Date().toISOString(),
            subtotal,
            taxRate,
            taxAmount,
            total,
            status,
            body.customer || null,
            plateNumber,
            body.name || 'New Order',
            body.paymentMethod || null,
            completedAt
        ).first();

        if (!res) throw new Error("Insert failed");
        const ticketId = res.id;

        // Insert Items
        if (body.items && Array.isArray(body.items)) {
            const stmt = db.prepare(`
                INSERT INTO ticket_items (ticket_id, product_id, product_name, quantity, unit_price, item_type, item_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            const batch = body.items.map((item: any) => {
                let itemId = item.productId;
                // Extract base ID if variant (e.g. "6-Small" -> "6")
                if (itemId && String(itemId).includes('-')) {
                    itemId = String(itemId).split('-')[0];
                }
                return stmt.bind(
                    ticketId,
                    item.productId,
                    item.productName,
                    item.quantity,
                    item.unitPrice,
                    'service', // Default to service for now
                    itemId
                );
            });

            // Loop for batch insertion
            for (const b of batch) {
                await b.run();
            }
        }

        return NextResponse.json({
            success: true,
            _id: String(ticketId),
            name: body.name || `Order #${ticketId}`,
            completedAt,
            paymentMethod: body.paymentMethod
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save ticket' }, { status: 500 });
    }
}
