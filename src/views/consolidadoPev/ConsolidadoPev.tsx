import { useEffect, useState } from "react";
import { consolidadoPevService } from "../../adapters";
import { Button, Carregando, MensagemErro, MensagemVazia, Paginacao, Table } from "../../components/ui";
import { calcularPremiacaoAdicionalReceber, type LinhaConsolidadoPev } from "../../services/consolidadoPevService";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { gerarIntervaloMeses, nomeCurtoMes, obterAnoCicloAtual, obterMesesCicloPEV } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";
import { usePaginacao } from "../../utils/usePaginacao";

export function ConsolidadoPev() {
  const { sessao } = useSessao();
  const cicloSugerido = obterMesesCicloPEV(obterAnoCicloAtual());
  const [anoCiclo, setAnoCiclo] = useState(obterAnoCicloAtual());
  const [de, setDe] = useState(cicloSugerido[0]);
  const [ate, setAte] = useState(cicloSugerido[cicloSugerido.length - 1]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaConsolidadoPev[]>([]);
  const [adiantamentosEditados, setAdiantamentosEditados] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? "";
  const podeEditarAdiantamento = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const mesesExibidos = de > ate ? [] : gerarIntervaloMeses(de, ate);

  // Campos De/Até ficam somente-leitura (só o Ciclo é editável) — mantidos em sincronia com ele.
  useEffect(() => {
    const meses = obterMesesCicloPEV(anoCiclo);
    setDe(meses[0]);
    setAte(meses[meses.length - 1]);
  }, [anoCiclo]);

  useEfeitoAssincrono(
    (foiCancelado) => {
      if (!sessao || de > ate) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro(null);
      consolidadoPevService.listarConsolidadoPev(filialAtiva, anoCiclo, gerarIntervaloMeses(de, ate)).then((resultado) => {
        if (foiCancelado()) return;
        if (resultado.status !== "sucesso") {
          setErro(resultado.status === "erro" ? resultado.mensagem : "Falha ao carregar.");
          setCarregando(false);
          return;
        }
        setLinhas(resultado.dados);
        setAdiantamentosEditados(Object.fromEntries(resultado.dados.map((l) => [l.vendedorId, l.adiantamento])));
        setCarregando(false);
      });
    },
    [sessao?.filialAtiva, anoCiclo, de, ate],
  );

  async function salvarAdiantamentos() {
    setSalvando(true);
    try {
      for (const linha of linhas) {
        const valor = adiantamentosEditados[linha.vendedorId] ?? 0;
        await consolidadoPevService.salvarAdiantamento(linha.vendedorId, anoCiclo, valor);
      }
      mostrarToast("Adiantamentos de férias salvos com sucesso.", "sucesso");
      setLinhas((atual) =>
        atual.map((l) => {
          const adiantamento = adiantamentosEditados[l.vendedorId] ?? 0;
          return { ...l, adiantamento, premiacaoAdicionalReceber: calcularPremiacaoAdicionalReceber(l.baseCalculo, adiantamento) };
        }),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function exportarCSV() {
    setExportando(true);
    try {
      const resultado = await consolidadoPevService.exportarCSV(filialAtiva, anoCiclo);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao exportar.", "erro");
      }
    } finally {
      setExportando(false);
    }
  }

  const totaisPorMes = mesesExibidos.map((mes) => linhas.reduce((soma, l) => soma + (l.porMes[mes] ?? 0), 0));
  const totalAcumuladoGeral = linhas.reduce((soma, l) => soma + l.totalAcumulado, 0);
  const totalBaseGeral = linhas.reduce((soma, l) => soma + l.baseCalculo, 0);
  const totalAdiantamentoGeral = linhas.reduce((soma, l) => soma + (adiantamentosEditados[l.vendedorId] ?? 0), 0);
  const totalAdicionalGeral = linhas.reduce((soma, l) => {
    const adiantamento = adiantamentosEditados[l.vendedorId] ?? 0;
    return soma + calcularPremiacaoAdicionalReceber(l.baseCalculo, adiantamento);
  }, 0);
  const paginacao = usePaginacao(linhas);

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Consolidado PEV</h2>
        <span className="view-subtitulo">PEV mês a mês (Dezembro a Novembro), com base de cálculo e adiantamento de férias</span>
      </div>

      <form className="formulario grade-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="pev-ano-ciclo">Ciclo (ano de referência de Novembro)</label>
          <input
            type="number"
            id="pev-ano-ciclo"
            min={2000}
            max={2100}
            value={anoCiclo}
            onChange={(e) => setAnoCiclo(parseInt(e.target.value, 10) || obterAnoCicloAtual())}
          />
        </div>
        <div className="campo">
          <label htmlFor="pev-filtro-de">De</label>
          <input type="month" id="pev-filtro-de" value={de} disabled readOnly />
        </div>
        <div className="campo">
          <label htmlFor="pev-filtro-ate">Até</label>
          <input type="month" id="pev-filtro-ate" value={ate} disabled readOnly />
        </div>
      </form>

      <div className="acoes-tabela" style={{ justifyContent: "flex-start", marginBottom: "10px" }}>
        <Button variant="secundario" onClick={exportarCSV} carregando={exportando}>
          ⭳ Exportar CSV
        </Button>
      </div>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <MensagemErro mensagem={erro} />
      ) : de > ate ? (
        <MensagemErro mensagem='O mês "De" não pode ser posterior ao mês "Até".' />
      ) : (
        <>
          <Table planilha>
            <thead>
              <tr>
                <th>CPF</th>
                <th>Nome</th>
                {mostrarFilial ? <th>Filial</th> : null}
                {mesesExibidos.map((mes) => (
                  <th key={mes}>{nomeCurtoMes(mes)}</th>
                ))}
                <th>Total Acumulado</th>
                <th>Base de Cálculo (28%)</th>
                <th>Adiantamento de Férias</th>
                <th>Premiação Adicional a Receber</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={6 + (mostrarFilial ? 1 : 0) + mesesExibidos.length}>
                    <MensagemVazia mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)." />
                  </td>
                </tr>
              ) : (
                paginacao.itensDaPagina.map((linha) => {
                  const adiantamento = adiantamentosEditados[linha.vendedorId] ?? 0;
                  const adicional = calcularPremiacaoAdicionalReceber(linha.baseCalculo, adiantamento);
                  return (
                    <tr key={linha.vendedorId}>
                      <td>{linha.cpf}</td>
                      <td>{linha.vendedorNome}</td>
                      {mostrarFilial ? <td>Filial {linha.filial}</td> : null}
                      {mesesExibidos.map((mes) => (
                        <td key={mes} className="celula-numerica">
                          {formatarMoeda(linha.porMes[mes] ?? 0)}
                        </td>
                      ))}
                      <td className="celula-numerica celula-total">{formatarMoeda(linha.totalAcumulado)}</td>
                      <td className="celula-numerica">{formatarMoeda(linha.baseCalculo)}</td>
                      {podeEditarAdiantamento ? (
                        <td className="celula-input">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            aria-label={`Adiantamento de férias de ${linha.vendedorNome}`}
                            value={adiantamento || ""}
                            onChange={(e) =>
                              setAdiantamentosEditados((atual) => ({
                                ...atual,
                                [linha.vendedorId]: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </td>
                      ) : (
                        <td className="celula-numerica">{formatarMoeda(adiantamento)}</td>
                      )}
                      <td className="celula-numerica celula-total">{formatarMoeda(adicional)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {linhas.length > 0 ? (
              <tfoot>
                <tr>
                  <td colSpan={2 + (mostrarFilial ? 1 : 0)}>Total geral</td>
                  {totaisPorMes.map((total, i) => (
                    <td key={mesesExibidos[i]} className="celula-numerica celula-total">
                      {formatarMoeda(total)}
                    </td>
                  ))}
                  <td className="celula-numerica celula-total">{formatarMoeda(totalAcumuladoGeral)}</td>
                  <td className="celula-numerica celula-total">{formatarMoeda(totalBaseGeral)}</td>
                  <td className="celula-numerica celula-total">{formatarMoeda(totalAdiantamentoGeral)}</td>
                  <td className="celula-numerica celula-total">{formatarMoeda(totalAdicionalGeral)}</td>
                </tr>
              </tfoot>
            ) : null}
          </Table>

          <Paginacao
            paginaAtual={paginacao.paginaAtual}
            totalPaginas={paginacao.totalPaginas}
            tamanhoPagina={paginacao.tamanhoPagina}
            totalItens={paginacao.totalItens}
            onIrParaPagina={paginacao.irParaPagina}
            onMudarTamanho={paginacao.definirTamanhoPagina}
          />

          {podeEditarAdiantamento && linhas.length > 0 ? (
            <div className="acoes-tabela">
              <Button variant="dourado" onClick={salvarAdiantamentos} carregando={salvando}>
                💾 Salvar adiantamentos de férias
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
