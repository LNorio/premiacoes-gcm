import type { PlanoSaudeService } from "../../services/planoSaudeService";
import {
  FILIAL_TODAS,
  resultadoErro,
  resultadoSucesso,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
  type PlanoSaudePeriodo,
  type TipoPlanoSaude,
} from "../../types";
import { httpClient } from "./cliente";
import { ErroHttp } from "./httpClient";

function paraMensagemErro(erro: unknown): string {
  return erro instanceof ErroHttp ? erro.message : "Não foi possível conectar ao servidor. Tente novamente.";
}

function queryFilial(filial: string): string {
  return filial === FILIAL_TODAS ? "" : `&filial=${encodeURIComponent(filial)}`;
}

// ---------- Dependentes ----------

/**
 * `GET /api/dependentes` — `Claude/API (4).md` não dá um exemplo de resposta; shape assumido a
 * partir dos campos do `POST`/`PUT` (confirmado em produção que o endpoint devolve array puro,
 * igual `/api/valores-plano-saude` — não `{"dados": [...]}` como Lançamentos/Descontos).
 */
interface RespostaDependente {
  id: number;
  nome: string;
  cpf: string | null;
  "id colaborador": number;
}

function paraDependente(resposta: RespostaDependente): PlanoSaudeDependente {
  return { id: String(resposta.id), vendedorId: String(resposta["id colaborador"]), nome: resposta.nome, cpf: resposta.cpf ?? "" };
}

// ---------- Lançamentos ----------

/** Linha de `GET /api/lancamentos` (confirmado ao vivo contra a API real) — vem dentro de `"dados"`, já com o valor calculado (não usado aqui: a tela recalcula a partir do período, ver `encontrarPeriodoPlano`). */
interface RespostaLinhaLancamento {
  "id colaborador": number;
  "id dependente": number | null;
  "valor adicional": number;
  "valor coparticipacao": number;
}
interface RespostaLancamentos {
  dados: RespostaLinhaLancamento[];
}

function paraLancamento(linha: RespostaLinhaLancamento, tipoPlano: TipoPlanoSaude, mesReferencia: string): PlanoSaudeLancamento {
  const titularId = String(linha["id colaborador"]);
  const idDependente = linha["id dependente"];
  const pessoaId = idDependente !== null ? String(idDependente) : titularId;
  return {
    // API não tem id de lançamento — chave sintética, mesmo padrão de Premiação/Comissão.
    id: `${titularId}-${idDependente ?? "titular"}-${tipoPlano}-${mesReferencia}`,
    pessoaId,
    titularId,
    mesReferencia,
    tipoPlano,
    valorAdicional: Number(linha["valor adicional"] ?? 0),
    valorCoparticipacao: Number(linha["valor coparticipacao"] ?? 0),
  };
}

// ---------- Valores de Plano de Saúde (Período) ----------

/** `GET /api/valores-plano-saude` — confirmado ao vivo contra a API real, array puro. */
interface RespostaPeriodo {
  id: number;
  filial: string;
  "tipo plano": TipoPlanoSaude;
  "tipo pessoa": "titular" | "dependente";
  valor: number;
  ativo: boolean;
  "data inicio": string;
  "data validade": string | null;
  "data criacao": string;
}

function paraPeriodo(resposta: RespostaPeriodo): PlanoSaudePeriodo {
  return {
    id: String(resposta.id),
    filial: resposta.filial,
    tipoPlano: resposta["tipo plano"],
    tipoPessoa: resposta["tipo pessoa"],
    valor: Number(resposta.valor),
    ativo: resposta.ativo,
    dataInicio: resposta["data inicio"],
    dataCriacao: resposta["data criacao"],
    dataValidade: resposta["data validade"],
  };
}

export const planoSaudeServiceHttp: PlanoSaudeService = {
  async listarDependentes(titularId) {
    try {
      const resposta = await httpClient.get<RespostaDependente[]>(`/api/dependentes?id%20colaborador=${titularId}`);
      return resultadoSucesso(resposta.map(paraDependente));
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarDependente(dependente) {
    try {
      if (dependente.id) {
        await httpClient.put(`/api/dependentes/${dependente.id}`, { nome: dependente.nome, cpf: dependente.cpf || undefined });
        return resultadoSucesso({ id: dependente.id, vendedorId: dependente.vendedorId, nome: dependente.nome, cpf: dependente.cpf });
      }

      await httpClient.post(`/api/dependentes`, {
        nome: dependente.nome,
        cpf: dependente.cpf || undefined,
        "id colaborador": Number(dependente.vendedorId),
      });
      // POST não devolve o registro criado (sem id, mesmo padrão de /api/usuarios) — relista para obter o id real.
      const todos = await httpClient.get<RespostaDependente[]>(`/api/dependentes?id%20colaborador=${dependente.vendedorId}`);
      const criado = todos.find((d) => d.nome === dependente.nome && (d.cpf ?? "") === dependente.cpf);
      return resultadoSucesso(
        criado ? paraDependente(criado) : { id: "", vendedorId: dependente.vendedorId, nome: dependente.nome, cpf: dependente.cpf },
      );
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async removerDependente(id) {
    try {
      await httpClient.delete(`/api/dependentes/${id}`);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarAdesao(titularId, tipo, valor) {
    try {
      const campo = tipo === "saude" ? "plano saude" : "plano odontologico";
      await httpClient.put(`/api/usuarios/${titularId}`, { [campo]: valor });
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  // A API de Dependentes (Claude/API (7).md) não tem nenhum campo de adesão — só nome/cpf.
  // Sem endpoint pra chamar, então isso não persiste de verdade contra o backend real ainda;
  // fica só no estado da tela (React), perdido ao recarregar, até a API ganhar suporte.
  async salvarAdesaoDependente() {
    return resultadoSucesso(undefined);
  },

  async listarLancamentosPlanoSaude(filial, mesReferencia, tipoPlano) {
    try {
      const resposta = await httpClient.get<RespostaLancamentos>(
        `/api/lancamentos?mes_de_referencia=${mesReferencia}-01&tipo_plano=${tipoPlano}${queryFilial(filial)}`,
      );
      return resultadoSucesso(resposta.dados.map((linha) => paraLancamento(linha, tipoPlano, mesReferencia)));
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarLancamentoPlanoSaude(lancamento) {
    try {
      const ehDependente = lancamento.pessoaId !== lancamento.titularId;
      await httpClient.put("/api/lancamentos", [
        {
          "id colaborador": Number(lancamento.titularId),
          ...(ehDependente ? { "id dependente": Number(lancamento.pessoaId) } : {}),
          "tipo plano": lancamento.tipoPlano,
          "mes de referencia": `${lancamento.mesReferencia}-01`,
          "valor adicional": lancamento.valorAdicional ?? 0,
          "valor coparticipacao": lancamento.valorCoparticipacao ?? 0,
        },
      ]);
      // PUT não devolve o registro salvo (mesmo padrão de Comissão/Premiação) — relista pra obter a verdade.
      const resLista = await planoSaudeServiceHttp.listarLancamentosPlanoSaude(FILIAL_TODAS, lancamento.mesReferencia, lancamento.tipoPlano);
      if (resLista.status !== "sucesso") return resultadoErro(resLista.status === "erro" ? resLista.mensagem : "Falha ao salvar.");
      const salvo = resLista.dados.find((l) => l.pessoaId === lancamento.pessoaId);
      return resultadoSucesso(salvo ?? lancamento);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async listarPeriodosPlanoSaude(filial, tipoPlano) {
    try {
      const resposta = await httpClient.get<RespostaPeriodo[]>(`/api/valores-plano-saude?tipo_plano=${tipoPlano}${queryFilial(filial)}`);
      return resultadoSucesso(resposta.map(paraPeriodo));
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarPeriodoPlanoSaude(filial, tipoPlano, tipoPessoa, valor, dataInicio, dataFim) {
    try {
      await httpClient.post("/api/valores-plano-saude", {
        filial,
        "tipo plano": tipoPlano,
        "tipo pessoa": tipoPessoa,
        valor,
        ...(dataInicio ? { "data inicio": dataInicio } : {}),
        ...(dataFim ? { "data fim": dataFim } : {}),
      });
      // POST não devolve o registro criado — relista pra obter a verdade. Sem "data fim", só pode
      // existir um vigente por filial/tipo/tipo de pessoa; com "data fim", o período já nasce
      // encerrado, então identifica pelo valor/datas que acabaram de ser enviados.
      const resLista = await planoSaudeServiceHttp.listarPeriodosPlanoSaude(filial, tipoPlano);
      if (resLista.status !== "sucesso") return resultadoErro(resLista.status === "erro" ? resLista.mensagem : "Falha ao cadastrar.");
      const criado = dataFim
        ? resLista.dados.find(
            (p) => p.tipoPessoa === tipoPessoa && p.valor === valor && p.dataValidade === dataFim && (!dataInicio || p.dataInicio === dataInicio),
          )
        : resLista.dados.find((p) => p.ativo && p.tipoPessoa === tipoPessoa);
      return criado ? resultadoSucesso(criado) : resultadoErro("Período cadastrado, mas não encontrado ao relistar.");
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async encerrarPeriodoPlanoSaude(periodo, dataValidade) {
    try {
      await httpClient.put(`/api/valores-plano-saude/${periodo.id}/encerrar`, dataValidade ? { "data validade": dataValidade } : {});
      // Resposta do endpoint de encerrar não é documentada — relista pra obter a verdade em vez de arriscar montar o registro à mão.
      const resLista = await planoSaudeServiceHttp.listarPeriodosPlanoSaude(periodo.filial, periodo.tipoPlano);
      if (resLista.status !== "sucesso") return resultadoErro(resLista.status === "erro" ? resLista.mensagem : "Falha ao encerrar.");
      const encerrado = resLista.dados.find((p) => p.id === periodo.id);
      return encerrado ? resultadoSucesso(encerrado) : resultadoErro("Período encerrado, mas não encontrado ao relistar.");
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
