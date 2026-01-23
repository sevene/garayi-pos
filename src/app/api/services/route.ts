export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getRequestContext().env.DB;
        // In the carwash schema, services are just products in 'Wash' or 'Detail' categories
        const { results } = await db.prepare('SELECT * FROM products').all();

        // Map to legacy Service interface if needed
        // The frontend expects services to have specific fields, but the new schema stores them in products table
        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}
