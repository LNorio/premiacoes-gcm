import type { HTMLAttributes, ReactNode } from "react";
import "./Card.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  titulo?: ReactNode;
  destaque?: boolean;
  children: ReactNode;
}

export function Card({ titulo, destaque = false, className, children, ...props }: CardProps) {
  const classes = ["cartao", destaque && "cartao-destaque", className].filter(Boolean).join(" ");
  return (
    <article className={classes} {...props}>
      {titulo ? <h3>{titulo}</h3> : null}
      {children}
    </article>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grade-cartoes">{children}</div>;
}
