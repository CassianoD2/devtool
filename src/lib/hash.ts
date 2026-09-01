import SparkMD5 from "spark-md5";

export type HashAlgo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const HASH_ALGOS: HashAlgo[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashText(text: string, algo: HashAlgo): Promise<string> {
  if (algo === "MD5") return SparkMD5.hash(text);
  const digest = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return toHex(digest);
}

export async function hashBytes(bytes: Uint8Array, algo: HashAlgo): Promise<string> {
  if (algo === "MD5") {
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(bytes.buffer as ArrayBuffer);
    return spark.end();
  }
  const digest = await crypto.subtle.digest(algo, bytes);
  return toHex(digest);
}

/** All algorithms at once, for the hash tool's overview table. */
export async function hashAll(text: string): Promise<Record<HashAlgo, string>> {
  const entries = await Promise.all(
    HASH_ALGOS.map(async (a) => [a, await hashText(text, a)] as const),
  );
  return Object.fromEntries(entries) as Record<HashAlgo, string>;
}
