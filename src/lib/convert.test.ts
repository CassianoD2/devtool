import { describe, it, expect } from "vitest";
import { convertData } from "./convert";

describe("convertData", () => {
  it("JSON → YAML round-trips back to the same value", () => {
    const json = '{"a":1,"b":["x","y"],"c":{"d":true}}';
    const yaml = convertData(json, "json", "yaml");
    const back = convertData(yaml, "yaml", "json");
    expect(JSON.parse(back)).toEqual(JSON.parse(json));
  });

  it("JSON → XML produces well-formed output", () => {
    const xml = convertData('{"note":{"to":"world","n":1}}', "json", "xml");
    expect(xml).toContain("<note>");
    expect(xml).toContain("<to>world</to>");
  });

  it("JSON → XML wraps multi-key objects in a single <root>", () => {
    const xml = convertData('{"a":1,"b":["x","y"],"c":{"d":true}}', "json", "xml");
    expect(xml).toMatch(/^<root>/);
    expect(xml).toContain("<a>1</a>");
    expect(xml).toContain("<b>x</b>");
    expect(xml).toContain("<b>y</b>");
    // exactly one top-level element
    expect(xml.match(/^<\/?\w+/gm)?.filter((l) => !l.startsWith("</")).length).toBeGreaterThan(0);
  });

  it("JSON → XML wraps a top-level array (no 'multiple root nodes')", () => {
    const xml = convertData("[1,2,3]", "json", "xml");
    expect(xml).toMatch(/^<root>/);
    expect(xml).toContain("<item>1</item>");
    expect(xml).toContain("<item>3</item>");
  });

  it("JSON → XML keeps a single-key wrapper object even when its value is an array", () => {
    const xml = convertData('{"items":[1,2]}', "json", "xml");
    expect(xml).toMatch(/^<root>/);
    expect(xml).toContain("<items>1</items>");
    expect(xml).toContain("<items>2</items>");
  });

  it("throws on empty input", () => {
    expect(() => convertData("  ", "json", "yaml")).toThrow(/vazia/i);
  });

  it("is a no-op when from === to", () => {
    expect(convertData("{}", "json", "json")).toBe("{}");
  });
});
