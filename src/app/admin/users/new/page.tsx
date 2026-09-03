import Link from "next/link";
import { getAdminUser } from "@/lib/admin-auth";
import NewUserForm from "./NewUserForm";

export default async function NewUserPage() {
  const admin = await getAdminUser();

  if (!admin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-neutral-600">
        이 페이지에 접근할 권한이 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4"
      >
        ← 계정 목록으로
      </Link>
      <h1 className="text-xl font-semibold text-neutral-900 mb-6">신규 계정 생성</h1>
      <NewUserForm />
    </div>
  );
}
