"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { createClient } from '@supabase/supabase-js';

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
  }, [selectedId]);

  // Dados da oferta selecionada
  const oferta = ofertas.find(o => o.id === selectedId);
  const chartData: Record<string, unknown>[] = [];
  const datasReais: string[] = [];
  if (oferta) {
    // Buscar os 15 dias mais recentes do histórico para a oferta
    const historicoOferta = historico
      .filter(h => h.oferta_id === oferta.id)
      .sort((a, b) => a.data.localeCompare(b.data));
    // Garante que sempre teremos 15 dias, preenchendo com 0 se faltar
    const ultimos15Dias = [];
    const hoje = new Date();
    let ultimoIndex = -1;
    for (let i = 14; i >= 0; i--) {
      const dataDia = new Date(hoje);
      dataDia.setDate(hoje.getDate() - i);
      const dataStr = dataDia.toISOString().slice(0, 10);
      const hist = historicoOferta.find(h => h.data === dataStr);
      datasReais.push(dataDia.toLocaleDateString('pt-BR'));
      chartData.push({
        dia: `Dia ${15 - i}`,
        dataReal: dataDia.toLocaleDateString('pt-BR'),
        Ativos: hist ? hist.ativos : 0,
        dataStr
      });
      if (hist && hist.ativos > 0) ultimoIndex = chartData.length - 1;
    }
    // Marca apenas o último ponto registrado como destaque
    if (ultimoIndex !== -1) {
      chartData[ultimoIndex].isHoje = true;
    }
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
                  dot={({ cx, cy, payload }) => (
                    payload.isHoje ? (
                      <circle cx={cx} cy={cy} r={10} fill="#fff" stroke="#a259ff" strokeWidth={4} />
                    ) : (
                      <circle cx={cx} cy={cy} r={5} fill="#a259ff" stroke="#fff" strokeWidth={2} />
                    )
                  )}
                  activeDot={{ r: 12, fill: "#a259ff", stroke: "#fff", strokeWidth: 4 }}
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