export function GET(request: Request) {
  const failed = new URL(request.url).searchParams.has("error");
  return new Response(null, { status: 307, headers: { location: failed ? "/me?error" : "/me" } });
}
