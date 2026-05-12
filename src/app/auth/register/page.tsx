"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Stethoscope, PawPrint, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [clinicVat, setClinicVat] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!clinicName.trim()) {
        toast.error("Nome da clínica é obrigatório");
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminPassword !== adminPasswordConfirm) {
      toast.error("As passwords não coincidem");
      return;
    }

    if (adminPassword.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic: {
            name: clinicName.trim(),
            vatNumber: clinicVat.trim() || undefined,
            phone: clinicPhone.trim() || undefined,
            email: clinicEmail.trim() || undefined,
          },
          admin: {
            name: adminName.trim(),
            email: adminEmail.trim(),
            password: adminPassword,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      toast.success("Clínica criada com sucesso!");
      router.push("/auth/signin");
    } catch {
      toast.error("Erro na comunicação com o servidor");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">VetApp Cloud</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Crie a sua clínica em minutos</p>
        </div>

        <Card className="border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900">
          <CardHeader className="space-y-2 text-center pb-6 pt-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                {step > 1 ? <CheckCircle2 size={16} /> : "1"}
              </div>
              <div className={`w-12 h-0.5 transition-all ${
                step > 1 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                2
              </div>
            </div>

            <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
              {step === 1 ? "Dados da Clínica" : "Conta do Administrador"}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {step === 1
                ? "Informações básicas da sua clínica veterinária"
                : "Crie a conta do administrador principal"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {step === 1 ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Nome da Clínica <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clinicName"
                    placeholder="Ex: Clínica VetVida"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicVat" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    NIF da Clínica
                  </Label>
                  <Input
                    id="clinicVat"
                    placeholder="Ex: 123456789"
                    value={clinicVat}
                    onChange={(e) => setClinicVat(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Telefone
                    </Label>
                    <Input
                      id="clinicPhone"
                      placeholder="210 000 000"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicEmail" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Email
                    </Label>
                    <Input
                      id="clinicEmail"
                      type="email"
                      placeholder="geral@clinica.pt"
                      value={clinicEmail}
                      onChange={(e) => setClinicEmail(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20"
                >
                  Próximo
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminName"
                    placeholder="Ex: Maria João"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@clinica.pt"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPasswordConfirm" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      Confirmar <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminPasswordConfirm"
                      type="password"
                      placeholder="••••••••"
                      value={adminPasswordConfirm}
                      onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                      required
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <PawPrint size={20} className="mr-2" />}
                    {loading ? "A criar..." : "Criar Clínica"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Já tem uma conta?{" "}
                <a href="/auth/signin" className="text-blue-600 font-bold hover:underline">
                  Entrar
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
