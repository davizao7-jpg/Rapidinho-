// ============================================================
// COLE AQUI AS SUAS CHAVES DO SUPABASE
// ============================================================
// Onde achar: painel do Supabase → seu projeto → Project Settings
// → API. "Project URL" vai em SUPABASE_URL, "anon public key"
// vai em SUPABASE_ANON_KEY. Essas duas chaves são seguras pra
// deixar públicas no código (é assim que o Supabase funciona,
// a segurança de verdade fica nas regras RLS do schema.sql).
// ============================================================

const SUPABASE_URL = "COLE_AQUI_A_SUA_PROJECT_URL";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_SUA_ANON_KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
