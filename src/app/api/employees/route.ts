import { getDB } from '@/lib/db';
import { NextResponse } from 'next/server';

// // export const runtime = 'edge';

export async function GET() {
    try {
        const db = await getDB();

        // 1. Ensure 'employees' has the correct schema and migrate from 'users'
        try {
            // Check if employees table exists
            const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").first();

            if (!tableCheck) {
                // Table doesn't exist, create it with username and password_hash
                await db.prepare(`
                    CREATE TABLE IF NOT EXISTS employees (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT,
                        username TEXT,
                        role TEXT,
                        pin TEXT,
                        password_hash TEXT,
                        contactInfo TEXT DEFAULT '{}',
                        address TEXT,
                        status TEXT DEFAULT 'active',
                        compensation TEXT DEFAULT '{}',
                        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                `).run();
            } else {
                // Table exists, check if username or password_hash column is missing
                const columns = await db.prepare("PRAGMA table_info(employees)").all();
                const hasUsername = columns.results.some((c: any) => c.name === 'username');
                const hasPasswordHash = columns.results.some((c: any) => c.name === 'password_hash');

                if (!hasUsername) {
                    try {
                        await db.prepare("ALTER TABLE employees ADD COLUMN username TEXT").run();
                        console.log("Added username column to employees table.");
                        // Initialize username from name if it's missing
                        await db.prepare("UPDATE employees SET username = name WHERE username IS NULL").run();
                    } catch (e) {
                        console.error("Failed to add username column:", e);
                    }
                }

                if (!hasPasswordHash) {
                    try {
                        await db.prepare("ALTER TABLE employees ADD COLUMN password_hash TEXT").run();
                        console.log("Added password_hash column to employees table.");
                    } catch (e) {
                        console.error("Failed to add password_hash column:", e);
                    }
                }
            }

            // Check for 'users' table to migrate
            const usersTableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name='users' OR name='USERS')").first<{ name: string }>();
            if (usersTableCheck) {
                console.log(`Migrating data from '${usersTableCheck.name}' to 'employees'...`);
                const oldTableName = usersTableCheck.name;

                try {
                    // Check employees count
                    const employeesCount = await db.prepare("SELECT COUNT(*) as count FROM employees").first<{ count: number }>();
                    if (employeesCount && employeesCount.count === 0) {
                        await db.prepare(`
                            INSERT INTO employees (name, username, role, password_hash, createdAt)
                            SELECT COALESCE(name, username, 'Unknown'), COALESCE(username, name, 'Unknown'), COALESCE(role, 'staff'), password_hash, COALESCE(created_at, createdAt, CURRENT_TIMESTAMP)
                            FROM ${oldTableName}
                        `).run();
                        console.log("Data migration successful.");
                    } else {
                        // Update existing records
                        await db.prepare(`
                            UPDATE employees
                            SET username = (SELECT username FROM ${oldTableName} WHERE ${oldTableName}.username = employees.name OR ${oldTableName}.name = employees.name),
                                password_hash = (SELECT password_hash FROM ${oldTableName} WHERE ${oldTableName}.username = employees.name OR ${oldTableName}.name = employees.name)
                            WHERE username IS NULL OR password_hash IS NULL
                        `).run();
                    }

                    // DROP the old table
                    await db.prepare(`DROP TABLE ${oldTableName}`).run();
                    console.log(`Dropped legacy table '${oldTableName}'.`);
                } catch (migrationError) {
                    console.error("Migration failed:", migrationError);
                }
            }
        } catch (checkError) {
            console.error("Table maintenance error:", checkError);
        }

        // 2. Fetch results
        const { results } = await db.prepare('SELECT * FROM employees ORDER BY createdAt DESC').all();
        return NextResponse.json(results.map((e: any) => ({
            ...e,
            _id: String(e.id),
            contactInfo: e.contactInfo ? JSON.parse(e.contactInfo) : { phone: '', email: '' },
            compensation: e.compensation ? JSON.parse(e.compensation) : { payType: 'hourly', rate: 0, commission: 0 }
        })));
    } catch (e) {
        console.error('Failed to fetch employees:', e);
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const db = await getDB();
        const body = await req.json() as any;
        const { name, username, password, role, pin, contactInfo, address, status, compensation } = body;

        // Hash the password if provided
        let hashedPassword = null;
        if (password && password.trim() !== '') {
            const { hashPassword } = await import('@/lib/auth');
            hashedPassword = await hashPassword(password);
        }

        await db.prepare(`
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                username TEXT,
                role TEXT,
                pin TEXT,
                password_hash TEXT,
                contactInfo TEXT,
                address TEXT,
                status TEXT,
                compensation TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        const res = await db.prepare(
            `INSERT INTO employees (name, username, role, pin, password_hash, contactInfo, address, status, compensation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
        ).bind(
            name,
            username || name, // Fallback to name if username not provided
            role,
            pin,
            hashedPassword,
            JSON.stringify(contactInfo || {}),
            address,
            status,
            JSON.stringify(compensation || {})
        ).first();

        if (!res) throw new Error('Failed to insert employee');

        return NextResponse.json({
            ...res,
            _id: String(res.id),
            contactInfo: res.contactInfo ? JSON.parse(res.contactInfo as string) : {},
            compensation: res.compensation ? JSON.parse(res.compensation as string) : {}
        });
    } catch (e) {
        console.error('Failed to create employee:', e);
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}
