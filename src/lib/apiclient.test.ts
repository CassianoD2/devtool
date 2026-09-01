import { describe, it, expect } from "vitest";
import {
  resolveVars,
  listVarNames,
  getQueryParams,
  setQueryParams,
  toSendable,
  specFromParsed,
  emptyRequest,
  type KV,
} from "./apiclient";
import { parseCurl } from "./curl";

const vars: KV[] = [
  { id: "1", key: "base", value: "https://api.test", enabled: true },
  { id: "2", key: "tok", value: "abc123", enabled: true },
  { id: "3", key: "off", value: "nope", enabled: false },
];

describe("resolveVars", () => {
  it("substitutes enabled vars and leaves the rest", () => {
    expect(resolveVars("{{base}}/x?t={{tok}}&z={{off}}&w={{missing}}", vars)).toBe(
      "https://api.test/x?t=abc123&z={{off}}&w={{missing}}",
    );
  });
  it("lists referenced names", () => {
    expect(listVarNames("{{a}}/{{b}}-{{a}}")).toEqual(["a", "b", "a"]);
  });
});

describe("query params <-> url", () => {
  it("reads params", () => {
    expect(getQueryParams("https://x/y?a=1&b=hello%20world&c")).toEqual([
      { key: "a", value: "1" },
      { key: "b", value: "hello world" },
      { key: "c", value: "" },
    ]);
  });
  it("writes params, dropping empty keys and preserving the hash", () => {
    expect(
      setQueryParams("https://x/y?old=1#frag", [
        { key: "a", value: "1" },
        { key: "", value: "skip" },
        { key: "b", value: "two words" },
      ]),
    ).toBe("https://x/y?a=1&b=two%20words#frag");
  });
  it("does not percent-encode values that contain a variable token", () => {
    expect(setQueryParams("https://x", [{ key: "u", value: "{{base}}" }])).toBe(
      "https://x?u={{base}}",
    );
  });
});

describe("toSendable", () => {
  it("resolves vars, applies bearer auth and JSON content-type", () => {
    const spec = emptyRequest();
    spec.method = "POST";
    spec.url = "{{base}}/users";
    spec.auth = { ...spec.auth, type: "bearer", token: "{{tok}}" };
    spec.body = { mode: "json", text: '{"a":1}', form: [] };

    const out = toSendable(spec, vars);
    expect(out.url).toBe("https://api.test/users");
    expect(out.method).toBe("POST");
    expect(out.headers).toContainEqual(["Authorization", "Bearer abc123"]);
    expect(out.headers).toContainEqual(["Content-Type", "application/json"]);
    expect(out.body).toBe('{"a":1}');
  });

  it("puts an API key in the query string when configured", () => {
    const spec = emptyRequest();
    spec.url = "https://x/y";
    spec.auth = { ...spec.auth, type: "apikey", apikeyName: "k", apikeyValue: "v", apikeyIn: "query" };
    expect(toSendable(spec, []).url).toBe("https://x/y?k=v");
  });

  it("builds a urlencoded body from form rows", () => {
    const spec = emptyRequest();
    spec.url = "https://x";
    spec.body = {
      mode: "form",
      text: "",
      form: [
        { id: "a", key: "name", value: "fulano de tal", enabled: true },
        { id: "b", key: "skip", value: "x", enabled: false },
      ],
    };
    const out = toSendable(spec, []);
    expect(out.body).toBe("name=fulano%20de%20tal");
    expect(out.headers).toContainEqual(["Content-Type", "application/x-www-form-urlencoded"]);
  });
});

describe("specFromParsed", () => {
  it("maps a parsed curl command into an editable spec", () => {
    const spec = specFromParsed(
      parseCurl(`curl -X PUT https://x/1 -H 'Accept: application/json' -d '{"n":1}'`),
    );
    expect(spec.method).toBe("PUT");
    expect(spec.url).toBe("https://x/1");
    expect(spec.headers.find((h) => h.key === "Accept")?.value).toBe("application/json");
    expect(spec.body.mode).toBe("json");
    expect(spec.body.text).toBe('{"n":1}');
  });
});
