"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Email ou password incorretos.");
      setLoading(false);
    } else {
      toast.success("Login efetuado com sucesso!");
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none bg-slate-900/80 backdrop-blur-xl ring-1 ring-white/10 rounded-[2.5rem]">
        <CardHeader className="space-y-2 text-center pb-8 pt-10">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
            <Stethoscope size={28} />
          </div>
          <CardTitle className="text-2xl font-black text-white">VetApp Cloud</CardTitle>
          <CardDescription className="text-slate-400">
            Introduz as tuas credenciais para aceder à clínica.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-400">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@vetapp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-slate-400">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {loading ? "A entrar..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-600">
            <p>Demo: admin@vetapp.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
