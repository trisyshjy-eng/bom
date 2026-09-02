import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 관계(join) 임베딩 쿼리를 자유롭게 쓰기 위해 스키마 제네릭 없이 사용하고,
// 결과 타입은 각 페이지에서 src/lib/types.ts 의 인터페이스로 명시한다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시 (middleware가 세션을 갱신함)
          }
        },
      },
    }
  );
}
