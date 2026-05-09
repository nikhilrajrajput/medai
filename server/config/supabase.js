const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
// ─── Supabase Admin Client ────────────────────────────────────────────────────
// Uses the SERVICE ROLE key (not anon key) so we can:
// - Send OTP emails to any address via Supabase Auth
// - Verify OTP tokens server-side
// - Manage users without going through RLS
//
// Get these from: Supabase Dashboard → Settings → API
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const verifySupabase = async () => {
  try {
    // Lightweight check — just list users with limit 1
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    console.log('✅  Supabase connected and ready');
  } catch (err) {
    console.error('⚠️  Supabase connection failed:', err.message);
    console.error('    → Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env vars');
  }
};

module.exports = { supabase, verifySupabase };