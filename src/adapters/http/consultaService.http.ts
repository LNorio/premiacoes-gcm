import type { CartaoMesConsulta, ConsultaService, FiltroConsulta } from "../../services/consultaService";
import { resultadoErro, resultadoSucesso, type Colaborador, type Resultado } from "../../types";
import { ultimoDiaDoMes } from "../../utils/periodo";
import { colaboradoresServiceHttp } from "./colaboradoresService.http";
import { ErroHttp } from "./httpClient";
import { buscarPremiacoesAgrupadas } from "./respostaPremiacoesAgrupadas";

type LinhaCartao = CartaoMesConsulta["linhas"][number];

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

/**
 * `GET /api/premiacoes` agora agrupa por mês (`"meses"`) — uma única
 * requisição por colaborador (com `?id=`) já cobre todo o período pedido,
 * sem precisar de uma chamada por mês (ver Claude/eventos-roadmap.md).
 */
async function buscarCartoesDoColaborador(
  colaborador: Colaborador,
  filtro: FiltroConsulta,
): Promise<{ mesReferencia: string; linha: LinhaCartao }[]> {
  const resposta = await buscarPremiacoesAgrupadas(
    colaborador.id,
    colaborador.filial,
    filtro.de ? `${filtro.de}-01` : undefined,
    filtro.ate ? ultimoDiaDoMes(filtro.ate) : undefined,
  );
  return resposta.meses.map((mes) => {
    const linhaApi = mes.dados[0];
    const linha: LinhaCartao = {
      vendedorId: colaborador.id,
      vendedorNome: colaborador.nome,
      cpf: colaborador.cpf,
      filial: colaborador.filial,
      total: linhaApi ? Number(linhaApi.total) : mes.subtotal,
      pev: Number(linhaApi?.pev ?? 0),
      iconic: Number(linhaApi?.iconic ?? 0),
      filtros: Number(linhaApi?.filtros ?? 0),
      campanhasFornecedores: Number(linhaApi?.fornecedores ?? 0),
      inadimplencia: Number(linhaApi?.inadimplencia ?? 0),
    };
    return { mesReferencia: mes["mes de referencia"].slice(0, 7), linha };
  });
}

export const consultaServiceHttp: ConsultaService = {
  async listarConsulta(filial, filtro, escopo): Promise<Resultado<CartaoMesConsulta[]>> {
    try {
      const resColaboradores = await colaboradoresServiceHttp.listarColaboradores(filial);
      if (resColaboradores.status !== "sucesso") {
        return resultadoErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      }
      const colaboradoresAlvo = escopo
        ? resColaboradores.dados.filter((c) => c.id === escopo.vendedorId)
        : resColaboradores.dados;

      const porColaborador = await Promise.all(colaboradoresAlvo.map((c) => buscarCartoesDoColaborador(c, filtro)));

      const porMes = new Map<string, LinhaCartao[]>();
      for (const entradas of porColaborador) {
        for (const { mesReferencia, linha } of entradas) {
          const linhas = porMes.get(mesReferencia) ?? [];
          linhas.push(linha);
          porMes.set(mesReferencia, linhas);
        }
      }
      const cartoes: CartaoMesConsulta[] = [...porMes.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mesReferencia, linhas]) => ({ mesReferencia, linhas }));

      return resultadoSucesso(cartoes);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
