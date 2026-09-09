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

  contaConteudo.innerHTML = `
    <div class="perfil-header">
      <div class="perfil-avatar">${(perfilAtual.username || "?")[0].toUpperCase()}</div>
      <div>
        <div class="perfil-username">@${escapeHtml(perfilAtual.username)}</div>
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

    <div class="secao-titulo">Configurações</div>
    <div class="card">
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
}

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
