import { useState } from "react";
import { bloqueioService, colaboradoresService, comissaoService, premiacaoService } from "../../adapters";
import { Button, Carregando, MensagemErro, MensagemVazia, Table } from "../../components/ui";
import { exportarComissoesExcel } from "../../services/comissaoService";
import { obterPevDaPremiacao } from "../../services/consolidadoPevService";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, type Colaborador, type Comissao as ComissaoEntidade } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";

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
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [premiacoesDoMes, setPremiacoesDoMes] = useState<{ vendedorId: string; pev: number }[]>([]);
  const [comissoesSalvas, setComissoesSalvas] = useState<ComissaoEntidade[]>([]);
  const [valores, setValores] = useState<Record<string, ValoresLinha>>({});
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternandoBloqueio, setAlternandoBloqueio] = useState(false);

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

    const [resColaboradores, resComissoes, resPremiacoes] = await Promise.all([
      colaboradoresService.listarColaboradores(filialAtiva),
      comissaoService.listarComissoes(filialAtiva, mesReferencia),
      premiacaoService.listarPremiacoes(filialAtiva, mesReferencia),
    ]);
    if (foiCancelado()) return;

    if (resColaboradores.status !== "sucesso") {
      setErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
      setCarregando(false);
      return;
    }
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

    const habilitados = resColaboradores.dados.filter((c) => c.telas.comissao);
    setColaboradores(habilitados);
    setComissoesSalvas(resComissoes.dados);
    setPremiacoesDoMes(resPremiacoes.dados);

    const proximosValores: Record<string, ValoresLinha> = {};
    for (const colaborador of habilitados) {
      const existente = resComissoes.dados.find((c) => c.vendedorId === colaborador.id);
      proximosValores[colaborador.id] = existente
        ? { valor: existente.valor, garantido: existente.garantido }
        : { ...LINHA_ZERADA };
    }
    setValores(proximosValores);

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
    if (colaboradores.length === 0) {
      mostrarToast("Cadastre ao menos um vendedor habilitado para Comissão antes de salvar.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const salvos: ComissaoEntidade[] = [];
      for (const colaborador of colaboradores) {
        const linha = valores[colaborador.id] ?? LINHA_ZERADA;
        const resultado = await comissaoService.salvarComissao(filialAtiva, mesReferencia, {
          vendedorId: colaborador.id,
          valor: linha.valor,
          garantido: linha.garantido,
        });
        if (resultado.status !== "sucesso") {
          mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
          return;
        }
        salvos.push(resultado.dados);
      }
      setComissoesSalvas(salvos);
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

  function exportarExcel() {
    const exportou = exportarComissoesExcel(comissoesSalvas, colaboradores, filialAtiva);
    if (!exportou) mostrarToast("Não há comissões salvas para exportar.", "erro");
  }

  const totalColunas = 6 + (mostrarPev ? 1 : 0);
  const totalPev = mostrarPev
    ? colaboradores.reduce((soma, c) => soma + obterPevDaPremiacao(premiacoesDoMes, c.id), 0)
    : 0;
  const totalValor = colaboradores.reduce((soma, c) => soma + (valores[c.id]?.valor ?? 0), 0);
  const totalGarantido = colaboradores.reduce((soma, c) => soma + (valores[c.id]?.garantido ?? 0), 0);

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

      <div className="acoes-tabela" style={{ justifyContent: "flex-start" }}>
        {ehAdmin && !mostrarFilial ? (
          <Button variant="secundario" onClick={alternarBloqueio} carregando={alternandoBloqueio}>
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
              {colaboradores.length === 0 ? (
                <tr className="linha-vazia">
                  <td colSpan={totalColunas}>
                    <MensagemVazia mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)." />
                  </td>
                </tr>
              ) : (
                colaboradores.map((colaborador) => {
                  const valoresLinha = valores[colaborador.id] ?? LINHA_ZERADA;
                  const pev = obterPevDaPremiacao(premiacoesDoMes, colaborador.id);
                  return (
                    <tr key={colaborador.id}>
                      <td>{colaborador.codigo || "—"}</td>
                      <td>{colaborador.nome}</td>
                      <td>{colaborador.cpf}</td>
                      <td>{colaborador.cargo}</td>
                      {mostrarPev ? <td className="celula-numerica">{formatarMoeda(pev)}</td> : null}
                      <td className="celula-input">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          aria-label={`Comissão de ${colaborador.nome}`}
                          value={valoresLinha.valor || ""}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarCelula(colaborador.id, "valor", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="celula-input">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          aria-label={`Garantido de ${colaborador.nome}`}
                          value={valoresLinha.garantido || ""}
                          disabled={bloqueadoParaEdicao}
                          onChange={(e) => editarCelula(colaborador.id, "garantido", parseFloat(e.target.value) || 0)}
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
