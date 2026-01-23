export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
    // Mock employees for now or fetch from users table with specific role?
    // Returning empty array or static list as 'employees' table wasn't in schema
    return NextResponse.json([
        { _id: 'E001', name: 'Staff 1', role: 'Staff' },
        { _id: 'E002', name: 'Staff 2', role: 'Staff' }
    ]);
}
