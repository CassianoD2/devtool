import { describe, it, expect } from "vitest";
import { parseEnv, toFormat, jsonToEnv } from "./dotenv";

describe("parseEnv", () => {
  it("chaves simples, export, comentários", () => {
    const env = parseEnv("# comentário\nexport FOO=bar\nBAZ=1  # inline\n\nQUX = spaced");
    expect(env).toEqual({ FOO: "bar", BAZ: "1", QUX: "spaced" });
  });
  it("aspas duplas processam escapes; simples são literais", () => {
    const env = parseEnv('A="linha1\\nlinha2"\nB=\'no $expand\'');
    expect(env.A).toBe("linha1\nlinha2");
    expect(env.B).toBe("no $expand");
  });
  it("ignora linhas sem = e chaves inválidas", () => {
    expect(parseEnv("SEMIGUAL\n1BAD=x\nOK=y")).toEqual({ OK: "y" });
  });
});

describe("toFormat", () => {
  const env = { FOO: "bar", MULTI: "a b", EMPTY: "" };
  it("json", () => {
    expect(JSON.parse(toFormat(env, "json"))).toEqual(env);
  });
  it("shell cita quando precisa", () => {
    expect(toFormat(env, "shell")).toBe('export FOO=bar\nexport MULTI="a b"\nexport EMPTY=""');
  });
  it("compose", () => {
    expect(toFormat(env, "compose")).toBe("environment:\n  - FOO=bar\n  - MULTI=a b\n  - EMPTY=");
  });
});

describe("jsonToEnv", () => {
  it("objeto plano → .env", () => {
    expect(jsonToEnv('{"A":1,"B":"x y","C":null}')).toBe('A=1\nB="x y"\nC=""');
  });
  it("rejeita array e JSON inválido", () => {
    expect(() => jsonToEnv("[1,2]")).toThrow(/objeto/);
    expect(() => jsonToEnv("{")).toThrow(/inválido/i);
  });
});
