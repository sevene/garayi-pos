import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
    const { env } = getRequestContext();
    const db = env.DB;

    try {
        const { results } = await db.prepare('SELECT * FROM products ORDER BY name ASC').all();
        return Response.json(results);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch products', details: error }, { status: 500 });
    }
}
