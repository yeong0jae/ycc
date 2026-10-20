const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const res = await fetch(`${API_URL}/api/site/${encodeURIComponent(code)}`, {
    method: "POST",
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  if (!res.ok) return new Response(null, { status: 303, headers: { location: "/" } });
  const { showId }: { showId: number } = await res.json();
  const headers = new Headers({ location: `/shows/${showId}/notices?from=qr`, "cache-control": "no-store" });
  res.headers.getSetCookie().forEach((cookie) => headers.append("set-cookie", cookie));
  return new Response(null, { status: 303, headers });
}
