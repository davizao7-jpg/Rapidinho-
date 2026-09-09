// ============================================================
// SISTEMA DE ANÚNCIOS
// ============================================================
// Aqui fica o ÚNICO lugar que você precisa mexer pra ligar o
// ExoClick/AdSense de verdade. Por enquanto são placeholders
// visuais mostrando onde cada anúncio vai entrar.
//
// Depois de aprovado no AdSense/ExoClick, troque o conteúdo de
// AD_SLOTS.feedFullscreen / AD_SLOTS.quizFullscreen pelo script
// que a rede te der (cada uma te entrega um <script> ou <ins>
// pra colar — cole o texto inteiro aqui dentro da string).
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

function criarSlotAnuncioFeed() {
  const div = document.createElement("div");
  div.className = "ad-slot-fullscreen";
  div.innerHTML = AD_SLOTS.feedFullscreen;
  return div;
}

function criarSlotAnuncioQuiz() {
  const div = document.createElement("div");
  div.className = "ad-slot-inline";
  div.innerHTML = AD_SLOTS.quizFullscreen;
  return div;
}
