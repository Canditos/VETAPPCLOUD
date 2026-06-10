export const dynamic = 'force-dynamic';

import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <MobileSidebar />
      <Header />
      <main className="ml-64">{children}</main>
      <Toaster />
    </div>
  );
}
