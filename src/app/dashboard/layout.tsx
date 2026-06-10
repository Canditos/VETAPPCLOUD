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
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
