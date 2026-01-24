import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, createSession } from '@/lib/auth';



export async function POST(req: NextRequest) {
    try {
        const { username, password } = (await req.json()) as any;

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // Use OpenNext Cloudflare Context
        const { env } = await getCloudflareContext();
        const db = env.DB;

        // Hash the input password
        const hashedPassword = await hashPassword(password);

        // Verify against DB
        const { results } = await db.prepare(
            'SELECT * FROM users WHERE username = ? AND password_hash = ?'
        ).bind(username, hashedPassword).all();

        const user = results[0] as any;

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create Session
        const token = await createSession({
            userId: user.id,
            username: user.username,
            role: user.role
        });

        const response = NextResponse.json({ success: true, redirect: '/admin/dashboard/overview' });

        // Set HTTP-only cookie
        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
