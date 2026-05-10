"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PawPrint, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao entrar");
      }

      toast.success("Bem-vindo ao Portal!");
      router.push("/portal/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center space-y-6 mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
            <PawPrint size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-black tracking-tight mb-2">Portal do Tutor</h1>
            <p className="text-slate-400 font-medium">Área Reservada Gato Escondido</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-500 font-black text-[10px] uppercase tracking-widest px-1">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950/50 border-slate-800 h-14 pl-12 rounded-2xl text-white font-medium focus:ring-blue-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-500 font-black text-[10px] uppercase tracking-widest px-1">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950/50 border-slate-800 h-14 pl-12 rounded-2xl text-white font-medium focus:ring-blue-600 transition-all"
                required
              />
            </div>
          </div>

          <Button 
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <span className="flex items-center gap-2">
                Entrar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center space-y-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Precisa de ajuda?</p>
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
