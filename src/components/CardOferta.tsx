import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const categoriaColors = {
  Tarot: "#8000ff",
  Saúde: "#00ff99",
  default: "#00ffe0"
};

type SparklineProps = { data: { valor: number }[]; color: string; };
function Sparkline({ data, color }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 10, bottom: 10, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={false} isAnimationActive={true} />
      </LineChart>
    </ResponsiveContainer>
  );
}

type CardOfertaProps = {
  nome: string;
  tags: string[];
  ativosHoje: number;
  ativosOntem: number;
  variacao?: string;
  dataCriacao: string;
  urlMeta?: string;
  urlSite?: string;
  onExcluirOferta?: () => Promise<void>;
};

const CardOferta = ({
  nome,
  tags,
  ativosHoje,
  ativosOntem,
  variacao,
  dataCriacao,
  urlMeta,
  urlSite,
  onExcluirOferta,
  ...props
}: CardOfertaProps & { id?: string; categoria?: string; historico7d?: { valor: number }[] }) => {
  const variacaoSafe = variacao ?? "0%";
  const tagSafe = tags && tags.length > 0 ? tags[0] : "";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ativosOntemReal, setAtivosOntemReal] = useState<number>(ativosOntem || 0);
  const corNeon = categoriaColors[props.categoria as keyof typeof categoriaColors] || categoriaColors.default;
  const historicoSpark = props.historico7d || Array(7).fill({ valor: 0 });

  useEffect(() => {
    async function fetchAtivosOntem() {
      if (!props.id) return;
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataOntem = ontem.toISOString().slice(0, 10);
      const res = await fetch(`/api/historicoOferta?id=${props.id}&data=${dataOntem}`);
      const data = await res.json();
      setAtivosOntemReal(data.ativos ?? 0);
    }
    fetchAtivosOntem();
  }, [props.id, ativosHoje]);
  return (
    <div className="bg-[#232046] border-2 border-[#A3FFD6] rounded-2xl shadow-[0_0_24px_#00FFD0] p-6 flex flex-col gap-4 min-w-[320px] max-w-xs w-full transition hover:shadow-[0_0_32px_#FF6AC2] hover:border-[#FF6AC2]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${ativosHoje > 0 ? 'bg-[#00FFD0]' : 'bg-red-500'}`}></span>
          <div className="text-lg font-semibold font-orbitron" style={{ color: '#F9F871' }}>{nome}</div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#7C3AED', color: '#18122B' }}>{props.categoria || tagSafe}</span>
        <button
          onClick={() => setConfirmDelete(true)}
          className="ml-2 p-1 rounded hover:bg-red-100/10 transition"
          title="Excluir oferta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-400 hover:text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>
      <Sparkline data={historicoSpark} color={corNeon} />
      <div className="flex gap-4 text-sm" style={{ color: '#00FFD0' }}>
        <div>Hoje: <span style={{ color: '#F3F3F3' }} className="font-bold">{ativosHoje}</span></div>
        <div>Ontem: <span style={{ color: '#F3F3F3' }} className="font-bold">{ativosOntemReal}</span></div>
        <div>Variação: <span className={variacaoSafe.startsWith("-") ? "text-red-400 font-bold" : "font-bold"} style={{ color: variacaoSafe.startsWith("-") ? '#FF6AC2' : '#00FFD0' }}>{variacaoSafe}</span></div>
      </div>
      <div className="text-xs" style={{ color: '#A3A3A3' }}>Criado em: {dataCriacao}</div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => urlMeta && window.open(urlMeta, "_blank")}
          className="bg-gradient-to-r from-[#7C3AED] via-[#00FFD0] to-[#FF6AC2] text-[#18122B] px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
        >
          Biblioteca
        </button>
        <button
          onClick={() => urlSite && window.open(urlSite, "_blank")}
          className="bg-gradient-to-r from-[#00FFD0] to-[#7C3AED] text-[#18122B] px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
        >
          Site
        </button>
        <button
          onClick={() => window.location.href = `/details/${props.id}`}
          className="bg-gradient-to-r from-[#FF6AC2] to-[#F9F871] text-[#18122B] px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
        >
          Detalhes
        </button>
      </div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#232046] rounded-2xl p-6 shadow-xl border border-[#A3FFD6] flex flex-col items-center">
            <div className="text-white mb-4">Tem certeza que deseja excluir esta oferta?</div>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg">Cancelar</button>
              <button onClick={async () => { setConfirmDelete(false); if (onExcluirOferta) await onExcluirOferta(); }} className="bg-red-600 text-white px-4 py-2 rounded-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardOferta; 