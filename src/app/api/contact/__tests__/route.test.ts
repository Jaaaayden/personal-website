import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The rate-limit map lives at module scope, so each test imports a fresh
 *  copy of the route to start from a clean slate. */
async function loadRoute() {
  vi.resetModules();
  return await import("../route");
}

const validBody = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "hello",
  message: "nice site!",
};

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", mockFetch);
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("CONTACT_TO", "owner@example.com");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("contact route validation", () => {
  it("rejects malformed JSON", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
  });

  it("rejects a missing field", async () => {
    const { POST } = await loadRoute();
    // JSON.stringify drops undefined keys, so `message` is truly absent.
    const res = await POST(post({ ...validBody, message: undefined }));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects an over-length field", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ ...validBody, name: "x".repeat(101) }));
    expect(res.status).toBe(400);
  });

  it("rejects a bad email", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ ...validBody, email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("silently accepts honeypot submissions without sending", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ ...validBody, website: "spam.example" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("contact route sending", () => {
  it("sends via Resend and reports ok", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.to).toEqual(["owner@example.com"]);
    expect(payload.reply_to).toBe(validBody.email);
    expect(payload.subject).toContain(validBody.subject);
    expect(payload.text).toContain(validBody.message);
  });

  it("returns 503 when the mailbox env is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { POST } = await loadRoute();
    const res = await POST(post(validBody));
    expect(res.status).toBe(503);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("hides Resend failures behind a generic 502", async () => {
    mockFetch.mockResolvedValue(new Response("api key leaked!", { status: 401 }));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { POST } = await loadRoute();
    const res = await POST(post(validBody));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("leaked");
    consoleError.mockRestore();
  });
});

describe("contact route rate limiting", () => {
  it("returns 429 on the sixth send from one IP", async () => {
    const { POST } = await loadRoute();
    const headers = { "x-forwarded-for": "203.0.113.7" };
    for (let i = 0; i < 5; i++) {
      const res = await POST(post(validBody, headers));
      expect(res.status).toBe(200);
    }
    const res = await POST(post(validBody, headers));
    expect(res.status).toBe(429);
  });

  it("cannot be bypassed by prepending spoofed X-Forwarded-For hops", async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) {
      // Attacker varies the client-supplied hops; the proxy-appended last
      // hop (the real IP) stays the same.
      const headers = { "x-forwarded-for": `10.0.0.${i}, 203.0.113.7` };
      const res = await POST(post(validBody, headers));
      expect(res.status).toBe(200);
    }
    const res = await POST(
      post(validBody, { "x-forwarded-for": "10.0.0.99, 203.0.113.7" })
    );
    expect(res.status).toBe(429);
  });

  it("limits per IP, not globally", async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) {
      await POST(post(validBody, { "x-forwarded-for": "203.0.113.7" }));
    }
    const res = await POST(
      post(validBody, { "x-forwarded-for": "198.51.100.9" })
    );
    expect(res.status).toBe(200);
  });
});
