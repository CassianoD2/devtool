import { describe, it, expect } from "vitest";
import { crc16, buildPixCode, parsePixCode } from "./pix";

describe("crc16", () => {
  it("returns 4 uppercase hex chars and is deterministic", () => {
    const a = crc16("123456789");
    expect(a).toMatch(/^[0-9A-F]{4}$/);
    expect(crc16("123456789")).toBe(a);
  });
  it('CRC16-CCITT/FALSE check value for "123456789" is 29B1', () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("is the trailing 4 chars of a built payload", () => {
    const code = buildPixCode({ key: "a@b.c", merchantName: "N", merchantCity: "C" });
    expect(crc16(code.slice(0, -4))).toBe(code.slice(-4));
  });
});

describe("buildPixCode / parsePixCode", () => {
  it("builds a payload whose CRC validates on parse", () => {
    const code = buildPixCode({
      key: "fulano@example.com",
      merchantName: "Fulano de Tal",
      merchantCity: "São Paulo",
      amount: 10.5,
      txid: "PEDIDO123",
    });
    const decoded = parsePixCode(code);
    expect(decoded.crcValid).toBe(true);

    const merchant = decoded.fields.find((f) => f.id === "26");
    expect(merchant?.children?.find((c) => c.id === "01")?.value).toBe(
      "fulano@example.com",
    );
    expect(decoded.fields.find((f) => f.id === "54")?.value).toBe("10.50");
    expect(decoded.fields.find((f) => f.id === "59")?.value).toBe("FULANO DE TAL");
    // accents stripped, city upper + truncated to 15
    expect(decoded.fields.find((f) => f.id === "60")?.value).toBe("SAO PAULO");
  });

  it("omits the amount tag when no value is given", () => {
    const code = buildPixCode({
      key: "11222333000181",
      merchantName: "Loja",
      merchantCity: "Recife",
    });
    const decoded = parsePixCode(code);
    expect(decoded.fields.find((f) => f.id === "54")).toBeUndefined();
    expect(decoded.crcValid).toBe(true);
  });

  it("flags a tampered payload", () => {
    const code = buildPixCode({ key: "x@y.z", merchantName: "A", merchantCity: "B" });
    const tampered = code.slice(0, 20) + "9" + code.slice(21);
    expect(parsePixCode(tampered).crcValid).toBe(false);
  });

  it("requires a key", () => {
    expect(() => buildPixCode({ key: "", merchantName: "A", merchantCity: "B" })).toThrow(
      /chave/i,
    );
  });
});
