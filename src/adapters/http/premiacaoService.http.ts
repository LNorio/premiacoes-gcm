import type { LancamentoPremiacao, PremiacaoService } from "../../services/premiacaoService";
import { resultadoErro, resultadoSucesso, type Premiacao, type Resultado } from "../../types";
import { baixarCSVPronto } from "../../utils/exportar";
import { ultimoDiaDoMes } from "../../utils/periodo";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";
import { buscarCsvPremiacoes, buscarPremiacoesAgrupadas } from "./respostaPremiacoesAgrupadas";

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

/**
 * Uma única requisição pra filial inteira (`Claude/API (16).md`): pedindo `data_inicio`/
 * `data_fim` do mesmo mês, a própria API já devolve o "roster do mês" — todo colaborador
 * com a tela Premiações aparece, com zero pra quem ainda não tem lançamento. Não precisa
 * mais buscar a lista de colaboradores nem filtrar por `telas.premiacoes` no cliente — a
 * API já filtra por acesso à tela sozinha (ver "Controle de acesso por tela" no documento).
 */
async function buscarPremiacoesDaFilial(filial: string, mesReferencia: string): Promise<Premiacao[]> {
  const resposta = await buscarPremiacoesAgrupadas(undefined, filial, `${mesReferencia}-01`, ultimoDiaDoMes(mesReferencia));
  return (resposta.meses[0]?.dados ?? []).map((linha) => ({
    // Não existe id de registro de premiação nesta API — chave estável derivada de colaborador+mês.
    id: `${linha["id colaborador"]}-${mesReferencia}`,
    vendedorId: String(linha["id colaborador"]),
    vendedorNome: linha["nome colaborador"],
    codigo: linha.codigo,
    filial: linha.filial,
    mesReferencia,
    pev: Number(linha.pev),
    iconic: Number(linha.iconic),
    filtros: Number(linha.filtros),
    campanhasFornecedores: Number(linha.fornecedores),
    inadimplencia: Number(linha.inadimplencia),
    total: Number(linha.total),
  }));
}

export const premiacaoServiceHttp: PremiacaoService = {
  async listarPremiacoes(filial, mesReferencia): Promise<Resultado<Premiacao[]>> {
    try {
      const premiacoes = await buscarPremiacoesDaFilial(filial, mesReferencia);
      return resultadoSucesso(premiacoes);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarPremiacoes(filial, mesReferencia, linhas: LancamentoPremiacao[]): Promise<Resultado<Premiacao[]>> {
    try {
      await httpClient.put("/api/premiacoes", {
        mes_de_referencia: `${mesReferencia}-01`,
        dados: linhas.map((linha) => ({
          "id colaborador": Number(linha.vendedorId),
          "mes de referencia": `${mesReferencia}-01`,
          pev: linha.pev,
          "premiacao iconic": linha.iconic,
          filtros: linha.filtros,
          "campanhas de fornecedores": linha.campanhasFornecedores,
          inadimplencia: linha.inadimplencia,
        })),
      });
      return await premiacaoServiceHttp.listarPremiacoes(filial, mesReferencia);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async exportarPremiacoesCSV(filial, mesReferencia): Promise<Resultado<void>> {
    try {
      const conteudo = await buscarCsvPremiacoes({
        filial,
        dataInicio: `${mesReferencia}-01`,
        dataFim: ultimoDiaDoMes(mesReferencia),
      });
      // O backend sempre devolve pelo menos a linha de cabeçalho — sem lançamento
      // nenhum, o conteúdo é só essa linha.
      if (conteudo.trim().split("\n").length <= 1) {
        return resultadoErro("Não há premiações salvas para exportar.");
      }
      baixarCSVPronto(conteudo, "premiacoes", filial);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
