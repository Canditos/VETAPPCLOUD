"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  PawPrint, Syringe, Calendar, FileText, Phone, MapPin,
  AlertTriangle, ChevronRight, Heart, Weight, Thermometer,
  Activity, Shield, Clock, CheckCircle2, Dog, Cat, X,
  Stethoscope, Pill, Bell, Home, User, Star,
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
  const { token } = useParams<{ token: string }>();
  const [tab, setTab] = useState<"home" | "animals" | "agenda" | "clinic">("home");
  const [showRequest, setShowRequest] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal", token],
    queryFn: async () => {
      const res = await fetch(`/api/portal/me?token=${token}`);
      if (!res.ok) throw new Error("invalid");
      return res.json();
    },
    retry: false,
  });

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

  const { owner, clinic, patients, vaccineAlerts } = data;
  const nextAppointment = patients.flatMap((p: any) => p.appointments ?? []).sort(
    (a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )[0];

  const tabs = [
    { id: "home",    label: "Início",   icon: Home },
    { id: "animals", label: "Animais",  icon: PawPrint },
    { id: "agenda",  label: "Agenda",   icon: Calendar },
    { id: "clinic",  label: "Clínica",  icon: MapPin },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto">

      {/* Top bar */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
            <PawPrint size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm leading-tight">{clinic.name}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Portal do Tutor</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-sm">{owner.name.split(" ")[0]}</p>
          <p className="text-slate-500 text-[10px]">{patients.length} animal{patients.length !== 1 ? "is" : ""}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">

        {/* HOME */}
        {tab === "home" && (
          <div className="space-y-4 py-2">

            {/* Vaccine alerts */}
            {vaccineAlerts?.length > 0 && (
              <div className="space-y-2">
                {vaccineAlerts.map((alert: any, i: number) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border",
                    alert.expired
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <AlertTriangle size={18} className={alert.expired ? "text-red-400 shrink-0" : "text-amber-400 shrink-0"} />
                    <div className="flex-1">
                      <p className={cn("font-black text-sm", alert.expired ? "text-red-300" : "text-amber-300")}>
                        {alert.expired ? "Vacina expirada" : "Vacina a expirar"}
                      </p>
                      <p className="text-xs text-slate-400">{alert.patientName} · {alert.vaccineName}</p>
                    </div>
                    <button onClick={() => setShowRequest(true)}
                      className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-xl hover:bg-white/20 transition-colors shrink-0">
                      Marcar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Next appointment */}
            {nextAppointment ? (
              <div className="bg-blue-600 rounded-3xl p-5 space-y-3">
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Próxima Consulta</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Calendar size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-white text-lg leading-tight">
                      {format(new Date(nextAppointment.startTime), "d 'de' MMMM", { locale: pt })}
                    </p>
                    <p className="text-blue-200 text-sm">
                      {format(new Date(nextAppointment.startTime), "HH:mm", { locale: pt })} · {nextAppointment.type ?? "Consulta"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${clinic.phone}`}
                    className="flex-1 bg-white/20 hover:bg-white/30 rounded-2xl py-2.5 text-center font-black text-xs uppercase tracking-widest transition-colors">
                    Ligar
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Calendar size={22} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 font-bold text-sm">Sem consultas agendadas</p>
                </div>
                <button onClick={() => setShowRequest(true)}
                  className="text-[10px] font-black bg-blue-600 px-3 py-2 rounded-xl text-white shrink-0">
                  Pedir
                </button>
              </div>
            )}

            {/* Animals summary */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                Os Seus Animais
              </p>
              {patients.map((p: any) => {
                const Icon = p.species?.toLowerCase().includes("cão") || p.species?.toLowerCase().includes("can") ? Dog
                  : p.species?.toLowerCase().includes("gato") ? Cat : PawPrint;
                const age = p.birthDate ? differenceInYears(new Date(), new Date(p.birthDate)) : null;
                const expiredVax = p.vaccinations?.filter((v: any) => v.expiresAt && isPast(new Date(v.expiresAt))).length ?? 0;
                return (
                  <button key={p.id} onClick={() => setTab("animals")}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl mb-2 hover:bg-white/10 transition-colors text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-white">{p.name}</p>
                      <p className="text-slate-400 text-xs capitalize">{p.species}{age !== null ? ` · ${age} anos` : ""}</p>
                    </div>
                    {expiredVax > 0 && (
                      <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-2 py-1 rounded-lg">
                        {expiredVax} vacina{expiredVax > 1 ? "s" : ""}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-slate-600" />
                  </button>
                );
              })}
            </div>

            {/* Request appointment CTA */}
            <button onClick={() => setShowRequest(true)}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20">
              + Pedir Marcação
            </button>
          </div>
        )}

        {/* ANIMALS */}
        {tab === "animals" && (
          <div className="space-y-4 py-2">
            <h2 className="font-black text-2xl text-white tracking-tight">Os seus animais</h2>
            {patients.map((p: any) => <PatientCard key={p.id} patient={p} />)}
          </div>
        )}

        {/* AGENDA */}
        {tab === "agenda" && (
          <div className="space-y-4 py-2">
            <h2 className="font-black text-2xl text-white tracking-tight">Agenda</h2>
            {patients.flatMap((p: any) => (p.appointments ?? []).map((a: any) => ({ ...a, patientName: p.name }))).length > 0 ? (
              patients.flatMap((p: any) => (p.appointments ?? []).map((a: any) => ({ ...a, patientName: p.name })))
                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((a: any) => (
                  <div key={a.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Calendar size={22} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-white">{a.patientName}</p>
                      <p className="text-slate-400 text-sm capitalize">{a.type ?? "Consulta"}</p>
                      <p className="text-blue-400 font-bold text-sm mt-1 capitalize">{fmtTime(a.startTime)}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-16 space-y-4">
                <Calendar size={48} className="mx-auto text-slate-700" strokeWidth={1.2} />
                <p className="text-slate-400 font-bold">Sem consultas agendadas</p>
                <button onClick={() => setShowRequest(true)}
                  className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm">
                  Pedir Marcação
                </button>
              </div>
            )}
          </div>
        )}

        {/* CLINIC */}
        {tab === "clinic" && (
          <div className="space-y-4 py-2">
            <h2 className="font-black text-2xl text-white tracking-tight">A Clínica</h2>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div>
                <p className="font-black text-white text-xl">{clinic.name}</p>
                {clinic.address && <p className="text-slate-400 text-sm mt-1">{clinic.address}</p>}
              </div>
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</p>
                    <p className="text-white font-bold">{clinic.phone}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-600" />
                </a>
              )}
              {clinic.email && (
                <a href={`mailto:${clinic.email}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="text-white font-bold">{clinic.email}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-600" />
                </a>
              )}
              <button onClick={() => setShowRequest(true)}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-all">
                Pedir Marcação
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-2 pb-safe">
        <div className="grid grid-cols-4 gap-1 py-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all",
                tab === id ? "bg-blue-600/20 text-blue-400" : "text-slate-600 hover:text-slate-400"
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
