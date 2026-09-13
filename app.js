// ============================================================
// APP — navegação entre as 4 telas e ponto de entrada
// ============================================================

const tabButtons = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");

// essas abas mexem com dados da conta (perfil, XP, publicar vídeo) —
// exigem login. O Feed fica de fora de propósito, pra rolar liberado.
const ABAS_QUE_EXIGEM_LOGIN = ["conta", "quiz", "postar"];

function trocarView(nome) {
  if (ABAS_QUE_EXIGEM_LOGIN.includes(nome) && !usuarioAtual) {
    pedirLogin(nome); // definida em auth.js — mostra a tela de login
    return;
  }

  telaLogin.style.display = "none"; // garante fechada ao navegar por uma aba liberada
  views.forEach(v => v.classList.toggle("ativa", v.id === `view-${nome}`));
  tabButtons.forEach(b => b.classList.toggle("ativa", b.dataset.view === nome));

  // o banner fixo do Native Banner só faz sentido na aba Feed
  if (nome === "feed") mostrarBannerFeed(); else esconderBannerFeed();

  if (nome === "quiz") renderTelaQuiz();
  if (nome === "conta") renderTelaConta();
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => trocarView(btn.dataset.view));
});

// roda 1 vez só, com ou sem login (chamada tanto pra visitante anônimo
// quanto depois que o login confirma sessão, em auth.js)
let appJaIniciado = false;
function iniciarApp() {
  if (appJaIniciado) return;
  appJaIniciado = true;
  iniciarFeed();
  mostrarBannerFeed(); // Feed já começa como aba ativa
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
