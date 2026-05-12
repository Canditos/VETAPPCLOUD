"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PawPrint } from "lucide-react";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";

function PortalContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setIsLoading(true);
      window.location.href = `/api/portal/auth/magic?token=${token}`;
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <PawPrint size={32} className="text-white" />
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">A validar acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center space-y-6 mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 group hover:scale-105 transition-transform duration-500">
            <PawPrint size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-black tracking-tight mb-2">Portal do Tutor</h1>
            <p className="text-slate-400 font-medium tracking-tight">Insira as suas credenciais Gato Escondido</p>
          </div>
        </div>

        <PortalLoginForm />

        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center space-y-4">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Precisa de ajuda com o acesso?</p>
          <div className="flex justify-center gap-4">
             <a href="tel:910000000" className="text-blue-400 text-sm font-black hover:text-blue-300 transition-colors">Telefone</a>
             <span className="text-slate-700">|</span>
             <a href="mailto:geral@gatoescondido.pt" className="text-blue-400 text-sm font-black hover:text-blue-300 transition-colors">Email</a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}

import { Loader2 } from "lucide-react";
