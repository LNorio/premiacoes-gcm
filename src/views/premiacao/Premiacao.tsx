import { useEffect, useState } from "react";
import { bloqueioService, colaboradoresService, premiacaoService } from "../../adapters";
import { Button, Carregando, MensagemErro, MensagemVazia, Table } from "../../components/ui";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { exportarPremiacoesCSV, somarCategoriasPremiacao } from "../../services/premiacaoService";
import { useSessao } from "../../state/SessaoContext";
import { CATEGORIAS_PREMIACAO, FILIAL_TODAS, type CategoriaPremiacao, type Colaborador, type Premiacao as PremiacaoEntidade } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";

type ValoresLinha = Record<CategoriaPremiacao, number>;
const LINHA_ZERADA: ValoresLinha = { pev: 0, iconic: 0, filtros: 0, campanhasFornecedores: 0, inadimplencia: 0 };

const ROTULOS_CATEGORIA: Record<CategoriaPremiacao, string> = {
  pev: "PEV",
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
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [premiacoesSalvas, setPremiacoesSalvas] = useState<PremiacaoEntidade[]>([]);
  const [valores, setValores] = useState<Record<string, ValoresLinha>>({});
  const [bloqueado, setBloqueado] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("premiacao", sessao.role, bloqueado) : false;

  async function carregar() {
    if (!sessao) return;
    setCarregando(true);
    setErro(null);

    const [resColaboradores, resPremiacoes] = await Promise.all([
      colaboradoresService.listarColaboradores(filialAtiva),
      premiacaoService.listarPremiacoes(filialAtiva, mesReferencia),
    ]);

    if (resColaboradores.status !== "sucesso") {
      setErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }
    if (resPremiacoes.status !== "sucesso") {
      setErro(resPremiacoes.status === "erro" ? resPremiacoes.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }

    const habilitados = resColaboradores.dados.filter((c) => c.telas.premiacoes);
    setColaboradores(habilitados);
    setPremiacoesSalvas(resPremiacoes.dados);

    const proximosValores: Record<string, ValoresLinha> = {};
    for (const colaborador of habilitados) {
      const existente = resPremiacoes.dados.find((p) => p.vendedorId === colaborador.id);
      proximosValores[colaborador.id] = existente
        ? {
            pev: existente.pev,
            iconic: existente.iconic,
            filtros: existente.filtros,
            campanhasFornecedores: existente.campanhasFornecedores,
            inadimplencia: existente.inadimplencia,
          }
        : { ...LINHA_ZERADA };
    }
    setValores(proximosValores);

    if (!mostrarFilial) {
      const resBloqueio = await bloqueioService.consultarBloqueio("premiacao", filialAtiva, mesReferencia);
      setBloqueado(resBloqueio.status === "sucesso" ? resBloqueio.dados : false);
    } else {
      setBloqueado(false);
    }

    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.filialAtiva, mesReferencia]);

  function editarCelula(vendedorId: string, categoria: CategoriaPremiacao, valor: number) {
    setValores((atual) => ({ ...atual, [vendedorId]: { ...(atual[vendedorId] ?? LINHA_ZERADA), [categoria]: valor } }));
  }

  async function salvar() {
    if (!sessao) return;
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível salvar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }
    if (colaboradores.length === 0) {
      mostrarToast("Cadastre ao menos um vendedor nesta filial antes de salvar a planilha.", "erro");
      return;
    }

    const linhas = colaboradores.map((c) => ({ vendedorId: c.id, ...(valores[c.id] ?? LINHA_ZERADA) }));
    const resultado = await premiacaoService.salvarPremiacoes(filialAtiva, mesReferencia, linhas);
    if (resultado.status !== "sucesso") {
      mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
      return;
    }
    setPremiacoesSalvas(resultado.dados);
    mostrarToast(`Planilha de ${mesReferencia} salva com sucesso.`, "sucesso");
  }

  async function alternarBloqueio() {
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
  }

  function exportarCSV() {
    const exportou = exportarPremiacoesCSV(premiacoesSalvas, colaboradores, filialAtiva);
    if (!exportou) mostrarToast("Não há premiações salvas para exportar.", "erro");
  }

  const totaisPorCategoria = CATEGORIAS_PREMIACAO.reduce(
    (acc, categoria) => {
      acc[categoria] = colaboradores.reduce((soma, c) => soma + (valores[c.id]?.[categoria] ?? 0), 0);
      return acc;
    },
    {} as Record<CategoriaPremiacao, number>,
  );
  const totalGeral = CATEGORIAS_PREMIACAO.reduce((soma, categoria) => soma + totaisPorCategoria[categoria], 0);
  const totalGeralDeivson = totalGeral - totaisPorCategoria.pev;

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Planilha de Premiação</h2>
        <span className="view-subtitulo">
          PEV, Premiação Iconic, Premiação Filtros e demais fornecedores, Campanhas de fornecedores e Premiação
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

      <div className="acoes-tabela" style={{ justifyContent: "flex-start" }}>
        {ehAdmin && !mostrarFilial ? (
          <Button variant="secundario" onClick={alternarBloqueio}>
            {bloqueado ? "🔓 Desbloquear lançamentos deste mês" : "🔒 Bloquear lançamentos deste mês"}
          </Button>
        ) : null}
        <Button variant="secundario" onClick={exportarCSV}>
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
                <th>CPF</th>
                {mostrarFilial ? <th>Filial</th> : null}
                {CATEGORIAS_PREMIACAO.map((categoria) => (
                  <th key={categoria}>{ROTULOS_CATEGORIA[categoria]}</th>
                ))}
                <th>Total</th>
                <th>Planilha Deivson</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={10 + (mostrarFilial ? 1 : 0)}>
                    <MensagemVazia mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)." />
                  </td>
                </tr>
              ) : (
                colaboradores.map((colaborador) => {
                  const valoresLinha = valores[colaborador.id] ?? LINHA_ZERADA;
                  const total = somarCategoriasPremiacao(valoresLinha);
                  const deivson = total - valoresLinha.pev;
                  return (
                    <tr key={colaborador.id}>
                      <td>{colaborador.codigo || "—"}</td>
                      <td>{colaborador.nome}</td>
                      <td>{colaborador.cpf}</td>
                      {mostrarFilial ? <td>Filial {colaborador.filial}</td> : null}
                      {CATEGORIAS_PREMIACAO.map((categoria) => (
                        <td key={categoria} className="celula-input">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            aria-label={`${ROTULOS_CATEGORIA[categoria]} de ${colaborador.nome}`}
                            value={valoresLinha[categoria] || ""}
                            disabled={bloqueadoParaEdicao}
                            onChange={(e) => editarCelula(colaborador.id, categoria, parseFloat(e.target.value) || 0)}
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
                <td colSpan={3 + (mostrarFilial ? 1 : 0)}>Total geral da planilha</td>
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

          <div className="acoes-tabela">
            <Button variant="dourado" onClick={salvar} disabled={bloqueadoParaEdicao}>
              💾 Salvar planilha do mês
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
