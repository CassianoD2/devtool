import { useState } from "react";
import { ApiTool, DefList } from "../components/ApiTool";
import { ToolBody, PaneHeading } from "../components/ToolLayout";
import { Input } from "../components/ui/primitives";
import { lookupCep, lookupCnpj, lookupDdd, listBanks, type Bank } from "../lib/brasilapi";
import { nationalHolidays } from "../lib/holidays";

export function CepTool() {
  return (
    <ApiTool
      toolId="cep"
      placeholder="01001-000"
      sample="01001-000"
      run={(q) => lookupCep(q)}
      renderResult={(d) => (
        <DefList
          rows={[
            ["CEP", d.cep],
            ["Logradouro", d.street],
            ["Bairro", d.neighborhood],
            ["Cidade", d.city],
            ["UF", d.state],
            ["Fonte", d.service ?? "brasilapi"],
          ]}
        />
      )}
    />
  );
}

export function CnpjTool() {
  return (
    <ApiTool
      toolId="cnpj"
      placeholder="00.000.000/0001-91"
      sample="00000000000191"
      run={(q) => lookupCnpj(q)}
      renderResult={(d) => (
        <DefList
          rows={[
            ["Razão social", d.razao_social],
            ["Nome fantasia", d.nome_fantasia],
            ["Situação", d.descricao_situacao_cadastral],
            ["Abertura", d.data_inicio_atividade],
            ["Atividade", d.cnae_fiscal_descricao],
            [
 "Endereço",
              `${d.logradouro}, ${d.numero} — ${d.bairro}, ${d.municipio}/${d.uf} — ${d.cep}`,
            ],
            ["Telefone", d.ddd_telefone_1],
          ]}
        />
      )}
    />
  );
}

export function DddTool() {
  return (
    <ApiTool
      toolId="ddd"
      placeholder="11"
      sample="11"
      run={(q) => lookupDdd(q)}
      renderResult={(d) => (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-muted">Estado:</span> {d.state}
          </p>
          <p className="font-medium text-muted">
            Cidades ({d.cities.length}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {d.cities.map((c) => (
              <span
                key={c}
                className="rounded bg-surface-2 px-2 py-0.5 text-xs"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    />
  );
}

export function BanksTool() {
  return (
    <ApiTool<Bank[]>
      toolId="banks"
      inputMode="none"
      autoRun
      run={() => listBanks()}
      renderResult={(banks) => {
        const sorted = [...banks].sort((a, b) => (a.code ?? 9999) - (b.code ?? 9999));
        return (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
                <tr>
                  <th className="px-2 py-1">Código</th>
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">ISPB</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b) => (
                  <tr
                    key={b.ispb}
                    className="border-t border-line"
                  >
                    <td className="px-2 py-1 font-mono">{b.code ?? "—"}</td>
                    <td className="px-2 py-1">{b.fullName ?? b.name ?? "—"}</td>
                    <td className="px-2 py-1 font-mono text-xs text-faint">
                      {b.ispb}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }}
    />
  );
}

export function HolidaysTool() {
  const [year, setYear] = useState(new Date().getFullYear());
  const days = nationalHolidays(year);

  return (
    <ToolBody
      toolbar={
        <label className="inline-flex items-center gap-1.5 text-sm text-muted">
          Ano
          <Input
            type="number"
            value={year}
            min={1900}
            max={2200}
            onChange={(e) => setYear(Number(e.currentTarget.value) || year)}
            className="w-24"
          />
        </label>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        <PaneHeading title={`Feriados nacionais de ${year}`} />
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <tbody>
              {days.map((h) => (
                <tr key={h.date + h.name} className="border-b border-line last:border-0">
                  <td className="px-3 py-1.5 font-mono text-muted">
                    {h.date.split("-").reverse().join("/")}
                  </td>
                  <td className="px-3 py-1.5 text-ink">{h.name}</td>
                  <td className="px-3 py-1.5 text-right text-xs text-faint">
                    {h.type === "facultativo" ? "ponto facultativo" : "nacional"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint">
          Calculado offline (Páscoa por computus + datas fixas). Não inclui feriados
          estaduais/municipais.
        </p>
      </div>
    </ToolBody>
  );
}
