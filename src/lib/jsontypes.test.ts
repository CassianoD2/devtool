import { describe, it, expect } from "vitest";
import { jsonToTypes } from "./jsontypes";

const SAMPLE = JSON.stringify({
  id: 1,
  name: "Ana",
  active: true,
  tags: ["a", "b"],
  address: { city: "SP", zip: "01000-000" },
  orders: [
    { total: 10, paid: true },
    { total: 20 },
  ],
});

describe("jsonToTypes — TypeScript", () => {
  it("gera interfaces aninhadas com opcional", () => {
    const ts = jsonToTypes(SAMPLE, "ts", "User");
    expect(ts).toContain("export interface User {");
    expect(ts).toContain("id: number;");
    expect(ts).toContain("tags: string[];");
    expect(ts).toContain("address: Address;");
    expect(ts).toContain("orders: Order[];");
    expect(ts).toContain("export interface Order {");
    expect(ts).toMatch(/paid\?: boolean;/); // presente só em 1 dos 2 pedidos
  });
});

describe("jsonToTypes — Go", () => {
  it("struct com tags json e ponteiro pro opcional", () => {
    const go = jsonToTypes(SAMPLE, "go", "User");
    expect(go).toContain("type User struct {");
    expect(go).toContain('Id float64 `json:"id"`');
    expect(go).toContain("Orders []Order");
    expect(go).toMatch(/Paid \*bool `json:"paid,omitempty"`/);
  });
});

describe("jsonToTypes — Zod", () => {
  it("z.object com optional", () => {
    const zod = jsonToTypes(SAMPLE, "zod", "User");
    expect(zod).toContain('import { z } from "zod";');
    expect(zod).toContain("export const UserSchema = z.object({");
    expect(zod).toContain("tags: z.array(z.string()),");
    expect(zod).toMatch(/paid: z\.boolean\(\)\.optional\(\)/);
  });
});

describe("jsonToTypes — SQL", () => {
  it("CREATE TABLE por objeto, snake_case, NOT NULL", () => {
    const sql = jsonToTypes(SAMPLE, "sql", "User");
    expect(sql).toContain("CREATE TABLE user (");
    expect(sql).toContain("id NUMERIC NOT NULL");
    expect(sql).toContain("tags JSONB NOT NULL");
    expect(sql).toContain("CREATE TABLE address (");
  });
});

describe("jsonToTypes — bordas", () => {
  it("JSON inválido lança", () => {
    expect(() => jsonToTypes("{", "ts")).toThrow(/JSON inválido/);
  });
  it("array na raiz usa o elemento", () => {
    const ts = jsonToTypes('[{"a":1},{"a":2}]', "ts", "Item");
    expect(ts).toContain("export interface Item {");
    expect(ts).toContain("a: number;");
  });
});
