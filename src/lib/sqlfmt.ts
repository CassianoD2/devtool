/** Formatação de SQL — wrapper fino sobre `sql-formatter`. */

import { format, type SqlLanguage } from "sql-formatter";

export const SQL_DIALECTS: { id: SqlLanguage; label: string }[] = [
  { id: "sql", label: "SQL padrão" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mysql", label: "MySQL / MariaDB" },
  { id: "sqlite", label: "SQLite" },
  { id: "mariadb", label: "MariaDB" },
  { id: "bigquery", label: "BigQuery" },
  { id: "snowflake", label: "Snowflake" },
  { id: "transactsql", label: "SQL Server (T-SQL)" },
  { id: "plsql", label: "Oracle (PL/SQL)" },
  { id: "redshift", label: "Redshift" },
  { id: "spark", label: "Spark SQL" },
];

export interface SqlFmtOptions {
  language: SqlLanguage;
  keywordCase: "preserve" | "upper" | "lower";
  tabWidth: number;
}

export const SQL_FMT_DEFAULTS: SqlFmtOptions = {
  language: "sql",
  keywordCase: "upper",
  tabWidth: 2,
};

export function formatSql(input: string, options: Partial<SqlFmtOptions> = {}): string {
  const o = { ...SQL_FMT_DEFAULTS, ...options };
  try {
    return format(input, {
      language: o.language,
      keywordCase: o.keywordCase,
      tabWidth: o.tabWidth,
    });
  } catch (err) {
    throw new Error(`Não foi possível formatar: ${(err as Error).message}`);
  }
}

/** Uma linha só, colapsando espaços. */
export function minifySql(input: string): string {
  return input
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([(),;])\s*/g, "$1")
    .trim();
}
