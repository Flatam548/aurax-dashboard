import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const data = searchParams.get('data');
  if (!id || !data) {
    return NextResponse.json({ error: 'id e data obrigatórios' }, { status: 400 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: historico } = await supabase
    .from('historico_ofertas')
    .select('ativos')
    .eq('oferta_id', id)
    .eq('data', data)
    .single();
  return NextResponse.json({ ativos: historico?.ativos ?? 0 });
} 