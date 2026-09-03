import { describe, it, expect } from "vitest";
import { easterSunday, nationalHolidays } from "./holidays";

describe("easterSunday", () => {
  it.each([
    [2024, "03-31"],
    [2025, "04-20"],
    [2026, "04-05"],
    [2000, "04-23"],
  ])("Páscoa de %i", (year, mmdd) => {
    const e = easterSunday(year);
    expect(`${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`).toBe(mmdd);
  });
});

describe("nationalHolidays", () => {
  it("2026: fixos e móveis nas datas certas, ordenados", () => {
    const h = nationalHolidays(2026);
    const by = (name: string) => h.find((x) => x.name === name)?.date;
    expect(by("Confraternização Universal")).toBe("2026-01-01");
    expect(by("Sexta-feira Santa")).toBe("2026-04-03"); // Páscoa 05/04 - 2
    expect(by("Corpus Christi")).toBe("2026-06-04"); // Páscoa + 60
    expect(by("Tiradentes")).toBe("2026-04-21");
    expect(by("Natal")).toBe("2026-12-25");
    const dates = h.map((x) => x.date);
    expect(dates).toEqual([...dates].sort());
  });
  it("Consciência Negra só a partir de 2024", () => {
    expect(nationalHolidays(2023).some((x) => x.name === "Consciência Negra")).toBe(false);
    expect(nationalHolidays(2024).some((x) => x.name === "Consciência Negra")).toBe(true);
  });
});
