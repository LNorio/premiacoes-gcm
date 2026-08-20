import { useState } from "react";
import { bloqueioService, premiacaoService } from "../../adapters";
import { Button, Carregando, MensagemErro, MensagemVazia, Paginacao, Table } from "../../components/ui";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { somarCategoriasPremiacao } from "../../services/premiacaoService";
import { useSessao } from "../../state/SessaoContext";
import { CATEGORIAS_PREMIACAO, FILIAL_TODAS, type CategoriaPremiacao, type Premiacao } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";
import { usePaginacao } from "../../utils/usePaginacao";

type ValoresLinha = Record<CategoriaPremiacao, number>;
const LINHA_ZERADA: ValoresLinha = { pev: 0, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 };

const ROTULOS_CATEGORIA: Record<CategoriaPremiacao, string> = {
  pev: "PEV Atingida",
  iconic: "Premiação Iconic",
  filtros: "Filtros e demais fornecedores",
  campanhasFornecedores: "Campanhas de fornecedores",
  inadimplencia: "Premiação Inadimplência",
};

export function Premiacao() {
  const { sessao } = useSessao();
  const [mesReferencia, setMesReferencia] = useState(obterMesAtualISO());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Roster do mês (Claude/API (16).md) — uma linha por colaborador com a tela Premiações,
  // já vindo zerada de quem ainda não lançou nada; não depende mais de buscar colaboradores
  // à parte (a API filtra por acesso à tela sozinha).
  const [roster, setRoster] = useState<Premiacao[]>([]);
  const [valores, setValores] = useState<Record<string, ValoresLinha>>({});
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternandoBloqueio, setAlternandoBloqueio] = useState(false);
  const [exportando, setExportando] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("premiacao", sessao.role, bloqueado) : false;

  async function carregar(foiCancelado: () => boolean = () => false) {
    if (!sessao) return;
    setCarregando(true);
    setErro(null);

    const resPremiacoes = await premiacaoService.listarPremiacoes(filialAtiva, mesReferencia);
    if (foiCancelado()) return;

    if (resPremiacoes.status !== "sucesso") {
      setErro(resPremiacoes.status === "erro" ? resPremiacoes.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }

    setRoster(resPremiacoes.dados);
    const proximosValores: Record<string, ValoresLinha> = {};
    for (const linha of resPremiacoes.dados) {
      proximosValores[linha.vendedorId] = {
        pev: linha.pev,
        iconic: linha.iconic,
        filtros: linha.filtros,
        campanhasFornecedores: linha.campanhasFornecedores,
        inadimplencia: linha.inadimplencia,
      };
    }
    setValores(proximosValores);

    if (!mostrarFilial) {
      const resBloqueio = await bloqueioService.consultarBloqueio("premiacao", filialAtiva, mesReferencia);
      if (foiCancelado()) return;
      setBloqueado(resBloqueio.status === "sucesso" ? resBloqueio.dados : false);
    } else {
      setBloqueado(false);
    }

    setCarregando(false);
  }

  useEfeitoAssincrono(
    (foiCancelado) => {
      void carregar(foiCancelado);
    },
    [sessao?.filialAtiva, mesReferencia],
  );

  function editarCelula(vendedorId: string, categoria: CategoriaPremiacao, valor: number) {
    setValores((atual) => ({ ...atual, [vendedorId]: { ...(atual[vendedorId] ?? LINHA_ZERADA), [categoria]: valor } }));
  }

  async function salvar() {
    if (!sessao) return;
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível salvar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }
    if (roster.length === 0) {
      mostrarToast("Cadastre ao menos um vendedor nesta filial antes de salvar a planilha.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const linhas = roster.map((r) => ({ vendedorId: r.vendedorId, ...(valores[r.vendedorId] ?? LINHA_ZERADA) }));
      const resultado = await premiacaoService.salvarPremiacoes(filialAtiva, mesReferencia, linhas);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
        return;
      }
      mostrarToast(`Planilha de ${mesReferencia} salva com sucesso.`, "sucesso");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarBloqueio() {
    setAlternandoBloqueio(true);
    try {
      const resultado = await bloqueioService.alternarBloqueio("premiacao", filialAtiva, mesReferencia);
      if (resultado.status === "sucesso") {
        setBloqueado(resultado.dados);
        mostrarToast(
          resultado.dados
            ? `Lançamentos de Premiação de ${mesReferencia} bloqueados.`
            : `Lançamentos de Premiação de ${mesReferencia} desbloqueados.`,
          "sucesso",
        );
      }
    } finally {
      setAlternandoBloqueio(false);
    }
  }

  async function exportarCSV() {
    setExportando(true);
    try {
      const resultado = await premiacaoService.exportarPremiacoesCSV(filialAtiva, mesReferencia);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao exportar.", "erro");
      }
    } finally {
      setExportando(false);
    }
  }

  const totaisPorCategoria = CATEGORIAS_PREMIACAO.reduce(
    (acc, categoria) => {
      acc[categoria] = roster.reduce((soma, r) => soma + (valores[r.vendedorId]?.[categoria] ?? 0), 0);
      return acc;
    },
    {} as Record<CategoriaPremiacao, number>,
  );
  const totalGeral = CATEGORIAS_PREMIACAO.reduce((soma, categoria) => soma + totaisPorCategoria[categoria], 0);
  const totalGeralDeivson = totalGeral - totaisPorCategoria.pev;
  const paginacao = usePaginacao(roster);

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Planilha de Premiação</h2>
        <span className="view-subtitulo">
          PEV Atingida, Premiação Iconic, Premiação Filtros e demais fornecedores, Campanhas de fornecedores e Premiação
          Inadimplência
        </span>
      </div>

      <form className="formulario grade-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="planilha-mes-referencia">Mês de referência da planilha</label>
          <input
            type="month"
            id="planilha-mes-referencia"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
          />
        </div>
        <p className="dica-campo campo-largo">
          Preencha o valor já apurado de cada categoria para cada vendedor da filial. O total de cada linha é somado
          automaticamente.
        </p>
      </form>

      <div className="acoes-tabela" style={{ justifyContent: "flex-start", marginBottom: "10px" }}>
        {ehAdmin && !mostrarFilial ? (
          <Button variant="secundario" onClick={alternarBloqueio} carregando={alternandoBloqueio}>
            {bloqueado ? "🔓 Desbloquear lançamentos deste mês" : "🔒 Bloquear lançamentos deste mês"}
          </Button>
        ) : null}
        <Button variant="secundario" onClick={exportarCSV} carregando={exportando}>
          ⭳ Exportar CSV da filial
        </Button>
      </div>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <MensagemErro mensagem={erro} />
      ) : (
        <>
          <Table planilha>
            <thead>
              <tr>
                <th>Código</th>
                <th>Colaborador</th>
                {mostrarFilial ? <th>Filial</th> : null}
                {CATEGORIAS_PREMIACAO.map((categoria) => (
                  <th key={categoria}>{ROTULOS_CATEGORIA[categoria]}</th>
                ))}
                <th>Total</th>
                <th>Planilha Deivson</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={9 + (mostrarFilial ? 1 : 0)}>
                    <MensagemVazia mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)." />
                  </td>
                </tr>
              ) : (
                paginacao.itensDaPagina.map((linha) => {
                  const valoresLinha = valores[linha.vendedorId] ?? LINHA_ZERADA;
                  const total = somarCategoriasPremiacao(valoresLinha);
                  const deivson = total - valoresLinha.pev;
                  return (
                    <tr key={linha.vendedorId}>
                      <td>{linha.codigo || "—"}</td>
                      <td>{linha.vendedorNome}</td>
                      {mostrarFilial ? <td>Filial {linha.filial}</td> : null}
                      {CATEGORIAS_PREMIACAO.map((categoria) => (
                        <td key={categoria} className="celula-input">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            aria-label={`${ROTULOS_CATEGORIA[categoria]} de ${linha.vendedorNome}`}
                            value={valoresLinha[categoria] || ""}
                            disabled={bloqueadoParaEdicao}
                            onChange={(e) => editarCelula(linha.vendedorId, categoria, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      ))}
                      <td className="celula-numerica celula-total">{formatarMoeda(total)}</td>
                      <td className="celula-numerica celula-total">{formatarMoeda(deivson)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2 + (mostrarFilial ? 1 : 0)}>Total geral da planilha</td>
                {CATEGORIAS_PREMIACAO.map((categoria) => (
                  <td key={categoria} className="celula-numerica celula-total">
                    {formatarMoeda(totaisPorCategoria[categoria])}
                  </td>
                ))}
                <td className="celula-numerica celula-total">{formatarMoeda(totalGeral)}</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalGeralDeivson)}</td>
              </tr>
            </tfoot>
          </Table>

          <Paginacao
            paginaAtual={paginacao.paginaAtual}
            totalPaginas={paginacao.totalPaginas}
            tamanhoPagina={paginacao.tamanhoPagina}
            totalItens={paginacao.totalItens}
            onIrParaPagina={paginacao.irParaPagina}
            onMudarTamanho={paginacao.definirTamanhoPagina}
          />

          <div className="acoes-tabela">
            <Button variant="dourado" onClick={salvar} disabled={bloqueadoParaEdicao} carregando={salvando}>
              💾 Salvar planilha do mês
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
