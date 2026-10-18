import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export const KAKAO_LOGIN_URL = `${process.env.BACKEND_PUBLIC_URL ?? "http://localhost:8080"}/oauth2/authorization/kakao`;

export type Gender = "FEMALE" | "MALE" | "UNDISCLOSED";

export type Me = {
  id: number;
  nickname: string | null;
  gender: Gender | null;
  onboarded: boolean;
  admin: boolean;
};

export async function backendFetch(path: string, init: RequestInit = {}) {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, cookie: cookieHeader },
  });
}

export async function getMe(): Promise<Me | null> {
  const res = await backendFetch("/api/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`내 정보 조회 실패: ${res.status}`);
  return res.json();
}
