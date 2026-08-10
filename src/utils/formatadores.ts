export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "2026-07" -> "julho de 2026" */
export function formatarMesReferencia(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const data = new Date(ano, mes - 1, 1);
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function mascararCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
