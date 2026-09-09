// ============================================================
// FEED — carrega posts, evita repetir vídeo já visto, embed,
// likes, comentários e views
// ============================================================

const feedScroll = document.getElementById("feed-scroll");
let feedCarregando = false;
let feedAcabou = false;
let postIdsNaTela = new Set();
let postAtualComentarios = null; // id do post com painel de comentário aberto

// -------- resolve link curto do TikTok (vt.tiktok.com, vm.tiktok.com) --------
// esses links não têm o número do vídeo na própria URL, então pedimos
// pro próprio TikTok resolver via oEmbed (serviço oficial deles)
async function resolverTikTokViaOembed(url) {
  try {
    const resp = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const match = data.html?.match(/data-video-id="(\d+)"/);
    return match ? match[1] : null;
  } catch (e) {
    return null; // sem internet pro tiktok, link inválido, ou CORS bloqueado
  }
}

// -------- extrair id/plataforma de um link colado --------
async function interpretarLinkVideo(url) {
  url = url.trim();
  try {
    const u = new URL(url);
    if (u.hostname.includes("tiktok.com")) {
      // link normal já tem o número na própria URL — não precisa de internet extra
      const m = url.match(/video\/(\d+)/);
      if (m) return { plataforma: "tiktok", video_id: m[1] };

      // link curto (vt.tiktok.com/vm.tiktok.com) — pede pro TikTok resolver
      const videoId = await resolverTikTokViaOembed(url);
      if (videoId) return { plataforma: "tiktok", video_id: videoId };
      return null;
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v");
      if (!id && u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
      if (!id && u.pathname.includes("/shorts/")) id = u.pathname.split("/shorts/")[1];
      if (id) return { plataforma: "youtube", video_id: id.split("?")[0] };
    }
    if (u.hostname.includes("instagram.com")) {
      const m = url.match(/(reel|p)\/([A-Za-z0-9_-]+)/);
      if (m) return { plataforma: "instagram", video_id: m[2] };
    }
  } catch (e) { /* url inválida */ }
  return null;
}

// TikTok tem dois jeitos de embutir vídeo: o "widget" completo (com logo,
// botão de seguir, banner "assistir agora" — o que gerava aquela poluição
// visual) e o "Embed Player", uma versão enxuta feita pra iframes de app,
// sem essa casca, e que aceita comandos reais de play/pause via mensagem.
// Trocamos pra essa segunda versão — resolve o visual E permite nosso
// próprio botão de pausa controlar o vídeo de verdade.
// lembra se o usuário já ligou o som, pra os próximos vídeos já
// começarem tocando com som (só o primeiro precisa começar mudo)
let somLigado = false;

function gerarEmbedHtml(post) {
  if (post.plataforma === "tiktok") {
    const params = new URLSearchParams({
      autoplay: "1",
      muted: somLigado ? "0" : "1",
      loop: "1",        // looping — sem tela de "vídeos relacionados" no final
      controls: "0",
      progress_bar: "0",
      play_button: "0",
      volume_control: "0",
      fullscreen_button: "0",
      timestamp: "0",
      music_info: "0",
      description: "0",
      native_context_menu: "0",
      closed_caption: "0",
    });
    return `
      <div class="tiktok-player-container">
        <iframe class="tiktok-player-iframe"
          src="https://www.tiktok.com/player/v1/${post.video_id}?${params.toString()}"
          allow="autoplay; fullscreen" style="width:100%;height:100%;border:0;"
          title="Vídeo"></iframe>
        <div class="clique-barreira" data-video-id="${post.video_id}">
          <div class="icone-pausa">▶</div>
        </div>
        <button class="botao-som">${somLigado ? "🔊" : "🔇"}</button>
      </div>`;
  }
  if (post.plataforma === "youtube") {
    return `<iframe width="100%" height="100%"
      src="https://www.youtube.com/embed/${post.video_id}?playsinline=1"
      frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
      style="max-width:480px;"></iframe>`;
  }
  if (post.plataforma === "instagram") {
    return `<blockquote class="instagram-media" data-instgrm-permalink="${post.url_original}"
      style="max-height:100%;"></blockquote>`;
  }
  return `<a href="${post.url_original}" target="_blank" style="color:#fff;">Abrir vídeo</a>`;
}

// -------- botão invisível que intercepta o clique antes de chegar no player --------
// sem essa barreira, clicar no vídeo do TikTok abre o app/site deles. Com
// ela, o clique é nosso: pausa/retoma via mensagem pro player (postMessage)
function configurarBarreiraClique(item) {
  const barreira = item.querySelector(".clique-barreira");
  const iframe = item.querySelector(".tiktok-player-iframe");
  const botaoSom = item.querySelector(".botao-som");
  if (!barreira || !iframe) return;

  if (botaoSom) {
    botaoSom.addEventListener("click", (e) => {
      e.stopPropagation(); // não deixa isso também pausar o vídeo
      somLigado = !somLigado;
      botaoSom.textContent = somLigado ? "🔊" : "🔇";
      iframe.contentWindow?.postMessage(
        { "x-tiktok-player": true, type: somLigado ? "unMute" : "mute" },
        "*"
      );
    });
  }

  barreira.addEventListener("click", () => {
    const pausado = barreira.classList.toggle("pausado");
    iframe.contentWindow?.postMessage(
      { "x-tiktok-player": true, type: pausado ? "pause" : "play" },
      "*"
    );
  });
}

// -------- buscar próximo lote de posts, sem repetir vistos --------
async function buscarProximosPosts(limite = 6) {
  // ids que esse usuário já viu
  const { data: vistos } = await supabaseClient
    .from("post_views")
    .select("post_id")
    .eq("usuario_id", usuarioAtual.id);
  const idsVistos = (vistos || []).map(v => v.post_id);

  let query = supabaseClient
    .from("posts")
    .select("*, profiles:autor_id (username)")
    .order("criado_em", { ascending: false })
    .limit(limite);

  if (idsVistos.length > 0) {
    query = query.not("id", "in", `(${idsVistos.join(",")})`);
  }

  let { data: posts } = await query;

  // se não sobrou nada novo, o usuário já viu tudo — libera de novo do zero
  if (!posts || posts.length === 0) {
    const { data: todos } = await supabaseClient
      .from("posts")
      .select("*, profiles:autor_id (username)")
      .order("criado_em", { ascending: false })
      .limit(limite);
    return { posts: todos || [], reiniciado: true };
  }
  return { posts, reiniciado: false };
}

const TEMPO_MAXIMO_VIDEO_MS = 20000; // depois disso, empurra pro próximo sozinho

// -------- montar 1 card de vídeo no feed --------
// o player do TikTok NÃO é carregado aqui — só guardamos os dados no
// elemento (data-*) e um aviso de "carregando". O player de verdade só
// entra quando o vídeo fica visível (ver carregarEmbedSeVisivel), pra
// não travar tudo carregando 6 players pesados de uma vez.
function montarFeedItem(post, indiceGlobal) {
  const item = document.createElement("div");
  item.className = "feed-item";
  item.dataset.postId = post.id;
  item.dataset.plataforma = post.plataforma;
  item.dataset.videoId = post.video_id;
  item.dataset.urlOriginal = post.url_original;
  item.dataset.carregado = "false";

  const embedWrap = document.createElement("div");
  embedWrap.className = "embed-wrap";
  embedWrap.innerHTML = `<div style="color:#666; font-size:13px;">Carregando vídeo...</div>`;
  item.appendChild(embedWrap);

  const legenda = document.createElement("div");
  legenda.className = "legenda-box";
  legenda.innerHTML = `
    <div class="autor">@${post.profiles?.username || "usuario"}</div>
    ${post.legenda ? `<div class="legenda-texto">${escapeHtml(post.legenda)}</div>` : ""}
  `;
  item.appendChild(legenda);

  const rail = document.createElement("div");
  rail.className = "acoes-rail";
  rail.innerHTML = `
    <button class="acao-btn like-btn" data-post-id="${post.id}">
      <div class="icone">♥</div>
      <div class="contagem">${post.likes_count || 0}</div>
    </button>
    <button class="acao-btn comentario-btn" data-post-id="${post.id}">
      <div class="icone">💬</div>
      <div class="contagem">${post.comentarios_count || 0}</div>
    </button>
  `;
  item.appendChild(rail);

  return item;
}

async function carregarMaisFeed() {
  if (feedCarregando || feedAcabou) return;
  feedCarregando = true;

  const { posts } = await buscarProximosPosts(6);

  if (posts.length === 0) {
    if (feedScroll.children.length === 0) {
      feedScroll.innerHTML = `<div class="feed-fim">
        <div class="titulo">Ainda não tem vídeo aqui</div>
        <p>Seja o primeiro a postar na aba "Postar"!</p>
      </div>`;
    }
    feedCarregando = false;
    return;
  }

  let contador = feedScroll.querySelectorAll(".feed-item").length;

  posts.forEach((post) => {
    if (postIdsNaTela.has(post.id)) return;
    postIdsNaTela.add(post.id);
    feedScroll.appendChild(montarFeedItem(post, contador));
    contador++;
    if (contador % AD_CONFIG.frequenciaFeed === 0) {
      feedScroll.appendChild(criarSlotAnuncioFeed());
    }
  });

  feedCarregando = false;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// -------- carrega o player de verdade só quando o item fica visível --------
function carregarEmbedSeVisivel(item) {
  if (item.dataset.carregado === "true") return;
  item.dataset.carregado = "true";

  const embedWrap = item.querySelector(".embed-wrap");
  embedWrap.innerHTML = gerarEmbedHtml({
    plataforma: item.dataset.plataforma,
    video_id: item.dataset.videoId,
    url_original: item.dataset.urlOriginal,
  });

  if (item.dataset.plataforma === "tiktok") configurarBarreiraClique(item);
  if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
}

// -------- avança pro próximo item sozinho depois de X segundos --------
// existe pra não deixar a pessoa "presa" dentro do player do TikTok
// (o player deles, depois que o vídeo acaba, mostra sugestões pra
// continuar vendo TikTok — a gente não controla essa parte porque é
// conteúdo de outro site rodando dentro de um iframe. Isso aqui evita
// o problema na prática: força a virada antes disso incomodar)
function agendarAvancoAutomatico(item) {
  cancelarAvancoAutomatico(item);
  item._timerAvanco = setTimeout(() => {
    let proximo = item.nextElementSibling;
    while (proximo && !proximo.classList.contains("feed-item") && !proximo.classList.contains("ad-slot-fullscreen")) {
      proximo = proximo.nextElementSibling;
    }
    if (proximo) proximo.scrollIntoView({ behavior: "smooth", block: "start" });
  }, TEMPO_MAXIMO_VIDEO_MS);
}
function cancelarAvancoAutomatico(item) {
  if (item._timerAvanco) {
    clearTimeout(item._timerAvanco);
    item._timerAvanco = null;
  }
}

// -------- registrar view + carregar player + iniciar cronômetro --------
const observerFeed = new IntersectionObserver((entries) => {
  entries.forEach(async (entry) => {
    const item = entry.target;
    if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
      carregarEmbedSeVisivel(item);
      agendarAvancoAutomatico(item);

      const postId = item.dataset.postId;
      if (postId) {
        await supabaseClient
          .from("post_views")
          .insert({ post_id: postId, usuario_id: usuarioAtual.id })
          .select(); // erro de "unique" é esperado se já tinha visto, ignoramos
      }
    } else {
      cancelarAvancoAutomatico(item);
    }
  });
}, { threshold: [0.6] });

// re-observa itens novos sempre que o feed muda
const mutationObserverFeed = new MutationObserver((mutations) => {
  mutations.forEach((m) => {
    m.addedNodes.forEach((node) => {
      if (node.classList?.contains("feed-item")) observerFeed.observe(node);
    });
  });
});
mutationObserverFeed.observe(feedScroll, { childList: true });

// -------- scroll infinito --------
feedScroll.addEventListener("scroll", () => {
  const restante = feedScroll.scrollHeight - feedScroll.scrollTop - feedScroll.clientHeight;
  if (restante < window.innerHeight * 2) carregarMaisFeed();
});

// -------- curtir --------
feedScroll.addEventListener("click", async (e) => {
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn) {
    const postId = likeBtn.dataset.postId;
    const jaCurtido = likeBtn.classList.contains("curtido");
    likeBtn.classList.toggle("curtido");
    const contagemEl = likeBtn.querySelector(".contagem");
    contagemEl.textContent = parseInt(contagemEl.textContent) + (jaCurtido ? -1 : 1);

    if (jaCurtido) {
      await supabaseClient.from("likes").delete()
        .eq("post_id", postId).eq("usuario_id", usuarioAtual.id);
    } else {
      await supabaseClient.from("likes").insert({ post_id: postId, usuario_id: usuarioAtual.id });
    }
    return;
  }

  const comentarioBtn = e.target.closest(".comentario-btn");
  if (comentarioBtn) abrirComentarios(comentarioBtn.dataset.postId);
});

// -------- painel de comentários --------
const painelComentarios = document.getElementById("comentarios-painel");
const listaComentarios = document.getElementById("comentarios-lista");
const formComentario = document.getElementById("form-comentario");

async function abrirComentarios(postId) {
  postAtualComentarios = postId;
  painelComentarios.classList.add("aberto");
  listaComentarios.innerHTML = "Carregando...";

  const { data: comentarios } = await supabaseClient
    .from("comentarios")
    .select("*, profiles:autor_id (username)")
    .eq("post_id", postId)
    .order("criado_em", { ascending: true });

  listaComentarios.innerHTML = (comentarios || []).map(c => `
    <div class="comentario-item">
      <div class="autor">@${c.profiles?.username || "usuario"}</div>
      <div class="texto">${escapeHtml(c.texto)}</div>
    </div>
  `).join("") || `<p style="color:var(--text-2); text-align:center; margin-top:20px;">Nenhum comentário ainda. Seja o primeiro!</p>`;
}

document.getElementById("fechar-comentarios").addEventListener("click", () => {
  painelComentarios.classList.remove("aberto");
});

formComentario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("input-comentario");
  const texto = input.value.trim();
  if (!texto || !postAtualComentarios) return;

  await supabaseClient.from("comentarios").insert({
    post_id: postAtualComentarios,
    autor_id: usuarioAtual.id,
    texto,
  });

  // atualiza contador visível no rail daquele post
  const item = feedScroll.querySelector(`.feed-item[data-post-id="${postAtualComentarios}"] .comentario-btn .contagem`);
  if (item) item.textContent = parseInt(item.textContent) + 1;

  input.value = "";
  abrirComentarios(postAtualComentarios); // recarrega a lista
});

function iniciarFeed() {
  feedScroll.innerHTML = "";
  postIdsNaTela.clear();
  feedAcabou = false;
  carregarMaisFeed();
}
