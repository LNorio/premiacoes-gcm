import "./Toast.css";

type ToastVariant = "info" | "sucesso" | "erro";

interface ToastProps {
  mensagem: string;
  variante?: ToastVariant;
}

export function Toast({ mensagem, variante = "info" }: ToastProps) {
  const classes = ["toast", variante !== "info" && `toast-${variante}`].filter(Boolean).join(" ");
  return (
    <div className={classes} role="status">
      {mensagem}
    </div>
  );
}
