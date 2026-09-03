import { createClient } from "@/lib/supabase/server";

// 계정 관리(생성/수정/삭제) 권한을 가진 이메일 목록.
// .env.local의 ADMIN_EMAILS (콤마로 구분)로 설정한다.
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

// 현재 로그인한 사용자가 관리자이면 user 객체를, 아니면 null을 반환한다.
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) return null;
  return user;
}
