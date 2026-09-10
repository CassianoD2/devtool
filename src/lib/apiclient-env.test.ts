import { describe, it, expect } from "vitest";
import { emptyRequest, emptyStore, type ApiClientStore } from "./apiclient-model";
import {
  activeVars,
  addEnvironment,
  deleteEnvironment,
  missingVarNames,
  resolveSpec,
  setActiveEnv,
  setEnvVars,
  setGlobals,
} from "./apiclient-env";

function storeWithEnv(): { s: ApiClientStore; envId: string } {
  let s = emptyStore();
  s = setGlobals(s, [
    { id: "g1", key: "base", value: "https://global", enabled: true },
    { id: "g2", key: "shared", value: "G", enabled: true },
  ]);
  const added = addEnvironment(s, "dev");
  s = setEnvVars(added.store, added.env.id, [
    { id: "e1", key: "base", value: "https://dev", enabled: true },
    { id: "e2", key: "only", value: "D", enabled: true },
    { id: "e3", key: "shared", value: "E", enabled: false },
  ]);
  s = setActiveEnv(s, added.env.id);
  return { s, envId: added.env.id };
}

describe("apiclient-env", () => {
  it("env vars win over globals on the same key", () => {
    const { s } = storeWithEnv();
    const merged = activeVars(s);
    // resolveVars usa o primeiro match habilitado → env vem primeiro
    expect(merged.find((v) => v.key === "base")?.value).toBe("https://dev");
  });

  it("disabled env var falls back to the global", () => {
    const { s } = storeWithEnv();
    const spec = emptyRequest();
    spec.url = "{{shared}}";
    expect(resolveSpec(spec, s).url).toBe("G");
  });

  it("key disabled everywhere is absent from the merged list", () => {
    let s = emptyStore();
    s = setGlobals(s, [{ id: "g", key: "x", value: "1", enabled: false }]);
    expect(activeVars(s).some((v) => v.key === "x")).toBe(false);
  });

  it("secret rows still resolve", () => {
    let s = emptyStore();
    s = setGlobals(s, [{ id: "g", key: "tok", value: "sEcReT", enabled: true, secret: true }]);
    const spec = emptyRequest();
    spec.url = "h://x?t={{tok}}";
    expect(resolveSpec(spec, s).url).toBe("h://x?t=sEcReT");
  });

  it("resolveSpec folds request options onto the ParsedRequest", () => {
    const { s } = storeWithEnv();
    const spec = emptyRequest();
    spec.url = "https://x";
    spec.options = { timeoutMs: 1234, followRedirects: false, insecure: true };
    const out = resolveSpec(spec, s);
    expect(out.timeoutMs).toBe(1234);
    expect(out.followRedirects).toBe(false);
    expect(out.insecure).toBe(true);
  });

  it("missingVarNames reports uncovered tokens, dedupes, ignores disabled defs", () => {
    let s = emptyStore();
    s = setGlobals(s, [{ id: "g", key: "known", value: "1", enabled: true }]);
    const spec = emptyRequest();
    spec.url = "{{known}}/{{gone}}/{{gone}}";
    spec.headers = [{ id: "h", key: "X-{{alsogone}}", value: "", enabled: true }];
    expect(missingVarNames(spec, s).sort()).toEqual(["alsogone", "gone"]);
  });

  it("setActiveEnv ignores an unknown id", () => {
    const s = setActiveEnv(emptyStore(), "nope");
    expect(s.activeEnvId).toBeNull();
  });

  it("deleteEnvironment of the active env clears activeEnvId", () => {
    const { s, envId } = storeWithEnv();
    expect(s.activeEnvId).toBe(envId);
    const next = deleteEnvironment(s, envId);
    expect(next.activeEnvId).toBeNull();
    expect(next.environments).toHaveLength(0);
  });
});
