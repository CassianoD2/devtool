import { describe, it, expect } from "vitest";
import {
  tokenizeCommand,
  parseCurl,
  toFetch,
  toHttpie,
  toWget,
  toPowerShell,
} from "./curl";

describe("tokenizeCommand", () => {
  it("respects quotes and line continuations", () => {
    expect(
      tokenizeCommand("curl 'http://x/y' \\\n  -H \"A: b c\" -d '{\"k\":1}'"),
    ).toEqual(["curl", "http://x/y", "-H", "A: b c", "-d", '{"k":1}']);
  });
});

describe("parseCurl", () => {
  it("parses a POST with JSON body", () => {
    const r = parseCurl(
      `curl -X POST 'https://api.test/users?admin=1' -H 'Content-Type: application/json' -d '{"a":1}'`,
    );
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://api.test/users?admin=1");
    expect(r.headers).toContainEqual(["Content-Type", "application/json"]);
    expect(r.body).toBe('{"a":1}');
  });

  it("infers POST when data is present without -X", () => {
    expect(parseCurl("curl https://x -d foo=bar").method).toBe("POST");
  });

  it("defaults to GET", () => {
    expect(parseCurl("curl https://x").method).toBe("GET");
  });

  it("moves data into the query string with -G", () => {
    const r = parseCurl("curl -G https://x -d a=1 -d b=2");
    expect(r.method).toBe("GET");
    expect(r.url).toBe("https://x?a=1&b=2");
    expect(r.body).toBeUndefined();
  });

  it("handles -H with --header= syntax and repeated data", () => {
    const r = parseCurl("curl https://x --header='X-A: 1' -d a=1 --data-raw b=2");
    expect(r.headers).toContainEqual(["X-A", "1"]);
    expect(r.body).toBe("a=1&b=2");
  });

  it("captures basic auth and -k", () => {
    const r = parseCurl("curl -u joe:secret -k https://x");
    expect(r.auth).toEqual({ user: "joe", pass: "secret" });
    expect(r.insecure).toBe(true);
  });

  it("adds a urlencoded content-type for raw data when absent", () => {
    const r = parseCurl("curl https://x -d name=fulano");
    expect(r.headers).toContainEqual([
      "Content-Type",
      "application/x-www-form-urlencoded",
    ]);
  });

  it("warns about unknown flags but still parses", () => {
    const r = parseCurl("curl --frobnicate https://x");
    expect(r.url).toBe("https://x");
    expect(r.warnings.join(" ")).toMatch(/frobnicate/);
  });

  it("throws when there is no URL", () => {
    expect(() => parseCurl("curl -X GET")).toThrow(/URL/i);
  });
});

describe("exporters", () => {
  const req = parseCurl(
    `curl -X POST 'https://api.test/p' -H 'Accept: application/json' -d '{"a":1}'`,
  );

  it("fetch", () => {
    const out = toFetch(req);
    expect(out).toContain('fetch("https://api.test/p"');
    expect(out).toContain('"method": "POST"');
    expect(out).toContain('"Accept": "application/json"');
  });
  it("httpie", () => {
    expect(toHttpie(req)).toContain("http POST 'https://api.test/p'");
  });
  it("wget", () => {
    expect(toWget(req)).toContain("--method=POST");
  });
  it("powershell", () => {
    expect(toPowerShell(req)).toContain("Invoke-RestMethod -Method POST");
  });
});
