import { describe, expect, it } from "vitest";
import type { PlanoSaudePeriodo } from "../types";
import { encontrarPeriodoPlano } from "./planoSaudeService";

function periodo(sobrepor: Partial<PlanoSaudePeriodo>): PlanoSaudePeriodo {
  return {
    id: "p",
    filial: "100",
    tipoPlano: "odontologico",
    tipoPessoa: "titular",
    valor: 0,
    ativo: false,
    dataInicio: "2000-01-01",
    dataCriacao: "2000-01-01 00:00:00",
    dataValidade: null,
    ...sobrepor,
  };
}

describe("encontrarPeriodoPlano", () => {
  it("acha o período vigente que cobre o mês", () => {
    const periodos = [periodo({ id: "a", ativo: true, valor: 100 })];
    expect(encontrarPeriodoPlano(periodos, "100", "odontologico", "titular", "2026-08")?.id).toBe("a");
  });

  it("ignora período de outra filial/tipo de plano/tipo de pessoa", () => {
    const periodos = [
      periodo({ id: "outra-filial", filial: "200", ativo: true }),
      periodo({ id: "outro-tipo-plano", tipoPlano: "saude", ativo: true }),
      periodo({ id: "outra-pessoa", tipoPessoa: "dependente", ativo: true }),
    ];
    expect(encontrarPeriodoPlano(periodos, "100", "odontologico", "titular", "2026-08")).toBeUndefined();
  });

  it("o período vigente (ativo) sempre vence sobre um histórico que também bate no mês, não importa a posição no array", () => {
    // Reproduz o bug real: um período seed antigo, encerrado no meio do mês corrente, aparecia
    // DEPOIS do período novo e realmente vigente na resposta de GET /api/valores-plano-saude — a
    // busca por posição (mais recente = fim do array) pegava o registro errado (o antigo).
    const seedAntigoEncerradoNoMes = periodo({
      id: "seed-antigo",
      valor: 13.56,
      ativo: false,
      dataInicio: "2000-01-01",
      dataCriacao: "2000-01-01 00:00:00",
      dataValidade: "2026-08-18",
    });
    const novoRealmenteVigente = periodo({
      id: "novo-vigente",
      valor: 100,
      ativo: true,
      dataInicio: "2026-08-18",
      dataCriacao: "2026-08-18 11:24:46",
      dataValidade: null,
    });
    const periodos = [novoRealmenteVigente, seedAntigoEncerradoNoMes];
    expect(encontrarPeriodoPlano(periodos, "100", "odontologico", "titular", "2026-08")?.id).toBe("novo-vigente");
  });

  it("sem nenhum vigente batendo no mês, entre dois históricos sobrepostos o de dataCriacao mais recente prevalece", () => {
    const historicoAntigo = periodo({ id: "antigo", dataCriacao: "2026-01-01 00:00:00", dataValidade: "2026-08-31" });
    const historicoRecente = periodo({ id: "recente", dataCriacao: "2026-08-01 00:00:00", dataValidade: "2026-08-31" });
    // ordem proposital invertida (o "mais recente" vem primeiro no array) pra provar que não é
    // posição que decide.
    const periodos = [historicoRecente, historicoAntigo];
    expect(encontrarPeriodoPlano(periodos, "100", "odontologico", "titular", "2026-08")?.id).toBe("recente");
  });
});
