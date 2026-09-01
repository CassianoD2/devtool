import { TransformTool } from "../components/TransformTool";
import { formatYaml } from "../lib/yaml";

const SAMPLE = `nome: DevTool
versao: 1
tags: [json, xml, cep]
config:
  tema: auto
  atalhos: true`;

export function YamlFormatter() {
  return (
    <TransformTool
      toolId="yaml-formatter"
      sample={SAMPLE}
      inputLang="yaml"
      outputLang="yaml"
      transform={(input) => formatYaml(input)}
    />
  );
}
