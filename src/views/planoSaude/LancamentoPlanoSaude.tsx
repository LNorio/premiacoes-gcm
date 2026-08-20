import { useState } from "react";
import { bloqueioService, colaboradoresService, planoSaudeService } from "../../adapters";
import { AjudaPopover, Button, Carregando, LinhaVazia, MensagemErro, Paginacao, Table } from "../../components/ui";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { encontrarPeriodoPlano, listarPessoasPlanoSaude, type PessoaPlanoSaude } from "../../services/planoSaudeService";
import { useSessao } from "../../state/SessaoContext";
import {
  FILIAL_TODAS,
  type Colaborador,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
  type PlanoSaudePeriodo,
  type TipoPlanoSaude,
  type TotaisDesligadosPlano,
} from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { normalizarBusca } from "../../utils/texto";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";
import { usePaginacao } from "../../utils/usePaginacao";

interface ValoresExtras {
  valorAdicional: number;
  valorCoparticipacao: number;
}
const EXTRAS_ZERADOS: ValoresExtras = { valorAdicional: 0, valorCoparticipacao: 0 };

const DESLIGADOS_ZERADOS: TotaisDesligadosPlano = { titular: 0, dependente: 0, adicional: 0, coparticipacao: 0 };

const ROTULOS_TIPO_PLANO: Record<TipoPlanoSaude, { titulo: string; rotuloTitular: string; rotuloDependente: string; rotuloTotal: string }> = {
  saude: { titulo: "Plano de Saúde", rotuloTitular: "R$ Titular", rotuloDependente: "R$ Dep.", rotuloTotal: "R$ Total" },
  odontologico: { titulo: "Plano Odontológico", rotuloTitular: "Titular", rotuloDependente: "Dependente", rotuloTotal: "Total" },
};

/**
 * Agrupa a lista plana de pessoas por titular, pra paginar sem separar um dependente
 * do titular dele — cada grupo é "uma página inteira" pra fins de paginação. Se um
 * dependente aparecer sem o titular correspondente no array (ex.: busca bateu só no
 * dependente), ele vira seu próprio grupo, em vez de quebrar.
 */
export function agruparPorTitular(pessoas: PessoaPlanoSaude[]): PessoaPlanoSaude[][] {
  const grupos: PessoaPlanoSaude[][] = [];
  const indicePorTitular = new Map<string, number>();
  for (const pessoa of pessoas) {
    if (pessoa.tipo === "titular") {
      indicePorTitular.set(pessoa.titularId, grupos.length);
      grupos.push([pessoa]);
      continue;
    }
    const indice = indicePorTitular.get(pessoa.titularId);
    if (indice !== undefined) grupos[indice].push(pessoa);
    else grupos.push([pessoa]);
  }
  return grupos;
}

export function LancamentoPlanoSaude() {
  const { sessao } = useSessao();
  const [tipoPlano, setTipoPlano] = useState<TipoPlanoSaude>("saude");
  const [mesReferencia, setMesReferencia] = useState(obterMesAtualISO());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [titulares, setTitulares] = useState<Colaborador[]>([]);
  const [dependentes, setDependentes] = useState<PlanoSaudeDependente[]>([]);
  const [lancamentos, setLancamentos] = useState<PlanoSaudeLancamento[]>([]);
  const [periodos, setPeriodos] = useState<PlanoSaudePeriodo[]>([]);
  const [valoresExtras, setValoresExtras] = useState<Record<string, ValoresExtras>>({});
  const [desligadosPorColuna, setDesligadosPorColuna] = useState<TotaisDesligadosPlano>(DESLIGADOS_ZERADOS);
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternandoBloqueio, setAlternandoBloqueio] = useState(false);
  const [busca, setBusca] = useState("");
  const [exportando, setExportando] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const temCamposEditaveis = tipoPlano === "saude";
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("planoSaude", sessao.role, bloqueado) : false;
  // Total desligados é um valor único por filial — não dá pra gravar com "Todas as filiais" selecionada.
  const podeEditarDesligados = !mostrarFilial;
  const rotulos = ROTULOS_TIPO_PLANO[tipoPlano];

  useEfeitoAssincrono(
    (foiCancelado) => {
      if (!sessao) return;
      setCarregando(true);
      setErro(null);

      colaboradoresService.listarColaboradores(filialAtiva).then(async (resColaboradores) => {
        if (foiCancelado()) return;
        if (resColaboradores.status !== "sucesso") {
          setErro(resColaboradores.status === "erro" ? resColaboradores.mensagem : "Falha ao carregar.");
          setCarregando(false);
          return;
        }

        const habilitados = resColaboradores.dados.filter((c) => c.telas.planoSaude);
        const [respostasDependentes, resLancamentos, resPeriodos] = await Promise.all([
          Promise.all(habilitados.map((t) => planoSaudeService.listarDependentes(t.id))),
          planoSaudeService.listarLancamentosPlanoSaude(filialAtiva, mesReferencia, tipoPlano),
          planoSaudeService.listarPeriodosPlanoSaude(filialAtiva, tipoPlano),
        ]);
        if (foiCancelado()) return;

        if (resLancamentos.status !== "sucesso") {
          setErro(resLancamentos.status === "erro" ? resLancamentos.mensagem : "Falha ao carregar.");
          setCarregando(false);
          return;
        }

        setTitulares(habilitados);
        setDependentes(respostasDependentes.flatMap((r) => (r.status === "sucesso" ? r.dados : [])));
        setLancamentos(resLancamentos.dados.lancamentos);
        setPeriodos(resPeriodos.status === "sucesso" ? resPeriodos.dados : []);
        setDesligadosPorColuna(resLancamentos.dados.totalDesligados);

        const extras: Record<string, ValoresExtras> = {};
        for (const lancamento of resLancamentos.dados.lancamentos) {
          extras[lancamento.pessoaId] = {
            valorAdicional: lancamento.valorAdicional ?? 0,
            valorCoparticipacao: lancamento.valorCoparticipacao ?? 0,
          };
        }
        setValoresExtras(extras);

        if (!mostrarFilial) {
          const resBloqueio = await bloqueioService.consultarBloqueio("planoSaude", filialAtiva, mesReferencia);
          if (foiCancelado()) return;
          setBloqueado(resBloqueio.status === "sucesso" ? resBloqueio.dados : false);
        } else {
          setBloqueado(false);
        }

        setCarregando(false);
      });
    },
    [sessao?.filialAtiva, mesReferencia, tipoPlano],
  );

  const pessoas = listarPessoasPlanoSaude(titulares, dependentes, tipoPlano);

  function editarExtra(pessoaId: string, campo: keyof ValoresExtras, valor: number) {
    setValoresExtras((atual) => ({ ...atual, [pessoaId]: { ...(atual[pessoaId] ?? EXTRAS_ZERADOS), [campo]: valor } }));
  }

  function editarDesligado(campo: keyof TotaisDesligadosPlano, valor: number) {
    setDesligadosPorColuna((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar() {
    if (!sessao) return;
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível salvar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }

    setSalvando(true);
    try {
      if (temCamposEditaveis && pessoas.length > 0) {
        const salvos: PlanoSaudeLancamento[] = [];
        for (const pessoa of pessoas) {
          const extras = valoresExtras[pessoa.id] ?? EXTRAS_ZERADOS;
          const existente = lancamentos.find((l) => l.pessoaId === pessoa.id);
          const resultado = await planoSaudeService.salvarLancamentoPlanoSaude({
            id: existente?.id ?? "",
            pessoaId: pessoa.id,
            titularId: pessoa.titularId,
            mesReferencia,
            tipoPlano,
            valorAdicional: extras.valorAdicional,
            valorCoparticipacao: extras.valorCoparticipacao,
          });
          if (resultado.status !== "sucesso") {
            mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
            return;
          }
          salvos.push(resultado.dados);
        }
        setLancamentos(salvos);
      }

      if (podeEditarDesligados) {
        const resultadoDesligados = await planoSaudeService.salvarTotalDesligadosPlanoSaude(
          filialAtiva,
          mesReferencia,
          tipoPlano,
          desligadosPorColuna,
        );
        if (resultadoDesligados.status !== "sucesso") {
          mostrarToast(resultadoDesligados.status === "erro" ? resultadoDesligados.mensagem : "Falha ao salvar total de desligados.", "erro");
          return;
        }
      }

      mostrarToast(`${rotulos.titulo} de ${mesReferencia} salvo com sucesso.`, "sucesso");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarBloqueio() {
    setAlternandoBloqueio(true);
    try {
      const resultado = await bloqueioService.alternarBloqueio("planoSaude", filialAtiva, mesReferencia);
      if (resultado.status === "sucesso") {
        setBloqueado(resultado.dados);
        mostrarToast(
          resultado.dados
            ? `Lançamentos de Plano de Saúde de ${mesReferencia} bloqueados.`
            : `Lançamentos de Plano de Saúde de ${mesReferencia} desbloqueados.`,
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
      const resultado = await planoSaudeService.exportarCSV(filialAtiva, mesReferencia, tipoPlano);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao exportar.", "erro");
      }
    } finally {
      setExportando(false);
    }
  }

  const totalColunas = 3 + (mostrarFilial ? 1 : 0) + 2 + (temCamposEditaveis ? 2 : 0) + 1;
  let totalTitular = 0;
  let totalDependente = 0;
  let totalAdicional = 0;
  let totalCoparticipacao = 0;
  for (const pessoa of pessoas) {
    const periodo = encontrarPeriodoPlano(periodos, pessoa.filial, tipoPlano, pessoa.tipo, mesReferencia);
    const valorFixo = periodo?.valor ?? 0;
    if (pessoa.tipo === "titular") totalTitular += valorFixo;
    else totalDependente += valorFixo;
    if (temCamposEditaveis) {
      const extras = valoresExtras[pessoa.id] ?? EXTRAS_ZERADOS;
      totalAdicional += extras.valorAdicional;
      totalCoparticipacao += extras.valorCoparticipacao;
    }
  }
  const totalAtivos = totalTitular + totalDependente + totalAdicional + totalCoparticipacao;
  const totalDesligadosSoma =
    desligadosPorColuna.titular +
    desligadosPorColuna.dependente +
    (temCamposEditaveis ? desligadosPorColuna.adicional + desligadosPorColuna.coparticipacao : 0);
  const totalGeral = totalAtivos + totalDesligadosSoma;

  // Busca só filtra o que é exibido — os totais acima continuam somando todo mundo, buscado ou não.
  const buscaNormalizada = normalizarBusca(busca);
  const pessoasFiltradas = buscaNormalizada
    ? pessoas.filter((p) => [p.codigo, p.nome].some((campo) => normalizarBusca(campo).includes(buscaNormalizada)))
    : pessoas;
  // Pagina por grupo titular+dependentes (não por <tr>) — ver agruparPorTitular acima.
  const paginacao = usePaginacao(agruparPorTitular(pessoasFiltradas));
  const pessoasDaPagina = paginacao.itensDaPagina.flat();

  return (
    <div style={{ marginTop: "var(--esp-6)" }}>
      <h3 style={{ marginBottom: "var(--esp-3)" }}>Lançamento mensal do desconto</h3>

      <div className="acoes-tabela" style={{ justifyContent: "flex-start", marginBottom: "var(--esp-2)" }}>
        <Button variant={tipoPlano === "saude" ? "dourado" : "secundario"} onClick={() => setTipoPlano("saude")}>
          Plano de Saúde
        </Button>
        <Button variant={tipoPlano === "odontologico" ? "dourado" : "secundario"} onClick={() => setTipoPlano("odontologico")}>
          Plano Odontológico
        </Button>
      </div>

      <form className="formulario grade-formulario" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="plano-saude-mes-referencia">Mês de referência</label>
          <input
            type="month"
            id="plano-saude-mes-referencia"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
          />
        </div>
      </form>

      <div className="acoes-tabela" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "10px" }}>
        <div className="campo" style={{ marginBottom: 0, minWidth: "220px", flex: "1 1 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--esp-1)" }}>
            <label htmlFor="plano-saude-lancamento-busca" style={{ marginBottom: 0 }}>
              Buscar titular/dependente
            </label>
            <AjudaPopover texto="Esta busca serve só para facilitar encontrar um titular/dependente na lista e preencher os valores dele — ela não altera os totais (Total ativos/desligados/geral) nem a exportação CSV da filial, que sempre consideram todo mundo, buscado ou não." />
          </div>
          <input
            id="plano-saude-lancamento-busca"
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
                <th>Cód.</th>
                <th>Nome Titular</th>
                {mostrarFilial ? <th>Filial</th> : null}
                <th>Descrição</th>
                <th>{rotulos.rotuloTitular}</th>
                <th>{rotulos.rotuloDependente}</th>
                {temCamposEditaveis ? (
                  <>
                    <th>R$ Adicional</th>
                    <th>R$ Coopart.</th>
                  </>
                ) : null}
                <th>{rotulos.rotuloTotal}</th>
              </tr>
            </thead>
            <tbody>
              {pessoasFiltradas.length === 0 ? (
                <LinhaVazia
                  colSpan={totalColunas}
                  mensagem={
                    buscaNormalizada
                      ? `Nenhum titular/dependente encontrado para "${busca.trim()}".`
                      : `Nenhum titular com adesão a ${rotulos.titulo} no momento (marque a adesão na aba "Titulares e Dependentes").`
                  }
                />
              ) : (
                pessoasDaPagina.map((pessoa) => {
                  const periodo = encontrarPeriodoPlano(periodos, pessoa.filial, tipoPlano, pessoa.tipo, mesReferencia);
                  const valorFixo = periodo?.valor ?? 0;
                  const extras = valoresExtras[pessoa.id] ?? EXTRAS_ZERADOS;
                  // Usa os valores em edição (valoresExtras), não o lançamento já salvo — senão o
                  // total da linha não reagiria ao que o usuário acabou de digitar.
                  const total = valorFixo + (temCamposEditaveis ? extras.valorAdicional + extras.valorCoparticipacao : 0);
                  return (
                    <tr key={pessoa.id}>
                      <td>{pessoa.codigo || "—"}</td>
                      <td>
                        {pessoa.tipo === "dependente" ? "   " : ""}
                        {pessoa.nome}
                      </td>
                      {mostrarFilial ? <td>Filial {pessoa.filial}</td> : null}
                      <td>{pessoa.tipo === "titular" ? "TITULAR" : "DEPENDENTE"}</td>
                      {pessoa.tipo === "titular" ? (
                        <td className="celula-numerica">{formatarMoeda(valorFixo)}</td>
                      ) : (
                        <td className="celula-bloqueada">***</td>
                      )}
                      {pessoa.tipo === "dependente" ? (
                        <td className="celula-numerica">{formatarMoeda(valorFixo)}</td>
                      ) : (
                        <td className="celula-bloqueada">***</td>
                      )}
                      {temCamposEditaveis ? (
                        <>
                          <td className="celula-input">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              aria-label={`Valor adicional de ${pessoa.nome}`}
                              value={extras.valorAdicional || ""}
                              disabled={bloqueadoParaEdicao}
                              onChange={(e) => editarExtra(pessoa.id, "valorAdicional", parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="celula-input">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              aria-label={`Valor de coparticipação de ${pessoa.nome}`}
                              value={extras.valorCoparticipacao || ""}
                              disabled={bloqueadoParaEdicao}
                              onChange={(e) => editarExtra(pessoa.id, "valorCoparticipacao", parseFloat(e.target.value) || 0)}
                            />
                          </td>
                        </>
                      ) : null}
                      <td className="celula-numerica celula-total">{formatarMoeda(total)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3 + (mostrarFilial ? 1 : 0)}>Total ativos</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalTitular)}</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalDependente)}</td>
                {temCamposEditaveis ? (
                  <>
                    <td className="celula-numerica celula-total">{formatarMoeda(totalAdicional)}</td>
                    <td className="celula-numerica celula-total">{formatarMoeda(totalCoparticipacao)}</td>
                  </>
                ) : null}
                <td className="celula-numerica celula-total">{formatarMoeda(totalAtivos)}</td>
              </tr>
              <tr>
                <td colSpan={3 + (mostrarFilial ? 1 : 0)}>Total desligados</td>
                <td className="celula-input celula-input-dourado">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    aria-label="Total desligados — Titular"
                    value={desligadosPorColuna.titular}
                    disabled={bloqueadoParaEdicao || !podeEditarDesligados}
                    onChange={(e) => editarDesligado("titular", parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="celula-input celula-input-dourado">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    aria-label="Total desligados — Dependente"
                    value={desligadosPorColuna.dependente}
                    disabled={bloqueadoParaEdicao || !podeEditarDesligados}
                    onChange={(e) => editarDesligado("dependente", parseFloat(e.target.value) || 0)}
                  />
                </td>
                {temCamposEditaveis ? (
                  <>
                    <td className="celula-input celula-input-dourado">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        aria-label="Total desligados — Adicional"
                        value={desligadosPorColuna.adicional}
                        disabled={bloqueadoParaEdicao || !podeEditarDesligados}
                        onChange={(e) => editarDesligado("adicional", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="celula-input celula-input-dourado">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        aria-label="Total desligados — Coparticipação"
                        value={desligadosPorColuna.coparticipacao}
                        disabled={bloqueadoParaEdicao || !podeEditarDesligados}
                        onChange={(e) => editarDesligado("coparticipacao", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  </>
                ) : null}
                <td className="celula-numerica celula-total">{formatarMoeda(totalDesligadosSoma)}</td>
              </tr>
              <tr>
                <td colSpan={3 + (mostrarFilial ? 1 : 0)}>Total geral</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalTitular + desligadosPorColuna.titular)}</td>
                <td className="celula-numerica celula-total">{formatarMoeda(totalDependente + desligadosPorColuna.dependente)}</td>
                {temCamposEditaveis ? (
                  <>
                    <td className="celula-numerica celula-total">{formatarMoeda(totalAdicional + desligadosPorColuna.adicional)}</td>
                    <td className="celula-numerica celula-total">
                      {formatarMoeda(totalCoparticipacao + desligadosPorColuna.coparticipacao)}
                    </td>
                  </>
                ) : null}
                <td className="celula-numerica celula-total">{formatarMoeda(totalGeral)}</td>
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

          {!podeEditarDesligados ? (
            <p className="dica-campo" style={{ marginTop: "var(--esp-3)" }}>
              Selecione uma filial específica no cabeçalho para editar o Total de desligados — a API não aceita gravar um
              total agregado de "Todas as filiais".
            </p>
          ) : null}

          {temCamposEditaveis || podeEditarDesligados ? (
            <div className="acoes-tabela">
              <Button variant="dourado" onClick={salvar} disabled={bloqueadoParaEdicao} carregando={salvando}>
                💾 Salvar lançamento do mês
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
