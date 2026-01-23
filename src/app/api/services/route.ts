export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getRequestContext().env.DB;
        const { results } = await db.prepare('SELECT * FROM products WHERE category = ?').bind('Wash').all();

        // Map to legacy Service interface if needed, or just return
        // Legacy Service: { id, name, price_sedan, ... }
        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}
