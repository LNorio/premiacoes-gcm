import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baixarExcel } from "./exportar";

describe("baixarExcel", () => {
  beforeEach(() => {
    delete (window as { XLSX?: unknown }).XLSX;
  });

  afterEach(() => {
    delete (window as { XLSX?: unknown }).XLSX;
    vi.restoreAllMocks();
  });

  it("gera a planilha com uma aba 'Dados' e baixa o arquivo quando o SheetJS já está carregado", async () => {
    const aoaToSheet = vi.fn().mockReturnValue("planilha-fake");
    const bookNew = vi.fn().mockReturnValue("livro-fake");
    const bookAppendSheet = vi.fn();
    const writeFile = vi.fn();
    window.XLSX = {
      utils: { aoa_to_sheet: aoaToSheet, book_new: bookNew, book_append_sheet: bookAppendSheet },
      writeFile,
    };

    await baixarExcel(["Código", "Nome"], [["001", "Carlos Silva"]], "comissoes", "100");

    expect(aoaToSheet).toHaveBeenCalledWith([
      ["Código", "Nome"],
      ["001", "Carlos Silva"],
    ]);
    expect(bookAppendSheet).toHaveBeenCalledWith("livro-fake", "planilha-fake", "Dados");
    expect(writeFile).toHaveBeenCalledTimes(1);
    const [livro, nomeArquivo] = writeFile.mock.calls[0] as [unknown, string];
    expect(livro).toBe("livro-fake");
    expect(nomeArquivo).toMatch(/^comissoes_filial-100_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it("usa 'todas-filiais' no nome do arquivo quando a filial é FILIAL_TODAS", async () => {
    const writeFile = vi.fn();
    window.XLSX = {
      utils: { aoa_to_sheet: vi.fn(), book_new: vi.fn(), book_append_sheet: vi.fn() },
      writeFile,
    };

    await baixarExcel(["Código"], [], "comissoes", "TODAS");

    const [, nomeArquivo] = writeFile.mock.calls[0] as [unknown, string];
    expect(nomeArquivo).toContain("todas-filiais");
  });

  it("avisa por toast e não quebra quando o script do SheetJS falha ao carregar", async () => {
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      queueMicrotask(() => (node as unknown as HTMLScriptElement).onerror?.(new Event("error")));
      return node;
    });

    await expect(baixarExcel(["Código"], [], "comissoes", "100")).resolves.toBeUndefined();
    expect(window.XLSX).toBeUndefined();

    appendChild.mockRestore();
  });
});
