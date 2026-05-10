import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Portal do Tutor — VetApp",
  description: "Acompanhe a saúde do seu animal de estimação",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VetApp",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-950 antialiased overscroll-none min-h-screen text-white">
      {children}
    </div>
  );
}
