import type { ComissaoService } from "../../services/comissaoService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Comissao, type Resultado } from "../../types";
import { colaboradoresServiceHttp } from "./colaboradoresService.http";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";

/** Linha de `GET /api/comissoes` — ver Claude/API.md. `pev` é buscado ao vivo em Premiações pela própria API. */
interface RespostaLinhaComissao {
  "id colaborador": number;
  "nome colaborador": string;
  cpf: string;
  funcao: string;
  pev: number;
  comissao: string;
  garantido: string;
}

interface RespostaComissoes {
  dados: RespostaLinhaComissao[];
  "total pev": number;
  "total comissao": number;
  "total garantido": number;
}

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

function queryFilial(filial: string): string {
  return filial === FILIAL_TODAS ? "" : `&filial=${encodeURIComponent(filial)}`;
}

export const comissaoServiceHttp: ComissaoService = {
  async listarComissoes(filial, mesReferencia): Promise<Resultado<Comissao[]>> {
    try {
      // GET /api/comissoes não devolve a filial de cada colaborador — cruza com
      // /api/usuarios (mesmo padrão do Consolidado PEV) para preenchê-la.
      const [resColaboradores, resposta] = await Promise.all([
        colaboradoresServiceHttp.listarColaboradores(filial),
        httpClient.get<RespostaComissoes>(`/api/comissoes?mes_de_referencia=${mesReferencia}-01${queryFilial(filial)}`),
      ]);
      if (resColaboradores.status !== "sucesso") {
        return resultadoErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      }
      const filialPorId = new Map(resColaboradores.dados.map((c) => [c.id, c.filial]));

      const comissoes: Comissao[] = resposta.dados.map((linha) => {
        const vendedorId = String(linha["id colaborador"]);
        return {
          // Não existe id de registro de comissão nesta API — chave sintética, mesmo padrão de Premiação.
          id: `${vendedorId}-${mesReferencia}`,
          vendedorId,
          vendedorNome: linha["nome colaborador"],
          filial: filialPorId.get(vendedorId) ?? filial,
          mesReferencia,
          pev: Number(linha.pev),
          valor: Number(linha.comissao),
          garantido: Number(linha.garantido),
        };
      });
      return resultadoSucesso(comissoes);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarComissao(filial, mesReferencia, linha): Promise<Resultado<Comissao>> {
    try {
      await httpClient.put("/api/comissoes", [
        {
          "id colaborador": Number(linha.vendedorId),
          "mes de referencia": `${mesReferencia}-01`,
          comissao: linha.valor,
          garantido: linha.garantido,
        },
      ]);
      const resLista = await comissaoServiceHttp.listarComissoes(filial, mesReferencia);
      if (resLista.status !== "sucesso") {
        return resultadoErro(resLista.status === "erro" ? resLista.mensagem : "Falha ao salvar.");
      }
      const salvo = resLista.dados.find((c) => c.vendedorId === linha.vendedorId);
      return resultadoSucesso(
        salvo ?? {
          id: `${linha.vendedorId}-${mesReferencia}`,
          vendedorId: linha.vendedorId,
          vendedorNome: "",
          filial,
          mesReferencia,
          pev: 0,
          valor: linha.valor,
          garantido: linha.garantido,
        },
      );
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
