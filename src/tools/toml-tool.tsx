import { useState } from "react";
import { TransformTool } from "../components/TransformTool";
import { Segmented } from "../components/ui/primitives";
import { tomlToJson, jsonToToml, formatToml } from "../lib/tomljson";

const SAMPLE_TOML = `# exemplo
title = "DevTool"
version = "1.5.0"

[build]
target = "release"
features = ["http", "fs"]

[[tool]]
id = "json"
name = "JSON"`;

const SAMPLE_JSON = `{
  "title": "DevTool",
  "build": { "target": "release", "features": ["http", "fs"] }
}`;

type Mode = "toml2json" | "json2toml" | "format";

export function TomlTool() {
  const [mode, setMode] = useState<Mode>("toml2json");

  return (
    <TransformTool
      toolId="toml"
      sample={mode === "json2toml" ? SAMPLE_JSON : SAMPLE_TOML}
      deps={[mode]}
      inputLang={mode === "json2toml" ? "json" : "text"}
      outputLang={mode === "toml2json" ? "json" : "text"}
      transform={(input) =>
        mode === "toml2json"
          ? tomlToJson(input)
          : mode === "json2toml"
            ? jsonToToml(input)
            : formatToml(input)
      }
      toolbar={
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "toml2json", label: "TOML → JSON" },
            { value: "json2toml", label: "JSON → TOML" },
            { value: "format", label: "Formatar TOML" },
          ]}
        />
      }
    />
  );
}
