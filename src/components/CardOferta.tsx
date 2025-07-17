import React from "react";

type CardOfertaProps = {
  nome: string;
  tags: string[];
  ativosHoje: number;
  ativosOntem: number;
  variacao?: string;
  dataCriacao: string;
  urlMeta?: string;
  urlSite?: string;
  ativo?: boolean;
  onToggleAtivo?: (checked: boolean) => void;
  onAtualizarOferta?: () => Promise<void>;
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
  ativo = true,
  onToggleAtivo,
  onAtualizarOferta,
  onExcluirOferta,
}: CardOfertaProps) => {
  const variacaoSafe = variacao ?? "0%";
  const tagSafe = tags && tags.length > 0 ? tags[0] : "";
  const [loading, setLoading] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  return (
    <div className="bg-[#23234a] rounded-2xl shadow-md p-6 flex flex-col gap-4 min-w-[320px] max-w-xs w-full border border-[#2d2d5a]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${ativosHoje > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <div className="text-lg font-semibold text-white">{nome}</div>
          <span className={`ml-2 text-xs font-bold ${ativosHoje > 0 ? 'text-green-400' : 'text-red-400'}`}>{ativosHoje > 0 ? 'Ativo' : 'Inativo'}</span>
        </div>
        <span className="bg-gradient-to-r from-[#a259ff] to-[#6a0dad] text-xs text-white px-3 py-1 rounded-full">{tagSafe}</span>
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
      <div className="flex gap-4 text-sm text-[#a259ff]">
        <div>Ativos Hoje: <span className="text-white font-bold">{ativosHoje}</span></div>
        <div>Ontem: <span className="text-white font-bold">{ativosOntem}</span></div>
        <div>Variação: <span className={variacaoSafe.startsWith("-") ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{variacaoSafe}</span></div>
      </div>
      <div className="text-xs text-gray-400">Criado em: {dataCriacao}</div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => urlMeta && window.open(urlMeta, "_blank")}
          className="bg-gradient-to-r from-[#a259ff] to-[#6a0dad] text-white px-4 py-2 rounded-lg font-medium shadow hover:opacity-90 transition"
        >
          Biblioteca
        </button>
        <button
          onClick={() => urlSite && window.open(urlSite, "_blank")}
          className="bg-[#1a1a2e] border border-[#6a0dad] text-[#a259ff] px-4 py-2 rounded-lg font-medium hover:bg-[#23234a] transition"
        >
          Site
        </button>
        <button
          onClick={async () => {
            if (!onAtualizarOferta || !urlMeta) return;
            setLoading(true); setOk(false);
            await onAtualizarOferta();
            setLoading(false); setOk(true);
            setTimeout(() => setOk(false), 2000);
          }}
          className={`bg-[#a259ff] text-white px-3 py-2 rounded-lg font-medium hover:bg-[#6a0dad] transition text-xs ${!urlMeta ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading || !urlMeta}
          title={!urlMeta ? 'Cadastre o link da biblioteca para atualizar' : ''}
        >
          {loading ? 'Atualizando...' : ok ? 'Atualizado!' : 'Atualizar agora'}
        </button>
        <label className="flex items-center cursor-pointer ml-auto">
          <input
            type="checkbox"
            className="form-checkbox accent-[#a259ff]"
            checked={ativo}
            onChange={e => onToggleAtivo?.(e.target.checked)}
          />
          <span className="ml-2 text-xs text-white">Ativo</span>
        </label>
      </div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#23234a] rounded-2xl p-6 shadow-xl border border-[#6a0dad] flex flex-col items-center">
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