"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  PawPrint, Syringe, Calendar, FileText, Phone, MapPin,
  AlertTriangle, ChevronRight, Heart, Weight, Thermometer,
  Activity, Shield, ShieldCheck, Clock, CheckCircle2, Dog, Cat, X,
  Stethoscope, Pill, Bell, Home, User, Star, LogOut,
  Sun, Cloud, CloudRain, CloudLightning, ThermometerSun,
  MessageSquare, Send, CreditCard, Download
} from "lucide-react";
import { format, isPast, differenceInDays, differenceInYears, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const fmt = (d: string | Date) => format(new Date(d), "dd MMM yyyy", { locale: pt });
const fmtTime = (d: string | Date) => format(new Date(d), "EEEE, d MMM · HH:mm", { locale: pt });

// ── Vaccine badge ─────────────────────────────────────────────────────────────
function VaxBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-xs text-slate-400">Sem reforço</span>;
  const d = new Date(expiresAt);
  const days = differenceInDays(d, new Date());
  if (isPast(d)) return <span className="text-xs font-bold text-red-400">Expirada</span>;
  if (days <= 30) return <span className="text-xs font-bold text-amber-400">Em {days}d</span>;
  return <span className="text-xs font-bold text-emerald-400">Válida</span>;
}

// ── Appointment request modal ─────────────────────────────────────────────────
function RequestModal({ patients, token, onClose }: { patients: any[]; token?: string; onClose: () => void }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [preferred, setPreferred] = useState("");

  const request = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, patientId, reason, preferred }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { toast.success("Pedido enviado! A clínica irá confirmar em breve."); onClose(); },
    onError: () => toast.error("Erro ao enviar pedido"),
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-white">Pedir Marcação</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Animal</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {patients.map((p: any) => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Motivo</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Ex: consulta de rotina, vacina, não está bem..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none placeholder:text-slate-500" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Preferência de horário (opcional)</label>
            <input value={preferred} onChange={e => setPreferred(e.target.value)}
              placeholder="Ex: manhã, tarde, 2ª ou 4ª feira..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500" />
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center">A clínica irá confirmar a data e hora por SMS ou telefone.</p>

        <button
          onClick={() => request.mutate()}
          disabled={!reason || request.isPending}
          className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all"
        >
          {request.isPending ? "A enviar..." : "Enviar Pedido"}
        </button>
      </div>
    </div>
  );
}

// ── Patient card ──────────────────────────────────────────────────────────────
function PatientCard({ patient }: { patient: any }) {
  const [open, setOpen] = useState(false);
  const isDog = patient.species?.toLowerCase().includes("cão") || patient.species?.toLowerCase().includes("can");
  const isCat = patient.species?.toLowerCase().includes("gato") || patient.species?.toLowerCase().includes("fel");
  const Icon = isDog ? Dog : isCat ? Cat : PawPrint;
  const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : null;
  const lastVital = patient.vitalSigns?.[0];
  const activeRx = patient.prescriptions?.filter((rx: any) => !isPast(new Date(rx.validUntil ?? "9999")));

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
      {/* Header */}
      <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center gap-4 text-left">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
          <Icon size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-xl tracking-tight">{patient.name}</p>
          <p className="text-slate-400 text-sm font-medium capitalize">
            {patient.species}{patient.breed ? ` · ${patient.breed}` : ""}{age !== null ? ` · ${age} anos` : ""}
          </p>
        </div>
        <ChevronRight size={20} className={cn("text-slate-500 transition-transform duration-300", open && "rotate-90")} />
      </button>

      {/* Expanded */}
      {open && (
        <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Last vitals */}
          {lastVital && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Weight,      color: "text-blue-400",    label: "Peso",  val: lastVital.weight ? `${lastVital.weight}kg` : null },
                { icon: Thermometer, color: "text-blue-400",  label: "Temp",  val: lastVital.temperature ? `${lastVital.temperature}°C` : null },
                { icon: Heart,       color: "text-blue-300",    label: "FC",    val: lastVital.heartRate ? `${lastVital.heartRate}bpm` : null },
                { icon: Activity,    color: "text-emerald-400", label: "FR",    val: lastVital.respiratoryRate ? `${lastVital.respiratoryRate}rpm` : null },
              ].filter(x => x.val).map(({ icon: Ic, color, label, val }) => (
                <div key={label} className="bg-white/5 rounded-2xl p-3 flex items-center gap-2">
                  <Ic size={14} className={color} />
                  <div>
                    <p className="text-white font-black text-sm">{val}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vaccines */}
          {patient.vaccinations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-2 group/header">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/header:bg-emerald-500 group-hover/header:text-white transition-all duration-500 shadow-inner">
                  <Syringe size={12} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/header:text-white transition-colors duration-500">
                  Vacinação & Desparasitação
                </p>
                <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent ml-2 opacity-50" />
              </div>
              <div className="space-y-2">
                {patient.vaccinations.slice(0, 4).map((v: any) => (
                  <div key={v.id} className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-white font-bold text-sm">{v.vaccineName}</p>
                      <p className="text-slate-500 text-[10px]">{fmt(v.appliedAt)}</p>
                    </div>
                    <VaxBadge expiresAt={v.expiresAt} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {activeRx?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-4 group/header">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/header:bg-blue-500 group-hover/header:text-white transition-all duration-500 shadow-inner">
                  <Pill size={12} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/header:text-white transition-colors duration-500">
                  Protocolo Terapêutico
                </p>
                <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent ml-2 opacity-50" />
              </div>
              <div className="space-y-2">
                {activeRx.map((rx: any) => (
                  <div key={rx.id} className="bg-white/5 rounded-xl px-3 py-2">
                    <p className="text-slate-400 text-[10px]">Dr. {rx.veterinarian?.name} · {fmt(rx.date)}</p>
                    {rx.items?.map((item: any, i: number) => (
                      <p key={i} className="text-white font-bold text-sm">{item.medicineName}
                        <span className="text-slate-400 font-normal text-xs ml-1">— {item.dosage}</span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consultation history */}
          {patient.consultations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-4 group/header">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover/header:bg-purple-500 group-hover/header:text-white transition-all duration-500 shadow-inner">
                  <Stethoscope size={12} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/header:text-white transition-colors duration-500">
                  Histórico de Consultas
                </p>
                <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent ml-2 opacity-50" />
              </div>
              <div className="space-y-2">
                {patient.consultations.slice(0, 3).map((c: any) => (
                  <div key={c.id} className="bg-white/5 rounded-xl px-3 py-2">
                    <div className="flex justify-between">
                      <p className="text-white font-bold text-sm">{c.type || "Consulta Geral"}</p>
                      <p className="text-slate-500 text-xs">{fmt(c.date)}</p>
                    </div>
                    <p className="text-slate-400 text-xs">Dr. {c.veterinarian?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {patient.allergies && (
            <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-black text-[10px] uppercase tracking-widest">Alergias / Alertas</p>
                <p className="text-red-300 text-xs mt-0.5">{patient.allergies}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weather Widget ────────────────────────────────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; icon: any; text: string } | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const code = data.current_weather.weathercode;
        
        // Basic mapping
        let icon = Sun;
        let text = "Céu Limpo";
        if (code >= 1 && code <= 3) { icon = Cloud; text = "Parcialmente Nublado"; }
        else if (code >= 51 && code <= 67) { icon = CloudRain; text = "Chuva"; }
        else if (code >= 95) { icon = CloudLightning; text = "Trovoada"; }

        setWeather({ temp: Math.round(data.current_weather.temperature), icon, text });
      } catch (e) { if (process.env.NODE_ENV !== "production") { console.error(e); } }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(38.7223, -9.1393) // Fallback to Lisbon
      );
    }
  }, []);

  if (!weather) return (
    <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/10" />
      <div className="space-y-2">
        <div className="w-20 h-4 bg-white/10 rounded" />
        <div className="w-12 h-3 bg-white/10 rounded" />
      </div>
    </div>
  );

  const WeatherIcon = weather.icon;

  return (
    <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-500">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <WeatherIcon size={28} className="text-white" />
        </div>
        <div>
          <p className="text-3xl font-black text-white tracking-tighter">{weather.temp}°C</p>
          <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest">{weather.text}</p>
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Hoje</p>
        <p className="text-white/60 text-xs font-bold">{format(new Date(), "eeee", { locale: pt })}</p>
      </div>
    </div>
  );
}

// ── Main portal page ──────────────────────────────────────────────────────────
export default function PortalPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "animals" | "agenda" | "clinic" | "messages" | "financial">("home");
  const [showRequest, setShowRequest] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal"],
    queryFn: async () => {
      const res = await fetch(`/api/portal/me`);
      if (!res.ok) throw new Error("invalid");
      return res.json();
    },
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/portal/auth/logout", { method: "POST" });
      router.push("/portal");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Erro ao sair", error);
      }
    }
  };

  // PWA install prompt
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Redirect to privacy page if not consented
  useEffect(() => {
    if (data?.owner?.id) {
      fetch("/api/portal/privacy").then(r => r.json()).then(d => {
        if (!d.accepted) router.replace("/portal/privacy");
      }).catch(() => {});
    }
  }, [data, router]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto animate-pulse">
          <PawPrint size={32} className="text-white" />
        </div>
        <p className="text-slate-400 font-bold">A carregar...</p>
      </div>
    </div>
  );

  if (isError || !data) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center mx-auto">
          <X size={32} className="text-red-400" />
        </div>
        <h2 className="text-white font-black text-2xl">Link inválido</h2>
        <p className="text-slate-400">Este link de acesso é inválido ou expirou. Contacte a clínica para obter um novo link.</p>
      </div>
    </div>
  );

  const { owner, clinic, patients, vaccineAlerts } = data;
  const nextAppointment = patients.flatMap((p: any) => p.appointments ?? []).sort(
    (a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )[0];

  const tabs = [
    { id: "home",    label: "Início",   icon: Home },
    { id: "animals", label: "Animais",  icon: PawPrint },
    { id: "agenda",  label: "Agenda",   icon: Calendar },
    { id: "messages", label: "Mensagens", icon: MessageSquare },
    { id: "financial", label: "Financeiro", icon: CreditCard },
    { id: "clinic",  label: "Clínica",  icon: MapPin },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      
      {/* ── Desktop Sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-72 flex-col border-r border-white/5 bg-slate-900/50 backdrop-blur-xl p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PawPrint size={24} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-base leading-tight">VetConnect</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Portal do Tutor</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest",
                tab === id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black">
              {owner.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{owner.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{clinic.name}</p>
            </div>
          </div>
          <a href="/portal/privacy"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest mb-2"
          >
            <ShieldCheck size={16} />
            Privacidade
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            Sair do Portal
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden px-5 pt-10 pb-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
              <PawPrint size={20} className="text-white" />
            </div>
            <p className="font-black text-white text-sm">{clinic.name}</p>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
            <LogOut size={18} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-12">
          <div className="max-w-6xl mx-auto w-full">

            {/* HOME VIEW */}
            {tab === "home" && (
              <div className="space-y-10">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <header>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                      Olá, {owner.name.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">Bem-vindo à área reservada dos seus patudos.</p>
                  </header>
                  <div className="w-full lg:w-72">
                    <WeatherWidget />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Alerts & Next Appt */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Next Appointment (Moved to Center) */}
                      <div className="p-8 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-500/20 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                          <h3 className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Clock size={12} /> Próxima Consulta
                          </h3>
                          {nextAppointment ? (
                            <div className="space-y-4">
                              <div>
                                <p className="text-4xl font-black text-white tracking-tighter leading-none">
                                  {format(new Date(nextAppointment.startTime), "dd MMM", { locale: pt })}
                                </p>
                                <p className="text-blue-100 font-bold text-lg mt-1 capitalize">
                                  {format(new Date(nextAppointment.startTime), "EEEE, HH:mm", { locale: pt })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 py-3 px-4 bg-white/10 rounded-2xl w-fit">
                                <PawPrint size={16} className="text-white" />
                                <span className="font-bold text-white text-sm">{nextAppointment.patientName}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-blue-100 font-medium leading-relaxed">Sem consultas agendadas para os próximos dias.</p>
                              <button onClick={() => setShowRequest(true)} className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black uppercase text-[10px] tracking-widest transition-all">Marcar Agora</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Request New Appointment */}
                      <div className="p-8 rounded-[2.5rem] border border-blue-500/20 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between group hover:border-blue-500/40 transition-all">
                        <Stethoscope className="text-blue-400 group-hover:scale-110 transition-transform" size={32} />
                        <div className="mt-8">
                          <p className="text-white font-black text-2xl leading-tight">Agendar Serviço</p>
                          <p className="text-slate-400 text-sm mt-1">Consulta, vacinas ou banhos</p>
                          <button onClick={() => setShowRequest(true)} className="mt-6 w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all">Pedir Marcação</button>
                        </div>
                      </div>
                    </div>

                    {/* Vaccine Alerts Grid */}
                    {vaccineAlerts?.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                           <Bell size={16} className="text-amber-400" />
                           <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Alertas de Saúde</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {vaccineAlerts.slice(0, 2).map((alert: any, i: number) => (
                            <div key={i} className={cn(
                              "p-6 rounded-[2rem] border relative overflow-hidden group",
                              alert.expired ? "bg-red-500/5 border-red-500/10" : "bg-amber-500/5 border-amber-500/10"
                            )}>
                              <div className="relative z-10 flex gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                  alert.expired ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                                )}>
                                  <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-black text-base">{alert.patientName}</p>
                                  <p className="text-slate-400 text-xs font-medium">{alert.vaccineName} · {alert.expired ? "Expirada" : "A expirar"}</p>
                                  <button onClick={() => setShowRequest(true)} className="mt-3 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Resolver Agora</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Animals Section */}
                    <section className="space-y-4">
                      <div className="flex justify-between items-end px-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Os Seus Animais</h2>
                        <button onClick={() => setTab("animals")} className="text-blue-400 font-black text-xs uppercase hover:underline transition-all">Ver Todos</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {patients.map((p: any) => {
                          const Icon = p.species?.toLowerCase().includes("cão") || p.species?.toLowerCase().includes("can") ? Dog : Cat;
                          return (
                            <button key={p.id} onClick={() => setTab("animals")} className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all text-left group">
                              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner shadow-blue-500/10">
                                <Icon size={32} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-white text-xl truncate">{p.name}</p>
                                <p className="text-slate-400 text-xs font-medium capitalize truncate">{p.species} · {p.breed || "SRD"}</p>
                              </div>
                              <ChevronRight size={20} className="text-slate-700 group-hover:text-blue-400 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Clinic Info */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 sticky top-12">
                      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">A Nossa Clínica</h3>
                      <div className="space-y-8">
                        <div>
                          <p className="text-white font-black text-2xl leading-tight mb-2">{clinic.name}</p>
                          <div className="flex items-center gap-3 text-slate-400">
                            <MapPin size={16} className="text-blue-400 shrink-0" />
                            <span className="text-sm font-medium">{clinic.address || "Morada não disponível"}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`)} 
                            className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center"><MapPin size={18} /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-white">Direções</span>
                          </button>
                          <a href={`tel:${clinic.phone}`} className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center"><Phone size={18} /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-white">Ligar</span>
                          </a>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Horário de Hoje</p>
                           <div className="flex justify-between items-center text-sm font-bold">
                              <span className="text-white">{clinic.hours?.days || "Segunda a Sexta"}</span>
                              <span className="text-blue-400">{clinic.hours?.schedule || "09:00 - 20:00"}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ANIMALS VIEW */}
            {tab === "animals" && (
              <div className="space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Os Seus Animais</h1>
                    <p className="text-slate-400 font-medium">Histórico clínico, vacinas e medicação.</p>
                  </div>
                  <button onClick={() => setShowRequest(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black px-8 h-14 uppercase text-xs tracking-widest">Novo Pedido</button>
                </header>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {patients.map((p: any) => <PatientCard key={p.id} patient={p} />)}
                </div>
              </div>
            )}

            {/* AGENDA VIEW */}
            {tab === "agenda" && (
              <div className="max-w-3xl space-y-8">
                <h1 className="text-4xl font-black text-white tracking-tight">Agenda</h1>
                <div className="space-y-4">
                  {patients.flatMap((p: any) => (p.appointments ?? []).map((a: any) => ({ ...a, patientName: p.name }))).length > 0 ? (
                    patients.flatMap((p: any) => (p.appointments ?? []).map((a: any) => ({ ...a, patientName: p.name })))
                      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((a: any) => (
                        <div key={a.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                            <Calendar size={28} />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{a.patientName}</p>
                            <p className="text-xl font-black text-white capitalize">{a.type ?? "Consulta"}</p>
                            <p className="text-blue-400 font-bold text-base mt-1 capitalize">{fmtTime(a.startTime)}</p>
                          </div>
                          <div className="hidden sm:block text-right">
                             <p className="text-slate-400 text-xs font-bold mb-2">Confirmado</p>
                             <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ml-auto">
                               <CheckCircle2 size={16} />
                             </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
                      <Calendar size={64} className="mx-auto text-slate-800 mb-6" strokeWidth={1} />
                      <p className="text-xl text-slate-400 font-bold">Sem consultas agendadas</p>
                      <button onClick={() => setShowRequest(true)} className="mt-6 bg-blue-600 hover:bg-blue-500 rounded-2xl px-8 h-14 font-black uppercase text-xs tracking-widest">Agendar Agora</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CLINIC VIEW */}
            {tab === "clinic" && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h1 className="text-4xl font-black text-white tracking-tight">A Nossa Clínica</h1>
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8">
                       <div className="space-y-2">
                         <h2 className="text-2xl font-black text-white">{clinic.name}</h2>
                         <p className="text-slate-400 leading-relaxed">{clinic.address || "Morada não especificada"}</p>
                       </div>
                       <div className="grid grid-cols-1 gap-4">
                         <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl">
                           <Phone className="text-blue-400" />
                           <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase">Contacto</p>
                             <p className="text-white font-bold">{clinic.phone}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl">
                           <FileText className="text-blue-400" />
                           <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase">Email</p>
                             <p className="text-white font-bold">{clinic.email || "Não disponível"}</p>
                           </div>
                         </div>
                       </div>
                       <button onClick={() => setShowRequest(true)} className="w-full h-16 rounded-2xl bg-blue-600 text-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">Pedir Marcação</button>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-[3rem] border border-white/5 overflow-hidden flex items-center justify-center min-h-[400px]">
                     <div className="text-center p-10">
                       <MapPin size={48} className="text-blue-600 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold underline cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`)}>Abrir no Google Maps</p>
                     </div>
                  </div>
               </div>
            )}

            {/* MESSAGES VIEW */}
            {tab === "messages" && (
              <div className="space-y-8 max-w-6xl animate-in fade-in duration-500">
                <header>
                  <h1 className="text-4xl font-black text-white tracking-tight">As Suas Mensagens</h1>
                  <p className="text-slate-400 font-medium">Histórico de conversas e pedidos com a clínica.</p>
                </header>

                <div className="grid grid-cols-1 gap-4">
                  <PortalMessagesView clinic={clinic} owner={owner} />
                </div>
              </div>
            )}
            
            {/* FINANCIAL VIEW */}
            {tab === "financial" && (
              <div className="space-y-8 max-w-6xl animate-in fade-in duration-500">
                <header>
                  <h1 className="text-4xl font-black text-white tracking-tight">O Seu Financeiro</h1>
                  <p className="text-slate-400 font-medium">Consulte o seu saldo e histórico de faturas.</p>
                </header>

                <div className="grid grid-cols-1 gap-8">
                  <PortalFinancialView />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── Mobile Navigation ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 px-6 pb-8 pt-4 z-40">
        <div className="flex justify-between items-center">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                tab === id ? "text-blue-400" : "text-slate-600"
              )}>
              <Icon size={24} strokeWidth={tab === id ? 2.5 : 1.5} />
              <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Appointment request modal */}
      {showRequest && <RequestModal patients={patients} token={data.token || ""} onClose={() => setShowRequest(false)} />}
    </div>
  );
}

// ── Portal Messages View ──────────────────────────────────────────────────────
function PortalMessagesView({ clinic, owner }: { clinic: any; owner: any }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ["portal-messages"],
    queryFn: async () => {
      const res = await fetch("/api/portal/messages");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000
  });

  // Auto-select first thread if nothing selected
  useEffect(() => {
    if (!selectedRequestId && messages.length > 0) {
      setSelectedRequestId(messages[0].requestId);
    }
  }, [messages, selectedRequestId]);

  const send = useMutation({
    mutationFn: async () => {
      if (!reply.trim()) return;
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply, requestId: selectedRequestId })
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      return res.json();
    },
    onSuccess: () => {
      setReply("");
      refetch();
      toast.success("Mensagem enviada!");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  });

  if (isLoading) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto animate-bounce">
        <MessageSquare className="text-blue-400" size={24} />
      </div>
      <p className="text-slate-500 font-black animate-pulse">A carregar comunicações...</p>
    </div>
  );

  const threads = messages.filter((m: any, i: number, self: any[]) => 
    self.findIndex((t: any) => t.requestId === m.requestId) === i
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
       {/* List of topics/tickets */}
       <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversas</h3>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full">{threads.length}</span>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide">
            {threads.length === 0 ? (
              <div className="p-10 rounded-[2rem] bg-white/5 border border-dashed border-white/10 text-center">
                <MessageSquare className="mx-auto mb-3 text-slate-700" size={32} />
                <p className="text-[10px] font-black text-slate-500 uppercase">Sem histórico</p>
                <p className="text-[10px] text-slate-600 mt-1">As suas mensagens aparecerão aqui.</p>
              </div>
            ) : (
              threads.map((m: any) => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedRequestId(m.requestId)}
                  className={cn(
                    "w-full p-5 rounded-[2rem] border transition-all text-left group relative overflow-hidden",
                    selectedRequestId === m.requestId 
                      ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.02]" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                     <span className={cn(
                       "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                       selectedRequestId === m.requestId ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-400"
                     )}>
                       {m.requestId ? "Pedido Clínica" : "Geral"}
                     </span>
                     <span className={cn(
                       "text-[9px] font-bold",
                       selectedRequestId === m.requestId ? "text-blue-100" : "text-slate-600"
                     )}>
                       {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: pt })}
                     </span>
                  </div>
                  <p className={cn(
                    "text-sm font-black tracking-tight line-clamp-1",
                    selectedRequestId === m.requestId ? "text-white" : "text-slate-300"
                  )}>
                    {m.content}
                  </p>
                </button>
              ))
            )}
          </div>
       </div>

       {/* Chat view */}
       <div className="lg:col-span-8 flex flex-col bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {selectedRequestId !== undefined || messages.length > 0 ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <PawPrint size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Conversa com</p>
                    <p className="text-sm font-black text-white">{clinic.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages.filter((m: any) => m.requestId === selectedRequestId).map((m: any) => (
                    <div key={m.id} className={cn(
                      "flex flex-col max-w-[85%] gap-1",
                      m.senderType === "TUTOR" ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                        m.senderType === "TUTOR" 
                          ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10" 
                          : "bg-white/10 text-slate-200 rounded-tl-none border border-white/5"
                      )}>
                        {m.content}
                      </div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: pt })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 bg-white/5 border-t border-white/5 backdrop-blur-md">
                <div className="flex gap-3">
                   <Input 
                     placeholder="Escreva a sua resposta..."
                     className="flex-1 bg-slate-950/50 border-white/10 rounded-2xl h-14 text-sm font-medium placeholder:text-slate-600 focus:ring-blue-500 transition-all"
                     value={reply}
                     onChange={e => setReply(e.target.value)}
                     onKeyDown={e => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         send.mutate();
                       }
                     }}
                   />
                   <Button 
                     onClick={() => send.mutate()}
                     disabled={!reply.trim() || send.isPending}
                     className="h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                   >
                     {send.isPending ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <Send size={20} />
                     )}
                   </Button>
                </div>
                <p className="mt-3 text-[10px] text-slate-600 text-center font-medium italic">A clínica receberá a sua mensagem instantaneamente.</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare size={48} className="mb-4 text-slate-800" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-600">Selecione uma conversa</p>
            </div>
          )}
       </div>
    </div>
  );
}

// ── Portal Financial View ────────────────────────────────────────────────────
function PortalFinancialView() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-financial"],
    queryFn: async () => {
      const res = await fetch("/api/portal/invoices");
      if (!res.ok) throw new Error("Falha ao carregar dados financeiros");
      return res.json();
    }
  });

  if (isLoading) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
        <CreditCard size={24} />
      </div>
      <p className="text-slate-500 font-black animate-pulse">A carregar dados financeiros...</p>
    </div>
  );

  const { invoices = [], stats } = data || {};

  return (
    <div className="space-y-8">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Liquidado</p>
            <p className="text-5xl font-black text-white tracking-tighter">€{(stats?.totalInvoiced - stats?.outstandingBalance || 0).toFixed(2)}</p>
            <p className="text-emerald-200/60 text-xs mt-2 font-medium">Pagamentos efetuados com sucesso</p>
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-500",
          stats?.outstandingBalance > 0 
            ? "bg-red-500/10 border-red-500/20 shadow-xl shadow-red-900/20" 
            : "bg-white/5 border-white/10"
        )}>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Saldo em Aberto</p>
          <p className={cn(
            "text-5xl font-black tracking-tighter",
            stats?.outstandingBalance > 0 ? "text-red-400" : "text-white"
          )}>
            €{(stats?.outstandingBalance || 0).toFixed(2)}
          </p>
          <p className="text-slate-500 text-xs mt-2 font-medium">
            {stats?.outstandingBalance > 0 ? "Pendente de pagamento na clínica" : "Conta totalmente liquidada"}
          </p>
        </div>
      </div>

      {/* Invoice List */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <FileText size={16} className="text-blue-400" />
           <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Histórico de Documentos</h2>
        </div>
        
        <div className="space-y-3">
          {invoices.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 px-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/30 dark:bg-transparent">
                <FileText size={48} className="text-slate-800 mb-4" strokeWidth={1} />
                <p className="text-slate-400 font-bold">Ainda não existem faturas registadas.</p>
             </div>
          ) : (
            invoices.map((inv: any) => (
              <div key={inv.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg">{inv.jasminInvoiceId || `FT #${inv.id.slice(-6).toUpperCase()}`}</p>
                    <p className="text-slate-500 text-xs font-bold uppercase">{fmt(inv.createdAt)} · {inv.status === "PAID" ? "Pago" : "Pendente"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-2xl font-black text-white tracking-tight">€{(Number(inv.total) || 0).toFixed(2)}</p>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{inv.paymentMethod || "TPA / Dinheiro"}</p>
                  </div>
                  <Button variant="outline" className="rounded-xl h-12 w-12 border-white/10 bg-white/5 hover:bg-blue-600 hover:border-blue-600 transition-all group/btn" 
                    onClick={() => toast.info("Download de PDF em desenvolvimento")}>
                    <Download size={20} className="text-slate-400 group-hover/btn:text-white" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Info Box */}
      <div className="p-6 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex gap-4 items-start">
        <Activity size={20} className="text-blue-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-white font-black text-sm">Pagamentos na Clínica</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            As faturas apresentadas refletem os serviços prestados. Os pagamentos devem ser efetuados presencialmente na clínica via TPA (Multibanco) ou Numerário. Assim que o pagamento for processado, o portal será atualizado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

