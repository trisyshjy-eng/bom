import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-neutral-900">
            원물원가 관리
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <Link href="/" className="hover:text-neutral-900">
              대시보드
            </Link>
            <Link href="/products" className="hover:text-neutral-900">
              원물 목록
            </Link>
            <Link href="/products/new" className="hover:text-neutral-900">
              신규 등록
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="hover:text-neutral-900">
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
