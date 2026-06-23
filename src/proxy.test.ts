import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import * as jwt from "next-auth/jwt";
import { appConfig } from "@/lib/config";
import { proxy, config as proxyConfig } from "@/proxy";

beforeEach(() => {
  vi.restoreAllMocks();
});

function buildRequest(url: string, host: string | null): NextRequest {
  const headers = new Headers();
  if (host !== null) headers.set("host", host);
  return new NextRequest(url, { headers });
}

describe("proxy — app-host traffic", () => {
  it("redirects unauthenticated requests to /login", async () => {
    vi.spyOn(jwt, "getToken").mockResolvedValueOnce(null);

    const request = buildRequest(`http://${appConfig.app.host}/dashboard`, appConfig.app.host);
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`http://${appConfig.app.host}/login`);
  });

  it("passes through authenticated requests", async () => {
    vi.spyOn(jwt, "getToken").mockResolvedValueOnce({
      sub: "user-1",
      id: "user-1",
      domain: "example.com",
      role: "user",
      accountId: "account-1"
    });

    const request = buildRequest(`http://${appConfig.app.host}/dashboard`, appConfig.app.host);
    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("proxy — matcher exclusions", () => {
  // Pull out the single matcher pattern and reconstruct a regex anchored on
  // pathname. Mirrors Next's runtime semantics closely enough to verify the
  // intent: which paths invoke the proxy, and which do not.
  const pattern = (proxyConfig.matcher as string[])[0];
  const matcherRegex = new RegExp(`^${pattern}$`);

  function matches(path: string): boolean {
    return matcherRegex.test(path);
  }

  it("excludes existing public app routes", () => {
    expect(matches("/login")).toBe(false);
    expect(matches("/signup")).toBe(false);
    expect(matches("/claim/123")).toBe(false);
    expect(matches("/start")).toBe(false);
    expect(matches("/api/auth/session")).toBe(false);
    expect(matches("/_next/static/chunks/abc.js")).toBe(false);
    expect(matches("/favicon.ico")).toBe(false);
  });

  it("does not over-exclude paths that merely start with the literal 'link'", () => {
    // `/links` would be a legitimate app route; the `link/` (with slash)
    // exclusion guards against the prefix collision with `/links`.
    expect(matches("/links")).toBe(true);
    expect(matches("/linker")).toBe(true);
  });

  it("matches arbitrary slugs and dashboard paths so the proxy runs on them", () => {
    expect(matches("/some-slug")).toBe(true);
    expect(matches("/accounts/123/links")).toBe(true);
    expect(matches("/dashboard")).toBe(true);
  });
});
