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
  frequenciaQuiz: 4,

  // a cada quantos vídeos rolados no Feed aparece 1 tela de anúncio
  // (além da barrinha fixa, que continua sempre visível)
  frequenciaFeed: 4,

  // de quanto em quanto tempo a barrinha fixa do Feed troca de anúncio
  // (pede um invoke novo pra Adsterra, contando como impressão nova).
  //
  // ATENÇÃO com esse número: redes de CPM (Adsterra incluída) monitoram
  // impressão repetida rápido demais sem ação real da pessoa e podem
  // marcar como tráfego inválido — isso não é "perder alguns centavos",
  // é a conta inteira ser suspensa e o site ficar sem monetização
  // nenhuma. 5s é bem agressivo pra esse tipo de rede. 30s é um ponto
  // de partida bem mais seguro pra escalar depois olhando as métricas
  // do painel deles (impressões aprovadas x reprovadas). Suba/desça
  // esse valor à vontade, mas monitore o painel depois de mudar.
  intervaloRefreshBannerMs: 30000,
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

// ---- painel de debug visível na tela (pra quem só tem celular, sem
// DevTools). Mostra em tempo real cada pedido de anúncio e se encheu.
// Deixa DEBUG_ADS = true por enquanto pra a gente enxergar os fatos;
// depois de resolver o problema é só voltar pra false e ele some.
const DEBUG_ADS = false;
let debugPanelEl = null;
function logDebugAnuncio(msg) {
  if (!DEBUG_ADS) return;
  if (!debugPanelEl) {
    debugPanelEl = document.createElement("div");
    debugPanelEl.style.cssText =
      "position:fixed;left:0;right:0;bottom:64px;max-height:130px;overflow-y:auto;" +
      "background:rgba(0,0,0,0.88);color:#4f4;font-size:10px;line-height:1.4;" +
      "padding:4px 6px;z-index:999999;font-family:monospace;pointer-events:none;";
    document.body.appendChild(debugPanelEl);
  }
  const hora = new Date().toLocaleTimeString("pt-BR");
  const linha = document.createElement("div");
  linha.textContent = `[${hora}] ${msg}`;
  debugPanelEl.appendChild(linha);
  while (debugPanelEl.childElementCount > 14) debugPanelEl.removeChild(debugPanelEl.firstChild);
  debugPanelEl.scrollTop = debugPanelEl.scrollHeight;
}

// ---- helper compartilhado: injeta o anúncio dentro de "el" e, se a
// rede não preencher a tempo, TENTA MAIS 1 VEZ antes de desistir —
// cobre o caso de ter sido só uma resposta lenta/falha pontual, não
// necessariamente falta real de anúncio pra mostrar
function preencherAnuncio(el, aoFalharDefinitivo, rotulo = "anúncio", tentativasRestantes = 1) {
  removerInstanciaAnterior();
  el.innerHTML = "";
  el.appendChild(criarConteudoNativeBanner());
  logDebugAnuncio(`${rotulo}: pedindo invoke novo (tentativas restantes: ${tentativasRestantes})`);

  const containerIdAlvo = NATIVE_BANNER.containerId;
  setTimeout(() => {
    if (!el.isConnected) {
      logDebugAnuncio(`${rotulo}: slot saiu da tela, ignorando resultado`);
      return;
    }
    const container = document.getElementById(containerIdAlvo);
    const preencheu = container && container.childElementCount > 0;
    if (preencheu) {
      logDebugAnuncio(`${rotulo}: preencheu OK (${container.childElementCount} elemento(s) dentro)`);
      return;
    }
    if (tentativasRestantes > 0) {
      logDebugAnuncio(`${rotulo}: NÃO preencheu, tentando de novo...`);
      preencherAnuncio(el, aoFalharDefinitivo, rotulo, tentativasRestantes - 1);
    } else {
      logDebugAnuncio(`${rotulo}: NÃO preencheu depois de todas as tentativas — desistindo`);
      aoFalharDefinitivo();
    }
  }, 6000); // 6s dá mais margem pro script carregar antes de considerar "sem anúncio"
}

// ---- versão barrinha fixa (usada no Feed) ----
// fica embaixo da tela enquanto a pessoa rola os vídeos, e agora se
// RENOVA sozinha de tempos em tempos (AD_CONFIG.intervaloRefreshBannerMs),
// pedindo um invoke novo pra Adsterra = uma impressão nova, sem precisar
// que a pessoa faça nada. Some só quando troca de aba, e também pausa
// automaticamente quando: (a) o app vai pra segundo plano / a aba do
// navegador perde o foco (senão a rede conta impressão que ninguém tá
// vendo, o que é exatamente o padrão que gera bloqueio por tráfego
// inválido), ou (b) tem um anúncio de tela cheia aberto no Feed no
// mesmo instante (não pode ter 2 com o mesmo containerId ao mesmo tempo).
const bannerFeedEl = document.getElementById("ad-banner-fixo");
let bannerFeedTimer = null;
let bannerFeedPausadoPorFullscreen = false;

function montarBannerFeedAgora() {
  if (!bannerFeedEl || bannerFeedPausadoPorFullscreen || document.hidden) return;
  bannerFeedEl.classList.remove("sem-fill");
  preencherAnuncio(bannerFeedEl, () => bannerFeedEl.classList.add("sem-fill"), "barrinha fixa");
}

function mostrarBannerFeed() {
  if (!bannerFeedEl) return;
  montarBannerFeedAgora();
  if (!bannerFeedTimer) {
    bannerFeedTimer = setInterval(montarBannerFeedAgora, AD_CONFIG.intervaloRefreshBannerMs);
  }
}

function esconderBannerFeed() {
  if (!bannerFeedEl) return;
  bannerFeedEl.innerHTML = "";
  bannerFeedEl.classList.remove("sem-fill");
  if (bannerFeedTimer) {
    clearInterval(bannerFeedTimer);
    bannerFeedTimer = null;
  }
}

// chamadas pelo feed.js quando um slide de anúncio em tela cheia entra
// ou sai de vista, pra nunca disputar o mesmo containerId com a barrinha
function pausarBannerFeedPorFullscreen() {
  bannerFeedPausadoPorFullscreen = true;
  if (bannerFeedEl) bannerFeedEl.innerHTML = ""; // libera o container pro anúncio de tela cheia
}
function retomarBannerFeedPorFullscreen() {
  bannerFeedPausadoPorFullscreen = false;
  montarBannerFeedAgora();
}

// pausa a renovação enquanto a aba/app não tá em foco (visível), e
// retoma (com um invoke novo na hora) quando a pessoa volta a olhar
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && bannerFeedTimer) montarBannerFeedAgora();
});

// ---- versão tela cheia usada dentro do Feed (a cada N vídeos) ----
// igual à do quiz, mas também avisa a barrinha fixa pra soltar o
// containerId enquanto esse anúncio tá visível, e devolver depois.
// a tag "Anúncio" e o conteúdo ficam em elementos separados pra não
// duplicar a tag quando o conteúdo real é injetado por cima do placeholder.
function criarSlotAnuncioFeed() {
  const wrapper = document.createElement("div");
  wrapper.className = "ad-slot-fullscreen ad-slot-feed";
  wrapper.dataset.carregado = "false";

  const conteudo = document.createElement("div");
  conteudo.className = "ad-conteudo-feed";
  const placeholder = document.createElement("div");
  placeholder.className = "ad-placeholder";
  placeholder.textContent = "Carregando anúncio...";
  conteudo.appendChild(placeholder);
  wrapper.appendChild(conteudo);

  return wrapper;
}

// carrega o conteúdo de verdade só quando o slide fica visível (mesmo
// padrão de "lazy load" que os vídeos já usam)
function carregarAnuncioFeedSeVisivel(slot) {
  if (slot.dataset.carregado === "true") return;
  slot.dataset.carregado = "true";
  const conteudo = slot.querySelector(".ad-conteudo-feed");
  preencherAnuncio(conteudo, () => {
    conteudo.innerHTML = `<div class="ad-placeholder">Sem anúncio disponível agora — continue rolando.</div>`;
  }, "tela cheia (feed)");
}
