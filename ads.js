// ============================================================
// SISTEMA DE ANÚNCIOS
// ============================================================
// Native Banner da Adsterra, reaparecendo a cada N vídeos/perguntas
// (controlado pelo seu próprio contador, não pela Adsterra).
//
// ATENÇÃO — leia isso antes de mexer:
// O <div id="container-...48d"> tem um ID FIXO definido pela própria
// Adsterra — é assim que o script dela sabe onde injetar o anúncio.
// Só pode existir 1 elemento com esse ID no DOM por vez (IDs
// duplicados em HTML não são permitidos, e o script só preenche o
// primeiro que encontrar). Como o feed é infinito e o slot se repete
// várias vezes, a função abaixo REMOVE a instância anterior antes de
// criar uma nova, garantindo que nunca haja duplicata.
//
// O Bar Social/Interstitial ainda não entra aqui — assim que você
// gerar aquele código, ele fica fixo no index.html (ele não repete
// por vídeo, aparece sozinho controlado pelo próprio frequency cap).
// ============================================================

const AD_CONFIG = {
  // a cada quantas perguntas do quiz aparece 1 tela de anúncio
  // (o Feed não usa mais frequência — o anúncio dele agora é uma
  // barrinha fixa, sempre visível, controlada em mostrarBannerFeed)
  frequenciaQuiz: 4,
};

// Native Banner (Adsterra) — não mude o containerId, é fixo pra essa zona
const NATIVE_BANNER = {
  containerId: "container-db12c1ccc80708e478d2ba462efca48d",
  scriptSrc: "https://pl31282889.profitableratecpmnetwork.com/db12c1ccc80708e478d2ba462efca48d/invoke.js",
};

// remove qualquer instância anterior do anúncio (mesmo ID) — só pode
// existir 1 por vez no DOM, não importa se ela tava no feed ou no quiz
function removerInstanciaAnterior() {
  const anterior = document.getElementById(NATIVE_BANNER.containerId);
  if (anterior) anterior.remove();
}

// monta só o "miolo" do anúncio (tag + container + script), sem
// decidir ainda onde/como ele vai aparecer na tela
function criarConteudoNativeBanner() {
  const frag = document.createDocumentFragment();

  const tag = document.createElement("div");
  tag.className = "ad-tag";
  tag.textContent = "Anúncio";
  frag.appendChild(tag);

  const container = document.createElement("div");
  container.id = NATIVE_BANNER.containerId;
  frag.appendChild(container);

  const script = document.createElement("script");
  script.async = true;
  script.setAttribute("data-cfasync", "false");
  script.src = NATIVE_BANNER.scriptSrc;
  frag.appendChild(script);

  return frag;
}

// ---- versão tela cheia (usada entre perguntas do quiz) ----
function criarSlotAnuncioQuiz() {
  removerInstanciaAnterior();
  const wrapper = document.createElement("div");
  wrapper.className = "ad-slot-fullscreen";
  wrapper.appendChild(criarConteudoNativeBanner());
  return wrapper;
}

// ---- versão barrinha fixa (usada no Feed) ----
// diferente do quiz: não recria a cada N vídeos. É criada 1 vez quando
// a pessoa entra na aba Feed e fica ali, fixa embaixo da tela, enquanto
// ela rola os vídeos — some só quando ela troca de aba.
const bannerFeedEl = document.getElementById("ad-banner-fixo");

function mostrarBannerFeed() {
  if (!bannerFeedEl || bannerFeedEl.childElementCount > 0) return; // já tá montada
  removerInstanciaAnterior();
  bannerFeedEl.appendChild(criarConteudoNativeBanner());
}

function esconderBannerFeed() {
  if (!bannerFeedEl) return;
  bannerFeedEl.innerHTML = "";
}
