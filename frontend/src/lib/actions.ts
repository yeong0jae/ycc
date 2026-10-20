"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch } from "./auth";

export async function logout() {
  await backendFetch("/api/logout", { method: "POST" });
  (await cookies()).delete("SESSION");
  redirect("/me");
}
