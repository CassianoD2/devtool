import { describe, it, expect } from "vitest";
import {
  LEGACY_KEYS,
  STORE_KEY,
  isApiClientStore,
  migrateLegacy,
  normalizeRequest,
  readLegacy,
  runMigration,
} from "./apiclient-migrate";
import { emptyStore } from "./apiclient-model";

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

function seedLegacy(ls: Storage) {
  ls.setItem(
    "apiclient:saved",
    JSON.stringify([
      { id: "s1", name: "A", method: "POST", url: "https://a", headers: [{ id: "h", key: "X", value: "1", enabled: true }], body: { mode: "json", text: "{}", form: [] } },
    ]),
  );
  ls.setItem("apiclient:vars", JSON.stringify([{ id: "v1", key: "base", value: "https://b", enabled: true }]));
  ls.setItem(
    "apiclient:history",
    JSON.stringify([{ id: "hh", method: "GET", url: "https://h", status: 200, at: 111 }]),
  );
  ls.setItem("apiclient:current", JSON.stringify({ id: "cur", name: "", method: "GET", url: "https://draft" }));
}

describe("apiclient-migrate", () => {
  it("migrateLegacy maps saved → root requests with new fields", () => {
    const store = migrateLegacy({
      saved: [{ id: "s1", name: "A", method: "PUT", url: "https://a", body: { mode: "text", text: "hi" } }],
    });
    expect(store.requests).toHaveLength(1);
    const r = store.requests[0];
    expect(r.folderId).toBeNull();
    expect(r.options).toEqual({ timeoutMs: null, followRedirects: true, insecure: false });
    expect(Array.isArray(r.body.multipart)).toBe(true);
    expect(r.createdAt).toBeTypeOf("number");
  });

  it("legacy vars → globals; history → HistoryEntry[]; current → extra request", () => {
    const store = migrateLegacy({
      saved: [],
      vars: [{ id: "v", key: "k", value: "1", enabled: true }],
      history: [{ id: "h", method: "GET", url: "https://x", status: 404, at: 5 }],
      current: { id: "c", name: "", method: "GET", url: "https://draft" },
    });
    expect(store.globals.map((v) => v.key)).toEqual(["k"]);
    expect(store.history[0].request.url).toBe("https://x");
    expect(store.history[0].response).toEqual({ status: 404, statusText: "", timeMs: 0, size: 0, contentType: "" });
    expect(store.requests.find((r) => r.url === "https://draft")?.name).toBe("Rascunho");
  });

  it("runMigration is idempotent and clears legacy keys once", () => {
    const ls = new MemStorage();
    seedLegacy(ls);
    const first = runMigration(ls)!;
    expect(first.requests.length).toBeGreaterThan(0);
    for (const k of LEGACY_KEYS) expect(ls.getItem(k)).toBeNull();
    expect(ls.getItem(STORE_KEY)).not.toBeNull();

    const second = runMigration(ls)!;
    expect(second).toEqual(first);
  });

  it("runMigration with an existing store does not touch legacy keys", () => {
    const ls = new MemStorage();
    const custom = { ...emptyStore(), activeEnvId: null, requests: [] };
    ls.setItem(STORE_KEY, JSON.stringify(custom));
    ls.setItem("apiclient:saved", JSON.stringify([{ id: "x" }]));
    const got = runMigration(ls)!;
    expect(got).toEqual(custom);
    expect(ls.getItem("apiclient:saved")).not.toBeNull();
  });

  it("absent legacy keys → emptyStore()", () => {
    const ls = new MemStorage();
    const got = runMigration(ls)!;
    expect(got).toEqual(emptyStore());
  });

  it("malformed legacy JSON is treated as absent (no throw)", () => {
    const ls = new MemStorage();
    ls.setItem("apiclient:saved", "{bad");
    expect(() => runMigration(ls)).not.toThrow();
    expect(readLegacy(ls)).toBeNull();
  });

  it("normalizeRequest derives params from url when absent (legacy data)", () => {
    const r = normalizeRequest({ id: "s1", method: "GET", url: "https://a/b?x=1&y=2" });
    expect(r.params.map((p) => [p.key, p.value])).toEqual([
      ["x", "1"],
      ["y", "2"],
    ]);
  });

  it("normalizeRequest preserves an explicit params array", () => {
    const r = normalizeRequest({
      id: "s1",
      method: "GET",
      url: "https://a/b",
      params: [{ id: "p1", key: "unused", value: "", enabled: false }],
    });
    expect(r.params).toEqual([{ id: "p1", key: "unused", value: "", enabled: false }]);
  });

  it("isApiClientStore rejects junk", () => {
    expect(isApiClientStore({})).toBe(false);
    expect(isApiClientStore({ ...emptyStore(), folders: undefined })).toBe(false);
    expect(isApiClientStore(emptyStore())).toBe(true);
  });
});
