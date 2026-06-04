"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log to monitoring service in production
    if (process.env.NODE_ENV !== "production") {
      console.error("[Dashboard Error]", error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle size={40} className="text-red-500" strokeWidth={1.5} />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Algo correu mal
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Ocorreu um erro inesperado nesta página. Os dados estão seguros — é apenas um problema de carregamento.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-300 dark:text-slate-600">
            Ref: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-2xl gap-2"
          onClick={() => router.push("/dashboard")}
        >
          <Home size={16} /> Início
        </Button>
        <Button
          className="rounded-2xl gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={reset}
        >
          <RefreshCw size={16} /> Tentar novamente
        </Button>
      </div>
    </div>
  );
}
