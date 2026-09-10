import { describe, it, expect } from "vitest";
import { emptyStore, type ApiClientStore } from "./apiclient-model";
import {
  addFolder,
  addRequest,
  deleteFolder,
  deleteRequest,
  duplicateRequest,
  folderChildren,
  folderPath,
  isDescendant,
  moveFolder,
  moveRequest,
  renameFolder,
  requestChildren,
  updateRequest,
} from "./apiclient-tree";

/** Monta: raiz → A → A1 ; raiz → B ; request r em A. */
function fixture() {
  let s: ApiClientStore = emptyStore();
  let a; let a1; let b;
  ({ store: s, folder: a } = addFolder(s, null, "A"));
  ({ store: s, folder: a1 } = addFolder(s, a.id, "A1"));
  ({ store: s, folder: b } = addFolder(s, null, "B"));
  const added = addRequest(s, a.id, { name: "r" });
  s = added.store;
  return { s, a, a1, b, r: added.request };
}

describe("apiclient-tree", () => {
  it("addFolder nests under parent / root", () => {
    const { s, a, a1 } = fixture();
    expect(a.parentId).toBeNull();
    expect(a1.parentId).toBe(a.id);
    expect(folderChildren(s.folders, null).map((f) => f.name)).toEqual(["A", "B"]);
    expect(folderChildren(s.folders, a.id).map((f) => f.name)).toEqual(["A1"]);
  });

  it("requestChildren filters + sorts", () => {
    let { s, a } = fixture();
    s = addRequest(s, a.id, { name: "aaa" }).store;
    expect(requestChildren(s.requests, a.id).map((r) => r.name)).toEqual(["aaa", "r"]);
    expect(requestChildren(s.requests, null)).toEqual([]);
  });

  it("folderPath is root→leaf; isDescendant semantics", () => {
    const { s, a, a1, b } = fixture();
    expect(folderPath(s.folders, a1.id).map((f) => f.name)).toEqual(["A", "A1"]);
    expect(isDescendant(s.folders, a.id, a1.id)).toBe(true);
    expect(isDescendant(s.folders, a.id, a.id)).toBe(false);
    expect(isDescendant(s.folders, b.id, a1.id)).toBe(false);
  });

  it("moveFolder into own descendant or self is a no-op", () => {
    const { s, a, a1 } = fixture();
    expect(moveFolder(s, a.id, a1.id)).toEqual(s);
    expect(moveFolder(s, a.id, a.id)).toEqual(s);
  });

  it("moveFolder to a valid parent updates only parentId", () => {
    const { s, a, b } = fixture();
    const next = moveFolder(s, a.id, b.id);
    expect(next.folders.find((f) => f.id === a.id)?.parentId).toBe(b.id);
  });

  it("moveRequest updates folderId", () => {
    const { s, b, r } = fixture();
    const next = moveRequest(s, r.id, b.id);
    expect(next.requests.find((x) => x.id === r.id)?.folderId).toBe(b.id);
  });

  it("deleteFolder cascade removes subfolders + their requests", () => {
    let { s, a, a1 } = fixture();
    s = addRequest(s, a1.id, { name: "deep" }).store;
    const next = deleteFolder(s, a.id);
    expect(next.folders).toHaveLength(1); // só B
    expect(next.requests).toHaveLength(0);
  });

  it("deleteFolder without cascade reparents children + requests", () => {
    const { s, a, a1, r } = fixture();
    const next = deleteFolder(s, a.id, { cascade: false });
    expect(next.folders.find((f) => f.id === a1.id)?.parentId).toBeNull();
    expect(next.requests.find((x) => x.id === r.id)?.folderId).toBeNull();
  });

  it("deleteRequest removes just that request", () => {
    const { s, r } = fixture();
    expect(deleteRequest(s, r.id).requests).toHaveLength(0);
  });

  it("duplicateRequest → new id, same folder, suffixed name, deep copy", () => {
    const { s, a, r } = fixture();
    const { store, request } = duplicateRequest(s, r.id);
    expect(request.id).not.toBe(r.id);
    expect(request.folderId).toBe(a.id);
    expect(request.name).toBe("r (cópia)");
    expect(store.requests).toHaveLength(2);
    request.headers.push({ id: "z", key: "x", value: "y", enabled: true });
    expect(s.requests.find((x) => x.id === r.id)?.headers).toHaveLength(1);
  });

  it("updateRequest bumps updatedAt, keeps createdAt and id", async () => {
    const { s, r } = fixture();
    await new Promise((res) => setTimeout(res, 2));
    const next = updateRequest(s, r.id, { url: "https://x", id: "hack" } as never);
    const got = next.requests.find((x) => x.id === r.id)!;
    expect(got.url).toBe("https://x");
    expect(got.id).toBe(r.id);
    expect(got.createdAt).toBe(r.createdAt);
    expect(got.updatedAt).toBeGreaterThanOrEqual(r.updatedAt);
  });

  it("does not mutate the input store", () => {
    const { s } = fixture();
    const frozen = Object.freeze(s);
    expect(() => renameFolder(frozen, s.folders[0].id, "X")).not.toThrow();
  });
});
