"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Oferta { id: string; nome: string; }
interface HistoricoDia { data: string; ativos: number; }

export default function CalendarPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [historico, setHistorico] = useState<HistoricoDia[]>([]);

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
    <div className="min-h-screen bg-[#18122B] p-8 text-[#F3F3F3]">
      <h1 className="text-3xl font-bold mb-8 font-orbitron" style={{ color: '#F9F871' }}>Calendário de Acompanhamento</h1>
      <div className="mb-6">
        <label className="font-semibold text-lg mr-2" style={{ color: '#A3FFD6' }}>Selecione a oferta:</label>
        <select
          className="bg-[#18122B] text-[#F3F3F3] px-4 py-2 rounded-lg border border-[#7C3AED] focus:ring-2 focus:ring-[#A3FFD6] outline-none"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {ofertas.map(o => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>
      <div className="bg-[#232046] border-2 border-[#A3FFD6] rounded-2xl shadow-[0_0_24px_#00FFD0] p-8 max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {historico.map((h) => (
            <div
              key={h.data}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-all duration-300 text-xs font-bold
                ${h.ativos === pico.ativos ? 'bg-[#F9F871] border-[#00FFD0] text-[#18122B] scale-110' : h.ativos > 0 ? 'bg-[#00FFD0] border-[#7C3AED] text-[#232046] hover:scale-105' : 'bg-[#232046] border-[#2d2d5a] text-[#A3A3A3]'}`}
              title={`${h.ativos} ativos em ${h.data}`}
            >
              <span>{new Date(h.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              <span>{h.ativos}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between" style={{ color: '#A3FFD6' }}>
          <span>Início: {inicio ? new Date(inicio).toLocaleDateString("pt-BR") : "-"}</span>
          <span>Fim: {fim ? new Date(fim).toLocaleDateString("pt-BR") : "-"}</span>
        </div>
        <div className="text-xs mt-2" style={{ color: '#A3A3A3' }}>O dia de pico é destacado em amarelo neon. Passe o mouse sobre um dia para ver o número de ativos.</div>
      </div>
    </div>
  );
} 