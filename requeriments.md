Crie um projeto Next.js com Typescript e Tailwind CSS para um dashboard web chamado **Aurax** para monitoramento de ofertas.

🎨 **Design:**
- Tema escuro com tons de roxo (exemplo: #1a1a2e como fundo, detalhes em #6a0dad e #a259ff).
- Gradientes suaves em botões, badges e cards usando tons de lilás, roxo e violeta.
- Cards com bordas arredondadas, sombras sutis e visual clean.
- Texto branco ou cinza claro para contraste.
- Ícones modernos do lucide-react ou heroicons.

---

### 📌 **Funcionalidades principais:**
- Sidebar fixa à esquerda com logo no topo.
- Topbar com campo de busca e indicadores de:
  - Total de ofertas encontradas
  - Quantidade de ofertas selecionadas
  - Limite de uso (ex: "5/5 usos")
  - Tempo até reset (ex: "Reset em 7h 4m")
- Cards para cada oferta mostrando:
  - Nome da oferta
  - Tags (ex: emagrecimento, espiritualidade)
  - Ativos Hoje
  - Ativos Ontem
  - Variação
  - Data de criação
  - Botões para acessar biblioteca ou site
  - Toggle para ativar/desativar a oferta
- Botão “Adicionar Nova Oferta” que abre um modal.

---

### 🪟 **Modal Nova Oferta:**
- Título: “Nova Oferta” com descrição “Cadastre uma nova oferta para monitoramento”.
- Campos:
  - Nome da Oferta (placeholder: “Ex: Curso de Marketing Digital”)
  - URL da Meta Ads Library
  - Tags da oferta (campo para digitar e gerar chips/tags, até 10)
  - Idiomas (dropdown para escolher até 4)
  - URL do site (opcional)
  - URL do checkout (opcional)
- Botões:
  - Cancelar (cor roxa escura)
  - Criar Oferta (cor lilás/violeta vibrante)

---

### 🛠 **Componentes reutilizáveis:**
- `Sidebar`  
- `Topbar`  
- `CardOferta`  
- `ModalNovaOferta`  
- `FooterUser` (no rodapé da sidebar com avatar, nome do usuário e botão admin)

---

### 🗺 **Rotas / Páginas necessárias:**
- `/dashboard` — Visão geral das métricas e cards de ofertas
- `/profile` — Página de gerenciamento do perfil
- `/tools` — Ferramentas (pode ter dropdown ou subpáginas)
- `/analytics` — Página de análises detalhadas
- `/account` — Dados da conta e configuração
- `/admin/overview` — Visão geral do admin
- `/admin/users` — Gestão de usuários
- `/admin/finance` — Financeiro
- `/admin/marketing` — Marketing
- `/admin/system` — Configurações do sistema

---

✅ **Extras:**
- Responsivo (desktop e mobile)
- Componentização clara e limpa
- Cores e gradientes baseados exclusivamente em tons de roxo, lilás e violeta
- Use Tailwind para estilização
- Estrutura de pastas organizada:
  - `components/`
  - `pages/`
  - `styles/`
  - `lib/` (funções auxiliares)

Gere arquivos de produção seguindo boas práticas, focado em design roxo moderno, bonito, profissional e responsivo, igual ao exemplo enviado.
