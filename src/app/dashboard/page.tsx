// Novo commit para testar variáveis de ambiente do Supabase
'use client';
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import CardOferta from "../../components/CardOferta";
import ModalNovaOferta from "../../components/ModalNovaOferta";
import { useOfertas, Oferta } from "../../lib/OfertasContext";

const Dashboard = () => {
  const { ofertas, adicionarOferta, alternarAtivo, excluirOferta, loading } = useOfertas();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ativosOntemTotal, setAtivosOntemTotal] = useState<number>(0);

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
      setAtivosOntemTotal(total);
    }
    fetchAtivosOntem();
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

  const handleToggleAtivo = async (idx: number, checked: boolean) => {
    await alternarAtivo(idx, checked);
    setFeedback(checked ? "Oferta ativada!" : "Oferta desativada!");
    setTimeout(() => setFeedback(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Topbar />
        <div className="flex justify-between items-center mt-8 mb-6">
          <h1 className="text-3xl font-bold text-white">Ofertas</h1>
          <div className="flex gap-4 items-center">
            <div className="bg-[#23234a] rounded-xl px-4 py-2 text-white font-semibold flex flex-col items-center shadow border border-[#2d2d5a]">
              <span className="text-xs text-[#a259ff]">Ativos Hoje</span>
              <span className="text-lg">{ofertas.reduce((acc, o) => acc + (o.ativosHoje || 0), 0)}</span>
            </div>
            <div className="bg-[#23234a] rounded-xl px-4 py-2 text-white font-semibold flex flex-col items-center shadow border border-[#2d2d5a]">
              <span className="text-xs text-[#a259ff]">Ativos Ontem</span>
              <span className="text-lg">{ativosOntemTotal}</span>
            </div>
            <button
              className="bg-gradient-to-r from-[#a259ff] to-[#6a0dad] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 transition"
              onClick={() => setModalOpen(true)}
            >
              + Adicionar Nova Oferta
            </button>
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
            {ofertas.map((oferta, idx) => (
              <CardOferta
                key={(oferta.id || oferta.nome) + oferta.dataCriacao}
                {...oferta}
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
