// ============================================================
// POSTAR — usuário cola o link, vê o preview, publica
// ============================================================

const formPostar = document.getElementById("form-postar");
const postarUrl = document.getElementById("postar-url");
const postarPreview = document.getElementById("postar-preview");
const postarErro = document.getElementById("postar-erro");

let linkInterpretado = null;
let resolvendoLink = false;

postarUrl.addEventListener("input", async () => {
  const url = postarUrl.value.trim();
  postarPreview.innerHTML = "";
  linkInterpretado = null;
  if (!url) return;

  resolvendoLink = true;
  postarPreview.innerHTML = `<p style="color:var(--text-2); font-size:13px;">Verificando link...</p>`;

  const info = await interpretarLinkVideo(url);
  resolvendoLink = false;

  if (!info) {
    postarPreview.innerHTML = `<p style="color:var(--text-2); font-size:13px;">Cole um link válido do TikTok, YouTube ou Instagram pra ver o preview.</p>`;
    return;
  }
  linkInterpretado = info;
  postarPreview.innerHTML = gerarEmbedHtml({ ...info, url_original: url });
  if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
});

formPostar.addEventListener("submit", async (e) => {
  e.preventDefault();
  postarErro.textContent = "";

  const url = postarUrl.value.trim();
  const legenda = document.getElementById("postar-legenda").value.trim();

  // se o usuário colou e já apertou publicar rápido demais, garante que
  // a gente resolveu o link antes de tentar postar
  if (!linkInterpretado && !resolvendoLink) {
    linkInterpretado = await interpretarLinkVideo(url);
  }
  if (resolvendoLink) {
    postarErro.textContent = "Aguarda 1 segundo, ainda tô verificando o link...";
    return;
  }
  if (!linkInterpretado) {
    postarErro.textContent = "Não consegui reconhecer esse link. Confira se copiou certinho.";
    return;
  }

  const { error } = await supabaseClient.from("posts").insert({
    autor_id: usuarioAtual.id,
    url_original: url,
    plataforma: linkInterpretado.plataforma,
    video_id: linkInterpretado.video_id,
    legenda: legenda || null,
  });

  if (error) {
    postarErro.textContent = "Deu erro ao publicar. Tenta de novo em alguns segundos.";
    return;
  }

  formPostar.reset();
  postarPreview.innerHTML = "";
  linkInterpretado = null;

  // volta pro feed já mostrando o vídeo publicado
  trocarView("feed");
  iniciarFeed();
});
