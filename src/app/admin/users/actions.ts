"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UserFormState {
  error: string | null;
}

export async function createUserAdmin(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await getAdminUser();
  if (!admin) return { error: "관리자 권한이 필요합니다." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email) return { error: "이메일을 입력하세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  if (error) return { error: `계정 생성에 실패했습니다: ${error.message}` };

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAdmin(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await getAdminUser();
  if (!admin) return { error: "관리자 권한이 필요합니다." };

  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id) return { error: "잘못된 요청입니다." };
  if (!email) return { error: "이메일을 입력하세요." };
  if (password && password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    ...(password ? { password } : {}),
    user_metadata: { name: name || undefined },
  });

  if (error) return { error: `계정 수정에 실패했습니다: ${error.message}` };

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUserAdmin(userId: string): Promise<{ error: string | null }> {
  const admin = await getAdminUser();
  if (!admin) return { error: "관리자 권한이 필요합니다." };
  if (admin.id === userId) return { error: "본인 계정은 삭제할 수 없습니다." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return { error: `계정 삭제에 실패했습니다: ${error.message}` };

  revalidatePath("/admin/users");
  return { error: null };
}
