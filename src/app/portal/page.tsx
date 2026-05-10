import { PawPrint, ShieldAlert } from "lucide-react";

export default function PortalIndexPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
        <PawPrint size={40} />
      </div>
      
      <div className="space-y-2 max-w-sm">
        <h1 className="text-white font-black text-2xl">Portal do Tutor</h1>
        <p className="text-slate-400">
          Para aceder ao portal, por favor utilize o <strong className="text-white">link direto</strong> que lhe foi enviado pela sua clínica veterinária.
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-left max-w-sm mt-4">
        <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-amber-200">
          Por motivos de segurança e privacidade, o acesso só é possível através da hiperligação única enviada pela clínica (ex: <span className="opacity-75 font-mono">/portal/ABCD...</span>).
        </p>
      </div>
    </div>
  );
}
