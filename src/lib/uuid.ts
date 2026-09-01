import { v1 as uuidV1, v4 as uuidV4, v5 as uuidV5, v7 as uuidV7, NIL, validate, version } from "uuid";

export type UuidVersion = "v1" | "v4" | "v5" | "v7" | "nil";

export const UUID_V5_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
export const UUID_V5_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

export interface GenerateUuidOptions {
  version: UuidVersion;
  count: number;
  uppercase?: boolean;
  hyphens?: boolean;
  /** for v5 */
  namespace?: string;
  name?: string;
}

export function generateUuids(opts: GenerateUuidOptions): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(opts.count)));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let id: string;
    switch (opts.version) {
      case "v1":
        id = uuidV1();
        break;
      case "v5":
        id = uuidV5(opts.name ?? "", opts.namespace ?? UUID_V5_DNS);
        break;
      case "v7":
        id = uuidV7();
        break;
      case "nil":
        id = NIL;
        break;
      default:
        id = uuidV4();
    }
    if (opts.hyphens === false) id = id.replace(/-/g, "");
    if (opts.uppercase) id = id.toUpperCase();
    out.push(id);
  }
  return out;
}

export function inspectUuid(value: string): { valid: boolean; version?: number } {
  const valid = validate(value);
  return { valid, version: valid ? version(value) : undefined };
}
