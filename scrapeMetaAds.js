require('dotenv').config();
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function scrapeAnunciosAtivos(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('div[role="main"]', { timeout: 60000 });
  const resultados = await page.evaluate(() => {
    const el = document.querySelector('div[role="main"]');
    if (!el) return null;
    const match = el.innerText.match(/~?(\d+) resultados?/);
    return match ? parseInt(match[1], 10) : null;
  });
  await browser.close();
  return resultados;
}

async function atualizarAtivosHoje(idOferta, ativosHoje) {
  const { error } = await supabase
    .from('ofertas')
    .update({ ativosHoje })
    .eq('id', idOferta);

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