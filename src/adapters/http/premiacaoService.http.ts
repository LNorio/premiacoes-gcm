import { somarCategoriasPremiacao, type LancamentoPremiacao, type PremiacaoService } from "../../services/premiacaoService";
import { resultadoErro, resultadoSucesso, type Colaborador, type Premiacao, type Resultado } from "../../types";
import { ultimoDiaDoMes } from "../../utils/periodo";
import { colaboradoresServiceHttp } from "./colaboradoresService.http";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";
import { buscarPremiacoesAgrupadas } from "./respostaPremiacoesAgrupadas";

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

async function buscarPremiacaoDoColaborador(colaborador: Colaborador, mesReferencia: string): Promise<Premiacao> {
  const resposta = await buscarPremiacoesAgrupadas(
    colaborador.id,
    colaborador.filial,
    `${mesReferencia}-01`,
    ultimoDiaDoMes(mesReferencia),
  );
  const linha = resposta.meses[0]?.dados[0];
  const valores = {
    pev: Number(linha?.pev ?? 0),
    iconic: Number(linha?.iconic ?? 0),
    filtros: Number(linha?.filtros ?? 0),
    campanhasFornecedores: Number(linha?.fornecedores ?? 0),
    inadimplencia: Number(linha?.inadimplencia ?? 0),
  };
  return {
    // Não existe id de registro de premiação nesta API — chave estável derivada de colaborador+mês.
    id: `${colaborador.id}-${mesReferencia}`,
    vendedorId: colaborador.id,
    vendedorNome: colaborador.nome,
    filial: colaborador.filial,
    mesReferencia,
    ...valores,
    total: linha ? Number(linha.total) : somarCategoriasPremiacao(valores),
  };
}

export const premiacaoServiceHttp: PremiacaoService = {
  async listarPremiacoes(filial, mesReferencia): Promise<Resultado<Premiacao[]>> {
    try {
      const resColaboradores = await colaboradoresServiceHttp.listarColaboradores(filial);
      if (resColaboradores.status !== "sucesso") {
        return resultadoErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      }
      const habilitados = resColaboradores.dados.filter((c) => c.telas.premiacoes);
      const premiacoes = await Promise.all(habilitados.map((c) => buscarPremiacaoDoColaborador(c, mesReferencia)));
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
};
