import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;
        const result = await db.prepare('SELECT * FROM settings WHERE id = 1').first();

        // Map to legacy expected structure if needed
        return NextResponse.json(result || { name: 'Garayi Carwash', currency: 'PHP' });
    } catch (e) {
        return NextResponse.json({ name: 'Garayi Carwash', currency: 'PHP' });
    }
}
