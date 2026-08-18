import { baixarExcel } from "../utils/exportar";
import {
  type Colaborador,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
  type PlanoSaudePeriodo,
  type Resultado,
  type TipoPlanoSaude,
  type TotaisDesligadosPlano,
} from "../types";

export interface PlanoSaudeService {
  // Sub-aba Cadastro (Titulares e Dependentes)
  listarDependentes(titularId: string): Promise<Resultado<PlanoSaudeDependente[]>>;
  salvarDependente(dependente: Omit<PlanoSaudeDependente, "id"> & { id?: string }): Promise<Resultado<PlanoSaudeDependente>>;
  removerDependente(id: string): Promise<Resultado<void>>;
  salvarAdesao(titularId: string, tipo: TipoPlanoSaude, valor: boolean): Promise<Resultado<void>>;
  /** Adesão própria do dependente — ver nota em `PlanoSaudeDependente`. */
  salvarAdesaoDependente(dependenteId: string, tipo: TipoPlanoSaude, valor: boolean): Promise<Resultado<void>>;

  // Sub-aba Lançamento
  /**
   * `totalDesligados` vem do mesmo `GET /api/lancamentos` — total agregado (não itemizado por
   * pessoa, mas separado por Titular/Dependente/Adicional/Coopart.) dos colaboradores desligados;
   * em `filial=Todas`, já vem somado pela API.
   */
  listarLancamentosPlanoSaude(
    filial: string,
    mesReferencia: string,
    tipo: TipoPlanoSaude,
  ): Promise<Resultado<{ lancamentos: PlanoSaudeLancamento[]; totalDesligados: TotaisDesligadosPlano }>>;
  salvarLancamentoPlanoSaude(lancamento: PlanoSaudeLancamento): Promise<Resultado<PlanoSaudeLancamento>>;
  /** Só permitido numa filial específica — a API não aceita gravar o total agregado de "todas". */
  salvarTotalDesligadosPlanoSaude(
    filial: string,
    mesReferencia: string,
    tipoPlano: TipoPlanoSaude,
    valores: TotaisDesligadosPlano,
  ): Promise<Resultado<TotaisDesligadosPlano>>;

  // Sub-aba Período (Admin, por filial) — fechamento de período: só um `ativo` por filial + tipo de plano + tipo de pessoa.
  listarPeriodosPlanoSaude(filial: string, tipoPlano: TipoPlanoSaude): Promise<Resultado<PlanoSaudePeriodo[]>>;
  /**
   * `dataInicio` opcional (YYYY-MM-DD, pode ser retroativa) — quando não informada, a API usa
   * hoje. `dataFim` opcional — quando informada, o período já nasce encerrado (histórico direto,
   * sem concorrer com um período vigente existente).
   */
  salvarPeriodoPlanoSaude(
    filial: string,
    tipoPlano: TipoPlanoSaude,
    tipoPessoa: "titular" | "dependente",
    valor: number,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<Resultado<PlanoSaudePeriodo>>;
  /** `dataValidade` opcional (YYYY-MM-DD) — quando não informada, a API usa a data de hoje. */
  encerrarPeriodoPlanoSaude(periodo: PlanoSaudePeriodo, dataValidade?: string): Promise<Resultado<PlanoSaudePeriodo>>;
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

/**
 * Período (filial + tipo de plano + tipo de pessoa) vigente no mês pedido — o que começou
 * (`dataInicio`, que pode ser retroativa) até aquele mês e ainda não tinha sido encerrado
 * (`dataValidade` nula) ou só encerrou depois dele. Entre os candidatos que batem no mês, o
 * `ativo` sempre vence (só pode existir um por combinação); sem nenhum vigente batendo (mês já
 * ficou pra trás de um período fechado), o candidato com `dataCriacao` mais recente prevalece.
 * **Não confiar na ordem do array** pra decidir "mais recente" — a API não garante nenhuma ordem
 * específica em `GET /api/valores-plano-saude` (confirmado ao vivo: um período seed antigo, já
 * encerrado no mês corrente, apareceu depois de um período novo e realmente vigente na resposta,
 * o que fazia a busca por posição pegar o registro errado).
 */
export function encontrarPeriodoPlano(
  periodos: PlanoSaudePeriodo[],
  filial: string,
  tipoPlano: TipoPlanoSaude,
  tipoPessoa: "titular" | "dependente",
  mesReferencia: string,
): PlanoSaudePeriodo | undefined {
  const [inicioMes, fimMes] = limitesDoMes(mesReferencia);
  const candidatos = periodos.filter(
    (periodo) =>
      periodo.filial === filial &&
      periodo.tipoPlano === tipoPlano &&
      periodo.tipoPessoa === tipoPessoa &&
      periodo.dataInicio <= fimMes &&
      (periodo.dataValidade === null || periodo.dataValidade >= inicioMes),
  );
  if (candidatos.length === 0) return undefined;
  const vigente = candidatos.find((periodo) => periodo.ativo);
  if (vigente) return vigente;
  return candidatos.reduce((maisRecente, atual) => (atual.dataCriacao > maisRecente.dataCriacao ? atual : maisRecente));
}

/**
 * Uma linha por pessoa (titular, depois cada um dos seus dependentes), na ordem do
 * cadastro — só entram famílias cujo titular tem adesão ao `tipoPlano` pedido, e dentro delas
 * só os dependentes que também têm adesão própria (default aderido quando `undefined`).
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
      const dependenteAderido = tipoPlano === "saude" ? dependente.adesaoSaude !== false : dependente.adesaoOdontologico !== false;
      if (!dependenteAderido) continue;

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
