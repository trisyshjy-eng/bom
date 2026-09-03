import Link from "next/link";
import { getAdminUser, isAdminEmail } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import DeleteUserButton from "./DeleteUserButton";

export default async function AdminUsersPage() {
  const admin = await getAdminUser();

  if (!admin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-neutral-600">이 페이지에 접근할 권한이 없습니다.</p>
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-neutral-800">
          ← 대시보드로
        </Link>
      </div>
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });

  const users = (data?.users ?? [])
    .slice()
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← 대시보드로
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">계정 관리</h1>
          <p className="text-sm text-neutral-500 mt-1">
            사내 직원의 로그인 계정을 생성/수정/삭제합니다.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 whitespace-nowrap"
        >
          + 신규 계정 생성
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">계정 목록을 불러오지 못했습니다: {error.message}</p>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">이메일</th>
              <th className="px-4 py-2 font-medium">이름</th>
              <th className="px-4 py-2 font-medium">가입일</th>
              <th className="px-4 py-2 font-medium">최근 로그인</th>
              <th className="px-4 py-2 font-medium">권한</th>
              <th className="px-4 py-2 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                  계정이 없습니다.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-2 font-medium text-neutral-900 whitespace-nowrap">{u.email}</td>
                <td className="px-4 py-2 text-neutral-600">
                  {(u.user_metadata as { name?: string } | null)?.name ?? "-"}
                </td>
                <td className="px-4 py-2 text-neutral-500 whitespace-nowrap">
                  {new Date(u.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-2 text-neutral-500 whitespace-nowrap">
                  {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("ko-KR") : "-"}
                </td>
                <td className="px-4 py-2">
                  {isAdminEmail(u.email) && (
                    <span className="inline-flex items-center rounded-full bg-neutral-900 text-white px-2 py-0.5 text-xs font-medium">
                      관리자
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/users/${u.id}/edit`}
                      className="text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
                    >
                      수정
                    </Link>
                    <DeleteUserButton userId={u.id} disabled={u.id === admin.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">
        관리자 권한은 서버 환경변수 ADMIN_EMAILS로 지정되며, 화면에서는 변경할 수 없습니다.
      </p>
    </div>
  );
}
