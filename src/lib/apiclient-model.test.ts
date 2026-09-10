import { describe, it, expect } from "vitest";
import {
  APICLIENT_STORE_VERSION,
  emptyEnvironment,
  emptyFolder,
  emptyHistoryEntry,
  emptyRequest,
  emptyStore,
  uid,
} from "./apiclient-model";

describe("apiclient-model factories", () => {
  it("emptyStore has every field and correct version", () => {
    const s = emptyStore();
    expect(s.version).toBe(APICLIENT_STORE_VERSION);
    expect(s.folders).toEqual([]);
    expect(s.requests).toEqual([]);
    expect(s.environments).toEqual([]);
    expect(s.globals).toEqual([]);
    expect(s.activeEnvId).toBeNull();
    expect(s.history).toEqual([]);
  });

  it("emptyRequest has defaults for options/body/timestamps", () => {
    const r = emptyRequest();
    expect(r.folderId).toBeNull();
    expect(r.method).toBe("GET");
    expect(r.options).toEqual({ timeoutMs: null, followRedirects: true, insecure: false });
    expect(r.body.mode).toBe("none");
    expect(Array.isArray(r.body.multipart)).toBe(true);
    expect(r.createdAt).toBe(r.updatedAt);
  });

  it("emptyRequest honours a folderId argument", () => {
    expect(emptyRequest("f1").folderId).toBe("f1");
  });

  it("emptyFolder / emptyEnvironment shape", () => {
    expect(emptyFolder("p1").parentId).toBe("p1");
    expect(emptyFolder().parentId).toBeNull();
    expect(emptyEnvironment("dev").name).toBe("dev");
    expect(emptyEnvironment("dev").vars.length).toBe(1);
  });

  it("emptyHistoryEntry deep-clones the request", () => {
    const req = emptyRequest();
    const entry = emptyHistoryEntry(req, null);
    expect(entry.request).not.toBe(req);
    expect(entry.request.id).toBe(req.id);
    entry.request.url = "changed";
    expect(req.url).toBe("");
  });

  it("uid is unique across 1000 calls", () => {
    const set = new Set(Array.from({ length: 1000 }, () => uid()));
    expect(set.size).toBe(1000);
  });
});
