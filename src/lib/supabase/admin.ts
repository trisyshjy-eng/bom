import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role 키는 RLS를 완전히 우회하는 강력한 권한을 가지므로
// 반드시 서버 전용 코드(Server Action, Server Component)에서만 호출해야 한다.
// 브라우저 번들에 절대 노출되면 안 되므로 NEXT_PUBLIC_ 접두사를 붙이지 않는다.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local을 확인하세요."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
