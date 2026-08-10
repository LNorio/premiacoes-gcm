import type { ReactNode } from "react";
import "./Badge.css";

export function BadgeInfo({ children, perfil = false }: { children: ReactNode; perfil?: boolean }) {
  return <span className={perfil ? "badge-info badge-perfil" : "badge-info"}>{children}</span>;
}

export function BadgeTela({ children }: { children: ReactNode }) {
  return <span className="badge-tela">{children}</span>;
}

export function Selo({ children, variante }: { children: ReactNode; variante: "sucesso" | "alerta" }) {
  return <span className={`selo selo-${variante}`}>{children}</span>;
}
