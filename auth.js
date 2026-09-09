// ============================================================
// AUTENTICAÇÃO (cadastro, login, sessão)
// ============================================================

let modoCadastro = false; // alterna entre "Entrar" e "Criar conta" no mesmo formulário
let usuarioAtual = null;  // objeto de sessão do supabase
let perfilAtual = null;   // linha da tabela profiles do usuário logado

const telaLogin = document.getElementById("tela-login");
const formLogin = document.getElementById("form-login");
const loginErro = document.getElementById("login-erro");
const loginBtn = document.getElementById("login-btn");
const loginAltBtn = document.getElementById("login-alt-btn");
const loginAltTexto = document.getElementById("login-alt-texto");
const campoUsername = document.getElementById("login-username");

loginAltBtn.addEventListener("click", () => {
  modoCadastro = !modoCadastro;
  loginBtn.textContent = modoCadastro ? "Criar conta" : "Entrar";
  loginAltTexto.textContent = modoCadastro ? "Já tem conta?" : "Ainda não tem conta?";
  loginAltBtn.textContent = modoCadastro ? "Entrar" : "Criar conta";
  campoUsername.style.display = modoCadastro ? "block" : "none";
  campoUsername.required = modoCadastro;
});
// no login não precisa de username, só no cadastro
campoUsername.style.display = "none";
campoUsername.required = false;

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErro.textContent = "";
  loginBtn.disabled = true;

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  const username = campoUsername.value.trim();

  try {
    if (modoCadastro) {
      const { data, error } = await supabaseClient.auth.signUp({ email, password: senha });
      if (error) throw error;
      // o perfil é criado automaticamente por trigger no banco (username temporário);
      // aqui já ajustamos pro username escolhido pelo usuário
      if (data.user) {
        await supabaseClient
          .from("profiles")
          .update({ username })
          .eq("id", data.user.id);
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
    }
    await carregarSessao();
  } catch (err) {
    loginErro.textContent = traduzErroAuth(err.message);
  } finally {
    loginBtn.disabled = false;
  }
});

function traduzErroAuth(msg) {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha errados.";
  if (msg.includes("already registered")) return "Esse e-mail já tem conta.";
  if (msg.includes("Password should be")) return "Senha muito curta (mínimo 6 caracteres).";
  return msg;
}

async function carregarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    telaLogin.style.display = "flex";
    return;
  }
  usuarioAtual = session.user;
  const { data: perfil } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", usuarioAtual.id)
    .single();
  perfilAtual = perfil;
  telaLogin.style.display = "none";
  iniciarApp(); // definida em app.js
}
