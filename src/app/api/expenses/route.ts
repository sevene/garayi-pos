export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = getRequestContext().env.DB;
        const { results } = await db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();

        return NextResponse.json(results.map((e: any) => ({
            ...e,
            _id: String(e.id)
        })));
    } catch (e) {
        return NextResponse.json([]);
    }
}
