import { readJsonObject } from "@/lib/jsonBody";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { isKnownVisitor, registerVisitor } from "@/lib/secretVisitors";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 3 new visitor IDs per IP per hour, so a script can't pad the count.
 *  Returning visitors skip this check entirely. */
const isRateLimited = createRateLimiter(60 * 60_000, 3);

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;

  if (typeof body.id !== "string" || !UUID_RE.test(body.id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  const id = body.id.toLowerCase();

  try {
    if (!(await isKnownVisitor(id)) && isRateLimited(clientIp(request))) {
      return Response.json({ error: "slow down" }, { status: 429 });
    }
    return Response.json(await registerVisitor(id));
  } catch (err) {
    console.error("secret visitor count failed:", err);
    return Response.json({ error: "counter unavailable" }, { status: 503 });
  }
}
