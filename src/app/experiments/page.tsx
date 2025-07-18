"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface OfertaExp { id: string; nome: string; categoria?: string; experimento?: string; criativo?: string; }
interface HistoricoExp { ativos: number; }

export default function ExperimentsPage() {
  const [ofertas, setOfertas] = useState<OfertaExp[]>([]);
  const [experimentos, setExperimentos] = useState<Record<string, string>>({});
  const [criativos, setCriativos] = useState<Record<string, string>>({});
  const [historicos, setHistoricos] = useState<Record<string, HistoricoExp[]>>({});

  useEffect(() => {
    async function fetchOfertas() {
      const { data } = await supabase.from("ofertas").select("id, nome, categoria, experimento");
      setOfertas(data || []);
      const histObj: Record<string, HistoricoExp[]> = {};
      for (const oferta of data || []) {
        const { data: hist } = await supabase.from("historico_ofertas").select("ativos").eq("oferta_id", oferta.id).order("data", { ascending: true });
        histObj[oferta.id] = hist || [];
      }
      setHistoricos(histObj);
    }
    fetchOfertas();
  }, []);

  async function marcarExperimento(ofertaId: string, tipo: string) {
    await supabase.from("ofertas").update({ experimento: tipo }).eq("id", ofertaId);
    setExperimentos(prev => ({ ...prev, [ofertaId]: tipo }));
  }

  async function salvarCriativo(ofertaId: string, texto: string) {
    await supabase.from("ofertas").update({ criativo: texto }).eq("id", ofertaId);
    setCriativos(prev => ({ ...prev, [ofertaId]: texto }));
  }

  // Resultado comparativo
  function getResultado(ofertaId: string) {
    const hist = historicos[ofertaId] || [];
    if (hist.length < 15) return "Aguardando 15 dias...";
    const total = hist.reduce((acc, h) => acc + h.ativos, 0);
    return `Total: ${total} ativos`;
  }

  // Melhor desempenho
  const grupos: Record<string, { id: string; nome: string; total: number; tipo: string }> = {};
  for (const oferta of ofertas) {
    const tipo = oferta.experimento || experimentos[oferta.id] || "";
    if (!tipo) continue;
    const hist = historicos[oferta.id] || [];
    const total = hist.reduce((acc, h) => acc + h.ativos, 0);
    grupos[tipo] = grupos[tipo] && grupos[tipo].total > total ? grupos[tipo] : { id: oferta.id, nome: oferta.nome, total, tipo };
  }
  const melhor = Object.values(grupos).sort((a, b) => b.total - a.total)[0];

  return (
    <div className="min-h-screen bg-[#e0e7ff] p-8 text-[#18181b]">
      <h1 className="text-3xl font-bold mb-8 font-orbitron" style={{ color: '#2563eb' }}>Experimentos A/B</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {ofertas.map(oferta => (
          <div key={oferta.id} className="bg-white border border-[#e5e7eb] rounded-2xl shadow p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-orbitron text-lg" style={{ color: '#2563eb' }}>{oferta.nome}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e0e7ff] text-[#2563eb]">{oferta.categoria}</span>
            </div>
            <div className="flex gap-2 mt-2">
              {["A", "B"].map(tipo => (
                <button key={tipo} onClick={() => marcarExperimento(oferta.id, tipo)} className={`px-4 py-2 rounded-lg font-bold border transition-all duration-200 font-inter ${((oferta.experimento || experimentos[oferta.id]) === tipo) ? 'bg-[#2563eb] text-white scale-105' : 'bg-[#e0e7ff] text-[#2563eb] border-[#2563eb] hover:scale-105'}`}>Teste {tipo}</button>
              ))}
            </div>
            <div className="mt-2">
              <label className="block mb-1" style={{ color: '#2563eb' }}>Criativo/Copy testado:</label>
              <textarea value={criativos[oferta.id] || oferta.criativo || ""} onChange={e => salvarCriativo(oferta.id, e.target.value)} className="w-full bg-[#f3f4f6] text-[#18181b] rounded-lg p-2 border border-[#e5e7eb] focus:ring-2 focus:ring-[#2563eb] font-inter" rows={2} />
            </div>
            <div className="mt-2 font-mono" style={{ color: '#2563eb' }}>{getResultado(oferta.id)}</div>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2 font-orbitron" style={{ color: '#2563eb' }}>Melhor desempenho</h2>
        {melhor ? (
          <div className="bg-[#2563eb] text-white px-6 py-4 rounded-xl font-bold shadow w-fit">Teste {melhor.tipo}: {melhor.nome} ({melhor.total} ativos)</div>
        ) : <div className="text-[#6b7280]">Nenhum experimento finalizado ainda.</div>}
      </div>
    </div>
  );
} 