"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const NEON_COLORS = ["#8000ff", "#00ffe0", "#00ff99", "#ff00cc", "#ff9900"];

interface OfertaDetalhe { id: string; nome: string; categoria?: string; data_criacao?: string; }
interface HistoricoDia { data: string; ativos: number; notas?: string; tags?: string[]; }
interface Comparativo { id: string; nome: string; }

export default function DetalhesOfertaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [oferta, setOferta] = useState<OfertaDetalhe | null>(null);
  const [historico, setHistorico] = useState<HistoricoDia[]>([]);
  const [notas, setNotas] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState("");
  const [comparativo, setComparativo] = useState<Comparativo[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: ofertaData } = await supabase.from("ofertas").select("* ").eq("id", params.id).single();
      setOferta(ofertaData);
      const { data: hist } = await supabase.from("historico_ofertas").select("*").eq("oferta_id", params.id).order("data", { ascending: true });
      setHistorico(hist || []);
      setNotas(hist?.[0]?.notas || "");
      setTags(hist?.[0]?.tags || []);
      if (ofertaData?.categoria) {
        const { data: comp } = await supabase.from("ofertas").select("id, nome").eq("categoria", ofertaData.categoria).neq("id", params.id);
        setComparativo(comp || []);
      }
    }
    fetchData();
  }, [params.id]);

  // Timeline de picos
  const pico = historico.reduce(
    (max, h) => h.ativos > max.ativos ? h : max,
    historico[0] || { ativos: 0, data: "" }
  );
  const variacaoAcumulada = historico.length > 1 ? (((historico[historico.length-1].ativos - historico[0].ativos) / (historico[0].ativos || 1)) * 100).toFixed(1) : "0";

  // Upload handler (simples)
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data, error } = await supabase.storage.from("anexos").upload(`${params.id}/${file.name}`, file);
    if (data?.path) setUploadUrl(data.path);
  }

  // Salvar notas/tags
  async function salvarNotasTags() {
    await supabase.from("historico_ofertas").update({ notas, tags }).eq("oferta_id", params.id);
  }

  return (
    <div className="min-h-screen bg-[#18122B] p-8 text-[#F3F3F3]">
      <button onClick={() => router.back()} className="mb-4 text-[#00FFD0] underline">Voltar</button>
      <div className="bg-[#232046] border-2 border-[#A3FFD6] rounded-2xl shadow-[0_0_24px_#00FFD0] p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 font-orbitron" style={{ color: '#F9F871' }}>{oferta?.nome}</h2>
        <div className="flex gap-4 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#7C3AED', color: '#18122B' }}>{oferta?.categoria}</span>
          <span className="text-xs" style={{ color: '#A3A3A3' }}>Criado em: {oferta?.data_criacao}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={historico} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#2d2d5a" strokeDasharray="3 3" />
            <XAxis dataKey="data" tick={{ fill: "#7C3AED", fontWeight: 600 }} />
            <YAxis tick={{ fill: "#A3FFD6", fontWeight: 600 }} />
            <Tooltip contentStyle={{ background: "#232046", border: "1px solid #A3FFD6", color: "#F3F3F3" }} />
            <Line type="monotone" dataKey="ativos" stroke="#00FFD0" strokeWidth={3} dot={({ cx, cy, payload }) => payload.ativos === pico.ativos ? <circle cx={cx} cy={cy} r={8} fill="#F9F871" stroke="#00FFD0" strokeWidth={3} /> : <circle cx={cx} cy={cy} r={5} fill="#7C3AED" stroke="#F3F3F3" strokeWidth={2} />} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-2 mt-4">
          <span className="text-[#00FFD0]">Pico: {pico.ativos} ativos em {pico.data}</span>
          <span className="text-[#FF6AC2]">Variação acumulada: {variacaoAcumulada}%</span>
        </div>
        <div className="mt-6">
          <label className="block mb-1" style={{ color: '#A3FFD6' }}>Notas privadas:</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} className="w-full bg-[#232046] text-[#F3F3F3] rounded-lg p-2 border border-[#A3FFD6] focus:ring-2 focus:ring-[#00FFD0]" rows={3} />
          <div className="flex gap-2 mt-2">
            {["🔥 Potencial", "Morno", "Descartar"].map(tag => (
              <button key={tag} onClick={() => setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 ${tags.includes(tag) ? 'bg-gradient-to-r from-[#7C3AED] to-[#00FFD0] text-[#18122B] scale-105' : 'bg-[#232046] text-[#00FFD0] border-[#7C3AED] hover:scale-105'}`}>{tag}</button>
            ))}
          </div>
          <button onClick={salvarNotasTags} className="mt-2 bg-gradient-to-r from-[#00FFD0] to-[#FF6AC2] text-[#18122B] px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200">Salvar Notas/Tags</button>
        </div>
        <div className="mt-6">
          <label className="block mb-1" style={{ color: '#A3A3A3' }}>Upload de print/link:</label>
          <input type="file" onChange={handleUpload} className="block mb-2" />
          {uploadUrl && <a href={uploadUrl} target="_blank" rel="noopener" className="text-[#00FFD0] underline">Ver arquivo</a>}
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#FF6AC2' }}>Comparativo com outras ofertas ({oferta?.categoria})</h3>
          <ul className="list-disc ml-6" style={{ color: '#00FFD0' }}>
            {comparativo.map((o) => (
              <li key={o.id}>{o.nome}</li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#A3FFD6' }}>Histórico dos 15 dias</h3>
          <ul className="list-decimal ml-6">
            {historico.map((h, i) => (
              <li key={i} className={h.ativos === pico.ativos ? "text-[#F9F871] font-bold" : ""}>{h.data}: {h.ativos} ativos</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 