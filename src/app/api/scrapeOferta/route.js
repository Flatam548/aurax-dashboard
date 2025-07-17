import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BROWSERLESS_TOKEN = '2ShNbIajtnZhVuSed51c3c3ea6a7aa4ecf973e46d491a5f83';
const BROWSERLESS_URL = `https://chrome.browserless.io/function?token=${BROWSERLESS_TOKEN}`;

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

  // Script Puppeteer para rodar no browserless (sem require, usando contexto global)
  const code = `async ({ page, context }) => {
    await page.goto('${urlMeta}', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 7000));
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
    let resultados = null;
    try {
      const headings = await page.$$eval('div[role="heading"]', els => els.map(el => el.innerText));
      const headingResultados = headings.find(txt => /resultados?/i.test(txt));
      if (headingResultados) {
        const regex = /~?(\\d+) resultados?/i;
        const match = headingResultados.match(regex);
        resultados = match ? parseInt(match[1], 10) : null;
      }
    } catch (e) {}
    return { ativosHoje: resultados };
  }`;

  // Chama o browserless
  let ativosHoje = null;
  let browserlessError = null;
  try {
    const res = await fetch(BROWSERLESS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (typeof data === 'object' && data !== null && 'ativosHoje' in data) {
      ativosHoje = data.ativosHoje;
    } else {
      browserlessError = JSON.stringify(data);
    }
  } catch (e) {
    browserlessError = e.message;
  }

  if (browserlessError) {
    return NextResponse.json({ error: 'Erro ao rodar scraping no browserless', details: browserlessError }, { status: 500 });
  }

  if (id && ativosHoje !== null) {
    // Busca o valor do dia anterior
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dataOntem = ontem.toISOString().slice(0, 10);
    let ativosOntem = 0;
    try {
      const { data: historicoOntem } = await supabase
        .from('historico_ofertas')
        .select('ativos')
        .eq('oferta_id', id)
        .eq('data', dataOntem)
        .single();
      if (historicoOntem && historicoOntem.ativos !== undefined) {
        ativosOntem = historicoOntem.ativos;
      }
    } catch {}
    // Atualiza ativosHoje e ativosOntem na oferta
    await supabase.from('ofertas').update({ ativosHoje, ativosOntem }).eq('id', id);
    // Salva histórico do dia
    const hoje = new Date();
    const dataHoje = hoje.toISOString().slice(0, 10);
    await supabase
      .from('historico_ofertas')
      .upsert({ oferta_id: id, data: dataHoje, ativos: ativosHoje }, { onConflict: ['oferta_id', 'data'] });
  }
  return NextResponse.json({ ativosHoje });
} 