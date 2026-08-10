import type { ReactNode } from "react";
import "./Table.css";

interface TableProps {
  children: ReactNode;
  planilha?: boolean;
}

export function Table({ children, planilha = false }: TableProps) {
  return (
    <div className="tabela-wrapper">
      <table className={planilha ? "tabela tabela-planilha" : "tabela"}>{children}</table>
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
