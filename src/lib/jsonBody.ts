/** Parses a JSON-object request body, or returns the error response to send.
 *  Requiring application/json forces a CORS preflight (which fails, since we
 *  send no CORS headers), so other sites can't make their visitors' browsers
 *  post here — a text/plain body would skip the preflight entirely. */
export async function readJsonObject(
  request: Request
): Promise<Record<string, unknown> | Response> {
  const type = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!type.startsWith("application/json")) {
    return Response.json({ error: "invalid request" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  // Valid JSON can still be null, a number, or an array.
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  return body as Record<string, unknown>;
}
