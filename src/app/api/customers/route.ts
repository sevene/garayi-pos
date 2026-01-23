export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getRequestContext().env.DB;
        const { results } = await db.prepare('SELECT * FROM customers').all();
        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
