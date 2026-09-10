import { describe, it, expect } from "vitest";
import {
  exportApiClient,
  extensionForContentType,
  filterBodyLines,
  parseApiClientBundle,
} from "./apiclient-backup";
import { emptyRequest, emptyStore, type ApiClientStore } from "./apiclient-model";

function populated(): ApiClientStore {
  const s = emptyStore();
  const now = 1000;
  s.folders = [{ id: "f1", name: "F", parentId: null, createdAt: now, updatedAt: now }];
  s.requests = [{ ...emptyRequest("f1"), id: "r1", name: "R", url: "https://x" }];
  s.environments = [{ id: "e1", name: "dev", vars: [{ id: "v", key: "k", value: "1", enabled: true }] }];
  s.globals = [{ id: "g", key: "base", value: "b", enabled: true }];
  s.activeEnvId = "e1";
  return s;
}

describe("apiclient-backup", () => {
  it("round-trips export → parse", () => {
    const s = populated();
    const back = parseApiClientBundle(exportApiClient(s));
    expect(back).toEqual(s);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseApiClientBundle("{bad")).toThrow(/JSON/i);
  });

  it("rejects a foreign app / kind / version", () => {
    expect(() => parseApiClientBundle(JSON.stringify({ app: "outro", kind: "apiclient", version: 1, store: {} }))).toThrow(/DevTool/);
    expect(() => parseApiClientBundle(JSON.stringify({ app: "devtool", kind: "personal", version: 1, store: {} }))).toThrow(/API Client/);
    expect(() => parseApiClientBundle(JSON.stringify({ app: "devtool", kind: "apiclient", version: 999, store: {} }))).toThrow(/vers/i);
  });

  it("coerces missing arrays to [] and filters malformed items", () => {
    const json = JSON.stringify({
      app: "devtool",
      kind: "apiclient",
      version: 1,
      store: { folders: [{ id: "ok", name: "n", parentId: null }, { name: "no-id" }], requests: "nope" },
    });
    const out = parseApiClientBundle(json);
    expect(out.folders).toHaveLength(1);
    expect(out.requests).toEqual([]);
    expect(out.environments).toEqual([]);
  });

  it("nulls a dangling folderId and a dangling activeEnvId", () => {
    const json = JSON.stringify({
      app: "devtool",
      kind: "apiclient",
      version: 1,
      store: {
        folders: [],
        requests: [{ ...emptyRequest("ghost"), id: "r1" }],
        environments: [],
        activeEnvId: "ghost-env",
      },
    });
    const out = parseApiClientBundle(json);
    expect(out.requests[0].folderId).toBeNull();
    expect(out.activeEnvId).toBeNull();
  });

  it("extensionForContentType maps common types", () => {
    expect(extensionForContentType("application/json; charset=utf-8")).toBe("json");
    expect(extensionForContentType("text/html")).toBe("html");
    expect(extensionForContentType("application/xml")).toBe("xml");
    expect(extensionForContentType("text/csv")).toBe("csv");
    expect(extensionForContentType("")).toBe("txt");
  });

  it("filterBodyLines filters and counts; empty query passes through", () => {
    const body = "alpha\nBETA\ngamma beta\n";
    expect(filterBodyLines(body, "")).toEqual({ text: body, matches: 0 });
    const r = filterBodyLines(body, "beta");
    expect(r.matches).toBe(2);
    expect(r.text).toBe("BETA\ngamma beta");
  });
});
