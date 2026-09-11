// ============================================================
// CONTA — perfil, estatísticas, grade de vídeos postados,
// posição no ranking e configurações (tema, regras)
// ============================================================

const contaConteudo = document.getElementById("conta-conteudo");

async function renderTelaConta() {
  contaConteudo.innerHTML = `<p style="color:var(--text-1);">Carregando...</p>`;

  const [{ data: meusPosts }, { data: posicaoRanking }] = await Promise.all([
    supabaseClient
      .from("posts")
      .select("*")
      .eq("autor_id", usuarioAtual.id)
      .order("criado_em", { ascending: false }),
    calcularPosicaoRanking(),
  ]);

  const temaAtual = localStorage.getItem("rapidinho-tema") || "escuro";

  const seguidores = perfilAtual.seguidores_count || 0;
  const META_MONETIZAR = 100;
  const faltam = Math.max(META_MONETIZAR - seguidores, 0);
  const pctMonetizar = Math.min((seguidores / META_MONETIZAR) * 100, 100);

  const META_CONVITES = 10;
  const convites = perfilAtual.convites_count || 0;
  const faltamConvites = Math.max(META_CONVITES - convites, 0);
  const pctConvites = Math.min((convites / META_CONVITES) * 100, 100);
  const linkConvite = `${location.origin}${location.pathname}?codigo=${perfilAtual.codigo_convite}`;

  contaConteudo.innerHTML = `
    <div class="perfil-header">
      <label class="perfil-avatar-wrap" for="avatar-input" title="Trocar foto de perfil">
        <div class="perfil-avatar" id="perfil-avatar">${avatarHtml(perfilAtual.foto_url, perfilAtual.username)}</div>
        <span class="avatar-editar-icone">📷</span>
      </label>
      <input type="file" id="avatar-input" accept="image/*" style="display:none;">
      <div>
        <div class="perfil-username-row">
          <div class="perfil-username">@${escapeHtml(perfilAtual.username)}${badgeVerificado(perfilAtual.verificado)}</div>
          <button id="btn-monetizar" class="btn-monetizar-pill">Monetizar</button>
        </div>
        <div class="perfil-nivel-tag">Nível ${perfilAtual.quiz_nivel} · #${posicaoRanking || "—"} no ranking</div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-num">${perfilAtual.seguidores_count}</div>
        <div class="stat-label">Seguidores</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">${perfilAtual.seguindo_count}</div>
        <div class="stat-label">Seguindo</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">${perfilAtual.likes_recebidos_count}</div>
        <div class="stat-label">Curtidas</div>
      </div>
    </div>

    <div class="secao-titulo">Selo verificado</div>
    <div class="card convite-card">
      <p class="convite-texto">
        ${perfilAtual.verificado
          ? `Parabéns, sua conta já é <span class="badge-verificado" title="Conta verificada">✓</span> verificada!`
          : `Convide 10 amigos pro Rapidinho e ganhe o selo <span class="badge-verificado" title="Conta verificada">✓</span> verificado do lado do seu nome.`}
      </p>
      <div class="convite-progresso">${convites} / ${META_CONVITES} amigos convidados${faltamConvites > 0 ? ` · faltam ${faltamConvites}` : ""}</div>
      <div class="xp-barra-wrap">
        <div class="xp-barra-bg"><div class="xp-barra-fill" style="width:${pctConvites}%;"></div></div>
      </div>
      <button id="btn-copiar-convite" class="btn-copiar-convite">Copiar link de convite</button>
      <div class="convite-codigo-linha">ou envie seu código: <span class="convite-codigo">${perfilAtual.codigo_convite || "----"}</span></div>
    </div>

    <div class="secao-titulo">Seus vídeos (${meusPosts?.length || 0})</div>
    <div class="videos-grid">
      ${(meusPosts || []).map(p => `
        <div class="video-thumb">
          <span>${p.plataforma}</span>
          <span class="views-tag">${p.views_count} views</span>
        </div>
      `).join("") || ""}
    </div>
    ${(!meusPosts || meusPosts.length === 0) ? `<p style="color:var(--text-2); font-size:13px;">Você ainda não postou nenhum vídeo.</p>` : ""}

    <div class="secao-titulo secao-titulo-clicavel" id="titulo-config">
      <span>Configurações</span><span class="seta">▾</span>
    </div>
    <div class="card config-card-oculto" id="config-card">
      <div class="config-item">
        <span>Tema</span>
        <div class="toggle-tema">
          <button data-tema="escuro" class="${temaAtual === "escuro" ? "ativo" : ""}">Escuro</button>
          <button data-tema="claro" class="${temaAtual === "claro" ? "ativo" : ""}">Normal</button>
        </div>
      </div>
      <div class="config-item">
        <span>Termos de Uso</span>
        <button id="abrir-termos" style="color:var(--yellow); font-weight:600;">Ver</button>
      </div>
      <div class="config-item">
        <span>Política de Privacidade</span>
        <button id="abrir-privacidade" style="color:var(--yellow); font-weight:600;">Ver</button>
      </div>
      <div class="config-item" style="border-bottom:none;">
        <span>Sair da conta</span>
        <button id="btn-logout" style="color:var(--danger); font-weight:600;">Sair</button>
      </div>
    </div>
  `;

  document.querySelectorAll(".toggle-tema button").forEach(btn => {
    btn.addEventListener("click", () => aplicarTema(btn.dataset.tema));
  });
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    location.reload();
  });
  document.getElementById("abrir-termos").addEventListener("click", () => window.open("termos.html", "_blank"));
  document.getElementById("abrir-privacidade").addEventListener("click", () => window.open("privacidade.html", "_blank"));

  // configurações só aparecem depois que o usuário clica no título
  document.getElementById("titulo-config").addEventListener("click", () => {
    document.getElementById("config-card").classList.toggle("config-card-oculto");
    document.getElementById("titulo-config").classList.toggle("aberta");
  });

  const btnCopiarConvite = document.getElementById("btn-copiar-convite");
  btnCopiarConvite.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
    } catch {
      // clipboard pode falhar (ex: contexto sem HTTPS) — cai pro método antigo
      const temp = document.createElement("textarea");
      temp.value = linkConvite;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }
    const textoOriginal = btnCopiarConvite.textContent;
    btnCopiarConvite.textContent = "Link copiado!";
    setTimeout(() => { btnCopiarConvite.textContent = textoOriginal; }, 2000);
  });

  document.getElementById("avatar-input").addEventListener("change", (e) => {
    trocarFotoPerfil(e.target.files[0]);
  });

  document.getElementById("btn-monetizar").addEventListener("click", () => {
    document.getElementById("monetizar-conteudo").innerHTML = `
      <div class="monetizar-resumo">
        <div class="monetizar-numero">${seguidores} / ${META_MONETIZAR}</div>
        <div class="monetizar-legenda">
          ${faltam > 0
            ? `Faltam ${faltam} seguidores pra desbloquear a monetização.`
            : `Você já tem seguidores suficientes pra desbloquear a monetização.`}
        </div>
        <div class="monetizar-barra-wrap xp-barra-wrap">
          <div class="xp-barra-bg"><div class="xp-barra-fill" style="width:${pctMonetizar}%;"></div></div>
        </div>
      </div>
    `;
    document.getElementById("monetizar-painel").classList.add("aberto");
  });
}

document.getElementById("fechar-monetizar").addEventListener("click", () => {
  document.getElementById("monetizar-painel").classList.remove("aberto");
});

async function calcularPosicaoRanking() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("id, quiz_nivel, quiz_xp")
    .order("quiz_nivel", { ascending: false })
    .order("quiz_xp", { ascending: false })
    .limit(100);
  if (!data) return null;
  const pos = data.findIndex(u => u.id === usuarioAtual.id);
  return pos === -1 ? null : pos + 1;
}

// -------- foto de perfil --------
const TAMANHO_AVATAR_PX = 400; // lado da imagem final (quadrada)
const TAMANHO_MAX_ARQUIVO = 8 * 1024 * 1024; // 8MB no arquivo original

async function trocarFotoPerfil(arquivo) {
  if (!arquivo) return;

  const avatarDiv = document.getElementById("perfil-avatar");

  if (!arquivo.type.startsWith("image/")) {
    alert("Escolhe um arquivo de imagem (jpg, png, etc).");
    return;
  }
  if (arquivo.size > TAMANHO_MAX_ARQUIVO) {
    alert("Essa imagem é muito grande. Escolhe uma de até 8MB.");
    return;
  }

  avatarDiv.innerHTML = `<span class="avatar-carregando">...</span>`;

  try {
    const imagemRedimensionada = await redimensionarImagem(arquivo, TAMANHO_AVATAR_PX);
    const caminho = `${usuarioAtual.id}/avatar.jpg`;

    const { error: erroUpload } = await supabaseClient
      .storage
      .from("avatars")
      .upload(caminho, imagemRedimensionada, {
        upsert: true,
        contentType: "image/jpeg",
      });
    if (erroUpload) throw erroUpload;

    const { data: urlPublica } = supabaseClient.storage.from("avatars").getPublicUrl(caminho);
    // ?t= evita que o navegador mostre a foto antiga em cache depois de trocar
    const fotoUrl = `${urlPublica.publicUrl}?t=${Date.now()}`;

    const { error: erroUpdate } = await supabaseClient
      .from("profiles")
      .update({ foto_url: fotoUrl })
      .eq("id", usuarioAtual.id);
    if (erroUpdate) throw erroUpdate;

    perfilAtual.foto_url = fotoUrl;
    avatarDiv.innerHTML = avatarHtml(perfilAtual.foto_url, perfilAtual.username);
  } catch (err) {
    alert("Não deu pra trocar a foto agora. Tenta de novo em instantes.");
    avatarDiv.innerHTML = avatarHtml(perfilAtual.foto_url, perfilAtual.username);
  }
}

// recorta a imagem num quadrado central e reduz o tamanho, pra foto de
// perfil não pesar (bom pro plano grátis do Supabase e pro celular de
// quem tá vendo o feed)
function redimensionarImagem(arquivo, tamanho) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    leitor.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      img.onload = () => {
        const ladoMenor = Math.min(img.width, img.height);
        const origemX = (img.width - ladoMenor) / 2;
        const origemY = (img.height - ladoMenor) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, origemX, origemY, ladoMenor, ladoMenor, 0, 0, tamanho, tamanho);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Falha ao processar a imagem.")),
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

function aplicarTema(tema) {
  localStorage.setItem("rapidinho-tema", tema);
  document.documentElement.setAttribute("data-theme", tema);
  document.querySelectorAll(".toggle-tema button").forEach(b => {
    b.classList.toggle("ativo", b.dataset.tema === tema);
  });
}

// aplica o tema salvo assim que o script carrega (antes do login até)
(function aplicarTemaInicial() {
  const tema = localStorage.getItem("rapidinho-tema") || "escuro";
  document.documentElement.setAttribute("data-theme", tema);
})();
