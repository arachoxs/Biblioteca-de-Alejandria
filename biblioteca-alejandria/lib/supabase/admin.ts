import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");

    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}