import { createBrowserClient } from "@supabase/ssr";

// 관계(join) 임베딩 쿼리를 자유롭게 쓰기 위해 스키마 제네릭 없이 사용하고,
// 결과 타입은 각 페이지에서 src/lib/types.ts 의 인터페이스로 명시한다.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
