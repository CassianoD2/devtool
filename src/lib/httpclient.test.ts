import { describe, it, expect } from "vitest";
import { describeFetchError } from "./httpclient";

const URL = "http://localhost:8081/api/greeting";

describe("describeFetchError", () => {
  it("usa a string rejeitada pelo plugin HTTP do Tauri", () => {
    expect(describeFetchError("algo deu errado", URL)).toBe("algo deu errado");
  });

  it("usa a message de um Error", () => {
    expect(describeFetchError(new Error("falhou"), URL)).toBe("falhou");
  });

  it("serializa objetos desconhecidos", () => {
    expect(describeFetchError({ code: 42 }, URL)).toBe('{"code":42}');
  });

  it("cai em 'erro desconhecido' quando não há detalhe", () => {
    expect(describeFetchError(undefined, URL)).toBe("erro desconhecido");
    expect(describeFetchError("", URL)).toBe("erro desconhecido");
  });

  it("explica conexão recusada citando a URL", () => {
    const msg = describeFetchError(
      "error sending request for url (http://localhost:8081/): Connection refused (os error 111)",
      URL,
    );
    expect(msg).toContain("Connection refused");
    expect(msg).toContain(`nada está escutando em ${URL}`);
  });
});
