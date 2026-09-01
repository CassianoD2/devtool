import { describe, it, expect } from "vitest";
import { detectContent } from "./detect";

const ids = (s: string) => detectContent(s).map((x) => x.toolId);

describe("detectContent", () => {
  it("recognises JSON", () => {
    expect(ids('{"a":1}')).toContain("json-formatter");
  });
  it("recognises a JWT", () => {
    expect(ids("eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.abc")).toContain("jwt-decoder");
  });
  it("recognises a UUID", () => {
    expect(ids("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toContain("uuid-tool");
  });
  it("recognises a hex colour", () => {
    expect(ids("#3b82f6")).toContain("color");
  });
  it("recognises a CIDR", () => {
    expect(ids("192.168.0.0/24")).toContain("cidr");
  });
  it("recognises a cron expression", () => {
    expect(ids("*/5 * * * *")).toContain("cron");
  });
  it("recognises a CPF-shaped string", () => {
    expect(ids("529.982.247-25")).toContain("br-docs");
  });
  it("recognises a PIX payload and targets the decode draft", () => {
    const s =
      "00020126360014BR.GOV.BCB.PIX0114fulano@mail.com5204000053039865802BR5904Test6008BRASILIA62070503***6304ABCD";
    const hit = detectContent(s).find((x) => x.toolId === "pix");
    expect(hit?.draftKey).toBe("pix-decode");
  });
  it("recognises a curl command", () => {
    expect(ids("curl -X POST https://api.test/x -d '{}'")).toContain("curl");
  });
  it("returns nothing for plain prose", () => {
    expect(detectContent("o rato roeu a roupa do rei")).toEqual([]);
  });
});
