export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
    // Static categories based on schema comments
    return NextResponse.json([
        { _id: 'cat_wash', name: 'Wash' },
        { _id: 'cat_detail', name: 'Detail' },
        { _id: 'cat_addon', name: 'Addon' }
    ]);
}
