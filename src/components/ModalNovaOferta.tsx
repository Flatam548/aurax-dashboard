import React, { useState } from "react";
import { Oferta } from "../lib/OfertasContext";

type ModalNovaOfertaProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (oferta: Omit<Oferta, "ativosHoje" | "ativosOntem" | "variacao" | "dataCriacao" | "ativo">) => void;
};

const idiomasDisponiveis = ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"];

const ModalNovaOferta = ({ open, onClose, onCreate }: ModalNovaOfertaProps) => {
  const [nome, setNome] = useState("");
  const [urlMeta, setUrlMeta] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [urlSite, setUrlSite] = useState("");
  const [urlCheckout, setUrlCheckout] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  if (!open) return null;

  const addTag = () => {
    if (tagInput && tags.length < 10 && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const toggleIdioma = (idioma: string) => {
    if (idiomas.includes(idioma)) {
      setIdiomas(idiomas.filter(i => i !== idioma));
    } else if (idiomas.length < 4) {
      setIdiomas([...idiomas, idioma]);
    }
  };

  const handleCreate = () => {
    if (!nome.trim()) {
      setErro("O nome da oferta é obrigatório.");
      return;
    }
    if (!urlMeta.trim()) {
      setErro("A URL da Meta Ads Library é obrigatória.");
      return;
    }
    if (tags.length === 0) {
      setErro("Adicione pelo menos uma tag.");
      return;
    }
    if (idiomas.length === 0) {
      setErro("Selecione pelo menos um idioma.");
      return;
    }
    setErro(null);
    onCreate({ nome, urlMeta, tags, idiomas, urlSite, urlCheckout });
    setNome(""); setUrlMeta(""); setTags([]); setIdiomas([]); setUrlSite(""); setUrlCheckout("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl border-2 border-[#ccff00]">
        <h2 className="text-2xl font-bold text-[#23272a] mb-1">Nova Oferta</h2>
        <p className="text-sm text-[#23272a] mb-6">Cadastre uma nova oferta para monitoramento.</p>
        {erro && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-600/80 text-white font-semibold animate-pulse">
            {erro}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Curso de Marketing Digital" className="bg-white text-[#23272a] px-4 py-2 rounded-lg border border-[#ccff00] focus:ring-2 focus:ring-[#ccff00] outline-none" />
          <input value={urlMeta} onChange={e => setUrlMeta(e.target.value)} placeholder="URL da Meta Ads Library" className="bg-white text-[#23272a] px-4 py-2 rounded-lg border border-[#ccff00] focus:ring-2 focus:ring-[#ccff00] outline-none" />
          <div>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map(tag => (
                <span key={tag} className="bg-gradient-to-r from-[#ccff00] to-[#a3ff12] text-[#23272a] px-3 py-1 rounded-full text-xs flex items-center gap-1 font-bold">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 text-[#23272a] hover:text-[#a3ff12]">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' ? (addTag(), e.preventDefault()) : undefined} placeholder="Adicionar tag (máx 10)" className="bg-white text-[#23272a] px-4 py-2 rounded-lg flex-1 border border-[#ccff00] focus:ring-2 focus:ring-[#ccff00] outline-none" />
              <button onClick={addTag} className="bg-gradient-to-r from-[#ccff00] to-[#a3ff12] text-[#23272a] px-4 py-2 rounded-lg font-medium font-bold hover:brightness-110">Adicionar</button>
            </div>
          </div>
          <div>
            <label className="block text-[#23272a] mb-1">Idiomas (até 4):</label>
            <div className="flex flex-wrap gap-2">
              {idiomasDisponiveis.map(idioma => (
                <button key={idioma} type="button" onClick={() => toggleIdioma(idioma)} className={`px-3 py-1 rounded-full text-xs font-medium border ${idiomas.includes(idioma) ? 'bg-gradient-to-r from-[#ccff00] to-[#a3ff12] text-[#23272a] border-transparent' : 'bg-white text-[#23272a] border-[#ccff00]'}`}>{idioma}</button>
              ))}
            </div>
          </div>
          <input value={urlSite} onChange={e => setUrlSite(e.target.value)} placeholder="URL do site (opcional)" className="bg-white text-[#23272a] px-4 py-2 rounded-lg border border-[#ccff00] focus:ring-2 focus:ring-[#ccff00] outline-none" />
          <input value={urlCheckout} onChange={e => setUrlCheckout(e.target.value)} placeholder="URL do checkout (opcional)" className="bg-white text-[#23272a] px-4 py-2 rounded-lg border border-[#ccff00] focus:ring-2 focus:ring-[#ccff00] outline-none" />
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="bg-[#f3f4f6] text-[#23272a] px-6 py-2 rounded-lg font-semibold hover:bg-[#ccff00] hover:text-[#23272a] transition border border-[#ccff00]">Cancelar</button>
          <button onClick={handleCreate} className="bg-gradient-to-r from-[#ccff00] to-[#a3ff12] text-[#23272a] px-6 py-2 rounded-lg font-semibold shadow hover:brightness-110 transition font-bold">Criar Oferta</button>
        </div>
      </div>
    </div>
  );
};

export default ModalNovaOferta; 