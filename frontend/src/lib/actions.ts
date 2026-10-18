"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch, type Gender } from "./auth";

export type ProfileState = { error: string | null };

export async function saveProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const res = await backendFetch("/api/me", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname: form.get("nickname"), gender: form.get("gender") as Gender }),
  });
  if (res.status === 400 || res.status === 409) {
    const body = await res.json().catch(() => null);
    return { error: body?.message || "닉네임을 다시 확인해 주세요." };
  }
  if (res.status === 401) redirect("/login");
  if (!res.ok) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  redirect(form.get("next") === "/me" ? "/me" : "/");
}

export async function logout() {
  await backendFetch("/api/logout", { method: "POST" });
  (await cookies()).delete("SESSION");
  redirect("/");
}
