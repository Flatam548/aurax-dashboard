"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Label } from "recharts";
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
  ativosHoje: number;
  ativosOntem: number;
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

// Função para gerar dados de exemplo quando não há histórico
function gerarDadosExemplo(dataInicio: Date, diasPassados: number): ChartDia[] {
  const chartData: ChartDia[] = [];
  const hoje = new Date();
  
  for (let i = 0; i < diasPassados; i++) {
    const dataDia = new Date(dataInicio);
    dataDia.setDate(dataInicio.getDate() + i);
    const dataStr = dataDia.toISOString().slice(0, 10);
    
    // Gera dados realistas baseados no dia
    let ativos = 0;
    if (i >= 2) { // Começa a ter dados a partir do 3º dia
      const baseValue = Math.floor(Math.random() * 50) + 10; // 10-60 ativos base
      const crescimento = Math.min(i * 0.3, 1.5); // Crescimento gradual
      const variacao = (Math.random() - 0.5) * 0.4; // Variação de ±20%
      ativos = Math.max(0, Math.floor(baseValue * (1 + crescimento) * (1 + variacao)));
    }
    
    chartData.push({
      dia: `Dia ${i + 1}`,
      dataReal: dataDia.toLocaleDateString('pt-BR'),
      Ativos: ativos,
      dataStr,
      isHoje: dataStr === hoje.toISOString().slice(0, 10)
    });
  }
  
  return chartData;
}

function Heatmap({ chartData }: { chartData: ChartDia[] }) {
  return (
    <div className="flex gap-1 mt-8 mb-2 justify-center">
      {chartData.map((d, idx) => {
        let color = "#23272a"; // sem ativos
        if (d.Ativos > 0 && d.Ativos <= 30) color = "#2e2e2e"; // baixo
        if (d.Ativos > 30 && d.Ativos <= 80) color = "#9ca3af"; // médio
        if (d.Ativos > 80) color = "#ccff00"; // alto
        return (
          <div
            key={idx}
            className="w-6 h-6 rounded transition-all duration-300 border-2"
            style={{ background: color, borderColor: color }}
            title={`${d.Ativos} ativos em ${d.dataReal}`}
          />
        );
      })}
    </div>
  );
}

function BarraHojeOntem({ chartData }: { chartData: ChartDia[] }) {
  const hoje = chartData[chartData.length-1]?.Ativos ?? 0;
  const ontem = chartData[chartData.length-2]?.Ativos ?? 0;
  return (
    <div className="w-full max-w-xs mx-auto mt-6 mb-4 flex flex-col items-center">
      <BarChart width={180} height={120} data={[{ name: 'Ontem', valor: ontem }, { name: 'Hoje', valor: hoje }]}> 
        <Bar dataKey="valor">
          <Cell fill="#2e2e2e" />
          <Cell fill="#ccff00" />
        </Bar>
      </BarChart>
      <div className="flex justify-between w-full px-2 text-xs mt-1">
        <span className="text-[#9ca3af]">Ontem: <span className="font-bold text-[#9ca3af]">{ontem}</span></span>
        <span className="text-[#ccff00]">Hoje: <span className="font-bold text-[#ccff00]">{hoje}</span></span>
      </div>
    </div>
  );
}

function Insights({ chartData }: { chartData: ChartDia[] }) {
  // Previsão simples: média dos últimos 3 dias * 5
  const ultimos = chartData.slice(-3);
  const media = ultimos.length ? (ultimos.reduce((acc, d) => acc + d.Ativos, 0) / ultimos.length) : 0;
  const previsao = Math.round(media * 5);
  
  // Calcula crescimento percentual
  const hoje = chartData[chartData.length-1]?.Ativos ?? 0;
  const ontem = chartData[chartData.length-2]?.Ativos ?? 0;
  const crescimento = ontem > 0 ? ((hoje - ontem) / ontem) * 100 : 0;
  
  return (
    <div className="mt-4 mb-2 flex flex-col items-center">
      <button className="bg-gradient-to-r from-[#8000ff] to-[#00ffe0] text-[#1a002a] px-6 py-2 rounded-lg font-bold shadow hover:opacity-90 transition mb-2">
        Insights
      </button>
      <div className="text-[#00ff99] font-mono text-sm mb-1">
        Se continuar assim, previsão de <b>{previsao}</b> ativos em 5 dias.
      </div>
      {crescimento !== 0 && (
        <div className={`text-sm font-mono ${crescimento > 0 ? 'text-[#00ff99]' : 'text-[#ff6b6b]'}`}>
          Crescimento: {crescimento > 0 ? '+' : ''}{crescimento.toFixed(1)}% vs ontem
        </div>
      )}
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
      try {
        const { data: ofertasData, error: ofertasError } = await supabase
          .from('ofertas')
          .select('id, nome, dataCriacao, ativosHoje, ativosOntem');
        
        const { data: historicoData, error: historicoError } = await supabase
          .from('historico_ofertas')
          .select('oferta_id, data, ativos');
        
        if (ofertasError) {
          console.error('Erro ao buscar ofertas:', ofertasError);
        }
        if (historicoError) {
          console.error('Erro ao buscar histórico:', historicoError);
        }
        
        setOfertas(ofertasData || []);
        setHistorico(historicoData || []);
        // Logs para debug
        console.log('ofertasData:', ofertasData);
        console.log('historicoData:', historicoData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Garante que sempre haja uma oferta selecionada quando as ofertas mudam
  useEffect(() => {
    if (ofertas.length > 0 && (!selectedId || !ofertas.some(o => o.id === selectedId))) {
      setSelectedId(ofertas[0].id);
    }
  }, [ofertas, selectedId]);

  // Dados da oferta selecionada
  const oferta = ofertas.find(o => o.id === selectedId);
  const chartData: ChartDia[] = [];
  
  if (oferta) {
    // Garante que a data de início seja o menor dia do histórico ou a data de criação, o que for mais antigo
    const datasHistorico = historico.filter(h => h.oferta_id === oferta.id).map(h => h.data.slice(0, 10));
    const dataInicioStr = datasHistorico.length > 0 ? datasHistorico.sort()[0] : oferta.dataCriacao;
    const dataInicio = new Date(dataInicioStr);
    dataInicio.setHours(0,0,0,0); // força meia-noite
    const hoje = new Date();
    hoje.setHours(0,0,0,0); // força meia-noite
    const diasPassados = Math.min(
      Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      15
    );
    // Busca histórico específico da oferta
    const historicoOferta = historico
      .filter(h => h.oferta_id === oferta.id)
      .map(h => ({ ...h, data: h.data.slice(0, 10) }))
      .sort((a, b) => a.data.localeCompare(b.data));
    // Garante que todos os dias até hoje estejam presentes no chartData
    for (let i = 0; i < diasPassados; i++) {
      const dataDia = new Date(dataInicio);
      dataDia.setDate(dataInicio.getDate() + i);
      dataDia.setHours(0,0,0,0); // força meia-noite
      const dataStr = dataDia.toISOString().slice(0, 10);
      // Log para debug da comparação de datas
      console.log('Comparando:', dataStr, historicoOferta.map(h => h.data));
      const hist = historicoOferta.find(h => h.data === dataStr);
      chartData.push({
        dia: `Dia ${i + 1}`,
        dataReal: dataDia.toLocaleDateString('pt-BR'),
        Ativos: hist ? hist.ativos : 0,
        dataStr,
        isHoje: dataStr === hoje.toISOString().slice(0, 10)
      });
    }
    // Sobrescreve os valores de hoje e ontem com os dados reais da oferta, se existirem e forem diferentes de zero
    if (chartData.length > 0 && oferta.ativosHoje != null && oferta.ativosHoje !== 0) {
      chartData[chartData.length - 1].Ativos = oferta.ativosHoje;
    }
    if (chartData.length > 1 && oferta.ativosOntem != null && oferta.ativosOntem !== 0) {
      chartData[chartData.length - 2].Ativos = oferta.ativosOntem;
    }
  }
  // Adiciona log para debug
  console.log('chartData:', chartData);

  return (
    <div className="min-h-screen bg-[#18181b] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 font-orbitron text-white text-center">Análise de Ofertas<br /><span className="text-lg font-normal text-[#9ca3af]">Evolução dos Anúncios Ativos (15 dias)</span></h1>
        <div className="w-full max-w-5xl bg-[#23272a] border border-[#2e2e2e] rounded-2xl p-8 shadow">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <label className="font-semibold text-lg text-white">Selecione a oferta:</label>
            <select
              className="bg-[#2e2e2e] text-white px-4 py-2 rounded-lg border border-[#ccff00] focus:ring-2 focus:ring-[#ccff00] outline-none font-inter"
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
          ) : ofertas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[#9ca3af] text-lg mb-4">Nenhuma oferta encontrada</div>
              <div className="text-sm text-[#9ca3af]">Adicione ofertas no dashboard para ver os dados de analytics</div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid stroke="#2e2e2e" strokeDasharray="3 3" />
                  <XAxis dataKey="dia" stroke="#ccff00" tick={{ fill: "#ccff00", fontWeight: 700, fontSize: 16 }} interval={0} />
                  <YAxis stroke="#ccff00" tick={{ fill: "#ccff00", fontWeight: 700, fontSize: 16 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#23272a", border: "1px solid #ccff00", color: "#fff" }} labelFormatter={(label, payload) => {
                    if (!payload || !payload.length) return label;
                    return `${label} (${payload[0].payload.dataReal})`;
                  }} />
                  <Legend wrapperStyle={{ color: "#fff", fontSize: 16 }} />
                  <Line
                    type="monotone"
                    dataKey="Ativos"
                    stroke="#ccff00"
                    strokeWidth={4}
                    dot={({ cx, cy, payload }) => (
                      payload.isHoje ? (
                        <circle cx={cx} cy={cy} r={10} fill="#fff" stroke="#ccff00" strokeWidth={4} />
                      ) : (
                        <circle cx={cx} cy={cy} r={5} fill="#ccff00" stroke="#23272a" strokeWidth={2} />
                      )
                    )}
                    activeDot={{ r: 12, fill: "#23272a", stroke: "#ccff00", strokeWidth: 4 }}
                    fillOpacity={1}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
              {/* Heatmap logo abaixo do gráfico */}
              <div className="flex flex-col items-center w-full mt-4">
                <Heatmap chartData={chartData} />
                <div className="flex gap-6 justify-center mt-2 text-base font-medium text-[#9ca3af]">
                  <div className="flex items-center gap-1"><span className="inline-block w-6 h-6 rounded" style={{background:'#2e2e2e'}}></span> Baixo</div>
                  <div className="flex items-center gap-1"><span className="inline-block w-6 h-6 rounded" style={{background:'#9ca3af'}}></span> Médio</div>
                  <div className="flex items-center gap-1"><span className="inline-block w-6 h-6 rounded" style={{background:'#ccff00'}}></span> Alto</div>
                  <div className="flex items-center gap-1"><span className="inline-block w-6 h-6 rounded" style={{background:'#23272a'}}></span> Sem ativos</div>
                </div>
              </div>
              <BarraHojeOntem chartData={chartData} />
              <Insights chartData={chartData} />
              <div className="text-base mt-4 text-[#9ca3af] text-center">
                {historico.length === 0 ? 
                  "Dados de exemplo exibidos. Execute o script de scraping para obter dados reais." :
                  "O gráfico mostra a evolução diária dos anúncios ativos nos primeiros 15 dias após o cadastro. As datas reais aparecem abaixo dos dias. O heatmap indica os dias mais 'quentes' e o gráfico de barras compara hoje vs ontem."
                }
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 