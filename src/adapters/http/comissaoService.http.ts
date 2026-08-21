import type { ComissaoService } from "../../services/comissaoService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type Comissao, type Resultado } from "../../types";
import { baixarCSVPronto, decodificarCsvBase64 } from "../../utils/exportar";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";

/**
 * Linha de `GET /api/comissoes` — ver `Claude/API (19).md`. `pev` é buscado ao vivo em
 * Premiações pela própria API. `codigo`/`cpf`/`filial` vêm prontos nessa resposta (API
 * 17/19, "Campos de identificação padronizados") — antes precisava cruzar com
 * `/api/usuarios` só pra preencher esses campos. **Roster completo do mês** (API 19): a
 * resposta traz todo colaborador com a tela "Comissão", mesmo sem nada lançado ainda
 * (`comissao`/`garantido` zerados nesse caso) — não precisa mais de uma chamada separada
 * a colaboradores só pra montar a lista de quem pode lançar.
 */
interface RespostaLinhaComissao {
  "id colaborador": number;
  codigo: string;
  "nome colaborador": string;
  cpf: string;
  filial: string;
  funcao: string;
  pev: number;
  comissao: number | string;
  garantido: number | string;
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
      const resposta = await httpClient.get<RespostaComissoes>(
        `/api/comissoes?mes_de_referencia=${mesReferencia}-01${queryFilial(filial)}`,
      );

      const comissoes: Comissao[] = resposta.dados.map((linha) => {
        const vendedorId = String(linha["id colaborador"]);
        return {
          // Não existe id de registro de comissão nesta API — chave sintética, mesmo padrão de Premiação.
          id: `${vendedorId}-${mesReferencia}`,
          vendedorId,
          vendedorNome: linha["nome colaborador"],
          codigo: linha.codigo,
          cpf: linha.cpf,
          cargo: linha.funcao,
          filial: linha.filial,
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
          codigo: "",
          cpf: "",
          cargo: "",
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

  async exportarCSV(filial, mesReferencia): Promise<Resultado<void>> {
    try {
      const resposta = await httpClient.get<{ "arquivo csv": string; mensagem: string }>(
        `/api/comissoes/exportar-csv?mes_de_referencia=${mesReferencia}-01${queryFilial(filial)}`,
      );
      const conteudo = decodificarCsvBase64(resposta["arquivo csv"]);
      if (conteudo.trim().split("\n").length <= 1) {
        return resultadoErro("Não há comissões salvas para exportar.");
      }
      baixarCSVPronto(conteudo, "comissoes", filial);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
