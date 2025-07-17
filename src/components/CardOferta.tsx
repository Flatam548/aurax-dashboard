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
}: CardOfertaProps) => {
  const variacaoSafe = variacao ?? "0%";
  const tagSafe = tags && tags.length > 0 ? tags[0] : "";
  const [loading, setLoading] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  return (
    <div className="bg-[#23234a] rounded-2xl shadow-md p-6 flex flex-col gap-4 min-w-[320px] max-w-xs w-full border border-[#2d2d5a]">
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold text-white">{nome}</div>
        <span className="bg-gradient-to-r from-[#a259ff] to-[#6a0dad] text-xs text-white px-3 py-1 rounded-full">{tagSafe}</span>
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
            if (!onAtualizarOferta) return;
            setLoading(true); setOk(false);
            await onAtualizarOferta();
            setLoading(false); setOk(true);
            setTimeout(() => setOk(false), 2000);
          }}
          className="bg-[#a259ff] text-white px-3 py-2 rounded-lg font-medium hover:bg-[#6a0dad] transition text-xs"
          disabled={loading}
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
    </div>
  );
};

export default CardOferta; 