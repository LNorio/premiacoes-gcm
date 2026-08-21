import type { PessoaLancamentoPlanoSaude, PlanoSaudeService } from "../../services/planoSaudeService";
import {
  FILIAL_TODAS,
  resultadoErro,
  resultadoSucesso,
  type PlanoSaudeDependente,
  type PlanoSaudePeriodo,
  type TipoPlanoSaude,
} from "../../types";
import { baixarCSVPronto, decodificarCsvBase64 } from "../../utils/exportar";
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
  "plano saude": boolean;
  "plano odontologico": boolean;
}

function paraDependente(resposta: RespostaDependente): PlanoSaudeDependente {
  return {
    id: String(resposta.id),
    vendedorId: String(resposta["id colaborador"]),
    nome: resposta.nome,
    cpf: resposta.cpf ?? "",
    adesaoSaude: resposta["plano saude"],
    adesaoOdontologico: resposta["plano odontologico"],
  };
}

// ---------- Lançamentos ----------

/**
 * Linha de `GET /api/lancamentos` — ver `Claude/API (19).md`. Roster inteiro pronto: todo
 * titular/dependente ativo com adesão ao tipo de plano aparece, com `"valor titular"`/
 * `"valor dependente"` já calculados do período vigente — mesmo sem nenhum `"valor adicional"`/
 * `"valor coparticipacao"` lançado. Numa linha de dependente, `codigo`/`cpf`/`nome` são os
 * dele mesmo (código herdado do titular), não os do titular.
 */
interface RespostaLinhaLancamento {
  "tipo pessoa": "titular" | "dependente";
  "id colaborador": number;
  "id dependente": number | null;
  codigo: string;
  cpf: string;
  nome: string;
  filial: string;
  "valor titular": number;
  "valor dependente": number;
  "valor adicional": number;
  "valor coparticipacao": number;
  total: number;
}
interface RespostaLancamentos {
  dados: RespostaLinhaLancamento[];
  "total desligados titular": number;
  "total desligados dependente": number;
  "total desligados adicional": number;
  "total desligados coparticipacao": number;
}

function paraPessoaLancamento(linha: RespostaLinhaLancamento): PessoaLancamentoPlanoSaude {
  const titularId = String(linha["id colaborador"]);
  const idDependente = linha["id dependente"];
  return {
    id: idDependente !== null ? String(idDependente) : titularId,
    codigo: linha.codigo,
    nome: linha.nome,
    cpf: linha.cpf,
    tipo: linha["tipo pessoa"],
    titularId,
    filial: linha.filial,
    valorTitular: Number(linha["valor titular"]),
    valorDependente: Number(linha["valor dependente"]),
    valorAdicional: Number(linha["valor adicional"] ?? 0),
    valorCoparticipacao: Number(linha["valor coparticipacao"] ?? 0),
    total: Number(linha.total),
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

  async salvarAdesaoDependente(dependenteId, tipo, valor) {
    try {
      const campo = tipo === "saude" ? "plano saude" : "plano odontologico";
      await httpClient.put(`/api/dependentes/${dependenteId}`, { [campo]: valor });
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async listarLancamentosPlanoSaude(filial, mesReferencia, tipoPlano) {
    try {
      const resposta = await httpClient.get<RespostaLancamentos>(
        `/api/lancamentos?mes_de_referencia=${mesReferencia}-01&tipo_plano=${tipoPlano}${queryFilial(filial)}`,
      );
      return resultadoSucesso({
        pessoas: resposta.dados.map(paraPessoaLancamento),
        totalDesligados: {
          titular: Number(resposta["total desligados titular"] ?? 0),
          dependente: Number(resposta["total desligados dependente"] ?? 0),
          adicional: Number(resposta["total desligados adicional"] ?? 0),
          coparticipacao: Number(resposta["total desligados coparticipacao"] ?? 0),
        },
      });
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
      const salvo = resLista.dados.pessoas.find((p) => p.id === lancamento.pessoaId);
      return resultadoSucesso(
        salvo
          ? { ...lancamento, id: salvo.id, valorAdicional: salvo.valorAdicional, valorCoparticipacao: salvo.valorCoparticipacao }
          : lancamento,
      );
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },

  async salvarTotalDesligadosPlanoSaude(filial, mesReferencia, tipoPlano, valores) {
    try {
      await httpClient.put("/api/lancamentos/desligados", {
        filial,
        "tipo plano": tipoPlano,
        "mes de referencia": `${mesReferencia}-01`,
        "valor titular": valores.titular,
        "valor dependente": valores.dependente,
        "valor adicional": valores.adicional,
        "valor coparticipacao": valores.coparticipacao,
      });
      return resultadoSucesso(valores);
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

  async exportarCSV(filial, mesReferencia, tipoPlano) {
    try {
      const resposta = await httpClient.get<{ "arquivo csv": string; mensagem: string }>(
        `/api/lancamentos/exportar-csv?mes_de_referencia=${mesReferencia}-01&tipo_plano=${tipoPlano}${queryFilial(filial)}`,
      );
      const conteudo = decodificarCsvBase64(resposta["arquivo csv"]);
      if (conteudo.trim().split("\n").length <= 1) {
        return resultadoErro("Não há titulares/dependentes com adesão a este plano para exportar.");
      }
      baixarCSVPronto(conteudo, `plano-saude-${tipoPlano}`, filial);
      return resultadoSucesso(undefined);
    } catch (erro) {
      return resultadoErro(paraMensagemErro(erro));
    }
  },
};
