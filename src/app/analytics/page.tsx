"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, Cell } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Oferta = {
  id: string;
  nome: string;
  dataCriacao: string;
};

interface HistoricoDia {
  oferta_id: string;
  data: string;
  ativos: number;
}
interface ChartDia {
  dia: string;
  dataReal: string;
  Ativos: number;
  dataStr: string;
  isHoje?: boolean;
}

function Heatmap({ chartData }: { chartData: ChartDia[] }) {
  return (
    <div className="flex gap-1 mt-8 mb-4 justify-center">
      {chartData.map((d, idx) => (
        <div
          key={idx}
          className={`w-6 h-6 rounded transition-all duration-300 border-2 ${d.Ativos > 100 ? 'bg-[#00ff99] border-[#00ff99]' : d.Ativos > 50 ? 'bg-[#00ffe0] border-[#00ffe0]' : d.Ativos > 0 ? 'bg-[#8000ff] border-[#8000ff]' : 'bg-[#23234a] border-[#2d2d5a]'}`}
          title={`${d.Ativos} ativos em ${d.dataReal}`}
        />
      ))}
    </div>
  );
}

function BarraHojeOntem({ chartData }: { chartData: ChartDia[] }) {
  const hoje = chartData[chartData.length-1]?.Ativos ?? 0;
  const ontem = chartData[chartData.length-2]?.Ativos ?? 0;
  return (
    <div className="w-full max-w-xs mx-auto mt-6 mb-4">
      <BarChart width={220} height={120} data={[{ name: 'Ontem', valor: ontem }, { name: 'Hoje', valor: hoje }]}> 
        <Bar dataKey="valor">
          <Cell fill="#8000ff" />
          <Cell fill="#00ffe0" />
        </Bar>
      </BarChart>
      <div className="flex justify-between text-xs text-[#a259ff] mt-1">
        <span>Ontem: {ontem}</span>
        <span>Hoje: {hoje}</span>
      </div>
    </div>
  );
}

function Insights({ chartData }: { chartData: ChartDia[] }) {
  // Previsão simples: média dos últimos 3 dias * 5
  const ultimos = chartData.slice(-3);
  const media = ultimos.length ? (ultimos.reduce((acc, d) => acc + d.Ativos, 0) / ultimos.length) : 0;
  const previsao = Math.round(media * 5);
  return (
    <div className="mt-4 mb-2 flex flex-col items-center">
      <button className="bg-gradient-to-r from-[#8000ff] to-[#00ffe0] text-[#1a002a] px-6 py-2 rounded-lg font-bold shadow hover:opacity-90 transition mb-2">
        Insights
      </button>
      <div className="text-[#00ff99] font-mono text-sm">Se continuar assim, previsão de <b>{previsao}</b> ativos em 5 dias.</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [historico, setHistorico] = useState<HistoricoDia[]>([]);
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
  const chartData: ChartDia[] = [];
  if (oferta) {
    const dataInicio = new Date(oferta.dataCriacao.split('/').reverse().join('-'));
    const hoje = new Date();
    const diasPassados = Math.min(
      Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      15
    );
    const historicoOferta = historico
      .filter(h => h.oferta_id === oferta.id)
      .map(h => ({ ...h, data: h.data.slice(0, 10) }))
      .sort((a, b) => a.data.localeCompare(b.data));
    let ultimoIndex = -1;
    for (let i = 0; i < diasPassados; i++) {
      const dataDia = new Date(dataInicio);
      dataDia.setDate(dataInicio.getDate() + i);
      const dataStr = dataDia.toISOString().slice(0, 10);
      const hist = historicoOferta.find(h => h.data === dataStr);
      chartData.push({
        dia: `Dia ${i + 1}`,
        dataReal: dataDia.toLocaleDateString('pt-BR'),
        Ativos: hist ? hist.ativos : 0,
        dataStr
      });
      if (hist && hist.ativos > 0) ultimoIndex = chartData.length - 1;
    }
    if (ultimoIndex !== -1) {
      chartData[ultimoIndex].isHoje = true;
    }
  }

  return (
    <div className="min-h-screen bg-[#e0e7ff] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8 font-orbitron" style={{ color: '#2563eb' }}>Análise de Ofertas - Evolução dos Anúncios Ativos (15 dias)</h1>
        <div className="w-full max-w-5xl bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <label className="font-semibold text-lg" style={{ color: '#2563eb' }}>Selecione a oferta:</label>
            <select
              className="bg-[#f3f4f6] text-[#18181b] px-4 py-2 rounded-lg border border-[#2563eb] focus:ring-2 focus:ring-[#2563eb] outline-none font-inter"
              value={selectedId || ''}
              onChange={e => setSelectedId(e.target.value)}
            >
              {ofertas.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="text-[#18181b] text-lg">Carregando dados...</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorAtivos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fff" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="dia" stroke="#2563eb" tick={{ fill: "#2563eb", fontWeight: 600 }} interval={0} />
                  <YAxis stroke="#2563eb" tick={{ fill: "#2563eb", fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #2563eb", color: "#18181b" }} labelFormatter={(label, payload) => {
                    if (!payload || !payload.length) return label;
                    return `${label} (${payload[0].payload.dataReal})`;
                  }} />
                  <Legend wrapperStyle={{ color: "#18181b" }} />
                  <Line
                    type="monotone"
                    dataKey="Ativos"
                    stroke="#2563eb"
                    strokeWidth={4}
                    dot={({ cx, cy, payload }) => (
                      payload.isHoje ? (
                        <circle cx={cx} cy={cy} r={10} fill="#F9F871" stroke="#2563eb" strokeWidth={4} />
                      ) : (
                        <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#fff" strokeWidth={2} />
                      )
                    )}
                    activeDot={{ r: 12, fill: "#fff", stroke: "#2563eb", strokeWidth: 4 }}
                    fillOpacity={1}
                    fill="url(#colorAtivos)"
                    connectNulls
                  />
                  {chartData.length > 0 && (
                    <XAxis
                      dataKey="dataReal"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={40}
                      tick={{ fill: "#2563eb", fontSize: 12, fontWeight: 500, dy: 20 }}
                      xAxisId="datas"
                      allowDuplicatedCategory={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <Heatmap chartData={chartData} />
              <BarraHojeOntem chartData={chartData} />
              <Insights chartData={chartData} />
              <div className="text-sm mt-4" style={{ color: '#6b7280' }}>Selecione uma oferta para analisar. O gráfico mostra a evolução diária dos anúncios ativos nos primeiros 15 dias após o cadastro. As datas reais aparecem abaixo dos dias. O heatmap indica os dias mais &quot;quentes&quot; e o gráfico de barras compara hoje vs ontem.</div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 