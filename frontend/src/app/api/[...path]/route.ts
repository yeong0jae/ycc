const API_URL = process.env.API_URL ?? "http://localhost:8080";
const FORWARDED_REQUEST_HEADERS = ["cookie", "content-type", "range", "accept"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"];

async function proxy(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(request.url);
  const headers = new Headers();
  FORWARDED_REQUEST_HEADERS.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(`${API_URL}/api/${path.map(encodeURIComponent).join("/")}${url.search}`, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    duplex: hasBody ? "half" : undefined,
  } as RequestInit);
  const responseHeaders = new Headers();
  FORWARDED_RESPONSE_HEADERS.forEach((name) => {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  });
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
