import { useState } from "react";
import { consultaService } from "../../adapters";
import { Button, Carregando, MensagemErro } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { CATEGORIAS_PREMIACAO, FILIAL_TODAS, type CategoriaPremiacao } from "../../types";
import type { CartaoMesConsulta } from "../../services/consultaService";
import { baixarCSV } from "../../utils/exportar";
import { formatarMesReferencia, formatarMoeda } from "../../utils/formatadores";
import { obterMesPassadoISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";
import "./ConsultaPeriodo.css";

const ROTULOS_CATEGORIA_CURTO: Record<CategoriaPremiacao, string> = {
  pev: "PEV",
  iconic: "Iconic",
  filtros: "Filtros/Demais",
  campanhasFornecedores: "Camp. Fornecedores",
  inadimplencia: "Inadimplência",
};

export function ConsultaPeriodo() {
  const { sessao } = useSessao();
  const [de, setDe] = useState(obterMesPassadoISO());
  const [ate, setAte] = useState(obterMesPassadoISO());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cartoes, setCartoes] = useState<CartaoMesConsulta[]>([]);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehVendedor = sessao?.role === "vendedor";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const escopo = ehVendedor && sessao?.vendedorId ? { vendedorId: sessao.vendedorId } : undefined;

  useEfeitoAssincrono(
    (foiCancelado) => {
      if (!sessao) return;
      setCarregando(true);
      setErro(null);
      consultaService.listarConsulta(filialAtiva, { de, ate }, escopo).then((resConsulta) => {
        if (foiCancelado()) return;
        if (resConsulta.status !== "sucesso") {
          setErro(resConsulta.status === "erro" ? resConsulta.mensagem : "Falha ao carregar.");
          setCarregando(false);
          return;
        }
        setCartoes(resConsulta.dados);
        setCarregando(false);
      });
    },
    [sessao?.filialAtiva, sessao?.vendedorId, de, ate],
  );

  async function exportarCSV() {
    // A exportação usa todo o escopo da filial/vendedor, não só o período filtrado na
    // tela (mesmo comportamento do protótipo: mesmas colunas da Planilha de Premiação).
    const resultado = await consultaService.listarConsulta(filialAtiva, { de: "", ate: "" }, escopo);
    if (resultado.status !== "sucesso" || resultado.dados.every((c) => c.linhas.length === 0)) {
      mostrarToast("Não há premiações salvas para exportar.", "erro");
      return;
    }
    const linhas = resultado.dados.flatMap((cartao) => cartao.linhas.map((l) => [l.cpf, l.vendedorNome, l.total.toFixed(2), ""]));
    baixarCSV(["CPF", "Nome", "Valor Total", "Observações"], linhas, "premiacoes", filialAtiva);
  }

  const titulo = ehVendedor ? "Minhas Premiações por Período" : "Consulta de Premiações por Período";
  const subtitulo = ehVendedor
    ? "Veja o histórico dos seus lançamentos, mês a mês"
    : mostrarFilial
      ? "Lançamentos de todas as filiais, separados por mês"
      : `Lançamentos da Filial ${filialAtiva}, separados por mês`;

  const descricaoPeriodo =
    de && ate
      ? `${formatarMesReferencia(de)} até ${formatarMesReferencia(ate)}`
      : de
        ? `a partir de ${formatarMesReferencia(de)}`
        : ate
          ? `até ${formatarMesReferencia(ate)}`
          : "o período selecionado";

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>{titulo}</h2>
        <span className="view-subtitulo">{subtitulo}</span>
      </div>

      <form className="formulario grade-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="consulta-filtro-de">De</label>
          <input type="month" id="consulta-filtro-de" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="consulta-filtro-ate">Até</label>
          <input type="month" id="consulta-filtro-ate" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <div className="formulario-rodape">
          <Button
            type="button"
            variant="secundario"
            onClick={() => {
              setDe("");
              setAte("");
            }}
          >
            Ver todos os meses
          </Button>
        </div>
      </form>

      {!ehVendedor ? (
        <div className="acoes-tabela" style={{ justifyContent: "flex-start" }}>
          <Button variant="secundario" onClick={exportarCSV}>
            ⭳ Exportar CSV
          </Button>
        </div>
      ) : null}

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <MensagemErro mensagem={erro} />
      ) : cartoes.length === 0 ? (
        <p className="mensagem-vazia-consulta">
          {de || ate ? `Nenhuma premiação encontrada para ${descricaoPeriodo}.` : "Nenhuma premiação lançada ainda para consultar."}
        </p>
      ) : (
        [...cartoes]
          .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia))
          .map((cartao) => {
            const total = cartao.linhas.reduce((soma, l) => soma + l.total, 0);
            const totaisPorCategoria = CATEGORIAS_PREMIACAO.reduce(
              (acc, categoria) => {
                acc[categoria] = cartao.linhas.reduce((soma, l) => soma + l[categoria], 0);
                return acc;
              },
              {} as Record<CategoriaPremiacao, number>,
            );

            return (
              <article className="cartao-mes" key={cartao.mesReferencia}>
                <div className="cartao-mes-cabecalho">
                  <h3>{formatarMesReferencia(cartao.mesReferencia)}</h3>
                  <div className="cartao-mes-resumo">
                    <span>{cartao.linhas.length} lançamento(s)</span>
                    <span>
                      Subtotal: <strong>{formatarMoeda(total)}</strong>
                    </span>
                  </div>
                </div>
                <div className="tabela-wrapper">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Colaborador</th>
                        {mostrarFilial ? <th>Filial</th> : null}
                        {CATEGORIAS_PREMIACAO.map((categoria) => (
                          <th key={categoria}>{ROTULOS_CATEGORIA_CURTO[categoria]}</th>
                        ))}
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartao.linhas.map((linha) => (
                        <tr key={linha.vendedorId}>
                          <td>{linha.vendedorNome}</td>
                          {mostrarFilial ? <td>Filial {linha.filial}</td> : null}
                          {CATEGORIAS_PREMIACAO.map((categoria) => (
                            <td key={categoria} className="celula-numerica">
                              {formatarMoeda(linha[categoria])}
                            </td>
                          ))}
                          <td className="celula-numerica">
                            <strong>{formatarMoeda(linha.total)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={mostrarFilial ? 2 : 1}>Total do mês</td>
                        {CATEGORIAS_PREMIACAO.map((categoria) => (
                          <td key={categoria} className="celula-numerica celula-total">
                            {formatarMoeda(totaisPorCategoria[categoria])}
                          </td>
                        ))}
                        <td className="celula-numerica celula-total">{formatarMoeda(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </article>
            );
          })
      )}
    </section>
  );
}
