import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

export async function POST(req) {
  const { id, urlMeta } = await req.json();
  if (!urlMeta) {
    return NextResponse.json({ error: 'urlMeta obrigatória' }, { status: 400 });
  }

  // Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Função de scraping (adaptada do scrapeMetaAds.js)
  async function scrapeAnunciosAtivos(url) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 7000));
    // Seleciona país se necessário
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      const opcoes = await page.$$('span');
      for (const opcao of opcoes) {
        const texto = await opcao.evaluate(el => el.innerText);
        if (texto && texto.includes('Brasil')) {
          await opcao.click();
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (e) {}
    // Captura todos os headings e procura pelo que contém "resultados"
    let resultados = null;
    try {
      const headings = await page.$$eval('div[role="heading"]', els => els.map(el => el.innerText));
      const headingResultados = headings.find(txt => /resultados?/i.test(txt));
      if (headingResultados) {
        const regex = /~?(\d+) resultados?/i;
        const match = headingResultados.match(regex);
        resultados = match ? parseInt(match[1], 10) : null;
      }
    } catch (e) {}
    await browser.close();
    return resultados;
  }

  // Executa scraping
  const ativosHoje = await scrapeAnunciosAtivos(urlMeta);
  if (id && ativosHoje !== null) {
    await supabase.from('ofertas').update({ ativosHoje }).eq('id', id);
  }
  return NextResponse.json({ ativosHoje });
} 