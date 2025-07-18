"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const NEON_COLORS = ["#8000ff", "#00ffe0", "#00ff99", "#ff00cc", "#ff9900"];

export default function CalendarPage() {
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOfertas() {
      const { data } = await supabase.from("ofertas").select("id, nome");
      setOfertas(data || []);
      if (data && data.length > 0) setSelectedId(data[0].id);
    }
    fetchOfertas();
  }, []);

  useEffect(() => {
    async function fetchHist() {
      if (!selectedId) return;
      const { data } = await supabase.from("historico_ofertas").select("data, ativos").eq("oferta_id", selectedId).order("data", { ascending: true });
      setHistorico(data || []);
    }
    fetchHist();
  }, [selectedId]);

  const pico = historico.reduce((max, h) => h.ativos > max.ativos ? h : max, { ativos: 0 });
  const inicio = historico[0]?.data;
  const fim = historico[historico.length-1]?.data;

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-8 text-white">
      <h1 className="text-3xl font-bold text-[#00ffe0] mb-8 font-orbitron">Calendário de Acompanhamento</h1>
      <div className="mb-6">
        <label className="text-white font-semibold text-lg mr-2">Selecione a oferta:</label>
        <select
          className="bg-[#1a1a2e] text-white px-4 py-2 rounded-lg border border-[#a259ff] focus:ring-2 focus:ring-[#a259ff] outline-none"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {ofertas.map(o => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>
      <div className="bg-[#1a002a] border-2 border-[#8000ff] rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {historico.map((h, i) => (
            <div
              key={h.data}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-all duration-300 text-xs font-bold
                ${h.ativos === pico.ativos ? 'bg-[#00ff99] border-[#00ff99] text-[#1a002a]' : h.ativos > 0 ? 'bg-[#8000ff] border-[#00ffe0] text-white' : 'bg-[#23234a] border-[#2d2d5a] text-gray-400'}`}
              title={`${h.ativos} ativos em ${h.data}`}
            >
              <span>{new Date(h.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              <span>{h.ativos}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[#00ffe0] mt-4">
          <span>Início: {inicio ? new Date(inicio).toLocaleDateString("pt-BR") : "-"}</span>
          <span>Fim: {fim ? new Date(fim).toLocaleDateString("pt-BR") : "-"}</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">O dia de pico é destacado em verde neon. Passe o mouse sobre um dia para ver o número de ativos.</div>
      </div>
    </div>
  );
} 