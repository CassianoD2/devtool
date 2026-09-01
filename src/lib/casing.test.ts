import { describe, it, expect } from "vitest";
import { convertCase, toWords } from "./casing";

describe("toWords", () => {
  it("splits camelCase, kebab, and acronyms", () => {
    expect(toWords("firstNameValue")).toEqual(["first", "name", "value"]);
    expect(toWords("my-css-class")).toEqual(["my", "css", "class"]);
    expect(toWords("HTTPResponseCode")).toEqual(["http", "response", "code"]);
  });
});

describe("convertCase", () => {
  const input = "firstNameValue";
  it.each([
    ["camel", "firstNameValue"],
    ["pascal", "FirstNameValue"],
    ["snake", "first_name_value"],
    ["kebab", "first-name-value"],
    ["constant", "FIRST_NAME_VALUE"],
    ["dot", "first.name.value"],
    ["title", "First Name Value"],
    ["sentence", "First name value"],
  ] as const)("%s", (target, expected) => {
    expect(convertCase(input, target)).toBe(expected);
  });

  it("converts each line independently", () => {
    expect(convertCase("one-two\nthree-four", "camel")).toBe("oneTwo\nthreeFour");
  });
});
