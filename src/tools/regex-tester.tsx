import { useMemo, useState } from "react";
import { ToolBody, TwoPane, PaneHeading } from "../components/ToolLayout";
import { Button, Checkbox, ErrorNote, Select } from "../components/ui/primitives";
import { useToolDraft } from "../hooks/useToolDraft";
import { runRegex, REGEX_PRESETS } from "../lib/regex";

const FLAGS = [
  { f: "i", label: "i · ignore case" },
  { f: "m", label: "m · multiline" },
  { f: "s", label: "s · dotall" },
  { f: "u", label: "u · unicode" },
];

export function RegexTester() {
  const [pattern, setPattern] = useToolDraft("regex-tester:pattern");
  const [text, setText] = useToolDraft("regex-tester:text");
  const [flags, setFlags] = useState<Set<string>>(new Set(["i"]));

  const toggle = (f: string) =>
    setFlags((s) => {
      const n = new Set(s);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });

  const flagStr = [...flags].join("");
  const { matches, error } = useMemo(
    () => runRegex(pattern, flagStr, text),
    [pattern, flagStr, text],
  );

  const highlighted = useMemo(() => {
    if (error || matches.length === 0) return null;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    matches.forEach((m, i) => {
      if (m.index > cursor) nodes.push(text.slice(cursor, m.index));
      nodes.push(
        <mark key={i} className="rounded bg-yellow-200 dark:bg-yellow-500/40">
          {m.match}
        </mark>,
      );
      cursor = m.index + m.match.length;
    });
    nodes.push(text.slice(cursor));
    return nodes;
  }, [matches, text, error]);

  return (
    <ToolBody
      toolbar={
        <>
          <Select
            defaultValue=""
            onChange={(e) => {
              const p = REGEX_PRESETS.find((x) => x.label === e.currentTarget.value);
              if (p) {
                setPattern(p.pattern);
                setFlags(new Set(p.flags.replace("g", "").split("").filter(Boolean)));
              }
            }}
          >
            <option value="">Presets…</option>
            {REGEX_PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </Select>
          {FLAGS.map((fl) => (
            <Checkbox
              key={fl.f}
              label={fl.f}
              checked={flags.has(fl.f)}
              onChange={() => toggle(fl.f)}
            />
          ))}
          <span className="text-xs text-faint">
            {matches.length} correspondência(s)
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              onClick={() => {
                setPattern("");
                setText("");
              }}
              disabled={!pattern && !text}
            >
              Limpar
            </Button>
          </div>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.currentTarget.value)}
          placeholder="expressão regular, ex.: (\d{4})-(\d{2})"
          className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 font-mono text-sm"
        />
        {error && <ErrorNote message={error} />}
        <TwoPane
        storageKey="regex"
          left={
            <>
              <PaneHeading title="Texto de teste" />
              <textarea
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder="Texto onde aplicar a regex…"
                className="min-h-0 flex-1 resize-y rounded-md border border-line-strong bg-surface-2 p-3 font-mono text-sm"
              />
            </>
          }
          right={
            <>
              <PaneHeading title="Resultado" />
              <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-md border border-line p-3">
                {highlighted && (
                  <p className="font-mono text-xs whitespace-pre-wrap break-words text-muted">
                    {highlighted}
                  </p>
                )}
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="rounded border border-line p-2 text-xs"
                  >
                    <div className="font-mono font-semibold">
                      #{i + 1} @ {m.index}: <span className="text-accent">{m.match}</span>
                    </div>
                    {m.groups.length > 0 && (
                      <ol className="mt-1 list-decimal pl-5 font-mono text-muted">
                        {m.groups.map((g, gi) => (
                          <li key={gi}>{g || "∅"}</li>
                        ))}
                      </ol>
                    )}
                    {Object.entries(m.namedGroups).length > 0 && (
                      <ul className="mt-1 font-mono text-muted">
                        {Object.entries(m.namedGroups).map(([k, v]) => (
                          <li key={k}>
                            {k}: {v || "∅"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {!error && matches.length === 0 && pattern && (
                  <p className="text-sm text-faint">Nenhuma correspondência.</p>
                )}
              </div>
            </>
          }
        />
      </div>
    </ToolBody>
  );
}
