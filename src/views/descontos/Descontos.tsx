import { useEffect, useState } from "react";
import { bloqueioService, colaboradoresService, descontosService } from "../../adapters";
import { Button, Carregando, MensagemErro, MensagemVazia, Table } from "../../components/ui";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { exportarDescontosExcel } from "../../services/descontosService";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, TIPOS_DESCONTO_BONIFICACAO, type Colaborador, type TipoDescontoBonificacao } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";

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
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [linhas, setLinhas] = useState<LinhaDesconto[]>([]);
  const [bloqueado, setBloqueado] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("descontos", sessao.role, bloqueado) : false;

  async function carregar() {
    if (!sessao) return;
    setCarregando(true);
    setErro(null);

    const [resColaboradores, resDescontos] = await Promise.all([
      colaboradoresService.listarColaboradores(filialAtiva),
      descontosService.listarDescontos(filialAtiva, mesReferencia),
    ]);

    if (resColaboradores.status !== "sucesso") {
      setErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }
    if (resDescontos.status !== "sucesso") {
      setErro(resDescontos.status === "erro" ? resDescontos.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }

    setColaboradores(resColaboradores.dados.filter((c) => c.telas.descontos));
    setLinhas(
      resDescontos.dados.map((d) => ({
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
      const resultado = await descontosService.removerDesconto(linha.id);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao remover.", "erro");
        return;
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
  }

  async function alternarBloqueio() {
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
  }

  function exportarExcel() {
    const paraExportar = linhas
      .filter((l) => !l.novo)
      .map((l) => ({
        id: l.id,
        vendedorId: l.vendedorId,
        mesReferencia,
        tipo: l.tipo as TipoDescontoBonificacao,
        valor: l.valor,
        observacoes: l.observacoes,
      }));
    const exportou = exportarDescontosExcel(paraExportar, colaboradores, filialAtiva);
    if (!exportou) mostrarToast("Não há descontos ou bonificações salvos para exportar.", "erro");
  }

  const totalGeral = linhas.reduce((soma, l) => soma + l.valor, 0);

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

      <div className="acoes-tabela" style={{ justifyContent: "flex-start" }}>
        {ehAdmin && !mostrarFilial ? (
          <Button variant="secundario" onClick={alternarBloqueio}>
            {bloqueado ? "🔓 Desbloquear lançamentos deste mês" : "🔒 Bloquear lançamentos deste mês"}
          </Button>
        ) : null}
        <Button variant="secundario" onClick={exportarExcel}>
          ⭳ Exportar Excel da filial
        </Button>
      </div>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <MensagemErro mensagem={erro} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <th>Cód</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Observações</th>
                <th>Total</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {colaboradores.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={7}>
                    <MensagemVazia mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)." />
                  </td>
                </tr>
              ) : (
                colaboradores.map((colaborador) => {
                  const linhasColaborador = linhas.filter((l) => l.vendedorId === colaborador.id);
                  const totalColaborador = linhasColaborador.reduce((soma, l) => soma + l.valor, 0);
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
                        <td className="celula-numerica celula-total">{formatarMoeda(0)}</td>
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
                      <td className="celula-numerica celula-total">
                        {indice === 0 ? formatarMoeda(totalColaborador) : ""}
                      </td>
                      <td className="celula-acoes-form">
                        {indice === linhasColaborador.length - 1 ? botaoAdicionar : null}
                        {!bloqueadoParaEdicao ? (
                          <Button variant="perigo" onClick={() => removerLinha(linha)}>
                            Remover
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total geral</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalGeral)}</td>
                <td />
                <td className="celula-numerica celula-total">{formatarMoeda(totalGeral)}</td>
                <td />
              </tr>
            </tfoot>
          </Table>

          <div className="acoes-tabela">
            <Button variant="dourado" onClick={salvar} disabled={bloqueadoParaEdicao}>
              💾 Salvar lançamento do mês
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
