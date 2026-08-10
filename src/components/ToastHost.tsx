import { Toast } from "./ui";
import { useToasts } from "../utils/toast";

/** Renderiza a fila de mostrarToast(); monta uma vez na raiz do app. */
export function ToastHost() {
  const toasts = useToasts();
  return (
    <>
      {toasts.map((item) => (
        <Toast key={item.id} mensagem={item.mensagem} variante={item.variante} />
      ))}
    </>
  );
}
