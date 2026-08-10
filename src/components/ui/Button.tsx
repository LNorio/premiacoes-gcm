import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

type ButtonVariant = "primario" | "dourado" | "secundario" | "texto" | "perigo";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  largo?: boolean;
}

export function Button({ variant = "primario", largo = false, className, type = "button", ...props }: ButtonProps) {
  const classes = ["botao", `botao-${variant}`, largo && "botao-largo", className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...props} />;
}
