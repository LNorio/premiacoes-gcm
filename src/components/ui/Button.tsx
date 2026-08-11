import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

type ButtonVariant = "primario" | "dourado" | "secundario" | "texto" | "perigo";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  largo?: boolean;
  /** Mostra um spinner e desabilita o botão enquanto uma chamada à API está em andamento. */
  carregando?: boolean;
}

export function Button({
  variant = "primario",
  largo = false,
  carregando = false,
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = ["botao", `botao-${variant}`, largo && "botao-largo", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} disabled={disabled || carregando} aria-busy={carregando || undefined} {...props}>
      {carregando ? <span className="spinner-botao" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
