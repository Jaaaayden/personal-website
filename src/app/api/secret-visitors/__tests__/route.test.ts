import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The visitor cache and rate-limit map live at module scope, so each test
 *  imports a fresh copy; a fresh import also stands in for a server restart. */
async function loadRoute() {
  vi.resetModules();
  return await import("../route");
}

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function post(body: unknown, ip = "203.0.113.7"): Request {
  return new Request("http://localhost/api/secret-visitors", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "secret-visitors-"));
  vi.stubEnv("DATA_DIR", dataDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("secret visitors route", () => {
  it("numbers new visitors in arrival order", async () => {
    const { POST } = await loadRoute();
    expect(await (await POST(post({ id: ID_A }))).json()).toEqual({ number: 1, total: 1 });
    expect(await (await POST(post({ id: ID_B }))).json()).toEqual({ number: 2, total: 2 });
  });

  it("keeps a returning visitor's number without growing the total", async () => {
    const { POST } = await loadRoute();
    await POST(post({ id: ID_A }));
    await POST(post({ id: ID_B }));
    expect(await (await POST(post({ id: ID_A }))).json()).toEqual({ number: 1, total: 2 });
  });

  it("treats IDs case-insensitively", async () => {
    const { POST } = await loadRoute();
    const mixed = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    await POST(post({ id: mixed.toUpperCase() }));
    const res = await POST(post({ id: mixed }));
    expect(await res.json()).toEqual({ number: 1, total: 1 });
  });

  it("does not hand out the same number to simultaneous first visits", async () => {
    const { POST } = await loadRoute();
    const results = await Promise.all(
      [uuid(1), uuid(2), uuid(3)].map(async (id, i) =>
        (await POST(post({ id }, `198.51.100.${i}`))).json()
      )
    );
    expect(results.map((r) => r.number).sort()).toEqual([1, 2, 3]);
  });

  it("rejects malformed bodies and IDs", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post("not json"))).status).toBe(400);
    expect((await POST(post("null"))).status).toBe(400);
    expect((await POST(post({}))).status).toBe(400);
    expect((await POST(post({ id: "../../etc/passwd" }))).status).toBe(400);
  });

  it("rejects non-JSON content types so other sites can't post cross-origin", async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/secret-visitors", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ id: ID_A }),
      })
    );
    expect(res.status).toBe(415);
  });

  it("limits new IDs per IP but never blocks returning visitors", async () => {
    const { POST } = await loadRoute();
    for (let i = 1; i <= 3; i++) {
      expect((await POST(post({ id: uuid(i) }))).status).toBe(200);
    }
    expect((await POST(post({ id: uuid(4) }))).status).toBe(429);
    expect((await POST(post({ id: uuid(1) }))).status).toBe(200);
    expect((await POST(post({ id: uuid(4) }, "198.51.100.9"))).status).toBe(200);
  });

  it("persists the count across restarts", async () => {
    await (await loadRoute()).POST(post({ id: ID_A }));
    const { POST } = await loadRoute();
    expect(await (await POST(post({ id: ID_B }))).json()).toEqual({ number: 2, total: 2 });
  });
});
