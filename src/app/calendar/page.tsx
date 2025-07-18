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
    <div className="min-h-screen bg-[#e0e7ff] p-8 text-[#18181b]">
      <h1 className="text-3xl font-bold mb-8 font-orbitron" style={{ color: '#2563eb' }}>Calendário de Acompanhamento</h1>
      <div className="mb-6">
        <label className="font-semibold text-lg mr-2" style={{ color: '#2563eb' }}>Selecione a oferta:</label>
        <select
          className="bg-[#f3f4f6] text-[#18181b] px-4 py-2 rounded-lg border border-[#2563eb] focus:ring-2 focus:ring-[#2563eb] outline-none font-inter"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {ofertas.map(o => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow p-8 max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {historico.map((h) => (
            <div
              key={h.data}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-all duration-200 text-xs font-bold
                ${h.ativos === pico.ativos ? 'bg-[#2563eb] border-[#2563eb] text-white scale-110' : h.ativos > 0 ? 'bg-[#e0e7ff] border-[#2563eb] text-[#2563eb] hover:scale-105' : 'bg-[#f3f4f6] border-[#e5e7eb] text-[#6b7280]'}`}
              title={`${h.ativos} ativos em ${h.data}`}
            >
              <span>{new Date(h.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              <span>{h.ativos}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between" style={{ color: '#2563eb' }}>
          <span>Início: {inicio ? new Date(inicio).toLocaleDateString("pt-BR") : "-"}</span>
          <span>Fim: {fim ? new Date(fim).toLocaleDateString("pt-BR") : "-"}</span>
        </div>
        <div className="text-xs mt-2" style={{ color: '#6b7280' }}>O dia de pico é destacado em azul vibrante. Passe o mouse sobre um dia para ver o número de ativos.</div>
      </div>
    </div>
  );
} 