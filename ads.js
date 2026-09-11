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
  // a cada quantos vídeos do feed aparece 1 tela de anúncio
  frequenciaFeed: 4,
  // a cada quantas perguntas do quiz aparece 1 tela de anúncio
  frequenciaQuiz: 4,
};

// Native Banner (Adsterra) — não mude o containerId, é fixo pra essa zona
const NATIVE_BANNER = {
  containerId: "container-db12c1ccc80708e478d2ba462efca48d",
  scriptSrc: "https://pl31282889.profitableratecpmnetwork.com/db12c1ccc80708e478d2ba462efca48d/invoke.js",
};

function criarSlotNativeBanner() {
  // remove qualquer instância anterior (mesmo ID) antes de criar outra
  const anterior = document.getElementById(NATIVE_BANNER.containerId);
  if (anterior) anterior.remove();

  const wrapper = document.createElement("div");
  wrapper.className = "ad-slot-fullscreen";

  const tag = document.createElement("div");
  tag.className = "ad-tag";
  tag.textContent = "Anúncio";
  wrapper.appendChild(tag);

  const container = document.createElement("div");
  container.id = NATIVE_BANNER.containerId;
  wrapper.appendChild(container);

  const script = document.createElement("script");
  script.async = true;
  script.setAttribute("data-cfasync", "false");
  script.src = NATIVE_BANNER.scriptSrc;
  wrapper.appendChild(script);

  return wrapper;
}

function criarSlotAnuncioFeed() {
  return criarSlotNativeBanner();
}

function criarSlotAnuncioQuiz() {
  return criarSlotNativeBanner();
}
