import Image from "next/image";
import Link from "next/link";
import { 
  Stethoscope, 
  Calendar, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight,
  Zap,
  Globe,
  Database
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Stethoscope size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">VetConnect<span className="text-blue-600">SaaS</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-bold text-slate-500">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Funcionalidades</Link>
            <Link href="#integrations" className="hover:text-blue-600 transition-colors">Integrações</Link>
            <Link href="/dashboard" className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
              Aceder ao Painel
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center md:text-left flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-xs uppercase tracking-widest">
              <Zap size={14} /> Próxima Geração de Gestão Clínica
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
              A sua Clínica <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Conectada</span> ao Futuro.
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed">
              Software de gestão veterinária moderno, intuitivo e totalmente integrado. 
              Da agenda dinâmica à faturação Certificada com Vendus e Jasmin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center justify-center gap-3">
                Começar Agora <ArrowRight size={20} />
              </Link>
              <button className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all">
                Ver Demo
              </button>
            </div>
          </div>
          <div className="flex-1 relative animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur-3xl opacity-10"></div>
            <div className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-4 overflow-hidden">
               <div className="bg-slate-50 rounded-2xl p-8 h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-slate-300">
                    <Database size={64} />
                    <p className="font-black text-sm uppercase tracking-widest">Dashboard Preview</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="bg-slate-50 py-32 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Tudo o que a sua clínica precisa</h2>
              <p className="text-slate-500 font-medium text-lg">Módulos especializados e desenhados por médicos veterinários.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Calendar className="text-blue-600" />}
                title="Agenda Dinâmica"
                description="Gestão de marcações ultra-rápida com estados de consulta e histórico imediato."
              />
              <FeatureCard 
                icon={<BarChart3 className="text-indigo-600" />}
                title="Gestão de Stock"
                description="Controlo de lotes, validades e inventário com alertas automáticos de rutura."
              />
              <FeatureCard 
                icon={<ShieldCheck className="text-emerald-600" />}
                title="Faturação Certificada"
                description="Integração nativa com Vendus e Jasmin para emissão de faturas no ato médico."
              />
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section id="integrations" className="py-32">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-black text-slate-900 mb-6">Ecossistema Aberto</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8">
                Ligue-se aos seus parceiros habituais. Receba resultados de laboratórios (Fuji) e imagens de RX (Examion) diretamente na ficha do paciente.
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge label="Jasmin ERP" />
                <Badge label="Vendus POS" />
                <Badge label="Fuji Lab" />
                <Badge label="Examion RX" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
               <div className="p-8 bg-blue-600 rounded-3xl text-white flex flex-col justify-end h-48 shadow-xl shadow-blue-100">
                  <span className="text-4xl font-black">100%</span>
                  <span className="font-bold opacity-80 uppercase text-[10px] tracking-widest mt-2">Cloud Based</span>
               </div>
               <div className="p-8 bg-slate-900 rounded-3xl text-white flex flex-col justify-end h-48">
                  <Globe size={32} className="mb-4" />
                  <span className="font-bold uppercase text-[10px] tracking-widest">Acesso Global</span>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 text-center border-t border-slate-800">
        <p className="text-slate-500 font-medium">© 2026 VetConnect SaaS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-10 bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
      <div className="p-5 bg-slate-50 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full font-black text-xs text-slate-400 uppercase tracking-widest">
      {label}
    </span>
  );
}
