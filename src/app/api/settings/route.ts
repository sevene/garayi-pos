export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        tax_rate: 0.12, // example tax
        currency: 'PHP'
    });
}
