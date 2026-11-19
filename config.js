// Configuración de la conexión a Supabase.
// Copia estos dos valores desde Supabase → Project Settings → API.
// La "anon public key" está pensada para ser pública: los permisos reales
// los controlan las políticas (RLS) definidas en supabase_schema.sql.
window.APP_CONFIG = {
  SUPABASE_URL: "https://bizjmefgcxelfhplldfc.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_5UAerzWiXsm3YIDVac0wRQ_3FLI1snA"
};
