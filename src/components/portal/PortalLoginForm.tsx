"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface PortalLoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function PortalLoginForm({ onSuccess, className }: PortalLoginFormProps) {
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

      toast.success("Bem-vindo de volta!");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/portal/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className={`space-y-5 ${className}`}>
      <div className="space-y-2">
        <Label className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest px-1">Email</Label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 h-14 pl-12 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-blue-600 transition-all shadow-inner"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest px-1">Password</Label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 h-14 pl-12 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-blue-600 transition-all shadow-inner"
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
            Entrar no Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>

      <div className="text-center">
        <button type="button" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors">
          Esqueceu-se da password?
        </button>
      </div>
    </form>
  );
}
