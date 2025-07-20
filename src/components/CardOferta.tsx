import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, Dot } from "recharts";
import { FaBook, FaGlobe, FaInfoCircle, FaChevronUp, FaChevronDown, FaFire } from "react-icons/fa";

const categoriaColors = {
  Tarot: "#8000ff",
  Saúde: "#00ff99",
  default: "#00ffe0"
};

type SparklineProps = { data: { valor: number }[]; color: string; };
function Sparkline({ data, color }: SparklineProps) {
  const max = Math.max(...data.map(d => d.valor));
  const todayIdx = data.length - 1;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 10, bottom: 10, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={false} isAnimationActive={true}
          activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
        <RechartsTooltip formatter={(v: number) => `${v} ativos`} labelFormatter={(_, p) => `Dia ${p && p[0]?.payload ? p[0].payload.dia || '' : ''}`} />
        {/* Destaque no valor de hoje */}
        <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={0} dot={(props) => props.index === todayIdx ? <Dot {...props} r={6} fill={color} stroke="#fff" strokeWidth={2} /> : <g />} />
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
}: CardOfertaProps & { id?: string; categoria: string; historico7d?: { valor: number }[] }) => {
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

  const variacaoPercentual = ativosOntemReal > 0 ? (((ativosHoje - ativosOntemReal) / ativosOntemReal) * 100).toFixed(1) + "%" : "0%";
  const variacaoNum = Number(variacaoPercentual.replace('%',''));
  const pico7d = Math.max(...historicoSpark.map(h => h.valor));
  const diaPico = historicoSpark.findIndex(h => h.valor === pico7d);

  return (
    <div className={`rounded-2xl p-6 flex flex-col gap-4 min-w-[380px] max-w-xs w-full transition hover:shadow-2xl hover:scale-[1.03] duration-200 font-inter mb-8
      ${ativosHoje >= 80
        ? 'fire-border animate-fire-glow bg-gradient-to-br from-[#ffe066] to-[#ff9800] shadow-[0_12px_40px_0_rgba(255,152,0,0.35)]'
        : 'bg-white border-2 border-[#ccff00] shadow-[0_8px_32px_0_rgba(44,255,0,0.18)]'}
    `}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {ativosHoje >= 80 ? (
            <span className="relative flex items-center">
              <FaFire className="text-orange-500 animate-bounce" size={18} />
            </span>
          ) : (
            <span className={`inline-block w-3 h-3 rounded-full ${ativosHoje > 0 ? 'bg-[#ccff00]' : 'bg-red-500'}`}></span>
          )}
          <div className="text-lg font-bold font-orbitron text-black">{nome}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md bg-[#ffe066] text-black`}>{props.categoria || tagSafe}</span>
        <button
          onClick={() => setConfirmDelete(true)}
          className={`ml-2 p-1 rounded transition font-bold ${ativosHoje >= 80 ? 'bg-black hover:bg-[#ff9800] text-white border-none shadow-lg' : 'bg-gradient-to-r from-[#ccff00] to-[#a3ff12] text-black border-none shadow-lg hover:brightness-110'}`}
          title="Excluir oferta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-400 hover:text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>
      <Sparkline data={historicoSpark.map((h, i) => ({ ...h, dia: i+1 }))} color={ativosHoje >= 80 ? '#ff9800' : '#ccff00'} />
      <div className="flex gap-4 text-sm items-center" style={ativosHoje >= 80 ? {} : { color: '#23272a', fontWeight: 700 }}>
        <div>Hoje: <span style={ativosHoje >= 80 ? {} : { color: '#ccff00', fontWeight: 700, fontFamily: 'inherit', fontSize: '1em', lineHeight: '1', letterSpacing: '0', verticalAlign: 'baseline', background: 'none', boxShadow: 'none', border: 'none', outline: 'none', textShadow: 'none', WebkitTextStroke: '0', MozOsxFontSmoothing: 'auto', WebkitFontSmoothing: 'auto', transition: 'none', filter: 'none', textDecoration: 'none', fontStyle: 'normal', fontVariant: 'normal', fontWeight: 700, padding: 0, margin: 0, display: 'inline', zIndex: 1, position: 'relative', color: '#ccff00 !important' }}>{ativosHoje}</span></div>
        <div>Ontem: <span style={ativosHoje >= 80 ? {} : { color: '#9ca3af', fontWeight: 700, color: '#9ca3af !important' }}>{ativosOntemReal}</span></div>
        <div className="flex items-center gap-1" style={ativosHoje >= 80 ? {} : { color: '#23272a', fontWeight: 700 }}>Variação:
          {variacaoNum < 0 ? <FaChevronDown style={ativosHoje >= 80 ? {} : { color: '#ff6b6b', fontWeight: 700, color: '#ff6b6b !important' }} /> : <FaChevronUp style={ativosHoje >= 80 ? {} : { color: '#ccff00', fontWeight: 700, color: '#ccff00 !important' }} />}
          <span style={ativosHoje >= 80 ? {} : { color: variacaoNum < 0 ? '#ff6b6b' : '#ccff00', fontWeight: 700, color: (variacaoNum < 0 ? '#ff6b6b !important' : '#ccff00 !important') }}>{variacaoPercentual}</span>
        </div>
      </div>
      <div className="flex gap-2 text-xs items-center" style={ativosHoje >= 80 ? {} : { color: '#23272a', fontWeight: 700 }}>
        <span style={ativosHoje >= 80 ? {} : { color: '#23272a', fontWeight: 700 }}>Criado em: {dataCriacao}</span>
        <span className="ml-2" style={ativosHoje >= 80 ? {} : { color: '#23272a', fontWeight: 700 }}>Pico 7d: <span style={ativosHoje >= 80 ? {} : { color: '#00ffe0', fontWeight: 700, color: '#00ffe0 !important' }}>{pico7d}</span> (Dia {diaPico+1})</span>
      </div>
      <div className="flex gap-3 mt-2 flex-wrap justify-between">
        <button
          onClick={() => urlMeta && window.open(urlMeta, "_blank")}
          className={`${ativosHoje >= 80
            ? 'bg-black text-white border-none shadow-lg h-12 px-6 py-2 rounded-lg font-bold flex items-center gap-2 btn-pulse'
            : 'bg-gradient-to-r from-[#ccff00] to-[#a3ff12] border-none shadow-lg h-12 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition text-base hover:brightness-110 hover:shadow-xl'}`}
          style={ativosHoje >= 80 ? { background: '#000 !important', color: '#fff !important', border: 'none !important', boxShadow: '0 2px 8px 0 #0002 !important', outline: 'none !important', fontWeight: 700, fontFamily: 'inherit', fontSize: '1em', transition: 'none', filter: 'none', textDecoration: 'none', fontStyle: 'normal', fontVariant: 'normal', padding: 0, margin: 0, zIndex: 1, position: 'relative' } : {}}
        >
          <FaBook className="text-xl" style={ativosHoje >= 80 ? { color: '#fff !important' } : { color: '#23272a', fontWeight: 700 }} /> <span style={ativosHoje >= 80 ? { color: '#fff !important' } : { color: '#23272a', fontWeight: 700 }}>Biblioteca</span>
        </button>
        <button
          onClick={() => urlSite && window.open(urlSite, "_blank")}
          className={`${ativosHoje >= 80
            ? 'bg-black text-white border-none shadow-lg h-12 px-6 py-2 rounded-lg font-bold flex items-center gap-2 btn-pulse'
            : 'bg-gradient-to-r from-[#ccff00] to-[#a3ff12] border-none shadow-lg h-12 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition text-base hover:brightness-110 hover:shadow-xl'}`}
          style={ativosHoje >= 80 ? { background: '#000 !important', color: '#fff !important', border: 'none !important', boxShadow: '0 2px 8px 0 #0002 !important', outline: 'none !important', fontWeight: 700, fontFamily: 'inherit', fontSize: '1em', transition: 'none', filter: 'none', textDecoration: 'none', fontStyle: 'normal', fontVariant: 'normal', padding: 0, margin: 0, zIndex: 1, position: 'relative' } : {}}
        >
          <FaGlobe className="text-xl" style={ativosHoje >= 80 ? { color: '#fff !important' } : { color: '#23272a', fontWeight: 700 }} /> <span style={ativosHoje >= 80 ? { color: '#fff !important' } : { color: '#23272a', fontWeight: 700 }}>Site</span>
        </button>
        <button
          onClick={() => window.location.href = `/details/${props.id}`}
          className={`${ativosHoje >= 80
            ? 'bg-black text-white border-none shadow-lg h-12 px-6 py-2 rounded-lg font-bold flex items-center gap-2 btn-pulse'
            : 'bg-gradient-to-r from-[#ccff00] to-[#a3ff12] border-none shadow-lg h-12 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition text-base hover:brightness-110 hover:shadow-xl'}`}
          style={ativosHoje >= 80 ? { background: '#000 !important', color: '#fff !important', border: 'none !important', boxShadow: '0 2px 8px 0 #0002 !important', outline: 'none !important', fontWeight: 700, fontFamily: 'inherit', fontSize: '1em', transition: 'none', filter: 'none', textDecoration: 'none', fontStyle: 'normal', fontVariant: 'normal', padding: 0, margin: 0, zIndex: 1, position: 'relative' } : {}}
        >
          <FaInfoCircle className="text-xl" style={ativosHoje >= 80 ? { color: '#fff !important' } : { color: '#23272a', fontWeight: 700 }} /> <span style={ativosHoje >= 80 ? { color: '#fff !important' } : { color: '#23272a', fontWeight: 700 }}>Detalhes</span>
        </button>
      </div>
      {/* Placeholder para expansão do gráfico de 15 dias */}
      {/* <button className="text-xs text-[#2563eb] underline mt-2">Ver gráfico 15 dias</button> */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#e5e7eb] flex flex-col items-center">
            <div className="text-[#18181b] mb-4">Tem certeza que deseja excluir esta oferta?</div>
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