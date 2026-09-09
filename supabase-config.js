// ============================================================
// COLE AQUI AS SUAS CHAVES DO SUPABASE
// ============================================================
// Onde achar: painel do Supabase → seu projeto → Project Settings
// → API. "Project URL" vai em SUPABASE_URL, "anon public key"
// vai em SUPABASE_ANON_KEY. Essas duas chaves são seguras pra
// deixar públicas no código (é assim que o Supabase funciona,
// a segurança de verdade fica nas regras RLS do schema.sql).
// ============================================================

const SUPABASE_URL = "https://bsifnenhzmmuiciyyoxg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaWZuZW5oem1tdWljaXl5b3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MDk0NzUsImV4cCI6MjEwNDQ4NTQ3NX0.WznYZRIQ-jPAbbmC8q8m-OZlV8dDB5zVkkGZKL2UMho";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
