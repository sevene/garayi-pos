import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;
        // In the carwash schema, we'll try to fetch from employees table
        // If it doesn't exist, we might return a mock or empty array until migration
        const { results } = await db.prepare('SELECT * FROM employees').all();

        return NextResponse.json(results.map((e: any) => ({
            ...e,
            _id: String(e.id) // Legacy expects _id
        })));
    } catch (e) {
        // Fallback: return empty array if table doesn't exist yet
        return NextResponse.json([]);
    }
}
