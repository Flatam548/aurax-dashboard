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
import Image from "next/image";

const NEON_COLORS = ["#8000ff", "#00ffe0", "#00ff99", "#ff00cc", "#ff9900"];

function getCategoriaStats(ofertas: Oferta[]) {
  const map: Record<string, number> = {};
  for (const oferta of ofertas) {
    const cat = (oferta as OfertaDashboard).categoria || (oferta.tags && oferta.tags[0]) || "Outro";
    map[cat] = (map[cat] || 0) + 1;
  }
  return Object.entries(map).map(([name, value], i) => ({ name, value, color: NEON_COLORS[i % NEON_COLORS.length] }));
}

function getMediaCrescimentoPercentual(historicos7d: Record<string, { valor: number }[]>) {
  let soma = 0, count = 0;
  for (const arr of Object.values(historicos7d)) {
    if (!arr || arr.length < 2) continue;
    const v = arr[arr.length-1].valor;
    const v7 = arr[0].valor;
    if (v7 > 0) {
      soma += ((v - v7) / v7) * 100;
      count++;
    }
  }
  return count ? (soma / count).toFixed(1) + '%' : '0%';
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
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  // Adicionar estado para texto de busca
  const [busca, setBusca] = useState('');

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

  // Calcular variação percentual de Ativos Hoje vs Ontem
  const ativosHoje = ofertas.reduce((acc, o) => acc + (o.ativosHoje || 0), 0);
  const ativosOntem = ofertas.reduce((acc, o) => acc + (o.ativosOntem || 0), 0);
  const variacaoHojeOntem = ativosOntem > 0 ? (((ativosHoje - ativosOntem) / ativosOntem) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col items-center">
        <Topbar />
        {/* Campo de busca */}
        <div className="w-full max-w-7xl flex justify-center mb-6">
          <input
            type="text"
            placeholder="Buscar oferta pelo nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full max-w-xl px-4 py-2 rounded-lg border-2 border-[#2563eb] focus:ring-2 focus:ring-[#2563eb] outline-none font-inter text-lg"
          />
        </div>
        <div className="w-full max-w-7xl flex justify-end mb-4">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-[#2563eb] to-[#00ffe0] text-white font-bold px-6 py-2 rounded-lg shadow hover:scale-105 transition flex items-center gap-2"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Nova Oferta
          </button>
        </div>
        <ModalNovaOferta open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleNovaOferta} />
        <div className="w-full max-w-7xl flex flex-col gap-8 items-center">
          <div className="w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
            <div className="flex gap-6 flex-1 justify-center">
              {/* Cards estatísticas */}
              <div className="bg-gradient-to-br from-[#8000ff] to-[#00ffe0] border-2 border-[#8000ff] rounded-xl px-6 py-4 text-white font-semibold flex flex-col items-center shadow-lg hover:scale-105 transition duration-200">
                <span className="text-xs text-[#e0e7ff]">Total de Ofertas</span>
                <span className="text-2xl font-orbitron drop-shadow-lg">{ofertas.length}</span>
              </div>
              <div className="bg-gradient-to-br from-[#00ffe0] to-[#2563eb] border-2 border-[#00ffe0] rounded-xl px-6 py-4 text-white font-semibold flex flex-col items-center shadow-lg hover:scale-105 transition duration-200">
                <span className="text-xs text-[#e0e7ff]">Ativos Hoje</span>
                <span className="text-2xl font-orbitron drop-shadow-lg">{ativosHoje}</span>
                <span className={variacaoHojeOntem.startsWith('-') ? 'text-red-400 font-bold text-xs' : 'text-green-400 font-bold text-xs'}>
                  {variacaoHojeOntem.startsWith('-') ? '▼' : '▲'} {variacaoHojeOntem}
                </span>
              </div>
              <div className="bg-gradient-to-br from-[#00ff99] to-[#2563eb] border-2 border-[#00ff99] rounded-xl px-6 py-4 text-white font-semibold flex flex-col items-center shadow-lg hover:scale-105 transition duration-200">
                <span className="text-xs text-[#e0e7ff]">Média Crescimento 7d</span>
                <span className="text-2xl font-orbitron drop-shadow-lg">{getMediaCrescimentoPercentual(historicos7d)}</span>
              </div>
            </div>
          </div>
          {/* Substituir o bloco de Ofertas por Categoria: */}
          <div className="w-full flex justify-center mt-8 mb-4">
            <div className="bg-[#23234a] border-2 border-[#8000ff] rounded-xl px-6 py-4 flex flex-col items-center shadow-lg min-w-[260px] max-w-xs w-full">
              <span className="text-xs text-[#a259ff] mb-2">Ofertas por Categoria</span>
              <ResponsiveContainer width={180} height={140}>
                <PieChart>
                  <Pie data={getCategoriaStats(ofertas)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={25} isAnimationActive
                    label={({ name, percent }) => `${name} (${percent ? (percent*100).toFixed(0) : 0}%)`}
                    onClick={(_, idx) => setCategoriaFiltro(getCategoriaStats(ofertas)[idx].name)}
                    >
                    {getCategoriaStats(ofertas).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <PieTooltip content={({ active, payload }) => active && payload && payload.length ? (
                    <div className="bg-[#1a002a] border border-[#8000ff] text-white px-2 py-1 rounded shadow">
                      <div><b>{payload[0].name}</b>: {payload[0].value} ofertas</div>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {getCategoriaStats(ofertas).map((cat, i) => (
                  <button key={cat.name} onClick={() => setCategoriaFiltro(cat.name)}
                    className={`px-2 py-1 rounded text-xs font-bold border ${categoriaFiltro === cat.name ? 'bg-[#8000ff] text-white border-[#fff]' : 'bg-[#e0e7ff] text-[#2563eb] border-[#8000ff]'}`}
                  >{cat.name}</button>
                ))}
                {categoriaFiltro && <button onClick={() => setCategoriaFiltro(null)} className="ml-2 text-xs underline text-[#00ffe0]">Limpar filtro</button>}
              </div>
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
          <div className="w-full max-w-7xl flex justify-center">
            <div className="flex flex-wrap gap-8 justify-center">
              {(categoriaFiltro ? ofertas.filter(oferta => {
                const categoria: string = ((oferta as OfertaDashboard).categoria || (oferta.tags && oferta.tags[0]) || 'Outro');
                return categoria === categoriaFiltro;
              }) : ofertas)
              // Filtro de busca por nome
              .filter(oferta => oferta.nome.toLowerCase().includes(busca.toLowerCase()))
              .map((oferta, idx) => {
                const categoria: string = ((oferta as OfertaDashboard).categoria || (oferta.tags && oferta.tags[0]) || 'Outro');
                // Não tentar remover 'categoria' do objeto oferta, apenas sobrescrever na chamada
                return (
                  <CardOferta
                    key={oferta.id || idx}
                    nome={oferta.nome}
                    tags={oferta.tags}
                    ativosHoje={oferta.ativosHoje}
                    ativosOntem={oferta.ativosOntem}
                    variacao={oferta.variacao}
                    dataCriacao={oferta.dataCriacao}
                    urlMeta={oferta.urlMeta}
                    urlSite={oferta.urlSite}
                    id={oferta.id}
                    categoria={categoria}
                    historico7d={historicos7d[oferta.id || ''] || []}
                    onExcluirOferta={async () => await excluirOferta(oferta.id ?? "")}
                  />
                );
              })}
            </div>
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
