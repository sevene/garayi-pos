import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const db = env.DB;
        // Distinct categories from products table as a fallback or if no dedicated table
        const { results } = await db.prepare('SELECT DISTINCT category as name FROM products WHERE category IS NOT NULL').all();

        return NextResponse.json(results.map((c: any, index: number) => ({
            _id: String(index + 1),
            name: c.name
        })));
    } catch (e) {
        return NextResponse.json([]);
    }
}
