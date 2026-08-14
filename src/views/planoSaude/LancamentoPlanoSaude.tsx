import { useState } from "react";
import { bloqueioService, colaboradoresService, planoSaudeService } from "../../adapters";
import { Button, Carregando, LinhaVazia, MensagemErro, Table } from "../../components/ui";
import { usuarioEstaBloqueadoNaTela } from "../../services/bloqueioService";
import { encontrarPeriodoPlano, exportarPlanoSaudeExcel, listarPessoasPlanoSaude } from "../../services/planoSaudeService";
import { useSessao } from "../../state/SessaoContext";
import {
  FILIAL_TODAS,
  type Colaborador,
  type PlanoSaudeDependente,
  type PlanoSaudeLancamento,
  type PlanoSaudePeriodo,
  type TipoPlanoSaude,
} from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";

interface ValoresExtras {
  valorAdicional: number;
  valorCoparticipacao: number;
}
const EXTRAS_ZERADOS: ValoresExtras = { valorAdicional: 0, valorCoparticipacao: 0 };

const ROTULOS_TIPO_PLANO: Record<TipoPlanoSaude, { titulo: string; rotuloTitular: string; rotuloDependente: string; rotuloTotal: string }> = {
  saude: { titulo: "Plano de Saúde", rotuloTitular: "R$ Titular", rotuloDependente: "R$ Dep.", rotuloTotal: "R$ Total" },
  odontologico: { titulo: "Plano Odontológico", rotuloTitular: "Titular", rotuloDependente: "Dependente", rotuloTotal: "Total" },
};

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
  const [bloqueado, setBloqueado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternandoBloqueio, setAlternandoBloqueio] = useState(false);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const temCamposEditaveis = tipoPlano === "saude";
  const bloqueadoParaEdicao = sessao ? usuarioEstaBloqueadoNaTela("planoSaude", sessao.role, bloqueado) : false;
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
        setLancamentos(resLancamentos.dados);
        setPeriodos(resPeriodos.status === "sucesso" ? resPeriodos.dados : []);

        const extras: Record<string, ValoresExtras> = {};
        for (const lancamento of resLancamentos.dados) {
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

  async function salvar() {
    if (!sessao || !temCamposEditaveis) return;
    if (bloqueadoParaEdicao) {
      mostrarToast("Não é possível salvar: lançamentos bloqueados pelo Administrador.", "erro");
      return;
    }
    if (pessoas.length === 0) {
      mostrarToast(`Nenhum titular com adesão a ${rotulos.titulo} no momento.`, "erro");
      return;
    }

    setSalvando(true);
    try {
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

  function exportarExcel() {
    const exportou = exportarPlanoSaudeExcel(pessoas, lancamentos, periodos, tipoPlano, mesReferencia, filialAtiva);
    if (!exportou) mostrarToast("Não há titulares/dependentes com adesão a este plano para exportar.", "erro");
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
  const totalGeral = totalTitular + totalDependente + totalAdicional + totalCoparticipacao;

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

      <div className="acoes-tabela" style={{ justifyContent: "flex-start" }}>
        {ehAdmin && !mostrarFilial && temCamposEditaveis ? (
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
              {pessoas.length === 0 ? (
                <LinhaVazia
                  colSpan={totalColunas}
                  mensagem={`Nenhum titular com adesão a ${rotulos.titulo} no momento (marque a adesão na aba "Titulares e Dependentes").`}
                />
              ) : (
                pessoas.map((pessoa) => {
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
            {pessoas.length > 0 ? (
              <tfoot>
                <tr>
                  <td colSpan={3 + (mostrarFilial ? 1 : 0)}>Total geral</td>
                  <td className="celula-numerica celula-total">{formatarMoeda(totalTitular)}</td>
                  <td className="celula-numerica celula-total">{formatarMoeda(totalDependente)}</td>
                  {temCamposEditaveis ? (
                    <>
                      <td className="celula-numerica celula-total">{formatarMoeda(totalAdicional)}</td>
                      <td className="celula-numerica celula-total">{formatarMoeda(totalCoparticipacao)}</td>
                    </>
                  ) : null}
                  <td className="celula-numerica celula-total">{formatarMoeda(totalGeral)}</td>
                </tr>
              </tfoot>
            ) : null}
          </Table>

          {temCamposEditaveis ? (
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
