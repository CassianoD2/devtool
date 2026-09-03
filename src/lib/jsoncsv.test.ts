import { describe, it, expect } from "vitest";
import { jsonToCsv, csvToJson, parseCsv } from "./jsoncsv";

describe("jsonToCsv", () => {
  it("array de objetos → CSV com header e união de colunas", () => {
    const json = '[{"a":1,"b":"x"},{"a":2,"c":true}]';
    expect(jsonToCsv(json)).toBe("a,b,c\n1,x,\n2,,true");
  });
  it("cita campos com delimitador, aspas ou quebra", () => {
    const json = '[{"nome":"Silva, João","obs":"linha1\\nlinha2"}]';
    expect(jsonToCsv(json)).toBe('nome,obs\n"Silva, João","linha1\nlinha2"');
  });
  it("objetos aninhados viram JSON na célula", () => {
    expect(jsonToCsv('[{"x":{"y":1}}]')).toBe('x\n"{""y"":1}"');
  });
  it("delimitador e quoteAll", () => {
    expect(jsonToCsv('[{"a":1,"b":2}]', { delimiter: ";", quoteAll: true })).toBe(
      '"a";"b"\n"1";"2"',
    );
  });
  it("rejeita não-objetos", () => {
    expect(() => jsonToCsv("[1,2,3]")).toThrow(/array de objetos/);
    expect(() => jsonToCsv("{")).toThrow(/inválido/i);
  });
});

describe("parseCsv / csvToJson", () => {
  it("respeita aspas, campos multilinha e aspas duplicadas", () => {
    const csv = 'a,b\n1,"x,y"\n2,"linha\nquebrada"\n3,"com ""aspas"""';
    expect(parseCsv(csv)).toEqual([
      ["a", "b"],
      ["1", "x,y"],
      ["2", "linha\nquebrada"],
      ["3", 'com "aspas"'],
    ]);
  });
  it("CSV → JSON usando a 1ª linha como chave", () => {
    expect(JSON.parse(csvToJson("nome,idade\nAna,30\nBia,25"))).toEqual([
      { nome: "Ana", idade: "30" },
      { nome: "Bia", idade: "25" },
    ]);
  });
  it("round-trip simples", () => {
    const json = '[{"a":"1","b":"2"},{"a":"3","b":"4"}]';
    expect(csvToJson(jsonToCsv(json))).toBe(JSON.stringify(JSON.parse(json), null, 2));
  });
});
