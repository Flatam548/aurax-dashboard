'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabaseClient";

export interface Oferta {
  id?: string;
  nome: string;
  tag: string;
  ativosHoje: number;
  ativosOntem: number;
  variacao: string;
  dataCriacao: string;
  ativo: boolean;
  urlMeta?: string;
  idiomas?: string[];
  tags?: string[];
  urlSite?: string;
  urlCheckout?: string;
}

interface OfertasContextType {
  ofertas: Oferta[];
  adicionarOferta: (oferta: Omit<Oferta, "ativosHoje" | "ativosOntem" | "variacao" | "dataCriacao" | "ativo">) => Promise<void>;
  alternarAtivo: (idx: number, ativo: boolean) => Promise<void>;
  loading: boolean;
}

const OfertasContext = createContext<OfertasContextType | undefined>(undefined);

export function OfertasProvider({ children }: { children: ReactNode }) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOfertas() {
      setLoading(true);
      const { data, error } = await supabase.from("ofertas").select("*");
      if (!error && data) setOfertas(data);
      setLoading(false);
    }
    fetchOfertas();
  }, []);

  async function adicionarOferta(oferta: Omit<Oferta, "ativosHoje" | "ativosOntem" | "variacao" | "dataCriacao" | "ativo">) {
    const nova = {
      ...oferta,
      ativosHoje: 0,
      ativosOntem: 0,
      variacao: "0%",
      dataCriacao: new Date().toLocaleDateString("pt-BR"),
      ativo: true,
    };
    const { data, error } = await supabase.from("ofertas").insert([nova]).select();
    if (!error && data) setOfertas(prev => [...prev, ...data]);
  }

  async function alternarAtivo(idx: number, ativo: boolean) {
    const oferta = ofertas[idx];
    if (!oferta?.id) return;
    const { data, error } = await supabase.from("ofertas").update({ ativo }).eq("id", oferta.id).select();
    if (!error && data) setOfertas(ofertas.map((o, i) => i === idx ? { ...o, ativo } : o));
  }

  return (
    <OfertasContext.Provider value={{ ofertas, adicionarOferta, alternarAtivo, loading }}>
      {children}
    </OfertasContext.Provider>
  );
}

export function useOfertas() {
  const ctx = useContext(OfertasContext);
  if (!ctx) throw new Error("useOfertas deve ser usado dentro de OfertasProvider");
  return ctx;
} 