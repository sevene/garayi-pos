import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
    const { env } = getRequestContext();
    const db = env.DB;

    try {
        const { results } = await db.prepare(`
            SELECT
                id as _id,
                name,
                sku,
                price_sedan,
                price_suv,
                price_truck,
                category,
                duration_minutes
            FROM products
            ORDER BY name ASC
        `).all();

        // Coerce types to ensure numbers for prices
        const typedResults = results.map(r => ({
            ...r,
            _id: String(r._id), // Ensure ID is string for UI
            price_sedan: Number(r.price_sedan),
            price_suv: Number(r.price_suv),
            price_truck: Number(r.price_truck),
        }));

        return Response.json(typedResults);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch products', details: error }, { status: 500 });
    }
}
