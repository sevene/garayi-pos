import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;
        const { results } = await db.prepare('SELECT * FROM customers').all();
        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
