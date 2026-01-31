import { getDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const search = url.searchParams.get('search') || '';
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const db = await getDB();

        let query = 'SELECT * FROM customers';
        let countQuery = 'SELECT COUNT(*) as total FROM customers';
        const params: any[] = [];

        if (search) {
            const searchClause = ` WHERE name LIKE ? OR phone LIKE ? OR plate_number LIKE ?`;
            query += searchClause;
            countQuery += searchClause;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += ` ORDER BY last_visit DESC LIMIT ${limit} OFFSET ${offset}`;

        // Fetch Customers
        const stmt = db.prepare(query);
        const { results: rawResults } = await (params.length ? stmt.bind(...params) : stmt).all();

        // Fetch Total (for pagination)
        const countStmt = db.prepare(countQuery);
        const totalResult = await (params.length ? countStmt.bind(...params) : countStmt).first<{ total: number }>();

        // Fetch Vehicles for these customers
        // We do this in a second query to avoid complex joins/aggregations that might be slow or complex in D1
        const customerIds = rawResults.map((c: any) => c.id);
        let allVehicles: any[] = [];

        if (customerIds.length > 0) {
            try {
                // Prepare placeholders for IN clause
                const placeholders = customerIds.map(() => '?').join(',');
                const vehiclesRes = await db.prepare(`SELECT * FROM customer_vehicles WHERE customer_id IN (${placeholders})`)
                    .bind(...customerIds)
                    .all();
                allVehicles = vehiclesRes.results;
            } catch (err) {
                console.warn("Failed to fetch customer_vehicles (table might not exist yet?)", err);
            }
        }

        // Map DB columns to Frontend Interface
        const mappedResults = rawResults.map((row: any) => {
            // Get vehicles from new table
            const directVehicles = allVehicles.filter((v: any) => v.customer_id === row.id);

            // Map to frontend interface
            let cars = directVehicles.map((v: any) => ({
                id: v.id,
                plateNumber: v.plate_number,
                makeModel: v.vehicle_type,
                color: v.vehicle_color || '',
                size: v.vehicle_size || ''
            }));

            // Fallback for legacy data if no vehicles in new table but legacy columns exist
            if (cars.length === 0 && row.plate_number) {
                cars.push({
                    id: 'legacy_' + row.id,
                    plateNumber: row.plate_number,
                    makeModel: row.vehicle_type,
                    color: row.vehicle_color || '',
                    size: row.vehicle_size
                });
            }

            return {
                _id: row.id.toString(),
                name: row.name,
                email: row.email || '',
                phone: row.phone || '',
                address: {
                    street: row.address_street || '',
                    city: row.address_city || '',
                    zip: row.address_zip || ''
                },
                notes: row.notes || '',
                cars,
                loyaltyPoints: row.loyalty_points || 0,
                createdAt: row.last_visit // approximate for now
            };
        });

        return NextResponse.json({
            data: mappedResults,
            total: totalResult?.total || 0,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil((totalResult?.total || 0) / limit)
        });

    } catch (e: any) {
        console.error("Customers GET Error:", e);
        return NextResponse.json({ error: e.message || 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as any;
        const db = await getDB();

        // Destructure nested frontend fields to flat DB columns
        const { name, email, phone, address, notes, cars, loyaltyPoints } = body;

        // Keep legacy flat columns populated with the FIRST car for backward compatibility
        const primaryCar = cars && cars.length > 0 ? cars[0] : {};
        const plate_number = primaryCar.plateNumber || null;
        const vehicle_type = primaryCar.makeModel || primaryCar.size; // fallback logic same as before?

        // 1. Insert Customer
        const result = await db.prepare(`
            INSERT INTO customers (
                name, email, phone,
                address_street, address_city, address_zip,
                notes, plate_number, vehicle_type,
                loyalty_points, visits_count, last_visit, vehicle_size, vehicle_color
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, ?, ?)
        `).bind(
            name,
            email || '',
            phone || '',
            address?.street || '',
            address?.city || '',
            address?.zip || '',
            notes || '',
            plate_number,
            vehicle_type,
            loyaltyPoints || 0,
            primaryCar.size || null,
            primaryCar.color || null
        ).run();

        if (!result.success) {
            throw new Error("Failed to insert customer");
        }

        const newCustomerId = result.meta.last_row_id;

        // 2. Insert Vehicles
        if (cars && Array.isArray(cars) && cars.length > 0) {
            for (const car of cars) {
                await db.prepare(`
                    INSERT INTO customer_vehicles (customer_id, plate_number, vehicle_type, vehicle_color, vehicle_size)
                    VALUES (?, ?, ?, ?, ?)
                 `).bind(
                    newCustomerId,
                    car.plateNumber,
                    car.makeModel || 'SEDAN', // Map makeModel to vehicle_type
                    car.color || null,
                    car.size || null
                ).run();
            }
        }

        // Return the object in expected format so frontend can append it immediately
        return NextResponse.json({
            _id: newCustomerId.toString(),
            name,
            email,
            phone,
            address: address || { street: '', city: '', zip: '' },
            notes,
            cars: cars || [],
            loyaltyPoints,
            createdAt: new Date().toISOString()
        });

    } catch (e: any) {
        console.error("Customers POST Error:", e);
        return NextResponse.json({ error: e.message || 'Failed to create customer' }, { status: 500 });
    }
}
