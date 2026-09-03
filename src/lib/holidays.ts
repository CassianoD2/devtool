/** Feriados nacionais do Brasil, calculados offline. Puro. */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "nacional" | "facultativo";
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(y: number, m: number, d: number, delta: number): string {
  const t = new Date(y, m - 1, d + delta);
  return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

export function nationalHolidays(year: number): Holiday[] {
  const e = easterSunday(year);
  const list: Holiday[] = [
    { date: iso(year, 1, 1), name: "Confraternização Universal", type: "nacional" },
    { date: addDays(year, e.month, e.day, -48), name: "Carnaval (segunda)", type: "facultativo" },
    { date: addDays(year, e.month, e.day, -47), name: "Carnaval (terça)", type: "facultativo" },
    { date: addDays(year, e.month, e.day, -46), name: "Quarta-feira de Cinzas (até 14h)", type: "facultativo" },
    { date: addDays(year, e.month, e.day, -2), name: "Sexta-feira Santa", type: "nacional" },
    { date: iso(year, e.month, e.day), name: "Páscoa", type: "nacional" },
    { date: iso(year, 4, 21), name: "Tiradentes", type: "nacional" },
    { date: iso(year, 5, 1), name: "Dia do Trabalho", type: "nacional" },
    { date: addDays(year, e.month, e.day, 60), name: "Corpus Christi", type: "facultativo" },
    { date: iso(year, 9, 7), name: "Independência do Brasil", type: "nacional" },
    { date: iso(year, 10, 12), name: "Nossa Senhora Aparecida", type: "nacional" },
    { date: iso(year, 10, 28), name: "Dia do Servidor Público", type: "facultativo" },
    { date: iso(year, 11, 2), name: "Finados", type: "nacional" },
    { date: iso(year, 11, 15), name: "Proclamação da República", type: "nacional" },
    { date: iso(year, 12, 25), name: "Natal", type: "nacional" },
  ];
  // Consciência Negra virou feriado nacional pela Lei 14.759/2023 (a partir de 2024).
  if (year >= 2024) {
    list.push({ date: iso(year, 11, 20), name: "Consciência Negra", type: "nacional" });
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}
