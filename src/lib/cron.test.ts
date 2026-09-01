import { describe, it, expect } from "vitest";
import { describeCron } from "./cron";

describe("describeCron", () => {
  it("describes a 5-field expression in pt-BR and lists next runs", () => {
    const info = describeCron("*/5 * * * *");
    expect(info.error).toBeUndefined();
    expect(info.description.toLowerCase()).toContain("cada 5 minutos");
    expect(info.nextRuns).toHaveLength(5);
    expect(info.fields.map((f) => f.label)).toEqual([
      "Minuto",
      "Hora",
      "Dia do mês",
      "Mês",
      "Dia da semana",
    ]);
    expect(info.fields[0].value).toBe("*/5");
  });

  it("reports an error for an invalid expression", () => {
    expect(describeCron("not a cron").error).toBeTruthy();
  });

  it("returns empty info for empty input", () => {
    expect(describeCron("  ")).toEqual({ description: "", nextRuns: [], fields: [] });
  });
});
