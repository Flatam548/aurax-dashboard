// Novo commit para testar variáveis de ambiente do Supabase
'use client';
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import CardOferta from "../../components/CardOferta";
import ModalNovaOferta from "../../components/ModalNovaOferta";
import { useOfertas, Oferta } from "../../lib/OfertasContext";
// Definição da interface OfertaDashboard
interface OfertaDashboard extends Oferta {
  categoria?: string;
}
import { supabase } from "../../lib/supabaseClient";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip } from "recharts";

const NEON_COLORS = ["#8000ff", "#00ffe0", "#00ff99", "#ff00cc", "#ff9900"];

function getCategoriaStats(ofertas: Oferta[]) {
  const map: Record<string, number> = {};
  for (const oferta of ofertas) {
    const cat = (oferta as OfertaDashboard).categoria || (oferta.tags && oferta.tags[0]) || "Outro";
    map[cat] = (map[cat] || 0) + 1;
  }
  return Object.entries(map).map(([name, value], i) => ({ name, value, color: NEON_COLORS[i % NEON_COLORS.length] }));
}

function getMediaCrescimento(historicos7d: Record<string, { valor: number }[]>) {
  let soma = 0, count = 0;
  for (const arr of Object.values(historicos7d)) {
    if (!arr || arr.length < 2) continue;
    const v = arr[arr.length-1].valor;
    const v7 = arr[0].valor;
    soma += v - v7;
    count++;
  }
  return count ? (soma / count).toFixed(1) : "0";
}

function getNotificacoes(ofertas: Oferta[], historicos7d: Record<string, { valor: number }[]>) {
  const notifs: string[] = [];
  for (const oferta of ofertas) {
    const hist = oferta.id ? historicos7d[oferta.id] : undefined;
    if (hist && hist.length >= 2) {
      const ontem = hist[hist.length-2].valor;
      const hoje = hist[hist.length-1].valor;
      if (ontem > 0 && ((hoje-ontem)/ontem) > 1.5) {
        notifs.push(`🔥 Oferta ${oferta.nome} cresceu ${(((hoje-ontem)/ontem)*100).toFixed(0)}% ontem!`);
      }
    }
  }
  return notifs;
}

const Dashboard = () => {
  const { ofertas, adicionarOferta, excluirOferta, loading } = useOfertas();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [historicos7d, setHistoricos7d] = useState<Record<string, { valor: number }[]>>({});

  useEffect(() => {
    async function fetchAtivosOntem() {
      if (!ofertas.length) return;
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataOntem = ontem.toISOString().slice(0, 10);
      let total = 0;
      for (const oferta of ofertas) {
        if (!oferta.id) continue;
        const res = await fetch(`/api/historicoOferta?id=${oferta.id}&data=${dataOntem}`);
        const data = await res.json();
        total += data.ativos ?? 0;
      }
      // setAtivosOntemTotal(total); // This variable is no longer used
    }
    fetchAtivosOntem();
  }, [ofertas]);

  useEffect(() => {
    async function fetchHistoricos() {
      const historicosObj: Record<string, { valor: number }[]> = {};
      for (const oferta of ofertas) {
        if (!oferta.id) continue;
        const hoje = new Date();
        const datas: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const data = new Date(hoje);
          data.setDate(hoje.getDate() - i);
          datas.push(data.toISOString().slice(0, 10));
        }
        const { data: hist } = await supabase
          .from("historico_ofertas")
          .select("data, ativos")
          .eq("oferta_id", oferta.id)
          .in("data", datas);
        historicosObj[oferta.id] = datas.map(dataStr => {
          const dia = hist?.find((d: { data: string; ativos: number }) => d.data === dataStr);
          return { valor: dia ? dia.ativos : 0 };
        });
      }
      setHistoricos7d(historicosObj);
    }
    if (ofertas.length) fetchHistoricos();
  }, [ofertas]);

  const handleNovaOferta = async (novaOferta: Omit<Oferta, "ativosHoje" | "ativosOntem" | "variacao" | "dataCriacao" | "ativo">) => {
    await adicionarOferta(novaOferta);
    setFeedback("Oferta criada com sucesso!");
    setTimeout(() => setFeedback(null), 2000);
    // Buscar a oferta recém-criada (pelo nome e urlMeta, que são únicos)
    const nova = ofertas.find(o => o.nome === novaOferta.nome && o.urlMeta === novaOferta.urlMeta);
    if (nova && nova.id && nova.urlMeta) {
      setFeedback('Atualizando anúncios da nova oferta...');
      try {
        const res = await fetch('/api/scrapeOferta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: nova.id, urlMeta: nova.urlMeta })
        });
        const data = await res.json();
        if (data.ativosHoje !== undefined) {
          // Atualiza localmente ativosHoje
          nova.ativosHoje = data.ativosHoje;
          // Busca ativosOntem do histórico
          const ontem = new Date();
          ontem.setDate(ontem.getDate() - 1);
          const dataOntem = ontem.toISOString().slice(0, 10);
          const historicoRes = await fetch(`/api/historicoOferta?id=${nova.id}&data=${dataOntem}`);
          const historicoData = await historicoRes.json();
          nova.ativosOntem = historicoData.ativos ?? 0;
          setFeedback('Nova oferta atualizada!');
        } else {
          setFeedback('Erro ao atualizar nova oferta.');
        }
      } catch {
        setFeedback('Erro ao atualizar nova oferta.');
      }
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  // handleToggleAtivo is no longer used
  // const handleToggleAtivo = async (idx: number, checked: boolean) => {
  //   await alternarAtivo(idx, checked);
  //   setFeedback(checked ? "Oferta ativada!" : "Oferta desativada!");
  //   setTimeout(() => setFeedback(null), 1500);
  // };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Topbar />
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div className="flex gap-6">
              <div className="bg-[#23234a] border-2 border-[#8000ff] rounded-xl px-6 py-4 text-white font-semibold flex flex-col items-center shadow">
                <span className="text-xs text-[#a259ff]">Total de Ofertas</span>
                <span className="text-2xl font-orbitron">{ofertas.length}</span>
              </div>
              <div className="bg-[#23234a] border-2 border-[#00ffe0] rounded-xl px-6 py-4 text-white font-semibold flex flex-col items-center shadow">
                <span className="text-xs text-[#00ffe0]">Ativos Hoje</span>
                <span className="text-2xl font-orbitron">{ofertas.reduce((acc, o) => acc + (o.ativosHoje || 0), 0)}</span>
              </div>
              <div className="bg-[#23234a] border-2 border-[#00ff99] rounded-xl px-6 py-4 text-white font-semibold flex flex-col items-center shadow">
                <span className="text-xs text-[#00ff99]">Média Crescimento 7d</span>
                <span className="text-2xl font-orbitron">{getMediaCrescimento(historicos7d)}</span>
              </div>
            </div>
            <div className="bg-[#23234a] border-2 border-[#8000ff] rounded-xl px-4 py-2 flex flex-col items-center shadow min-w-[220px]">
              <span className="text-xs text-[#a259ff] mb-2">Ofertas por Categoria</span>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={getCategoriaStats(ofertas)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={25}
                    label={({ name }) => name} isAnimationActive>
                    {getCategoriaStats(ofertas).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <PieTooltip contentStyle={{ background: "#1a002a", border: "1px solid #8000ff", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Notificações automáticas */}
          <div className="flex flex-col gap-2 mt-2">
            {getNotificacoes(ofertas, historicos7d).map((msg, i) => (
              <div key={i} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8000ff] to-[#00ffe0] text-[#1a002a] font-bold shadow animate-pulse w-fit">
                {msg}
              </div>
            ))}
          </div>
        </div>
        {feedback && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#a259ff] to-[#6a0dad] text-white font-semibold shadow animate-pulse w-fit">
            {feedback}
          </div>
        )}
        {loading ? (
          <div className="text-white text-lg mt-12 animate-pulse">Carregando ofertas...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ofertas.map((oferta) => (
              <CardOferta
                key={(oferta.id || oferta.nome) + oferta.dataCriacao}
                {...oferta}
                id={oferta.id}
                categoria={(oferta as OfertaDashboard).categoria || (oferta.tags && oferta.tags[0]) || ''}
                historico7d={oferta.id ? historicos7d[oferta.id] : undefined}
                onExcluirOferta={async () => {
                  if (!oferta.id) return;
                  setFeedback('Excluindo oferta...');
                  await excluirOferta(oferta.id);
                  setFeedback('Oferta excluída!');
                  setTimeout(() => setFeedback(null), 2000);
                }}
              />
            ))}
          </div>
        )}
      </main>
      <ModalNovaOferta
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleNovaOferta}
      />
    </div>
  );
};

export default Dashboard;
