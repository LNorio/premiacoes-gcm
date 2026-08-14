import { baixarExcel } from "../utils/exportar";
import {
  type Colaborador,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
  type PlanoSaudePeriodo,
  type Resultado,
  type TipoPlanoSaude,
} from "../types";

export interface PlanoSaudeService {
  // Sub-aba Cadastro (Titulares e Dependentes)
  listarDependentes(titularId: string): Promise<Resultado<PlanoSaudeDependente[]>>;
  salvarDependente(dependente: Omit<PlanoSaudeDependente, "id"> & { id?: string }): Promise<Resultado<PlanoSaudeDependente>>;
  removerDependente(id: string): Promise<Resultado<void>>;
  salvarAdesao(titularId: string, tipo: TipoPlanoSaude, valor: boolean): Promise<Resultado<void>>;

  // Sub-aba Lançamento
  listarLancamentosPlanoSaude(filial: string, mesReferencia: string, tipo: TipoPlanoSaude): Promise<Resultado<PlanoSaudeLancamento[]>>;
  salvarLancamentoPlanoSaude(lancamento: PlanoSaudeLancamento): Promise<Resultado<PlanoSaudeLancamento>>;

  // Sub-aba Período (Admin, por filial) — fechamento de período: só um `ativo` por filial + tipo de plano + tipo de pessoa.
  listarPeriodosPlanoSaude(filial: string, tipoPlano: TipoPlanoSaude): Promise<Resultado<PlanoSaudePeriodo[]>>;
  salvarPeriodoPlanoSaude(
    filial: string,
    tipoPlano: TipoPlanoSaude,
    tipoPessoa: "titular" | "dependente",
    valor: number,
  ): Promise<Resultado<PlanoSaudePeriodo>>;
  encerrarPeriodoPlanoSaude(periodo: PlanoSaudePeriodo): Promise<Resultado<PlanoSaudePeriodo>>;
}

/** Uma linha da grade de Lançamento — o titular, ou um dos seus dependentes (documento técnico, Seção 3.6.2). */
export interface PessoaPlanoSaude {
  id: string;
  codigo: string;
  nome: string;
  tipo: "titular" | "dependente";
  titularId: string;
  filial: string;
}

/** Primeiro e último dia (YYYY-MM-DD) do mês de referência (YYYY-MM), para comparar com o período. */
function limitesDoMes(mesReferencia: string): [string, string] {
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return [`${mesReferencia}-01`, `${mesReferencia}-${String(ultimoDia).padStart(2, "0")}`];
}

/** Só a parte "YYYY-MM-DD" de uma data/hora ("YYYY-MM-DD HH:MM:SS" ou já só a data). */
function apenasData(dataHora: string): string {
  return dataHora.slice(0, 10);
}

/**
 * Período (filial + tipo de plano + tipo de pessoa) vigente no mês pedido — o que começou
 * (`dataCriacao`) até aquele mês e ainda não tinha sido encerrado (`dataValidade` nula) ou só
 * encerrou depois dele. Como só existe um período `ativo` por vez para essa combinação e o
 * histórico é fechado sequencialmente (nunca dois períodos abertos ao mesmo tempo), no máximo
 * um resultado é possível.
 */
export function encontrarPeriodoPlano(
  periodos: PlanoSaudePeriodo[],
  filial: string,
  tipoPlano: TipoPlanoSaude,
  tipoPessoa: "titular" | "dependente",
  mesReferencia: string,
): PlanoSaudePeriodo | undefined {
  const [inicioMes, fimMes] = limitesDoMes(mesReferencia);
  return periodos.find(
    (periodo) =>
      periodo.filial === filial &&
      periodo.tipoPlano === tipoPlano &&
      periodo.tipoPessoa === tipoPessoa &&
      apenasData(periodo.dataCriacao) <= fimMes &&
      (periodo.dataValidade === null || periodo.dataValidade >= inicioMes),
  );
}

/**
 * Uma linha por pessoa (titular, depois cada um dos seus dependentes), na ordem do
 * cadastro — só entram famílias cujo titular tem adesão ao `tipoPlano` pedido.
 */
export function listarPessoasPlanoSaude(
  titulares: Colaborador[],
  dependentes: PlanoSaudeDependente[],
  tipoPlano: TipoPlanoSaude,
): PessoaPlanoSaude[] {
  const pessoas: PessoaPlanoSaude[] = [];
  for (const titular of titulares) {
    const temAdesao = tipoPlano === "saude" ? titular.adesaoSaude !== false : titular.adesaoOdontologico !== false;
    if (!temAdesao) continue;

    pessoas.push({ id: titular.id, codigo: titular.codigo, nome: titular.nome, tipo: "titular", titularId: titular.id, filial: titular.filial });
    for (const dependente of dependentes.filter((d) => d.vendedorId === titular.id)) {
      pessoas.push({
        id: dependente.id,
        codigo: titular.codigo,
        nome: dependente.nome,
        tipo: "dependente",
        titularId: titular.id,
        filial: titular.filial,
      });
    }
  }
  return pessoas;
}

/** Valor do período vigente (igual para Titular e Dependente) + campos extras do lançamento, se houver. */
export function calcularTotalLancamentoPlanoSaude(
  lancamento: PlanoSaudeLancamento | undefined,
  tipoPlano: TipoPlanoSaude,
  periodo: PlanoSaudePeriodo | undefined,
): number {
  const valorFixo = periodo?.valor ?? 0;
  const extras = tipoPlano === "saude" ? (lancamento?.valorAdicional ?? 0) + (lancamento?.valorCoparticipacao ?? 0) : 0;
  return valorFixo + extras;
}

/** Documento técnico, Seção 4 — colunas variam por sub-aba (Saúde tem valores extras editáveis; Odontológico não). */
export function exportarPlanoSaudeExcel(
  pessoas: PessoaPlanoSaude[],
  lancamentos: PlanoSaudeLancamento[],
  periodos: PlanoSaudePeriodo[],
  tipoPlano: TipoPlanoSaude,
  mesReferencia: string,
  filial: string,
): boolean {
  if (pessoas.length === 0) return false;

  const cabecalho =
    tipoPlano === "saude"
      ? ["Código", "Nome", "Descrição", "R$ Titular", "R$ Dep.", "R$ Adicional", "R$ Coopart.", "R$ Total"]
      : ["Código", "Nome", "Descrição", "Titular", "Dependente", "Total"];

  const linhas = pessoas.map((pessoa) => {
    const lancamento = lancamentos.find((l) => l.pessoaId === pessoa.id);
    const periodo = encontrarPeriodoPlano(periodos, pessoa.filial, tipoPlano, pessoa.tipo, mesReferencia);
    const valorFixo = periodo?.valor ?? 0;
    const total = calcularTotalLancamentoPlanoSaude(lancamento, tipoPlano, periodo);
    const linhaBase = [
      pessoa.codigo || "",
      pessoa.nome,
      pessoa.tipo === "titular" ? "TITULAR" : "DEPENDENTE",
      pessoa.tipo === "titular" ? valorFixo.toFixed(2) : "",
      pessoa.tipo === "dependente" ? valorFixo.toFixed(2) : "",
    ];
    const extras =
      tipoPlano === "saude" ? [(lancamento?.valorAdicional ?? 0).toFixed(2), (lancamento?.valorCoparticipacao ?? 0).toFixed(2)] : [];
    return [...linhaBase, ...extras, total.toFixed(2)];
  });

  void baixarExcel(cabecalho, linhas, `plano-saude-${tipoPlano}`, filial);
  return true;
}
