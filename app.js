// ============================================================
// APP — navegação entre as 4 telas e ponto de entrada
// ============================================================

const tabButtons = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");

function trocarView(nome) {
  views.forEach(v => v.classList.toggle("ativa", v.id === `view-${nome}`));
  tabButtons.forEach(b => b.classList.toggle("ativa", b.dataset.view === nome));

  if (nome === "quiz") renderTelaQuiz();
  if (nome === "conta") renderTelaConta();
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => trocarView(btn.dataset.view));
});

// só roda depois que o login/cadastro confirma sessão (chamado em auth.js)
function iniciarApp() {
  iniciarFeed();
}

// tenta restaurar sessão já existente ao abrir o site
carregarSessao();

// mantém tudo sincronizado se o usuário deslogar em outra aba
// (SIGNED_OUT é o evento certo aqui — reagir a "sessão nula" em geral
// causa loop infinito, porque a checagem inicial da página também
// dispara esse estado antes do login acontecer)
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") location.reload();
});
