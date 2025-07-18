// copiarHojeParaHistorico.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function copiarAtivosHojeParaHistorico() {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: ofertas, error: errOfertas } = await supabase.from('ofertas').select('id, ativosHoje');
  if (errOfertas) {
    console.error('Erro ao buscar ofertas:', errOfertas);
    return;
  }
  for (const oferta of ofertas) {
    const { error } = await supabase
      .from('historico_ofertas')
      .upsert({ oferta_id: oferta.id, data: hoje, ativos: oferta.ativosHoje }, { onConflict: ['oferta_id', 'data'] });
    if (error) {
      console.error(`Erro ao inserir histórico da oferta ${oferta.id}:`, error);
    } else {
      console.log(`Histórico atualizado para oferta ${oferta.id} (${hoje}): ${oferta.ativosHoje}`);
    }
  }
  console.log('Finalizado!');
}

copiarAtivosHojeParaHistorico(); 