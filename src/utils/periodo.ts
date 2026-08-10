/**
 * Ciclo PEV: 12 meses, Dezembro → Novembro (ver documento técnico, Seção 3.3
 * e Anexo — Glossário). `anoCiclo` é o ano do mês de Novembro (fim do ciclo).
 */
export function obterAnoCicloAtual(hoje: Date = new Date()): number {
  const mes = hoje.getMonth(); // 0 = janeiro, 11 = dezembro
  const ano = hoje.getFullYear();
  return mes === 11 ? ano + 1 : ano;
}

function chaveMes(ano: number, mesIndex0: number): string {
  return `${ano}-${String(mesIndex0 + 1).padStart(2, "0")}`;
}

/** Gera as 12 chaves "YYYY-MM" do ciclo, de dezembro (anoCiclo - 1) a novembro (anoCiclo) */
export function obterMesesCicloPEV(anoCiclo: number): string[] {
  const meses: string[] = [chaveMes(anoCiclo - 1, 11)]; // dezembro do ano anterior
  for (let mesIndex0 = 0; mesIndex0 <= 10; mesIndex0 += 1) {
    meses.push(chaveMes(anoCiclo, mesIndex0)); // janeiro..novembro do ano do ciclo
  }
  return meses;
}

/** Recorta o intervalo [de, ate] (inclusive) dentro do ciclo informado */
export function gerarIntervaloMeses(anoCiclo: number, de: string, ate: string): string[] {
  const ciclo = obterMesesCicloPEV(anoCiclo);
  const inicio = ciclo.indexOf(de);
  const fim = ciclo.indexOf(ate);
  if (inicio === -1 || fim === -1 || inicio > fim) return [];
  return ciclo.slice(inicio, fim + 1);
}
