"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PawPrint, Shield, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function PortalPrivacyPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [policy, setPolicy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/privacy")
      .then(r => r.json())
      .then(async (data) => {
        if (data.accepted) { router.replace("/portal/dashboard"); return; }
        const res = await fetch("/api/privacy/policy");
        const policyData = await res.json();
        if (policyData?.text) setPolicy(policyData.text);
      })
      .catch(() => setPolicy("A Política de Privacidade está temporariamente indisponível. Tente novamente mais tarde."))
      .finally(() => setLoading(false));
  }, [router]);

  const handleAccept = async () => {
    if (!checked) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/portal/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "v1" }),
      });
      if (!res.ok) throw new Error("Erro ao registar consentimento");
      setDone(true);
      setTimeout(() => router.push("/portal/dashboard"), 1500);
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto animate-pulse">
          <PawPrint size={32} className="text-white" />
        </div>
        <p className="text-slate-400 font-bold animate-pulse">A carregar...</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-emerald-400" />
        </div>
        <h1 className="text-white text-3xl font-black tracking-tight">Consentimento Registado</h1>
        <p className="text-slate-400 font-medium">A sua aceitação foi guardada com sucesso. A redirecionar...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-2xl relative z-10 space-y-8 py-12">
        <button onClick={() => router.push("/portal/dashboard")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
          <ArrowLeft size={16} /> Voltar ao portal
        </button>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Proteção de Dados</h1>
          <p className="text-slate-400 font-medium text-lg">Confirmação de Consentimento — RGPD</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl space-y-6">
          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed max-h-[400px] overflow-y-auto space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {policy ? (
              policy.split("\n").map((line, i) => {
                const bold = line.match(/^\d+\.\s(.+)/);
                if (bold) return <p key={i} className="text-white font-black text-base mt-5 first:mt-0">{bold[1]}</p>;
                if (line.startsWith("Versão:")) return <p key={i} className="text-slate-500 text-[10px] uppercase tracking-widest pt-4 border-t border-slate-800 mt-6">{line}</p>;
                const heading = line.match(/^(POLÍTICA DE PRIVACIDADE —|A presente)/);
                if (heading) return null;
                if (line.trim().startsWith("• ")) return <p key={i} className="text-slate-300 ml-2 mt-3">• <span className="font-semibold">{line.trim().slice(2)}</span></p>;
                if (line.trim().startsWith("↳")) return <p key={i} className="text-slate-400 text-sm ml-6 mb-3">{line.trim()}</p>;
                if (line.trim().startsWith("- ")) return <p key={i} className="text-slate-300 ml-4">• {line.trim().slice(2)}</p>;
                if (line.trim()) return <p key={i} className="text-slate-300">{line}</p>;
                return <div key={i} className="h-2" />;
              })
            ) : (
              <p className="text-slate-500 italic">A carregar política de privacidade...</p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] cursor-pointer hover:border-blue-500/40 transition-all group">
          <div className={`
            w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200
            ${checked 
              ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30" 
              : "border-slate-600 group-hover:border-blue-500/60"
            }
          `}>
            {checked && <CheckCircle2 size={16} className="text-white" />}
          </div>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="hidden" />
          <div>
            <p className="text-white font-bold text-base">Li e compreendo a Política de Privacidade</p>
            <p className="text-slate-500 text-sm mt-1">
              Ao aceitar, autoriza o tratamento dos seus dados pessoais para efeitos de prestação de serviços veterinários, conforme descrito na política acima.
            </p>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={!checked || submitting}
          className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <><Loader2 size={20} className="animate-spin" /> A registar...</>
          ) : (
            "Confirmar Aceitação"
          )}
        </button>

        <p className="text-slate-600 text-xs text-center leading-relaxed">
          Se não confirmar, poderá continuar a receber informações essenciais relativas aos serviços clínicos do seu animal, mas algumas funcionalidades do portal poderão ficar limitadas.
        </p>
      </div>
    </div>
  );
}
