import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        // Assuming 'products' table holds both services and retail products
        // We might filter by category here if needed, or return all
        const { results } = await db.prepare('SELECT * FROM products').all();
        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
