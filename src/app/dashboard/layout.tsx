export const dynamic = 'force-dynamic';

import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/SidebarContext";
import { DashboardContent } from "@/components/DashboardContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <MobileSidebar />
        <Header />
        <DashboardContent>{children}</DashboardContent>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
