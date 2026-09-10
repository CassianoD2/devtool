import { describe, it, expect } from "vitest";
import { importInsomniaV4, importOpenApi, importPostmanV2_1 } from "./apiclient-postman";

const collection = {
  info: { name: "Minha API", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  variable: [{ key: "base_url", value: "https://api.exemplo.com" }],
  item: [
    {
      name: "Auth",
      item: [
        {
          name: "Login",
          request: {
            method: "POST",
            header: [{ key: "Accept", value: "application/json" }],
            url: { raw: "{{base_url}}/login" },
            body: { mode: "raw", raw: '{"u":1}', options: { raw: { language: "json" } } },
          },
        },
      ],
    },
    {
      name: "Listar",
      request: {
        method: "GET",
        url: { raw: "{{base_url}}/items" },
        auth: { type: "bearer", bearer: [{ key: "token", value: "{{tok}}" }] },
      },
    },
    {
      name: "Form",
      request: {
        method: "POST",
        url: "https://x/form",
        body: {
          mode: "formdata",
          formdata: [
            { key: "a", value: "1", type: "text" },
            { key: "file", src: "/tmp/x", type: "file" },
          ],
        },
      },
    },
    {
      name: "UrlEncoded",
      request: {
        method: "POST",
        url: "https://x/ue",
        body: { mode: "urlencoded", urlencoded: [{ key: "k", value: "v" }] },
      },
    },
  ],
};

describe("importPostmanV2_1", () => {
  const store = importPostmanV2_1(collection);

  it("builds nested folders + requests with the right parent/folder ids", () => {
    const auth = store.folders.find((f) => f.name === "Auth")!;
    expect(auth.parentId).toBeNull();
    const login = store.requests.find((r) => r.name === "Login")!;
    expect(login.folderId).toBe(auth.id);
    expect(login.method).toBe("POST");
    expect(login.url).toBe("{{base_url}}/login");
    expect(login.body.mode).toBe("json");
  });

  it("maps bearer auth", () => {
    const list = store.requests.find((r) => r.name === "Listar")!;
    expect(list.auth.type).toBe("bearer");
    expect(list.auth.token).toBe("{{tok}}");
  });

  it("formdata → multipart (text fields only)", () => {
    const form = store.requests.find((r) => r.name === "Form")!;
    expect(form.body.mode).toBe("multipart");
    expect(form.body.multipart.map((f) => f.key)).toEqual(["a"]);
  });

  it("urlencoded → form", () => {
    const ue = store.requests.find((r) => r.name === "UrlEncoded")!;
    expect(ue.body.mode).toBe("form");
    expect(ue.body.form[0]).toMatchObject({ key: "k", value: "v" });
  });

  it("collection variables → one Environment named after the collection", () => {
    expect(store.environments).toHaveLength(1);
    expect(store.environments[0].name).toBe("Minha API");
    expect(store.environments[0].vars[0]).toMatchObject({ key: "base_url", value: "https://api.exemplo.com" });
  });

  it("junk input → empty store, no throw", () => {
    expect(importPostmanV2_1(null).requests).toEqual([]);
    expect(importPostmanV2_1({}).folders).toEqual([]);
  });
});

describe("stubs", () => {
  it("insomnia / openapi importers throw a clear not-implemented error", () => {
    expect(() => importInsomniaV4({})).toThrow(/não implementada/i);
    expect(() => importOpenApi({})).toThrow(/não implementada/i);
  });
});
