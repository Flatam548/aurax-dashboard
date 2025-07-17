"use client";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
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

type Historico = {
  oferta_id: string;
  data: string;
  ativos: number;
};

export default function AnalyticsPage() {
  const [series, setSeries] = useState<{ nome: string; data: (number|null)[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Busca todas as ofertas
      const { data: ofertas } = await supabase.from('ofertas').select('id, nome, dataCriacao');
      // Busca todo o histórico
      const { data: historico } = await supabase.from('historico_ofertas').select('oferta_id, data, ativos');
      if (!ofertas || !historico) { setLoading(false); return; }
      // Monta as séries para o gráfico
      const result: { nome: string; data: (number|null)[] }[] = ofertas.map(oferta => {
        // Data de mineração/cadastro
        const dataMin = new Date(oferta.dataCriacao.split('/').reverse().join('-'));
        // Pega os 15 primeiros dias
        const dias: (number|null)[] = [];
        for (let i = 0; i < 15; i++) {
          const dataDia = new Date(dataMin);
          dataDia.setDate(dataDia.getDate() + i);
          const dataStr = dataDia.toISOString().slice(0, 10);
          const hist = historico.find(h => h.oferta_id === oferta.id && h.data === dataStr);
          dias.push(hist ? hist.ativos : null);
        }
        return { nome: oferta.nome, data: dias };
      });
      setSeries(result);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Monta os dados para o gráfico (um objeto por dia)
  const chartData = Array.from({ length: 15 }, (_, i) => {
    const obj: any = { dia: `Dia ${i + 1}` };
    series.forEach(serie => {
      obj[serie.nome] = serie.data[i] ?? null;
    });
    return obj;
  });

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Análise de Ofertas - Evolução dos Anúncios Ativos (15 dias)</h1>
      <div className="w-full max-w-5xl bg-[#23234a] rounded-2xl p-8 shadow-lg border border-[#6a0dad]">
        {loading ? (
          <div className="text-white text-lg">Carregando dados...</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2d2d5a" strokeDasharray="3 3" />
              <XAxis dataKey="dia" stroke="#a259ff" tick={{ fill: "#a259ff", fontWeight: 600 }} />
              <YAxis stroke="#a259ff" tick={{ fill: "#a259ff", fontWeight: 600 }} />
              <Tooltip contentStyle={{ background: "#23234a", border: "1px solid #a259ff", color: "#fff" }} />
              <Legend wrapperStyle={{ color: "#fff" }} />
              {series.map((serie, idx) => (
                <Line
                  key={serie.nome}
                  type="monotone"
                  dataKey={serie.nome}
                  stroke={chartColors[idx % chartColors.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="text-sm text-gray-300 mt-4">Cada linha representa uma oferta. Os dados mostram a evolução diária dos anúncios ativos nos primeiros 15 dias após o cadastro.</div>
      </div>
    </div>
  );
} 