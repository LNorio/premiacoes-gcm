import type { DescontosService } from "../../services/descontosService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Colaborador, type DescontoBonificacao } from "../../types";
import { baixarCSV } from "../../utils/exportar";
import { lerColecao, removerPorId, upsertPorId } from "./db";
import { garantirSeed } from "./seed";

const CHAVE = "descontosBonificacoes";

function habilitadosDaFilial(filial: string): Colaborador[] {
  const colaboradores = lerColecao<Colaborador>("colaboradores");
  const filtrados = filial === FILIAL_TODAS ? colaboradores : colaboradores.filter((c) => c.filial === filial);
  return filtrados.filter((c) => c.telas.descontos);
}

export const descontosServiceMock: DescontosService = {
  async listarDescontos(filial, mesReferencia) {
    garantirSeed();
    const habilitados = habilitadosDaFilial(filial);
    const idsFilial = new Set(habilitados.map((c) => c.id));
    const lancamentos = lerColecao<DescontoBonificacao>(CHAVE).filter(
      (d) => d.mesReferencia === mesReferencia && idsFilial.has(d.vendedorId),
    );
    const colaboradores = habilitados.map((c) => ({ id: c.id, codigo: c.codigo, nome: c.nome }));
    return resultadoSucesso({ colaboradores, lancamentos });
  },

  async salvarDescontos(lancamentos) {
    garantirSeed();
    const salvos = lancamentos.map((lancamento) =>
      upsertPorId<DescontoBonificacao>(CHAVE, { ...lancamento, id: lancamento.id ?? "" }, "desc"),
    );
    return resultadoSucesso(salvos);
  },

  async removerDesconto(id) {
    garantirSeed();
    removerPorId(CHAVE, id);
    return resultadoSucesso(undefined);
  },

  async exportarCSV(filial, mesReferencia) {
    garantirSeed();
    const idsFilial = new Set(habilitadosDaFilial(filial).map((c) => c.id));
    const lancamentos = lerColecao<DescontoBonificacao>(CHAVE).filter(
      (d) => d.mesReferencia === mesReferencia && idsFilial.has(d.vendedorId),
    );
    if (lancamentos.length === 0) return resultadoErro("Não há descontos ou bonificações salvos para exportar.");

    const colaboradores = lerColecao<Colaborador>("colaboradores");
    // Mesmas colunas do CSV gerado pelo backend real (`GET /api/descontos-bonificacoes/exportar-csv`) —
    // não tem CPF nem Mês Referência (só existiam na exportação Excel anterior).
    const linhas = lancamentos.map((d) => {
      const colaborador = colaboradores.find((c) => c.id === d.vendedorId);
      return [colaborador?.nome ?? "", d.tipo, d.valor.toFixed(2), d.observacoes || ""];
    });
    baixarCSV(["nome colaborador", "tipo", "valor", "observacao"], linhas, "descontos-bonificacoes", filial);
    return resultadoSucesso(undefined);
  },
};
