"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const NEON_COLORS = ["#8000ff", "#00ffe0", "#00ff99", "#ff00cc", "#ff9900"];

export default function DetalhesOfertaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [oferta, setOferta] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [notas, setNotas] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState("");
  const [comparativo, setComparativo] = useState<any[]>([]);

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
  const pico = historico.reduce((max, h) => h.ativos > max.ativos ? h : max, { ativos: 0 });
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
    <div className="min-h-screen bg-[#0d0d1a] p-8 text-white">
      <button onClick={() => router.back()} className="mb-4 text-[#00ffe0] underline">Voltar</button>
      <div className="bg-[#1a002a] border-2 border-[#8000ff] rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[#00ff99] mb-2 font-orbitron">{oferta?.nome}</h2>
        <div className="flex gap-4 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: NEON_COLORS[0], color: '#1a002a' }}>{oferta?.categoria}</span>
          <span className="text-xs text-gray-400">Criado em: {oferta?.data_criacao}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={historico} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#2d2d5a" strokeDasharray="3 3" />
            <XAxis dataKey="data" tick={{ fill: "#8000ff", fontWeight: 600 }} />
            <YAxis tick={{ fill: "#00ffe0", fontWeight: 600 }} />
            <Tooltip contentStyle={{ background: "#1a002a", border: "1px solid #8000ff", color: "#fff" }} />
            <Line type="monotone" dataKey="ativos" stroke="#00ffe0" strokeWidth={3} dot={({ cx, cy, payload }) => payload.ativos === pico.ativos ? <circle cx={cx} cy={cy} r={8} fill="#00ff99" stroke="#8000ff" strokeWidth={3} /> : <circle cx={cx} cy={cy} r={5} fill="#8000ff" stroke="#fff" strokeWidth={2} />} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-2 mt-4">
          <span className="text-[#00ff99]">Pico: {pico.ativos} ativos em {pico.data}</span>
          <span className="text-[#00ffe0]">Variação acumulada: {variacaoAcumulada}%</span>
        </div>
        <div className="mt-6">
          <label className="block text-[#a259ff] mb-1">Notas privadas:</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} className="w-full bg-[#23234a] text-white rounded-lg p-2 border border-[#8000ff] focus:ring-2 focus:ring-[#00ffe0]" rows={3} />
          <div className="flex gap-2 mt-2">
            {["🔥 Potencial", "Morno", "Descartar"].map(tag => (
              <button key={tag} onClick={() => setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])} className={`px-3 py-1 rounded-full text-xs font-bold border ${tags.includes(tag) ? 'bg-gradient-to-r from-[#8000ff] to-[#00ffe0] text-[#1a002a]' : 'bg-[#23234a] text-[#00ffe0] border-[#8000ff]'}`}>{tag}</button>
            ))}
          </div>
          <button onClick={salvarNotasTags} className="mt-2 bg-gradient-to-r from-[#00ff99] to-[#00ffe0] text-[#1a002a] px-4 py-2 rounded-lg font-bold shadow hover:opacity-90 transition">Salvar Notas/Tags</button>
        </div>
        <div className="mt-6">
          <label className="block text-[#a259ff] mb-1">Upload de print/link:</label>
          <input type="file" onChange={handleUpload} className="block mb-2" />
          {uploadUrl && <a href={uploadUrl} target="_blank" rel="noopener" className="text-[#00ffe0] underline">Ver arquivo</a>}
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-bold text-[#ff00cc] mb-2">Comparativo com outras ofertas ({oferta?.categoria})</h3>
          <ul className="list-disc ml-6 text-[#00ffe0]">
            {comparativo.map((o: any) => (
              <li key={o.id}>{o.nome}</li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-bold text-[#a259ff] mb-2">Histórico dos 15 dias</h3>
          <ul className="list-decimal ml-6 text-white">
            {historico.map((h, i) => (
              <li key={i} className={h.ativos === pico.ativos ? "text-[#00ff99] font-bold" : ""}>{h.data}: {h.ativos} ativos</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 