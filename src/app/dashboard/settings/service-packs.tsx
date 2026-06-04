"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Package } from "lucide-react";

interface Item {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface Pack {
  id: string;
  name: string;
  type: string;
  active: boolean;
  items: Item[];
}

const PACK_TYPES = [
  { value: "CONSULTATION", label: "Consulta Geral" },
  { value: "SURGERY", label: "Cirurgia" },
  { value: "VACCINE", label: "Vacinas" },
  { value: "CUSTOM", label: "Personalizado" },
];

export function ServicePacks() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "CUSTOM", items: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 23 }] });

  useEffect(() => { fetchPacks(); }, []);

  const fetchPacks = async () => {
    try {
      const res = await fetch("/api/settings/service-packs");
      if (res.ok) setPacks(await res.json());
    } catch { toast.error("Erro ao carregar packs"); }
    finally { setLoading(false); }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unitPrice: 0, vatRate: 23 }] });

  const removeItem = (i: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  };

  const updateItem = (i: number, field: keyof Item, value: any) => {
    const items = [...form.items];
    (items[i] as any)[field] = value;
    setForm({ ...form, items });
  };

  const savePack = async () => {
    if (!form.name) { toast.error("Nome do pack é obrigatório"); return; }
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/settings/service-packs/${editingId}` : "/api/settings/service-packs";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Pack atualizado!" : "Pack criado!");
      setShowForm(false); setEditingId(null);
      setForm({ name: "", type: "CUSTOM", items: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 23 }] });
      fetchPacks();
    } catch { toast.error("Erro ao guardar pack"); }
  };

  const editPack = (pack: Pack) => {
    setEditingId(pack.id);
    setForm({ name: pack.name, type: pack.type, items: pack.items });
    setShowForm(true);
  };

  const deletePack = async (id: string) => {
    if (!confirm("Tem a certeza?")) return;
    try {
      await fetch(`/api/settings/service-packs/${id}`, { method: "DELETE" });
      toast.success("Pack removido");
      fetchPacks();
    } catch { toast.error("Erro ao remover pack"); }
  };

  if (loading) return <div className="h-[200px] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={24} /></div>;

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/5 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <Package size={20} />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">Packs de Serviços</CardTitle>
                <CardDescription className="text-slate-400">Crie packs pré-definidos para faturação rápida (cirurgias, vacinas, consultas).</CardDescription>
              </div>
            </div>
            <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", type: "CUSTOM", items: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 23 }] }); }}
              className="h-10 rounded-xl gap-2 bg-emerald-600 font-bold px-4 text-xs">
              <Plus size={16} /> {showForm ? "Cancelar" : "Novo Pack"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Nome do Pack</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pack Cirurgia" className="rounded-xl bg-slate-800/50 border-slate-700/50 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Tipo</Label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white px-3 text-sm">
                    {PACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Itens do Pack</Label>
                  <Button variant="outline" size="sm" onClick={addItem} className="h-8 rounded-xl text-[10px] gap-1 border-slate-600 text-slate-300">
                    <Plus size={12} /> Adicionar Item
                  </Button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-[10px] text-slate-500">Descrição</Label>
                      <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Ex: Cirurgia + Anestesia" className="rounded-xl bg-slate-800/50 border-slate-700/50 text-white h-9 text-xs" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] text-slate-500">Qty</Label>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="rounded-xl bg-slate-800/50 border-slate-700/50 text-white h-9 text-xs" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] text-slate-500">Preço</Label>
                      <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} className="rounded-xl bg-slate-800/50 border-slate-700/50 text-white h-9 text-xs" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] text-slate-500">IVA %</Label>
                      <select value={item.vatRate} onChange={(e) => updateItem(i, "vatRate", parseInt(e.target.value))}
                        className="w-full h-9 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white px-2 text-xs">
                        <option value={23}>23%</option>
                        <option value={13}>13%</option>
                        <option value={6}>6%</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex items-end pb-1">
                      <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="h-9 w-9 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={savePack} className="h-10 rounded-xl gap-2 bg-emerald-600 font-bold px-6">
                  <Save size={16} /> {editingId ? "Atualizar Pack" : "Criar Pack"}
                </Button>
              </div>
            </div>
          )}

          {packs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhum pack criado ainda.</p>
          ) : (
            <div className="grid gap-3">
              {packs.map((pack) => (
                <div key={pack.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{pack.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">{PACK_TYPES.find(t => t.value === pack.type)?.label || pack.type}</span>
                      {!pack.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">Inativo</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pack.items.length} item(ns) · Total: {pack.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}€</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => editPack(pack)} className="h-8 px-3 rounded-xl text-xs text-slate-400 hover:text-white">Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePack(pack.id)} className="h-8 w-8 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
