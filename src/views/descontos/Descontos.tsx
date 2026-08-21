import { useState } from "react";
import { bloqueioService, descontosService } from "../../adapters";
import { AjudaPopover, Button, Carregando, LinhaVazia, MensagemErro, MensagemVazia, Modal, Paginacao, Table } from "../../components/ui";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { totaisPorTipo, type ColaboradorComDescontos } from "../../services/descontosService";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, TIPOS_DESCONTO_BONIFICACAO, type TipoDescontoBonificacao } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { normalizarBusca } from "../../utils/texto";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";
import { usePaginacao } from "../../utils/usePaginacao";

interface LinhaDesconto {
  id: string;
  vendedorId: string;
  tipo: TipoDescontoBonificacao | "";
  valor: number;
  observacoes: string;
  /** ainda não persistido no adapter (criado pelo "+ Adicionar" nesta sessão de edição) */
  novo: boolean;
}

let contadorRascunho = 0;
function proximoIdRascunho(): string {
  contadorRascunho += 1;
  return `rascunho-${contadorRascunho}`;
}

export function Descontos() {
  const { sessao } = useSessao();
  const [mesReferencia, setMesReferencia] = useState(obterMesAtualISO());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<ColaboradorComDescontos[]>([]);
  const [linhas, setLinhas] = useState<LinhaDesconto[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternandoBloqueio, setAlternandoBloqueio] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [modalTotaisAberta, setModalTotaisAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [exportando, setExportando] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("descontos", sessao.role, bloqueado) : false;

  async function carregar(foiCancelado: () => boolean = () => false) {
    if (!sessao) return;
    setCarregando(true);
    setErro(null);

    const resDescontos = await descontosService.listarDescontos(filialAtiva, mesReferencia);
    if (foiCancelado()) return;

    if (resDescontos.status !== "sucesso") {
      setErro(resDescontos.status === "erro" ? resDescontos.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }

    setColaboradores(resDescontos.dados.colaboradores);
    setLinhas(
      resDescontos.dados.lancamentos.map((d) => ({
        id: d.id,
        vendedorId: d.vendedorId,
        tipo: d.tipo,
        valor: d.valor,
        observacoes: d.observacoes,
        novo: false,
      })),
    );

    if (!mostrarFilial) {
      const resBloqueio = await bloqueioService.consultarBloqueio("descontos", filialAtiva, mesReferencia);
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

  function adicionarLinha(vendedorId: string) {
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível adicionar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }
    setLinhas((atual) => [
      ...atual,
      { id: proximoIdRascunho(), vendedorId, tipo: "", valor: 0, observacoes: "", novo: true },
    ]);
  }

  async function removerLinha(linha: LinhaDesconto) {
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível remover: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }
    if (!linha.novo) {
      setRemovendoId(linha.id);
      try {
        const resultado = await descontosService.removerDesconto(linha.id);
        if (resultado.status !== "sucesso") {
          mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao remover.", "erro");
          return;
        }
      } finally {
        setRemovendoId(null);
      }
    }
    setLinhas((atual) => atual.filter((l) => l.id !== linha.id));
  }

  function editarLinha(id: string, campo: "tipo" | "valor" | "observacoes", valor: string | number) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  async function salvar() {
    if (!sessao) return;
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível salvar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await descontosService.salvarDescontos(
        linhas.map((l) => ({
          id: l.novo ? undefined : l.id,
          vendedorId: l.vendedorId,
          mesReferencia,
          tipo: l.tipo as TipoDescontoBonificacao,
          valor: l.valor,
          observacoes: l.observacoes,
        })),
      );
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
        return;
      }
      setLinhas(
        resultado.dados.map((d) => ({
          id: d.id,
          vendedorId: d.vendedorId,
          tipo: d.tipo,
          valor: d.valor,
          observacoes: d.observacoes,
          novo: false,
        })),
      );
      mostrarToast(`Descontos e bonificações de ${mesReferencia} salvos com sucesso.`, "sucesso");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarBloqueio() {
    setAlternandoBloqueio(true);
    try {
      const resultado = await bloqueioService.alternarBloqueio("descontos", filialAtiva, mesReferencia);
      if (resultado.status === "sucesso") {
        setBloqueado(resultado.dados);
        mostrarToast(
          resultado.dados
            ? `Lançamentos de Descontos de ${mesReferencia} bloqueados.`
            : `Lançamentos de Descontos de ${mesReferencia} desbloqueados.`,
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
      const resultado = await descontosService.exportarCSV(filialAtiva, mesReferencia);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao exportar.", "erro");
      }
    } finally {
      setExportando(false);
    }
  }

  const totais = totaisPorTipo(linhas);
  const buscaNormalizada = normalizarBusca(busca);
  const colaboradoresFiltrados = buscaNormalizada
    ? colaboradores.filter((c) => [c.codigo, c.nome].some((campo) => normalizarBusca(campo).includes(buscaNormalizada)))
    : colaboradores;
  // Pagina por colaborador (não por <tr>) — um colaborador com vários lançamentos no mês
  // fica inteiro na mesma página.
  const paginacao = usePaginacao(colaboradoresFiltrados);

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Demais Descontos e Bonificações</h2>
        <span className="view-subtitulo">Lançamentos mensais por colaborador, com múltiplos itens por mês</span>
      </div>

      <form className="formulario grade-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="descontos-mes-referencia">Mês de referência</label>
          <input
            type="month"
            id="descontos-mes-referencia"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
          />
        </div>
      </form>

      <div className="acoes-tabela" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "10px" }}>
        <div className="campo" style={{ marginBottom: 0, minWidth: "220px", flex: "1 1 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--esp-1)" }}>
            <label htmlFor="descontos-busca" style={{ marginBottom: 0 }}>
              Buscar colaborador
            </label>
            <AjudaPopover texto="Esta busca serve só para facilitar encontrar um colaborador na lista e preencher os lançamentos dele — ela não altera o total por tipo nem a exportação CSV da filial, que sempre consideram todos os colaboradores, buscados ou não." />
          </div>
          <input
            id="descontos-busca"
            type="text"
            placeholder="Nome ou código"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--esp-3)", flexWrap: "wrap" }}>
          {ehAdmin && !mostrarFilial ? (
            <Button variant="secundario" onClick={alternarBloqueio} carregando={alternandoBloqueio}>
              {bloqueado ? "🔓 Desbloquear lançamentos deste mês" : "🔒 Bloquear lançamentos deste mês"}
            </Button>
          ) : null}
          <Button variant="secundario" onClick={() => setModalTotaisAberta(true)}>
            📊 Totais por tipo
          </Button>
          <Button variant="secundario" onClick={exportarCSV} carregando={exportando}>
            ⭳ Exportar CSV da filial
          </Button>
        </div>
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
                <th>Cód</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Observações</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {colaboradoresFiltrados.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={6}>
                    <MensagemVazia
                      mensagem={
                        buscaNormalizada
                          ? `Nenhum colaborador encontrado para "${busca.trim()}".`
                          : "Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)."
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginacao.itensDaPagina.map((colaborador) => {
                  const linhasColaborador = linhas.filter((l) => l.vendedorId === colaborador.id);
                  const botaoAdicionar = !bloqueadoParaEdicao ? (
                    <Button variant="secundario" onClick={() => adicionarLinha(colaborador.id)}>
                      + Adicionar
                    </Button>
                  ) : null;

                  if (linhasColaborador.length === 0) {
                    return (
                      <tr key={colaborador.id}>
                        <td>{colaborador.codigo || "—"}</td>
                        <td>{colaborador.nome}</td>
                        <td colSpan={3} className="dica-campo">
                          Nenhum lançamento neste mês
                        </td>
                        <td className="celula-acoes-form">{botaoAdicionar}</td>
                      </tr>
                    );
                  }

                  return linhasColaborador.map((linha, indice) => (
                    <tr key={linha.id}>
                      <td>{indice === 0 ? colaborador.codigo || "—" : ""}</td>
                      <td>{indice === 0 ? colaborador.nome : ""}</td>
                      <td className="celula-input">
                        <select
                          aria-label={`Tipo do lançamento ${indice + 1} de ${colaborador.nome}`}
                          value={linha.tipo}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarLinha(linha.id, "tipo", e.target.value)}
                        >
                          <option value="" disabled>
                            Selecione...
                          </option>
                          {TIPOS_DESCONTO_BONIFICACAO.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="celula-input">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          aria-label={`Valor do lançamento ${indice + 1} de ${colaborador.nome}`}
                          value={linha.valor || ""}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarLinha(linha.id, "valor", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="celula-input">
                        <input
                          type="text"
                          placeholder="Observações"
                          aria-label={`Observações do lançamento ${indice + 1} de ${colaborador.nome}`}
                          value={linha.observacoes}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarLinha(linha.id, "observacoes", e.target.value)}
                        />
                      </td>
                      <td className="celula-acoes-form">
                        {indice === linhasColaborador.length - 1 ? botaoAdicionar : null}
                        {!bloqueadoParaEdicao ? (
                          <Button variant="perigo" onClick={() => removerLinha(linha)} carregando={removendoId === linha.id}>
                            Remover
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </Table>

          <Paginacao
            paginaAtual={paginacao.paginaAtual}
            totalPaginas={paginacao.totalPaginas}
            tamanhoPagina={paginacao.tamanhoPagina}
            totalItens={paginacao.totalItens}
            onIrParaPagina={paginacao.irParaPagina}
            onMudarTamanho={paginacao.definirTamanhoPagina}
          />

          <Modal aberto={modalTotaisAberta} titulo="Totais por tipo de lançamento" onFechar={() => setModalTotaisAberta(false)}>
            <Table compacta>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {totais.length === 0 ? (
                  <LinhaVazia colSpan={2} mensagem="Nenhum lançamento neste mês." />
                ) : (
                  totais.map((item) => (
                    <tr key={item.tipo}>
                      <td>{item.tipo}</td>
                      <td className="celula-numerica">{formatarMoeda(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Modal>

          <div className="acoes-tabela">
            <Button variant="dourado" onClick={salvar} disabled={bloqueadoParaEdicao} carregando={salvando}>
              💾 Salvar lançamento do mês
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
