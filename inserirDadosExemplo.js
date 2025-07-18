// inserirDadosExemplo.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inserirDadosExemplo() {
  console.log('Inserindo dados de exemplo...');
  
  // Primeiro, vamos verificar se existem ofertas
  const { data: ofertas, error: errOfertas } = await supabase.from('ofertas').select('id, nome, dataCriacao');
  
  if (errOfertas) {
    console.error('Erro ao buscar ofertas:', errOfertas);
    return;
  }
  
  if (!ofertas || ofertas.length === 0) {
    console.log('Nenhuma oferta encontrada. Crie ofertas primeiro no dashboard.');
    return;
  }
  
  console.log(`Encontradas ${ofertas.length} ofertas. Inserindo dados de histórico...`);
  
  for (const oferta of ofertas) {
    console.log(`Inserindo dados para: ${oferta.nome}`);
    
    // Verifica se a data de criação é válida
    let dataInicio;
    try {
      dataInicio = new Date(oferta.dataCriacao);
      if (isNaN(dataInicio.getTime())) {
        console.log(`  Data de criação inválida para ${oferta.nome}: ${oferta.dataCriacao}`);
        // Usa uma data padrão se a data for inválida
        dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 14); // 14 dias atrás
      }
    } catch (error) {
      console.log(`  Erro ao processar data para ${oferta.nome}, usando data padrão`);
      dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 14);
    }
    
    const hoje = new Date();
    const diasPassados = Math.min(
      Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      15
    );
    
    console.log(`  Data início: ${dataInicio.toISOString().slice(0, 10)}`);
    console.log(`  Dias passados: ${diasPassados}`);
    
    // Gera dados realistas para cada dia
    for (let i = 0; i < diasPassados; i++) {
      const dataDia = new Date(dataInicio);
      dataDia.setDate(dataInicio.getDate() + i);
      const dataStr = dataDia.toISOString().slice(0, 10);
      
      // Gera dados realistas baseados no dia
      let ativos = 0;
      if (i >= 2) { // Começa a ter dados a partir do 3º dia
        const baseValue = Math.floor(Math.random() * 50) + 10; // 10-60 ativos base
        const crescimento = Math.min(i * 0.3, 1.5); // Crescimento gradual
        const variacao = (Math.random() - 0.5) * 0.4; // Variação de ±20%
        ativos = Math.max(0, Math.floor(baseValue * (1 + crescimento) * (1 + variacao)));
      }
      
      // Insere no histórico usando insert em vez de upsert
      const { error } = await supabase
        .from('historico_ofertas')
        .insert({ 
          oferta_id: oferta.id, 
          data: dataStr, 
          ativos: ativos 
        });
      
      if (error) {
        console.error(`Erro ao inserir dados para ${oferta.nome} em ${dataStr}:`, error);
      } else {
        console.log(`  ${dataStr}: ${ativos} ativos`);
      }
    }
    
    // Atualiza os valores atuais da oferta
    const ultimoDia = new Date(dataInicio);
    ultimoDia.setDate(dataInicio.getDate() + diasPassados - 1);
    const dataUltimo = ultimoDia.toISOString().slice(0, 10);
    const penultimoDia = new Date(ultimoDia);
    penultimoDia.setDate(ultimoDia.getDate() - 1);
    const dataPenultimo = penultimoDia.toISOString().slice(0, 10);
    
    // Busca os valores do último e penúltimo dia
    const { data: historicoUltimo } = await supabase
      .from('historico_ofertas')
      .select('ativos')
      .eq('oferta_id', oferta.id)
      .eq('data', dataUltimo)
      .single();
    
    const { data: historicoPenultimo } = await supabase
      .from('historico_ofertas')
      .select('ativos')
      .eq('oferta_id', oferta.id)
      .eq('data', dataPenultimo)
      .single();
    
    const ativosHoje = historicoUltimo?.ativos || 0;
    const ativosOntem = historicoPenultimo?.ativos || 0;
    
    // Atualiza a oferta
    const { error: updateError } = await supabase
      .from('ofertas')
      .update({ 
        ativosHoje: ativosHoje,
        ativosOntem: ativosOntem,
        variacao: ativosOntem > 0 ? `${(((ativosHoje - ativosOntem) / ativosOntem) * 100).toFixed(1)}%` : '0%'
      })
      .eq('id', oferta.id);
    
    if (updateError) {
      console.error(`Erro ao atualizar oferta ${oferta.nome}:`, updateError);
    } else {
      console.log(`  Oferta atualizada: Hoje=${ativosHoje}, Ontem=${ativosOntem}`);
    }
  }
  
  console.log('Dados de exemplo inseridos com sucesso!');
  console.log('Agora você pode acessar a página de analytics para ver os gráficos.');
}

inserirDadosExemplo().catch(console.error); 