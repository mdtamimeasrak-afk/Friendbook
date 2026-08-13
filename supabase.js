const SUPABASE_URL = "https://vtazrwksizpeyezwctko.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NZokcdzmT0q2d8KS4FpayA_CL3MAtci";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
// Step 10.15 Fix
window.db = supabaseClient;