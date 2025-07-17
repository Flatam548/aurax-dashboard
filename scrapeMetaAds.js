const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getActiveAdsCount(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Ajuste o seletor conforme a página da Meta Ads Library
  const count = await page.evaluate(() => {
    // Exemplo: buscar o texto "anúncios ativos" ou similar
    const el = document.querySelector('[data-testid="results-count"]');
    if (el) {
      const match = el.textContent.match(/(\\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  });

  await browser.close();
  return count;
}

async function main() {
  const { data: ofertas } = await supabase.from('ofertas').select('id, urlMeta');
  const today = new Date().toISOString().slice(0, 10);

  for (const oferta of ofertas) {
    if (!oferta.urlMeta) continue;
    const ativos = await getActiveAdsCount(oferta.urlMeta);

    // Salva no histórico
    await supabase.from('historico_ofertas').upsert([
      { oferta_id: oferta.id, data: today, ativos }
    ], { onConflict: ['oferta_id', 'data'] });
    console.log(`Oferta ${oferta.id}: ${ativos} ativos salvos para ${today}`);
  }
}

main();