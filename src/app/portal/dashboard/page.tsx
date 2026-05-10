"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  PawPrint, Syringe, Calendar, FileText, Phone, MapPin,
  AlertTriangle, ChevronRight, Heart, Weight, Thermometer,
  Activity, Shield, Clock, CheckCircle2, Dog, Cat, X,
  Stethoscope, Pill, Bell, Home, User, Star, LogOut
} from "lucide-react";
import { format, isPast, differenceInDays, differenceInYears } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
function RequestModal({ patients, token, onClose }: { patients: any[]; token: string; onClose: () => void }) {
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
                { icon: Thermometer, color: "text-orange-400",  label: "Temp",  val: lastVital.temperature ? `${lastVital.temperature}°C` : null },
                { icon: Heart,       color: "text-rose-400",    label: "FC",    val: lastVital.heartRate ? `${lastVital.heartRate}bpm` : null },
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Syringe size={10} /> Vacinas
              </p>
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Pill size={10} /> Medicação Ativa
              </p>
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Stethoscope size={10} /> Últimas Consultas
              </p>
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

// ── Main portal page ──────────────────────────────────────────────────────────
export default function PortalPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "animals" | "agenda" | "clinic">("home");
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
      console.error("Erro ao sair", error);
    }
  };

  // PWA install prompt
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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

  con  return (
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Main Info */}
                <div className="lg:col-span-8 space-y-8">
                  <header>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                      Olá, {owner.name.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-slate-400 font-medium">Bem-vindo à área reservada dos seus patudos.</p>
                  </header>

                  {/* Quick Stats / Alerts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vaccineAlerts?.slice(0, 2).map((alert: any, i: number) => (
                      <div key={i} className={cn(
                        "p-6 rounded-[2rem] border relative overflow-hidden group",
                        alert.expired ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"
                      )}>
                        <div className="relative z-10 space-y-3">
                          <AlertTriangle className={alert.expired ? "text-red-400" : "text-amber-400"} size={24} />
                          <div>
                            <p className="text-white font-black text-lg leading-tight">{alert.patientName}</p>
                            <p className="text-slate-400 text-sm">{alert.vaccineName} · {alert.expired ? "Expirada" : "A expirar"}</p>
                          </div>
                          <Button onClick={() => setShowRequest(true)} size="sm" className="bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase">Marcar Reforço</Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-6 rounded-[2rem] border border-blue-500/20 bg-blue-600/10 flex flex-col justify-between">
                       <Stethoscope className="text-blue-400" size={24} />
                       <div className="mt-4">
                         <p className="text-white font-black text-lg leading-tight">Nova Consulta</p>
                         <p className="text-slate-400 text-sm">Peça uma marcação online</p>
                       </div>
                       <Button onClick={() => setShowRequest(true)} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase mt-3">Pedir Agora</Button>
                    </div>
                  </div>

                  {/* Animals Preview */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                      <h2 className="text-xl font-black uppercase tracking-widest text-slate-500">Os Seus Animais</h2>
                      <button onClick={() => setTab("animals")} className="text-blue-400 font-black text-xs uppercase">Ver Todos</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {patients.map((p: any) => {
                        const Icon = p.species?.toLowerCase().includes("cão") || p.species?.toLowerCase().includes("can") ? Dog : Cat;
                        return (
                          <button key={p.id} onClick={() => setTab("animals")} className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all text-left group">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Icon size={32} />
                            </div>
                            <div>
                              <p className="font-black text-white text-xl">{p.name}</p>
                              <p className="text-slate-400 text-sm capitalize">{p.species} · {p.breed || "SRD"}</p>
                            </div>
                            <ChevronRight size={20} className="ml-auto text-slate-700 group-hover:text-blue-400 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Right: Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Next Appt Card */}
                  <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-500/20 space-y-6">
                    <h3 className="text-blue-200 text-xs font-black uppercase tracking-widest">Próxima Consulta</h3>
                    {nextAppointment ? (
                      <>
                        <div className="space-y-2">
                          <p className="text-4xl font-black text-white tracking-tighter">
                            {format(new Date(nextAppointment.startTime), "dd MMM", { locale: pt })}
                          </p>
                          <p className="text-blue-100 font-bold text-lg">
                            {format(new Date(nextAppointment.startTime), "EEEE, HH:mm", { locale: pt })}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                             <PawPrint size={20} className="text-white" />
                           </div>
                           <p className="font-bold text-white">{nextAppointment.patientName}</p>
                        </div>
                        <a href={`tel:${clinic.phone}`} className="block w-full py-4 rounded-2xl bg-white text-blue-600 text-center font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-colors">
                          Confirmar / Ligar
                        </a>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-blue-100 font-medium">Não tem nenhuma consulta agendada para breve.</p>
                        <Button onClick={() => setShowRequest(true)} className="w-full py-6 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black uppercase text-xs">Marcar Agora</Button>
                      </div>
                    )}
                  </div>

                  {/* Clinic Card */}
                  <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">A Sua Clínica</h3>
                    <div className="space-y-4">
                      <p className="text-white font-black text-xl leading-tight">{clinic.name}</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-400">
                          <MapPin size={16} className="text-blue-400" />
                          <span className="text-sm font-medium">{clinic.address || "Morada não disponível"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <Phone size={16} className="text-blue-400" />
                          <span className="text-sm font-medium">{clinic.phone}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 bg-white/5 border-white/10 rounded-xl font-bold" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`)}>Direções</Button>
                        <Button variant="outline" className="flex-1 bg-white/5 border-white/10 rounded-xl font-bold" onClick={() => window.location.href = `tel:${clinic.phone}`}>Ligar</Button>
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
                  <Button onClick={() => setShowRequest(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black px-8 h-14">Novo Pedido</Button>
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
                      <Button onClick={() => setShowRequest(true)} className="mt-6 bg-blue-600 hover:bg-blue-500 rounded-2xl px-8 h-14 font-black">Agendar Agora</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CLINIC VIEW (Desktop specific or merged) */}
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
                           <Mail className="text-blue-400" />
                           <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase">Email</p>
                             <p className="text-white font-bold">{clinic.email || "Não disponível"}</p>
                           </div>
                         </div>
                       </div>
                       <Button onClick={() => setShowRequest(true)} className="w-full h-16 rounded-2xl bg-blue-600 text-xl font-black">Pedir Marcação</Button>
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
      {showRequest && <RequestModal patients={patients} token={""} onClose={() => setShowRequest(false)} />}
    </div>
  );        tab === id ? "bg-blue-600/20 text-blue-400" : "text-slate-600 hover:text-slate-400"
              )}>
              <Icon size={22} strokeWidth={tab === id ? 2.5 : 1.5} />
              <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Appointment request modal */}
      {showRequest && <RequestModal patients={patients} token={token} onClose={() => setShowRequest(false)} />}
    </div>
  );
}

