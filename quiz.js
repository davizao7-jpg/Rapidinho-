// ============================================================
// QUIZ — lista de quizzes, jogo pergunta-a-pergunta, XP/nível,
// ranking dos top 100
// ============================================================

const XP_POR_NIVEL = 20; // precisa desse total de XP acumulado pra subir 1 nível (bate com o trigger do banco)
const quizConteudo = document.getElementById("quiz-conteudo");

let quizEmAndamento = null; // { quiz, perguntas, indice, acertos }

async function renderTelaQuiz() {
  quizConteudo.innerHTML = `<p style="color:var(--text-1);">Carregando...</p>`;

  const [{ data: quizzes }, { data: ranking }] = await Promise.all([
    supabaseClient.from("quizzes").select("*").order("ordem"),
    supabaseClient.from("profiles")
      .select("id, username, quiz_nivel, quiz_xp, quiz_acertos_total")
      .order("quiz_nivel", { ascending: false })
      .order("quiz_xp", { ascending: false })
      .limit(100),
  ]);

  const nivelAtual = perfilAtual.quiz_nivel;
  const xpAtual = perfilAtual.quiz_xp;
  const xpNesseNivel = xpAtual % XP_POR_NIVEL;
  const percentual = Math.round((xpNesseNivel / XP_POR_NIVEL) * 100);

  quizConteudo.innerHTML = `
    <h2 style="margin:0 0 4px;">Quizzes</h2>
    <p style="color:var(--text-1); font-size:13px; margin:0;">Responda, ganhe XP e suba de nível.</p>

    <div class="card xp-barra-wrap">
      <div class="xp-legenda">
        <span>Nível ${nivelAtual}</span>
        <span>${xpNesseNivel}/${XP_POR_NIVEL} XP</span>
      </div>
      <div class="xp-barra-bg"><div class="xp-barra-fill" style="width:${percentual}%;"></div></div>
    </div>

    <div class="secao-titulo">Escolha um quiz</div>
    <div class="quiz-lista" id="lista-quizzes">
      ${(quizzes || []).map(q => `
        <div class="quiz-card">
          <div>
            <div class="quiz-nome">${escapeHtml(q.titulo)}</div>
            <div class="quiz-categoria">${escapeHtml(q.categoria)}</div>
          </div>
          <button class="jogar-btn" data-quiz-id="${q.id}">Jogar</button>
        </div>
      `).join("") || `<p style="color:var(--text-2);">Nenhum quiz cadastrado ainda.</p>`}
    </div>

    <div class="secao-titulo">Ranking — top 100</div>
    <div class="card" id="ranking-lista">
      ${(ranking || []).map((u, i) => `
        <div class="ranking-item">
          <div class="ranking-pos ${i < 3 ? "top3" : ""}">${i + 1}</div>
          <div class="ranking-avatar">${(u.username || "?")[0].toUpperCase()}</div>
          <div class="ranking-info">
            <div class="ranking-nome">@${escapeHtml(u.username)}</div>
            <div class="ranking-sub">${u.quiz_acertos_total} acertos</div>
          </div>
          <div class="ranking-nivel">Nv. ${u.quiz_nivel}</div>
        </div>
      `).join("") || `<p style="color:var(--text-2);">Ninguém jogou ainda.</p>`}
    </div>
  `;

  document.querySelectorAll(".jogar-btn").forEach(btn => {
    btn.addEventListener("click", () => iniciarQuiz(btn.dataset.quizId, quizzes.find(q => q.id === btn.dataset.quizId)));
  });
}

async function iniciarQuiz(quizId, quiz) {
  const { data: perguntas } = await supabaseClient
    .from("quiz_perguntas")
    .select("*")
    .eq("quiz_id", quizId)
    .order("ordem");

  if (!perguntas || perguntas.length === 0) {
    alert("Esse quiz ainda não tem perguntas cadastradas.");
    return;
  }

  quizEmAndamento = { quiz, perguntas, indice: 0, acertos: 0 };
  renderPerguntaAtual();
}

function renderPerguntaAtual() {
  const { perguntas, indice } = quizEmAndamento;

  // a cada N perguntas (config em ads.js), mostra um anúncio antes de continuar
  if (indice > 0 && indice % AD_CONFIG.frequenciaQuiz === 0 && !quizEmAndamento.anuncioMostradoEm?.includes(indice)) {
    quizEmAndamento.anuncioMostradoEm = [...(quizEmAndamento.anuncioMostradoEm || []), indice];
    quizConteudo.innerHTML = "";
    const slot = criarSlotAnuncioQuiz();
    quizConteudo.appendChild(slot);
    const continuar = document.createElement("button");
    continuar.className = "btn-publicar";
    continuar.style.marginTop = "14px";
    continuar.textContent = "Continuar quiz";
    continuar.addEventListener("click", renderPerguntaAtual);
    quizConteudo.appendChild(continuar);
    return;
  }

  const pergunta = perguntas[indice];
  quizConteudo.innerHTML = `
    <div class="pergunta-numero">Pergunta ${indice + 1} de ${perguntas.length}</div>
    <div class="pergunta-texto">${escapeHtml(pergunta.pergunta)}</div>
    <div class="opcoes-lista" id="opcoes-lista">
      ${pergunta.opcoes.map((op, i) => `
        <button class="opcao-btn" data-indice="${i}">${escapeHtml(op)}</button>
      `).join("")}
    </div>
  `;

  document.querySelectorAll(".opcao-btn").forEach(btn => {
    btn.addEventListener("click", () => responderPergunta(parseInt(btn.dataset.indice)));
  });
}

function responderPergunta(indiceEscolhido) {
  const { perguntas, indice } = quizEmAndamento;
  const pergunta = perguntas[indice];
  const correta = pergunta.resposta_correta;

  document.querySelectorAll(".opcao-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === correta) btn.classList.add("correta");
    else if (i === indiceEscolhido) btn.classList.add("errada");
  });

  if (indiceEscolhido === correta) quizEmAndamento.acertos++;

  setTimeout(() => {
    quizEmAndamento.indice++;
    if (quizEmAndamento.indice >= perguntas.length) {
      finalizarQuiz();
    } else {
      renderPerguntaAtual();
    }
  }, 900);
}

async function finalizarQuiz() {
  const { quiz, perguntas, acertos } = quizEmAndamento;
  const xpGanho = acertos; // 1 XP por acerto

  await supabaseClient.from("quiz_resultados").insert({
    usuario_id: usuarioAtual.id,
    quiz_id: quiz.id,
    acertos,
    total_perguntas: perguntas.length,
    xp_ganho: xpGanho,
  });

  // recarrega perfil (o trigger no banco já atualizou XP/nível)
  const { data: perfil } = await supabaseClient
    .from("profiles").select("*").eq("id", usuarioAtual.id).single();
  perfilAtual = perfil;

  quizConteudo.innerHTML = `
    <div class="card" style="text-align:center; padding:30px 16px;">
      <div style="font-size:15px; color:var(--text-1);">Quiz concluído!</div>
      <div style="font-size:32px; font-weight:800; margin:10px 0;">${acertos}/${perguntas.length}</div>
      <div style="color:var(--green-bright); font-weight:700;">+${xpGanho} XP</div>
      <button class="btn-publicar" style="margin-top:20px;" id="btn-voltar-quizzes">Voltar</button>
    </div>
  `;
  document.getElementById("btn-voltar-quizzes").addEventListener("click", renderTelaQuiz);
  quizEmAndamento = null;
}
