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

/**
 * Gera os meses entre `de` e `ate` (inclusive), cronologicamente — não fica
 * preso ao ciclo Dez-Nov, segue literalmente o que foi escolhido no filtro
 * (documento técnico, Seção 3.3; o ciclo serve só de sugestão inicial).
 */
export function gerarIntervaloMeses(de: string, ate: string): string[] {
  const [anoDe, mesDe] = de.split("-").map(Number);
  const [anoAte, mesAte] = ate.split("-").map(Number);
  const meses: string[] = [];
  let ano = anoDe;
  let mes = mesDe;
  let seguranca = 0; // evita loop infinito com datas invertidas

  while ((ano < anoAte || (ano === anoAte && mes <= mesAte)) && seguranca < 240) {
    meses.push(chaveMes(ano, mes - 1));
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
    seguranca += 1;
  }
  return meses;
}

/** "YYYY-MM" atual, no fuso local — valor padrão dos filtros de mês. */
export function obterMesAtualISO(hoje: Date = new Date()): string {
  return chaveMes(hoje.getFullYear(), hoje.getMonth());
}

/** Abreviação de 3 letras do mês (jan, fev, ...) a partir de "YYYY-MM" */
export function nomeCurtoMes(chave: string): string {
  const [, mes] = chave.split("-").map(Number);
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return nomes[mes - 1];
}

/** Último dia do mês "YYYY-MM", como "YYYY-MM-DD" (usado nos filtros data_fim da API real). */
export function ultimoDiaDoMes(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${mesReferencia}-${String(ultimoDia).padStart(2, "0")}`;
}
