import React from 'react';
import AdminSideBar from '@/components/admin/AdminSideBar';
import AdminBackground from '@/components/admin/AdminBackground';
import { MainNav } from '@/components/MainNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <MainNav />
            <div className="flex flex-1 overflow-hidden relative p-4 gap-4">
                {/* GLOBAL BACKGROUND - Dynamic */}
                <AdminBackground />

                <AdminSideBar />

                {/* ADMIN CONTENT AREA */}
                <main className="flex-1 flex flex-col min-w-1/2 relative z-10">
                    <div id="admin-main-content" className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}