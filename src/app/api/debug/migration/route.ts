import { getDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    try {
        const db = await getDB();

        const logs: string[] = [];

        // 1. Rename table if old one exists and new one does not
        try {
            const oldTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first();
            const newTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").first();

            if (oldTable && !newTable) {
                logs.push("Renaming 'users' to 'employees'");
                await db.prepare("ALTER TABLE users RENAME TO employees").run();
            } else {
                logs.push(`Check result: users=${!!oldTable}, employees=${!!newTable}`);
            }
        } catch (e: any) {
            logs.push(`Error checking/renaming tables: ${e.message}`);
        }

        // 2. Ensure columns exist
        // Define desired schema
        const desiredColumns = [
            { name: 'name', type: 'TEXT', default: "''", oldName: 'username' },
            { name: 'role', type: 'TEXT', default: "''" },
            { name: 'pin', type: 'TEXT', default: "''" },
            { name: 'contactInfo', type: 'TEXT', default: "'{}'" },
            { name: 'address', type: 'TEXT', default: "''" },
            { name: 'status', type: 'TEXT', default: "'active'" },
            { name: 'compensation', type: 'TEXT', default: "'{}'" },
            { name: 'createdAt', type: 'TEXT', default: 'CURRENT_TIMESTAMP', oldName: 'created_at' }
        ];

        for (const col of desiredColumns) {
            try {
                // Check if column exists
                // PRAGMA table_info is standard SQLite
                // But D1 might be strict. Let's try to query first row or use PRAGMA.
                // PRAGMA table_info acts as a query returning rows.
                const { results: cols } = await db.prepare("PRAGMA table_info(employees)").all();
                const existingCol = cols.find((c: any) => c.name === col.name);

                if (!existingCol) {
                    // Check if we should rename an old column
                    let renamed = false;
                    if (col.oldName) {
                        const oldCol = cols.find((c: any) => c.name === col.oldName);
                        if (oldCol) {
                            logs.push(`Renaming column '${col.oldName}' to '${col.name}'`);
                            await db.prepare(`ALTER TABLE employees RENAME COLUMN ${col.oldName} TO ${col.name}`).run();
                            renamed = true;
                        }
                    }

                    if (!renamed) {
                        logs.push(`Adding column '${col.name}'`);
                        // Add column
                        await db.prepare(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`).run();
                    }
                }
            } catch (e: any) {
                logs.push(`Error processing column ${col.name}: ${e.message}`);
            }
        }

        return NextResponse.json({ success: true, logs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
