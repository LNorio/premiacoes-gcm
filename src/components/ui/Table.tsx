import type { ReactNode } from "react";
import "./Table.css";

interface TableProps {
  children: ReactNode;
  planilha?: boolean;
  /** Sem o min-width de 640px e com padding de célula reduzido — para tabelas pequenas (ex.: dentro de uma modal). */
  compacta?: boolean;
}

export function Table({ children, planilha = false, compacta = false }: TableProps) {
  const classes = ["tabela", planilha && "tabela-planilha", compacta && "tabela-compacta"].filter(Boolean).join(" ");
  return (
    <div className="tabela-wrapper">
      <table className={classes}>{children}</table>
    </div>
  );
}

export function LinhaVazia({ colSpan, mensagem }: { colSpan: number; mensagem: string }) {
  return (
    <tr className="linha-vazia">
      <td colSpan={colSpan}>{mensagem}</td>
    </tr>
  );
}
