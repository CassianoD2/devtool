import { describe, it, expect } from "vitest";
import { parseCidr, ipInCidr } from "./cidr";

describe("parseCidr", () => {
  it("computes a /24", () => {
    const i = parseCidr("192.168.1.10/24");
    expect(i.network).toBe("192.168.1.0");
    expect(i.broadcast).toBe("192.168.1.255");
    expect(i.netmask).toBe("255.255.255.0");
    expect(i.wildcard).toBe("0.0.0.255");
    expect(i.firstHost).toBe("192.168.1.1");
    expect(i.lastHost).toBe("192.168.1.254");
    expect(i.hostCount).toBe(256);
    expect(i.usableCount).toBe(254);
    expect(i.type).toBe("privado (RFC 1918)");
  });

  it("computes a /22 boundary", () => {
    const i = parseCidr("192.168.15.37/22");
    expect(i.network).toBe("192.168.12.0");
    expect(i.broadcast).toBe("192.168.15.255");
    expect(i.usableCount).toBe(1022);
  });

  it("accepts a dotted netmask", () => {
    const i = parseCidr("10.0.0.5 255.255.255.240");
    expect(i.prefix).toBe(28);
    expect(i.network).toBe("10.0.0.0");
    expect(i.broadcast).toBe("10.0.0.15");
  });

  it("treats /31 and /32 specially", () => {
    expect(parseCidr("10.0.0.0/31").usableCount).toBe(2);
    expect(parseCidr("10.0.0.1/32").usableCount).toBe(1);
  });

  it("classifies public and loopback", () => {
    expect(parseCidr("8.8.8.8/32").type).toBe("público");
    expect(parseCidr("127.0.0.1/8").type).toBe("loopback");
  });

  it("rejects bad octets and non-contiguous masks", () => {
    expect(() => parseCidr("999.1.1.1/24")).toThrow();
    expect(() => parseCidr("10.0.0.0 255.0.255.0")).toThrow(/contígua/);
  });
});

describe("ipInCidr", () => {
  it("checks membership", () => {
    expect(ipInCidr("192.168.1.200", "192.168.1.0/24")).toBe(true);
    expect(ipInCidr("192.168.2.1", "192.168.1.0/24")).toBe(false);
  });
});
