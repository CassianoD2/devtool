/** Infere tipos a partir de um exemplo JSON: TypeScript, Go, Zod ou DDL SQL. Puro. */

export type TypeTarget = "ts" | "go" | "zod" | "sql";

export const TYPE_TARGETS: { id: TypeTarget; label: string }[] = [
  { id: "ts", label: "TypeScript" },
  { id: "go", label: "Go struct" },
  { id: "zod", label: "Zod schema" },
  { id: "sql", label: "DDL SQL" },
];

type Prim = "string" | "number" | "boolean" | "null" | "any";

interface ObjNode {
  kind: "object";
  fields: Map<string, { node: TypeNode; optional: boolean }>;
}
interface ArrNode {
  kind: "array";
  of: TypeNode;
}
interface PrimNode {
  kind: "prim";
  prim: Prim;
}
type TypeNode = ObjNode | ArrNode | PrimNode;

const prim = (p: Prim): PrimNode => ({ kind: "prim", prim: p });

function primOf(v: unknown): Prim {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "any";
}

function mergePrim(a: Prim, b: Prim): Prim {
  if (a === b) return a;
  if (a === "null") return b;
  if (b === "null") return a;
  if (a === "any" || b === "any") return "any";
  return "any"; // string|number etc. — simplifica para any
}

function merge(a: TypeNode, b: TypeNode): TypeNode {
  if (a.kind === "prim" && b.kind === "prim") return prim(mergePrim(a.prim, b.prim));
  if (a.kind === "prim" && a.prim === "null") return b;
  if (b.kind === "prim" && b.prim === "null") return a;
  if (a.kind === "array" && b.kind === "array") {
    return { kind: "array", of: merge(a.of, b.of) };
  }
  if (a.kind === "object" && b.kind === "object") {
    const fields = new Map(a.fields);
    for (const [k, bf] of b.fields) {
      const af = fields.get(k);
      fields.set(k, {
        node: af ? merge(af.node, bf.node) : bf.node,
        optional: af ? af.optional || bf.optional : true,
      });
    }
    for (const [k, af] of fields) {
      if (!b.fields.has(k)) fields.set(k, { ...af, optional: true });
    }
    return { kind: "object", fields };
  }
  return prim("any");
}

function infer(value: unknown): TypeNode {
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", of: prim("any") };
    return { kind: "array", of: value.map(infer).reduce(merge) };
  }
  if (value !== null && typeof value === "object") {
    const fields = new Map<string, { node: TypeNode; optional: boolean }>();
    for (const [k, v] of Object.entries(value)) {
      fields.set(k, { node: infer(v), optional: false });
    }
    return { kind: "object", fields };
  }
  return prim(primOf(value));
}

// ---------- nomes ----------

const pascal = (s: string) =>
  s
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") || "Field";

const singular = (s: string) =>
  s.endsWith("ies") ? s.slice(0, -3) + "y" : s.endsWith("s") && !s.endsWith("ss") ? s.slice(0, -1) : s;

/** Percorre a árvore, dá nome aos objetos aninhados e devolve na ordem de emissão. */
function collectObjects(root: TypeNode, rootName: string) {
  const named: { name: string; node: ObjNode }[] = [];
  const used = new Set<string>();
  const nameFor = (base: string) => {
    let n = pascal(base) || "Type";
    let i = 2;
    while (used.has(n)) n = pascal(base) + i++;
    used.add(n);
    return n;
  };
  const walk = (node: TypeNode, hint: string): void => {
    if (node.kind === "array") return walk(node.of, singular(hint));
    if (node.kind !== "object") return;
    const name = nameFor(hint);
    named.push({ name, node });
    (node as ObjNode & { _name?: string })._name = name;
    for (const [k, f] of node.fields) walk(f.node, k);
  };
  walk(root, rootName);
  return named;
}

const getName = (n: ObjNode) => (n as ObjNode & { _name?: string })._name ?? "Type";

// ---------- emissores ----------

function tsType(node: TypeNode): string {
  if (node.kind === "prim") return node.prim === "null" ? "null" : node.prim;
  if (node.kind === "array") return `${tsType(node.of)}[]`;
  return getName(node);
}
function emitTs(named: { name: string; node: ObjNode }[]): string {
  return named
    .map(
      ({ name, node }) =>
        `export interface ${name} {\n` +
        [...node.fields]
          .map(([k, f]) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}${f.optional ? "?" : ""}: ${tsType(f.node)};`)
          .join("\n") +
        "\n}",
    )
    .join("\n\n");
}

function goType(node: TypeNode): string {
  if (node.kind === "prim")
    return { string: "string", number: "float64", boolean: "bool", null: "interface{}", any: "interface{}" }[
      node.prim
    ];
  if (node.kind === "array") return `[]${goType(node.of)}`;
  return getName(node);
}
function emitGo(named: { name: string; node: ObjNode }[]): string {
  return named
    .map(
      ({ name, node }) =>
        `type ${name} struct {\n` +
        [...node.fields]
          .map(([k, f]) => {
            const gt = goType(f.node);
            const t = f.optional && !gt.startsWith("[]") && gt !== "interface{}" ? `*${gt}` : gt;
            return `\t${pascal(k)} ${t} \`json:"${k}${f.optional ? ",omitempty" : ""}"\``;
          })
          .join("\n") +
        "\n}",
    )
    .join("\n\n");
}

function zodType(node: TypeNode): string {
  if (node.kind === "prim")
    return { string: "z.string()", number: "z.number()", boolean: "z.boolean()", null: "z.null()", any: "z.any()" }[
      node.prim
    ];
  if (node.kind === "array") return `z.array(${zodType(node.of)})`;
  return getName(node) + "Schema";
}
function emitZod(named: { name: string; node: ObjNode }[]): string {
  return named
    .map(
      ({ name, node }) =>
        `export const ${name}Schema = z.object({\n` +
        [...node.fields]
          .map(([k, f]) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${zodType(f.node)}${f.optional ? ".optional()" : ""},`)
          .join("\n") +
        "\n});",
    )
    .join("\n\n");
}

const snake = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toLowerCase();

function sqlType(node: TypeNode): string {
  if (node.kind === "prim")
    return { string: "TEXT", number: "NUMERIC", boolean: "BOOLEAN", null: "TEXT", any: "TEXT" }[node.prim];
  if (node.kind === "array") return "JSONB";
  return "JSONB";
}
function emitSql(named: { name: string; node: ObjNode }[]): string {
  return named
    .map(
      ({ name, node }) =>
        `CREATE TABLE ${snake(name)} (\n` +
        [...node.fields]
          .map(([k, f]) => `  ${snake(k)} ${sqlType(f.node)}${f.optional ? "" : " NOT NULL"}`)
          .join(",\n") +
        "\n);",
    )
    .join("\n\n");
}

export function jsonToTypes(json: string, target: TypeTarget, rootName = "Root"): string {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`JSON inválido: ${(err as Error).message}`);
  }
  const root = infer(data);
  if (root.kind === "prim") return `// o topo é ${root.prim}, nada a inferir`;
  const rootObj: TypeNode = root.kind === "array" ? root.of : root;
  if (rootObj.kind !== "object") {
    return target === "ts" ? `export type ${pascal(rootName)} = ${tsType(root)};` : "// sem objetos para gerar";
  }
  const named = collectObjects(root, rootName);
  const objNamed = named as { name: string; node: ObjNode }[];
  switch (target) {
    case "ts":
      return emitTs(objNamed);
    case "go":
      return emitGo(objNamed);
    case "zod":
      return "import { z } from \"zod\";\n\n" + emitZod(objNamed);
    case "sql":
      return emitSql(objNamed);
  }
}
