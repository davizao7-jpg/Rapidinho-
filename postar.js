// ============================================================
// POSTAR — usuário cola o link, vê o preview, publica
// ============================================================

const formPostar = document.getElementById("form-postar");
const postarUrl = document.getElementById("postar-url");
const postarPreview = document.getElementById("postar-preview");
const postarErro = document.getElementById("postar-erro");

let linkInterpretado = null;

postarUrl.addEventListener("input", () => {
  const url = postarUrl.value.trim();
  postarPreview.innerHTML = "";
  linkInterpretado = null;
  if (!url) return;

  const info = interpretarLinkVideo(url);
  if (!info) {
    postarPreview.innerHTML = `<p style="color:var(--text-2); font-size:13px;">Cole um link válido do TikTok, YouTube ou Instagram pra ver o preview.</p>`;
    return;
  }
  linkInterpretado = info;
  postarPreview.innerHTML = gerarEmbedHtml({ ...info, url_original: url });
  if (window.tiktokEmbed?.lib?.render) window.tiktokEmbed.lib.render();
  if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
});

formPostar.addEventListener("submit", async (e) => {
  e.preventDefault();
  postarErro.textContent = "";

  const url = postarUrl.value.trim();
  const legenda = document.getElementById("postar-legenda").value.trim();

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
