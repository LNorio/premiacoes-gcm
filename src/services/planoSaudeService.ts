import { baixarExcel } from "../utils/exportar";
import {
  FILIAIS_VALOR_DIFERENCIADO_SAUDE,
  VALOR_PADRAO_ODONTOLOGICO,
  VALOR_PADRAO_SAUDE_DIFERENCIADO,
  VALOR_PADRAO_SAUDE_PADRAO,
  type Colaborador,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
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

/** Valor fixo de Titular/Dependente por filial e tipo de plano — nunca digitado (documento técnico, Seção 3.5/3.6.2). */
export function obterValorPadraoSaude(filial: string, tipoPlano: TipoPlanoSaude): number {
  if (tipoPlano === "odontologico") return VALOR_PADRAO_ODONTOLOGICO;
  return (FILIAIS_VALOR_DIFERENCIADO_SAUDE as readonly string[]).includes(filial)
    ? VALOR_PADRAO_SAUDE_DIFERENCIADO
    : VALOR_PADRAO_SAUDE_PADRAO;
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

/** Valor fixo (Titular ou Dependente) + campos extras do lançamento, se houver. */
export function calcularTotalLancamentoPlanoSaude(
  pessoa: PessoaPlanoSaude,
  lancamento: PlanoSaudeLancamento | undefined,
  tipoPlano: TipoPlanoSaude,
): number {
  const valorFixo = obterValorPadraoSaude(pessoa.filial, tipoPlano);
  const extras = tipoPlano === "saude" ? (lancamento?.valorAdicional ?? 0) + (lancamento?.valorCoparticipacao ?? 0) : 0;
  return valorFixo + extras;
}

/** Documento técnico, Seção 4 — colunas variam por sub-aba (Saúde tem valores extras editáveis; Odontológico não). */
export function exportarPlanoSaudeExcel(
  pessoas: PessoaPlanoSaude[],
  lancamentos: PlanoSaudeLancamento[],
  tipoPlano: TipoPlanoSaude,
  filial: string,
): boolean {
  if (pessoas.length === 0) return false;

  const cabecalho =
    tipoPlano === "saude"
      ? ["Código", "Nome", "Descrição", "R$ Titular", "R$ Dep.", "R$ Adicional", "R$ Coopart.", "R$ Total"]
      : ["Código", "Nome", "Descrição", "Titular", "Dependente", "Total"];

  const linhas = pessoas.map((pessoa) => {
    const lancamento = lancamentos.find((l) => l.pessoaId === pessoa.id);
    const valorFixo = obterValorPadraoSaude(pessoa.filial, tipoPlano);
    const total = calcularTotalLancamentoPlanoSaude(pessoa, lancamento, tipoPlano);
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
