import type { ColaboradorComDescontos, DescontosService, NovoLancamentoDesconto } from "../../services/descontosService";
import { FILIAL_TODAS, resultadoErro, resultadoSucesso, type DescontoBonificacao, type Resultado } from "../../types";
import { baixarCSVPronto, decodificarCsvBase64 } from "../../utils/exportar";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";

/** Um lançamento dentro de `GET /api/descontos-bonificacoes` — ver Claude/API.md. */
interface RespostaLancamentoDesconto {
  id: number;
  tipo: DescontoBonificacao["tipo"];
  valor: string;
  observacao: string;
}

/**
 * Linha de `GET /api/descontos-bonificacoes` — ver `Claude/API (18).md`. Roster inteiro do
 * mês: todo colaborador com a tela "Descontos e Bonificações" aparece, com
 * `"descontos e bonificacoes": []` quando ainda não lançou nada — `codigo` (API 18) fecha o
 * que faltava pra não precisar mais de uma chamada separada a colaboradores.
 */
interface RespostaLinhaDesconto {
  "id colaborador": number;
  codigo: string;
  "nome colaborador": string;
  "descontos e bonificacoes": RespostaLancamentoDesconto[];
  total: number;
}

interface RespostaDescontos {
  total: number;
  dados: RespostaLinhaDesconto[];
}

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

function queryFilial(filial: string): string {
  return filial === FILIAL_TODAS ? "" : `&filial=${encodeURIComponent(filial)}`;
}

/** `DescontoBonificacao.id` codifica os dois ids que `DELETE /api/descontos-bonificacoes` exige. */
function paraIdComposto(vendedorId: string, idDesconto: number): string {
  return `${vendedorId}:${idDesconto}`;
}

function separarIdComposto(id: string): { idColaborador: number; idDesconto: number } {
  const [idColaborador, idDesconto] = id.split(":");
  return { idColaborador: Number(idColaborador), idDesconto: Number(idDesconto) };
}

async function buscarDescontosPorApi(
  filial: string,
  mesReferencia: string,
): Promise<{ colaboradores: ColaboradorComDescontos[]; lancamentos: DescontoBonificacao[] }> {
  const resposta = await httpClient.get<RespostaDescontos>(
    `/api/descontos-bonificacoes?mes_de_referencia=${mesReferencia}-01${queryFilial(filial)}`,
  );
  const colaboradores = resposta.dados.map((linha) => ({
    id: String(linha["id colaborador"]),
    codigo: linha.codigo,
    nome: linha["nome colaborador"],
  }));
  const lancamentos = resposta.dados.flatMap((linha) => {
    const vendedorId = String(linha["id colaborador"]);
    return linha["descontos e bonificacoes"].map((item) => ({
      id: paraIdComposto(vendedorId, item.id),
      vendedorId,
      mesReferencia,
      tipo: item.tipo,
      valor: Number(item.valor),
      observacoes: item.observacao ?? "",
    }));
  });
  return { colaboradores, lancamentos };
}

export const descontosServiceHttp: DescontosService = {
  async listarDescontos(filial, mesReferencia) {
    try {
      return resultadoSucesso(await buscarDescontosPorApi(filial, mesReferencia));
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  /**
   * `PUT /api/descontos-bonificacoes` só cria lançamentos (sempre soma ao que já existe,
   * nunca atualiza por id — confirmado ao vivo contra a API, ver Claude/eventos-roadmap.md).
   * Para editar um lançamento existente, a única forma é apagar e recriar: todo lançamento
   * já salvo (tem `id`) é removido e recriado do zero a cada "Salvar", mesmo que o valor não
   * tenha mudado — o id interno muda a cada salvamento, mas isso nunca é exposto na tela.
   */
  async salvarDescontos(lancamentos): Promise<Resultado<DescontoBonificacao[]>> {
    try {
      const existentes = lancamentos.filter((l): l is typeof l & { id: string } => Boolean(l.id));
      await Promise.all(
        existentes.map((l) => {
          const { idColaborador, idDesconto } = separarIdComposto(l.id);
          return httpClient.delete("/api/descontos-bonificacoes", {
            id_do_desconto: idDesconto,
            id_do_colaborador: idColaborador,
          });
        }),
      );

      const porColaborador = new Map<string, { mesReferencia: string; itens: NovoLancamentoDesconto[] }>();
      for (const lancamento of lancamentos) {
        const grupo = porColaborador.get(lancamento.vendedorId) ?? { mesReferencia: lancamento.mesReferencia, itens: [] };
        grupo.itens.push(lancamento);
        porColaborador.set(lancamento.vendedorId, grupo);
      }
      const corpo = [...porColaborador.entries()].map(([vendedorId, grupo]) => ({
        "id colaborador": Number(vendedorId),
        "mes de referencia": `${grupo.mesReferencia}-01`,
        dados: grupo.itens.map((item) => ({ tipo: item.tipo, valor: item.valor, observacoes: item.observacoes })),
      }));
      if (corpo.length > 0) {
        await httpClient.put("/api/descontos-bonificacoes", corpo);
      }

      const mesReferencia = lancamentos[0]?.mesReferencia;
      if (!mesReferencia) return resultadoSucesso([]);

      const vendedoresAlvo = new Set(lancamentos.map((l) => l.vendedorId));
      const { lancamentos: atuais } = await buscarDescontosPorApi(FILIAL_TODAS, mesReferencia);
      return resultadoSucesso(atuais.filter((d) => vendedoresAlvo.has(d.vendedorId)));
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async removerDesconto(id): Promise<Resultado<void>> {
    try {
      const { idColaborador, idDesconto } = separarIdComposto(id);
      await httpClient.delete("/api/descontos-bonificacoes", { id_do_desconto: idDesconto, id_do_colaborador: idColaborador });
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async exportarCSV(filial, mesReferencia): Promise<Resultado<void>> {
    try {
      const resposta = await httpClient.get<{ "arquivo csv": string; mensagem: string }>(
        `/api/descontos-bonificacoes/exportar-csv?mes_de_referencia=${mesReferencia}-01${queryFilial(filial)}`,
      );
      const conteudo = decodificarCsvBase64(resposta["arquivo csv"]);
      if (conteudo.trim().split("\n").length <= 1) {
        return resultadoErro("Não há descontos ou bonificações salvos para exportar.");
      }
      baixarCSVPronto(conteudo, "descontos-bonificacoes", filial);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
