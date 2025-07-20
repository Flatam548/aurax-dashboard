require('dotenv').config();
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function scrapeAnunciosAtivos(url) {
  const fs = require('fs');
  // Altere para headless: true para rodar em background
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(resolve => setTimeout(resolve, 9000)); // Aguarda 9 segundos extras

  // Tenta selecionar o país "Brasil" caso a página peça
  try {
    await page.waitForSelector('div[role="button"]', { timeout: 10000 });
    const botoes = await page.$$('div[role="button"]');
    for (const botao of botoes) {
      const texto = await botao.evaluate(el => el.innerText);
      if (texto && texto.includes('Selecionar país')) {
        await botao.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    const opcoes = await page.$$('span');
    for (const opcao of opcoes) {
      const texto = await opcao.evaluate(el => el.innerText);
      if (texto && texto.includes('Brasil')) {
        await opcao.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 6000));
  } catch (e) {
    console.log('Não foi necessário selecionar país ou houve erro:', e);
  }

  // Salva o HTML da página inteira para debug
  const html = await page.content();
  fs.writeFileSync('pagina.html', html);

  await new Promise(resolve => setTimeout(resolve, 3000));
  let mainText = '';
  let mainHTML = '';
  try {
    mainText = await page.$eval('div[role="main"]', el => el.innerText);
    mainHTML = await page.$eval('div[role="main"]', el => el.innerHTML);
    fs.writeFileSync('main.html', mainHTML);
    console.log("HTML do main salvo em main.html");
  } catch (e) {
    console.log('Não foi possível capturar o main:', e);
  }
  console.log('Texto do main:', mainText);

  let resultados = null;
  try {
    // Captura todos os headings e procura pelo que contém "resultados"
    const headings = await page.$$eval('div[role="heading"]', els => els.map(el => el.innerText));
    console.log('Headings encontrados:', headings);
    let headingResultados = headings.find(txt => /resultados?/i.test(txt));
    let regex = /~?(\d+) resultados?/i;
    let match = headingResultados ? headingResultados.match(regex) : null;
    if (!match) {
      // Tenta buscar em spans ou divs próximas
      const spans = await page.$$eval('span', els => els.map(el => el.innerText));
      headingResultados = spans.find(txt => /resultados?/i.test(txt));
      match = headingResultados ? headingResultados.match(regex) : null;
    }
    if (!match) {
      // Busca em todo o texto do main
      match = mainText.match(/~?(\d+) resultados?/i);
    }
    if (match) {
      resultados = parseInt(match[1], 10);
      console.log('Resultados extraídos:', resultados);
    } else {
      console.log('Nenhum heading ou span com "resultados" encontrado. Veja main.html para debug.');
    }
  } catch (e) {
    console.log('Erro ao capturar headings/spans:', e);
  }

  await browser.close();
  return resultados;
}

async function atualizarAtivosHoje(idOferta, ativosHoje) {
  if (typeof ativosHoje !== 'number' || isNaN(ativosHoje)) {
    console.log(`AtivosHoje inválido para oferta ${idOferta}, não será atualizado.`);
    return;
  }
  // Busca o valor do dia anterior
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const dataOntem = ontem.toISOString().slice(0, 10);
  let ativosOntem = 0;
  try {
    const { data: historicoOntem } = await supabase
      .from('historico_ofertas')
      .select('ativos')
      .eq('oferta_id', idOferta)
      .eq('data', dataOntem)
      .single();
    if (historicoOntem && historicoOntem.ativos !== undefined) {
      ativosOntem = historicoOntem.ativos;
    }
  } catch {}

  // Atualiza ativosHoje e ativosOntem na oferta
  const { error } = await supabase
    .from('ofertas')
    .update({ ativosHoje, ativosOntem })
    .eq('id', idOferta);

  // Salva histórico do dia
  const hoje = new Date();
  const dataHoje = hoje.toISOString().slice(0, 10);
  await supabase
    .from('historico_ofertas')
    .upsert({ oferta_id: idOferta, data: dataHoje, ativos: ativosHoje }, { onConflict: ['oferta_id', 'data'] });

  if (error) {
    console.error('Erro ao atualizar oferta:', error);
  } else {
    console.log(`Oferta ${idOferta} atualizada com sucesso!`);
  }
}

(async () => {
  // Busca todas as ofertas com urlMeta preenchida
  const { data: ofertas, error } = await supabase
    .from('ofertas')
    .select('id, urlMeta, nome');

  if (error || !ofertas) {
    console.error('Erro ao buscar ofertas:', error);
    return;
  }

  for (const oferta of ofertas) {
    if (!oferta.urlMeta) {
      console.log(`Oferta ${oferta.nome} não possui urlMeta cadastrada!`);
      continue;
    }
    console.log(`Buscando anúncios para: ${oferta.nome}`);
    const ativosHoje = await scrapeAnunciosAtivos(oferta.urlMeta);
    console.log(`Anúncios ativos encontrados para ${oferta.nome}:`, ativosHoje);
    await atualizarAtivosHoje(oferta.id, ativosHoje);
  }
})();