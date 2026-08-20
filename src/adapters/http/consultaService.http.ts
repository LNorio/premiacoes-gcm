import type { CartaoMesConsulta, ConsultaService, FiltroConsulta } from "../../services/consultaService";
import { resultadoErro, resultadoSucesso, type Resultado } from "../../types";
import { baixarCSVPronto } from "../../utils/exportar";
import { primeiroDiaDoProximoMes, ultimoDiaDoMes } from "../../utils/periodo";
import { ErroHttp } from "./httpClient";
import { buscarCsvPremiacoes, buscarPremiacoesAgrupadas } from "./respostaPremiacoesAgrupadas";

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

/**
 * Quando `data_inicio`/`data_fim` caem no mesmo mês, `GET /api/premiacoes` passa a
 * incluir o "roster do mês" (`Claude/API (16).md`) — uma linha zerada por colaborador
 * habilitado sem lançamento nenhum. Ótimo pra Planilha de Premiação (que precisa de
 * uma linha editável pra cada um), péssimo pra Consulta — que é histórico só do que
 * foi de fato lançado, e passaria a mostrar cartões fantasma de R$0,00 pra quem nunca
 * lançou nada (confirmado ao vivo: some ao consultar um intervalo maior que 1 mês).
 * Pra evitar isso sem voltar a pagar o preço de uma chamada por colaborador, estende
 * `data_fim` até o dia 1º do mês seguinte — sai do caso "mesmo mês" sem excluir nenhum
 * dia do período pedido. O mês extra que pode vazar por causa disso é descartado depois
 * (ver `listarConsulta`), então nunca aparece pro usuário.
 */
function paraIntervalo(filtro: FiltroConsulta): { dataInicio?: string; dataFim?: string } {
  const dataInicio = filtro.de ? `${filtro.de}-01` : undefined;
  const dataFim = filtro.ate
    ? dataInicio && dataInicio.slice(0, 7) === filtro.ate
      ? primeiroDiaDoProximoMes(filtro.ate)
      : ultimoDiaDoMes(filtro.ate)
    : undefined;
  return { dataInicio, dataFim };
}

export const consultaServiceHttp: ConsultaService = {
  async listarConsulta(filial, filtro, escopo): Promise<Resultado<CartaoMesConsulta[]>> {
    try {
      // Uma única requisição pra filial inteira (Claude/API (15).md — cada linha já
      // traz "id colaborador"); quando `escopo` vem preenchido (perfil vendedor), o
      // `?id=` já restringe a resposta a esse colaborador só — nem precisa buscar a
      // lista de colaboradores pra filtrar depois, e o navegador do vendedor nunca
      // chega a receber premiação de outra pessoa.
      const { dataInicio, dataFim } = paraIntervalo(filtro);
      const resposta = await buscarPremiacoesAgrupadas(escopo?.vendedorId, filial, dataInicio, dataFim);

      const cartoes: CartaoMesConsulta[] = resposta.meses
        // Descarta o mês seguinte que pode ter vazado por causa do "data_fim" estendido
        // em paraIntervalo (ver comentário lá) — nunca chega a aparecer pro usuário.
        .filter((mes) => {
          const mesReferencia = mes["mes de referencia"].slice(0, 7);
          return (!filtro.de || mesReferencia >= filtro.de) && (!filtro.ate || mesReferencia <= filtro.ate);
        })
        .map((mes) => ({
          mesReferencia: mes["mes de referencia"].slice(0, 7),
          linhas: mes.dados.map((linha) => ({
            vendedorId: String(linha["id colaborador"]),
            vendedorNome: linha["nome colaborador"],
            // CPF não vem nessa resposta — não é exibido em tela, só era usado na
            // exportação CSV, que agora vem pronta do backend (sem essa coluna também).
            cpf: "",
            filial: linha.filial,
            total: Number(linha.total),
            pev: Number(linha.pev),
            iconic: Number(linha.iconic),
            filtros: Number(linha.filtros),
            campanhasFornecedores: Number(linha.fornecedores),
            inadimplencia: Number(linha.inadimplencia),
          })),
        }))
        .sort((a, b) => a.mesReferencia.localeCompare(b.mesReferencia));

      return resultadoSucesso(cartoes);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async exportarCSV(filial, _filtro, escopo): Promise<Resultado<void>> {
    try {
      // Sempre o histórico inteiro (sem filtro de período) — mesmo comportamento de
      // antes da troca pro backend, ver comentário na interface.
      const conteudo = await buscarCsvPremiacoes({ filial, colaboradorId: escopo?.vendedorId });
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
