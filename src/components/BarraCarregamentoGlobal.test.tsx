import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { BarraCarregamentoGlobal } from "./BarraCarregamentoGlobal";
import { finalizarRequisicaoHttp, iniciarRequisicaoHttp } from "../utils/cargaHttp";

describe("BarraCarregamentoGlobal", () => {
  it("não renderiza nada sem requisições em andamento, e aparece/some conforme iniciarRequisicaoHttp/finalizarRequisicaoHttp", () => {
    render(<BarraCarregamentoGlobal />);
    expect(screen.queryByRole("status", { name: "Carregando" })).not.toBeInTheDocument();

    act(() => iniciarRequisicaoHttp());
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();

    act(() => finalizarRequisicaoHttp());
    expect(screen.queryByRole("status", { name: "Carregando" })).not.toBeInTheDocument();
  });
});
