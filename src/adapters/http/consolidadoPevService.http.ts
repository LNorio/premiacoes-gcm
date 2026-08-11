import type { ConsolidadoPevService, LinhaConsolidadoPev } from "../../services/consolidadoPevService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Resultado } from "../../types";
import { obterMesesCicloPEV } from "../../utils/periodo";
import { colaboradoresServiceHttp } from "./colaboradoresService.http";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";

/** Chaves em português do ciclo Dez→Nov, na mesma ordem de `obterMesesCicloPEV`. */
const CHAVES_MES_API = [
  "dezembro",
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
] as const;

/** Resposta de `GET /api/consolidado` — ver Claude/API.md. */
interface RespostaConsolidado {
  id: number;
  cpf: string;
  nome: string;
  "valor dezembro": number;
  "valor janeiro": number;
  "valor fevereiro": number;
  "valor marco": number;
  "valor abril": number;
  "valor maio": number;
  "valor junho": number;
  "valor julho": number;
  "valor agosto": number;
  "valor setembro": number;
  "valor outubro": number;
  "valor novembro": number;
  "total acumulado": number;
  "base de calculo": number;
  "valor adiantamento": number;
  "premiacao total a receber": number;
}

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

export const consolidadoPevServiceHttp: ConsolidadoPevService = {
  async listarConsolidadoPev(filial, anoCiclo, meses): Promise<Resultado<LinhaConsolidadoPev[]>> {
    try {
      // GET /api/consolidado não devolve a filial de cada colaborador — cruza
      // com /api/usuarios (já usado pelo Cadastro de Colaboradores) para
      // obter filial + telas.premiacoes por id.
      const [resColaboradores, dados] = await Promise.all([
        colaboradoresServiceHttp.listarColaboradores(filial),
        httpClient.get<RespostaConsolidado[]>(
          `/api/consolidado?ano=${anoCiclo}${filial === FILIAL_TODAS ? "" : `&filial=${encodeURIComponent(filial)}`}`,
        ),
      ]);
      if (resColaboradores.status !== "sucesso") {
        return resultadoErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      }
      const colaboradoresPorId = new Map(resColaboradores.dados.map((c) => [c.id, c]));
      const cicloMeses = obterMesesCicloPEV(anoCiclo);

      const linhas: LinhaConsolidadoPev[] = dados
        .filter((linha) => colaboradoresPorId.get(String(linha.id))?.telas.premiacoes)
        .map((linha) => {
          const colaborador = colaboradoresPorId.get(String(linha.id))!;
          const porMes: Record<string, number> = {};
          for (const mes of meses) {
            const indice = cicloMeses.indexOf(mes);
            porMes[mes] = indice === -1 ? 0 : Number(linha[`valor ${CHAVES_MES_API[indice]}` as keyof RespostaConsolidado]);
          }
          return {
            vendedorId: String(linha.id),
            vendedorNome: linha.nome,
            cpf: linha.cpf,
            filial: colaborador.filial,
            porMes,
            totalAcumulado: Number(linha["total acumulado"]),
            baseCalculo: Number(linha["base de calculo"]),
            adiantamento: Number(linha["valor adiantamento"]),
            premiacaoAdicionalReceber: Number(linha["premiacao total a receber"]),
          };
        });
      return resultadoSucesso(linhas);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarAdiantamento(vendedorId, anoCiclo, valor): Promise<Resultado<void>> {
    try {
      await httpClient.put("/api/consolidado/adiantamento", [
        { "id colaborador": Number(vendedorId), "ano referencia": anoCiclo, adiantamento: valor },
      ]);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
