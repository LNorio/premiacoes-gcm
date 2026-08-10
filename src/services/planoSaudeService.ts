import type { PlanoSaudeDependente, PlanoSaudeLancamento, Resultado, TipoPlanoSaude } from "../types";

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
