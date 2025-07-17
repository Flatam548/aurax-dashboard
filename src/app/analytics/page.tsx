"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { createClient } from '@supabase/supabase-js';

const chartColors = [
  "#a259ff", "#6a0dad", "#c084fc", "#7c3aed", "#818cf8", "#f472b6", "#facc15", "#f59e42", "#f87171", "#38bdf8"
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Oferta = {
  id: string;
  nome: string;
  dataCriacao: string;
};

export default function AnalyticsPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [historico, setHistorico] = useState<{ oferta_id: string; data: string; ativos: number }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: ofertasData } = await supabase.from('ofertas').select('id, nome, dataCriacao');
      const { data: historicoData } = await supabase.from('historico_ofertas').select('oferta_id, data, ativos');
      setOfertas(ofertasData || []);
      setHistorico(historicoData || []);
      setLoading(false);
      if (ofertasData && ofertasData.length > 0 && !selectedId) setSelectedId(ofertasData[0].id);
    }
    fetchData();
  }, []);

  // Dados da oferta selecionada
  const oferta = ofertas.find(o => o.id === selectedId);
  let chartData: Record<string, any>[] = [];
  let datasReais: string[] = [];
  if (oferta) {
    const dataMin = new Date(oferta.dataCriacao.split('/').reverse().join('-'));
    chartData = Array.from({ length: 15 }, (_, i) => {
      const dataDia = new Date(dataMin);
      dataDia.setDate(dataDia.getDate() + i);
      const dataStr = dataDia.toISOString().slice(0, 10);
      const hist = historico.find(h => h.oferta_id === oferta.id && h.data === dataStr);
      datasReais.push(dataDia.toLocaleDateString('pt-BR'));
      return {
        dia: `Dia ${i + 1}`,
        dataReal: dataDia.toLocaleDateString('pt-BR'),
        Ativos: hist ? hist.ativos : 0
      };
    });
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-8">Análise de Ofertas - Evolução dos Anúncios Ativos (15 dias)</h1>
        <div className="w-full max-w-5xl bg-[#23234a] rounded-2xl p-8 shadow-lg border border-[#6a0dad]">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <label className="text-white font-semibold text-lg">Selecione a oferta:</label>
            <select
              className="bg-[#1a1a2e] text-white px-4 py-2 rounded-lg border border-[#a259ff] focus:ring-2 focus:ring-[#a259ff] outline-none"
              value={selectedId || ''}
              onChange={e => setSelectedId(e.target.value)}
            >
              {ofertas.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="text-white text-lg">Carregando dados...</div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorAtivos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a259ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#23234a" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2d2d5a" strokeDasharray="3 3" />
                <XAxis dataKey="dia" stroke="#a259ff" tick={{ fill: "#a259ff", fontWeight: 600 }} interval={0} />
                <YAxis stroke="#a259ff" tick={{ fill: "#a259ff", fontWeight: 600 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#23234a", border: "1px solid #a259ff", color: "#fff" }} labelFormatter={(label, payload) => {
                  if (!payload || !payload.length) return label;
                  return `${label} (${payload[0].payload.dataReal})`;
                }} />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Line
                  type="monotone"
                  dataKey="Ativos"
                  stroke="#a259ff"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "#a259ff", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  fillOpacity={1}
                  fill="url(#colorAtivos)"
                  connectNulls
                />
                {/* Datas reais abaixo do gráfico */}
                {chartData.length > 0 && (
                  <XAxis
                    dataKey="dataReal"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={40}
                    tick={{ fill: "#818cf8", fontSize: 12, fontWeight: 500, dy: 20 }}
                    xAxisId="datas"
                    allowDuplicatedCategory={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="text-sm text-gray-300 mt-4">Selecione uma oferta para analisar. O gráfico mostra a evolução diária dos anúncios ativos nos primeiros 15 dias após o cadastro. As datas reais aparecem abaixo dos dias.</div>
        </div>
      </main>
    </div>
  );
} 