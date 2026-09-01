/** Calculadora de sub-rede IPv4 (CIDR). Offline. */

function ipToInt(ip: string): number {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) throw new Error(`IP inválido: ${ip}`);
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255 || !/^\d+$/.test(p)) {
      throw new Error(`Octeto inválido em ${ip}: "${p}"`);
    }
    n = (n << 8) | o;
  }
  return n >>> 0;
}

function intToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}

export interface SubnetInfo {
  cidr: string;
  address: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  hostCount: number;
  usableCount: number;
  ipClass: string;
  isPrivate: boolean;
  type: string;
}

function classify(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (multicast)";
  return "E (reservado)";
}

function isPrivate(n: number): boolean {
  const a = (n >>> 24) & 255;
  const b = (n >>> 16) & 255;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 127) ||
    (a === 169 && b === 254)
  );
}

function specialType(n: number): string {
  const a = (n >>> 24) & 255;
  const b = (n >>> 16) & 255;
  if (a === 127) return "loopback";
  if (a === 169 && b === 254) return "link-local (APIPA)";
  if (a >= 224) return "multicast/reservado";
  if (isPrivate(n)) return "privado (RFC 1918)";
  return "público";
}

/** Aceita "192.168.0.10/24" ou "192.168.0.10 255.255.255.0" ou só "192.168.0.10" (assume /32). */
export function parseCidr(input: string): SubnetInfo {
  const raw = input.trim();
  let ipStr: string;
  let prefix: number;

  const slash = raw.match(/^(\S+)\/(\d{1,2})$/);
  const spaced = raw.match(/^(\S+)\s+(\S+)$/);
  if (slash) {
    ipStr = slash[1];
    prefix = Number(slash[2]);
  } else if (spaced) {
    ipStr = spaced[1];
    prefix = maskToPrefix(ipToInt(spaced[2]));
  } else {
    ipStr = raw;
    prefix = 32;
  }
  if (prefix < 0 || prefix > 32) throw new Error("Prefixo deve estar entre 0 e 32.");

  const addr = ipToInt(ipStr);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (addr & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(total - 2, 0);
  const first = prefix >= 31 ? network : (network + 1) >>> 0;
  const last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;

  return {
    cidr: `${intToIp(network)}/${prefix}`,
    address: intToIp(addr),
    prefix,
    netmask: intToIp(mask),
    wildcard: intToIp(~mask >>> 0),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(first),
    lastHost: intToIp(last),
    hostCount: total,
    usableCount: usable,
    ipClass: classify((addr >>> 24) & 255),
    isPrivate: isPrivate(addr),
    type: specialType(addr),
  };
}

function maskToPrefix(mask: number): number {
  const bin = (mask >>> 0).toString(2).padStart(32, "0");
  if (!/^1*0*$/.test(bin)) throw new Error("Máscara de sub-rede não contígua.");
  return bin.replace(/0/g, "").length;
}

/** O ip está dentro do cidr? */
export function ipInCidr(ip: string, cidr: string): boolean {
  const info = parseCidr(cidr);
  const target = ipToInt(ip);
  const net = ipToInt(info.network);
  const mask = info.prefix === 0 ? 0 : (0xffffffff << (32 - info.prefix)) >>> 0;
  return (target & mask) >>> 0 === net;
}
