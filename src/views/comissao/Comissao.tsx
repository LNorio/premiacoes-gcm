import { useState } from "react";
import { bloqueioService, comissaoService, premiacaoService } from "../../adapters";
import { Button, Carregando, MensagemErro, MensagemVazia, Paginacao, Table } from "../../components/ui";
import { obterPevDaPremiacao } from "../../services/consolidadoPevService";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, type Comissao as ComissaoEntidade } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";
import { usePaginacao } from "../../utils/usePaginacao";

interface ValoresLinha {
  valor: number;
  garantido: number;
}
const LINHA_ZERADA: ValoresLinha = { valor: 0, garantido: 0 };

export function Comissao() {
  const { sessao } = useSessao();
  const [mesReferencia, setMesReferencia] = useState(obterMesAtualISO());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // GET /api/comissoes já traz o roster inteiro do mês (Claude/API (19).md) — não precisa
  // mais de uma chamada separada a colaboradores só pra montar quem pode lançar.
  const [roster, setRoster] = useState<ComissaoEntidade[]>([]);
  const [premiacoesDoMes, setPremiacoesDoMes] = useState<{ vendedorId: string; pev: number }[]>([]);
  const [valores, setValores] = useState<Record<string, ValoresLinha>>({});
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternandoBloqueio, setAlternandoBloqueio] = useState(false);
  const [exportando, setExportando] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  // PEV nunca é digitado aqui — é sempre lido da Planilha de Premiação e só visível ao Admin.
  const mostrarPev = ehAdmin;
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("comissao", sessao.role, bloqueado) : false;

  async function carregar(foiCancelado: () => boolean = () => false) {
    if (!sessao) return;
    setCarregando(true);
    setErro(null);

    const [resComissoes, resPremiacoes] = await Promise.all([
      comissaoService.listarComissoes(filialAtiva, mesReferencia),
      premiacaoService.listarPremiacoes(filialAtiva, mesReferencia),
    ]);
    if (foiCancelado()) return;

    if (resComissoes.status !== "sucesso") {
      setErro(resComissoes.status === "erro" ? resComissoes.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }
    if (resPremiacoes.status !== "sucesso") {
      setErro(resPremiacoes.status === "erro" ? resPremiacoes.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }

    setRoster(resComissoes.dados);
    setPremiacoesDoMes(resPremiacoes.dados);
    setValores(Object.fromEntries(resComissoes.dados.map((c) => [c.vendedorId, { valor: c.valor, garantido: c.garantido }])));

    if (!mostrarFilial) {
      const resBloqueio = await bloqueioService.consultarBloqueio("comissao", filialAtiva, mesReferencia);
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

  function editarCelula(vendedorId: string, campo: keyof ValoresLinha, valor: number) {
    setValores((atual) => ({ ...atual, [vendedorId]: { ...(atual[vendedorId] ?? LINHA_ZERADA), [campo]: valor } }));
  }

  async function salvar() {
    if (!sessao) return;
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível salvar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }
    if (roster.length === 0) {
      mostrarToast("Cadastre ao menos um vendedor habilitado para Comissão antes de salvar.", "erro");
      return;
    }

    setSalvando(true);
    try {
      for (const item of roster) {
        const linha = valores[item.vendedorId] ?? LINHA_ZERADA;
        const resultado = await comissaoService.salvarComissao(filialAtiva, mesReferencia, {
          vendedorId: item.vendedorId,
          valor: linha.valor,
          garantido: linha.garantido,
        });
        if (resultado.status !== "sucesso") {
          mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
          return;
        }
      }
      mostrarToast(`Comissões de ${mesReferencia} salvas com sucesso.`, "sucesso");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarBloqueio() {
    setAlternandoBloqueio(true);
    try {
      const resultado = await bloqueioService.alternarBloqueio("comissao", filialAtiva, mesReferencia);
      if (resultado.status === "sucesso") {
        setBloqueado(resultado.dados);
        mostrarToast(
          resultado.dados
            ? `Lançamentos de Comissão de ${mesReferencia} bloqueados.`
            : `Lançamentos de Comissão de ${mesReferencia} desbloqueados.`,
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
      const resultado = await comissaoService.exportarCSV(filialAtiva, mesReferencia);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao exportar.", "erro");
      }
    } finally {
      setExportando(false);
    }
  }

  const totalColunas = 6 + (mostrarPev ? 1 : 0);
  const totalPev = mostrarPev ? roster.reduce((soma, c) => soma + obterPevDaPremiacao(premiacoesDoMes, c.vendedorId), 0) : 0;
  const totalValor = roster.reduce((soma, c) => soma + (valores[c.vendedorId]?.valor ?? 0), 0);
  const totalGarantido = roster.reduce((soma, c) => soma + (valores[c.vendedorId]?.garantido ?? 0), 0);
  const paginacao = usePaginacao(roster);

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Comissão</h2>
        <span className="view-subtitulo">Lançamento mensal de comissão por colaborador</span>
      </div>

      <form className="formulario grade-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="comissao-mes-referencia">Mês de referência</label>
          <input
            type="month"
            id="comissao-mes-referencia"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
          />
        </div>
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
                <th>CPF</th>
                <th>Função</th>
                {mostrarPev ? <th>PEV Atingida</th> : null}
                <th>Comissão (PEV Base)</th>
                <th>Garantido</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={totalColunas}>
                    <MensagemVazia mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)." />
                  </td>
                </tr>
              ) : (
                paginacao.itensDaPagina.map((item) => {
                  const valoresLinha = valores[item.vendedorId] ?? LINHA_ZERADA;
                  const pev = obterPevDaPremiacao(premiacoesDoMes, item.vendedorId);
                  return (
                    <tr key={item.vendedorId}>
                      <td>{item.codigo || "—"}</td>
                      <td>{item.vendedorNome}</td>
                      <td>{item.cpf}</td>
                      <td>{item.cargo}</td>
                      {mostrarPev ? <td className="celula-numerica">{formatarMoeda(pev)}</td> : null}
                      <td className="celula-input">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          aria-label={`Comissão de ${item.vendedorNome}`}
                          value={valoresLinha.valor || ""}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarCelula(item.vendedorId, "valor", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="celula-input">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          aria-label={`Garantido de ${item.vendedorNome}`}
                          value={valoresLinha.garantido || ""}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarCelula(item.vendedorId, "garantido", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total geral</td>
                {mostrarPev ? <td className="celula-numerica celula-total">{formatarMoeda(totalPev)}</td> : null}
                <td className="celula-numerica celula-total">{formatarMoeda(totalValor)}</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalGarantido)}</td>
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
              💾 Salvar comissões do mês
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
