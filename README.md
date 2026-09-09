# Rapidinho

Rede social de vídeos curtos (feed estilo TikTok agregando links de fora), com sistema de quiz, XP/nível e ranking. Feito pra rodar 100% grátis em GitHub Pages + Supabase.

## O que já está pronto
- Feed vertical com embed de TikTok/YouTube/Instagram, like, comentário, e anti-repetição de vídeo já visto.
- Anúncio em tela cheia a cada 4 vídeos no feed, e a cada 4 perguntas no quiz (configurável em `js/ads.js`).
- 5 quizzes com 15 perguntas cada já cadastrados (QI, curiosidades, cultura pop, personalidade, sobrevivência).
- Sistema de XP, nível e ranking dos 100 melhores.
- Tela de conta com seguidores, curtidas, vídeos postados e posição no ranking.
- Tema escuro/claro.
- Termos de uso e política de privacidade (rascunho — revisar antes de valer pra usuário real).

## Passo a passo pra colocar no ar

### 1. Criar o banco de dados (Supabase)
1. Crie uma conta grátis em [supabase.com](https://supabase.com).
2. Crie um novo projeto (escolha uma senha de banco, guarde ela).
3. Vá em **SQL Editor** → cole o conteúdo de `supabase/schema.sql` → clique **Run**.
4. Ainda no SQL Editor, cole o conteúdo de `supabase/quizzes-exemplo.sql` → **Run** (isso já cadastra os 5 quizzes prontos).
5. Vá em **Project Settings → API**. Copie a **Project URL** e a **anon public key**.
6. Abra `js/supabase-config.js` neste projeto e cole essas duas informações nos lugares indicados.

### 2. Subir pro GitHub Pages
1. Crie uma conta no [github.com](https://github.com) se não tiver.
2. Crie um repositório novo (público, é obrigatório no plano grátis) chamado, por exemplo, `rapidinho`.
3. Suba **todos os arquivos soltos** (não a pasta `supabase/`, essa é só de uso local — veja abaixo) direto na raiz do repositório: `index.html`, `style.css`, `ads.js`, `auth.js`, `feed.js`, `quiz.js`, `conta.js`, `postar.js`, `app.js`, `supabase-config.js`, `termos.html`, `privacidade.html`. Todos ficam no mesmo nível, sem pasta nenhuma — funciona certinho assim.
4. Vá em **Settings → Pages** do repositório → em "Source" escolha a branch `main` e a pasta `/ (root)` → **Save**.
5. Em alguns minutos seu site estará em `https://seu-usuario.github.io/rapidinho`.

> A pasta `supabase/` (com `schema.sql` e `quizzes-exemplo.sql`) não precisa ir pro GitHub — ela é só pra você copiar e colar no SQL Editor do Supabase, o navegador do usuário nunca acessa esses arquivos.

### 3. Domínio próprio (opcional, recomendado)
Registre um domínio (ex: `rapidinho.com.br`) em algum registrador, aponte o DNS pro GitHub Pages
(o GitHub tem um guia próprio em Settings → Pages → Custom domain) — passa mais confiança que o link padrão do GitHub.

### 4. Publicar os primeiros vídeos
O feed começa vazio — publique você mesmo os primeiros posts (aba Postar) antes de divulgar o site,
senão quem chegar primeiro vê tela vazia.

### 5. Aplicar pro Google AdSense
Só faça isso depois de ter um volume real de posts/comentários/usuários — site muito vazio costuma
ser reprovado por "conteúdo de baixo valor". Quando aprovado, você recebe um script — cole ele
dentro de `js/ads.js`, no lugar dos placeholders em `AD_SLOTS`.

### 6. ExoClick (se for usar além do AdSense)
Mesmo processo: cadastre o site lá, crie as zonas de anúncio, e cole os scripts gerados em `js/ads.js`.

## Sobre o programa de recompensas (seguidores/views)
O sistema de seguir e contar views já está pronto e é 100% automático (não depende de API externa
do TikTok). Ainda não decidimos os valores/gatilhos de pagamento — quando definir, me chama que eu
deixo isso configurável direto no painel, sem precisar mexer no código toda vez.

## Arquivos importantes
- `js/ads.js` — frequência e código dos anúncios.
- `js/supabase-config.js` — suas chaves do banco.
- `supabase/schema.sql` — estrutura do banco (rodar 1 vez só).
- `supabase/quizzes-exemplo.sql` — perguntas prontas (rodar 1 vez só).
- `termos.html` / `privacidade.html` — páginas legais (revisar antes de valer pra usuário real).
