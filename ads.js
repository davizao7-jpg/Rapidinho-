// ============================================================
// SISTEMA DE ANÚNCIOS
// ============================================================
// ATUALIZADO: a Adsterra (Popunder + Social Bar) já está conectada,
// mas NÃO aqui dentro do AD_SLOTS. Os dois scripts dela ficam
// carregados 1x só direto no <head>/fim do index.html, porque
// esses formatos se auto-gerenciam (a própria Adsterra decide
// quando aparecer, respeitando o frequency cap configurado no
// painel). Reinjetar o script deles aqui, a cada N vídeos, dispara
// o mesmo anúncio várias vezes na mesma sessão — isso é visto como
// comportamento de "farm" pela Adsterra e pode banir a conta.
//
// Os slots AD_SLOTS abaixo ficam DESATIVADOS por enquanto (não são
// chamados em lugar nenhum — ver criarSlotAnuncioFeed/Quiz). Se um
// dia você quiser um formato de CONTEÚDO (Native Banner, Banner
// normal), aí sim ele entra aqui, porque esses sim são pensados
// pra aparecer embutidos numa tela específica.
// ============================================================

const AD_CONFIG = {
  // a cada quantos vídeos do feed aparece 1 tela de anúncio
  frequenciaFeed: 4,
  // a cada quantas perguntas do quiz aparece 1 tela de anúncio
  frequenciaQuiz: 4,
};

// HTML que aparece dentro do slot de anúncio (troque pelo código real depois)
const AD_SLOTS = {
  feedFullscreen: `
    <div class="ad-tag">Anúncio</div>
    <div class="ad-placeholder">
      Espaço reservado para anúncio em tela cheia (ExoClick).<br>
      Substitua isto pelo código da sua zona de anúncio em js/ads.js.
    </div>
  `,
  quizFullscreen: `
    <div class="ad-tag">Anúncio</div>
    <div class="ad-placeholder">
      Espaço reservado para anúncio em tela cheia (ExoClick).<br>
      Substitua isto pelo código da sua zona de anúncio em js/ads.js.
    </div>
  `,
};

// Mantidas como no-op (retornam um elemento vazio) pra não quebrar
// as chamadas em feed.js/quiz.js. A Adsterra (Popunder/Social Bar)
// já cuida sozinha de quando aparecer — não precisa mais criar um
// "slot" a cada N vídeos/perguntas.
function criarSlotAnuncioFeed() {
  return document.createElement("div");
}

function criarSlotAnuncioQuiz() {
  return document.createElement("div");
}
