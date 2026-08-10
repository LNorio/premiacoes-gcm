import type { InputHTMLAttributes, ReactNode } from "react";
import "./FloatingField.css";

interface FloatingFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

export function FloatingField({ label, icon, id, ...props }: FloatingFieldProps) {
  return (
    <div className={icon ? "campo-flutuante com-icone" : "campo-flutuante"}>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
      {icon}
    </div>
  );
}
