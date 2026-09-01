import { describe, it, expect } from "vitest";
import { formatJson, minifyJson } from "./json";

describe("formatJson", () => {
  it("pretty-prints with 2-space indent by default", () => {
    expect(formatJson('{"b":1,"a":[2,3]}')).toBe(
      '{\n  "b": 1,\n  "a": [\n    2,\n    3\n  ]\n}',
    );
  });

  it("sorts keys recursively when asked", () => {
    expect(formatJson('{"b":1,"a":{"d":1,"c":2}}', { sortKeys: true })).toBe(
      '{\n  "a": {\n    "c": 2,\n    "d": 1\n  },\n  "b": 1\n}',
    );
  });

  it("honours tab indentation", () => {
    expect(formatJson('{"a":1}', { indent: "tab" })).toBe('{\n\t"a": 1\n}');
  });

  it("points at the line/column of a syntax error", () => {
    expect(() => formatJson('{\n  "a": 1\n  "b": 2\n}')).toThrow(/linha 3, coluna 3/);
  });

  it("surfaces a readable message for a bad token", () => {
    expect(() => formatJson('{"a": }')).toThrow(/Unexpected token/);
  });

  it("throws on empty input", () => {
    expect(() => formatJson("   ")).toThrow(/vazia/i);
  });
});

describe("minifyJson", () => {
  it("collapses whitespace", () => {
    expect(minifyJson('{\n  "a": 1\n}')).toBe('{"a":1}');
  });
});
