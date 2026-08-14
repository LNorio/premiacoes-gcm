import { useState, type FormEvent } from "react";
import { planoSaudeService } from "../../adapters";
import { Button, Carregando, LinhaVazia, MensagemErro, Table } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, type PlanoSaudePeriodo, type TipoPlanoSaude } from "../../types";
import { formatarMoeda } from "../../utils/formatadores";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";

const ROTULOS_TIPO: Record<TipoPlanoSaude, string> = { saude: "Plano de Saúde", odontologico: "Plano Odontológico" };
const ROTULOS_PESSOA: Record<"titular" | "dependente", string> = { titular: "Titular", dependente: "Dependente" };

function formatarDataBr(dataIso: string): string {
  return dataIso.slice(0, 10).split("-").reverse().join("/");
}

export function CadastroPeriodoPlano() {
  const { sessao } = useSessao();
  const [tipoPlano, setTipoPlano] = useState<TipoPlanoSaude>("saude");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<PlanoSaudePeriodo[]>([]);
  const [novoValorTitular, setNovoValorTitular] = useState("");
  const [novoValorDependente, setNovoValorDependente] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [encerrandoId, setEncerrandoId] = useState<string | null>(null);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const filialSelecionada = filialAtiva !== FILIAL_TODAS;

  useEfeitoAssincrono(
    (foiCancelado) => {
      if (!sessao || !filialSelecionada) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro(null);

      planoSaudeService.listarPeriodosPlanoSaude(filialAtiva, tipoPlano).then((resultado) => {
        if (foiCancelado()) return;
        if (resultado.status !== "sucesso") {
          setErro(resultado.status === "erro" ? resultado.mensagem : "Falha ao carregar.");
          setCarregando(false);
          return;
        }
        // mais recente primeiro (vigentes no topo, depois o histórico do mais novo pro mais antigo).
        setPeriodos([...resultado.dados].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao)));
        setCarregando(false);
      });
    },
    [sessao?.filialAtiva, tipoPlano],
  );

  function valorInvalido(valorTexto: string): boolean {
    if (!valorTexto) return false;
    const valor = parseFloat(valorTexto);
    return Number.isNaN(valor) || valor < 0;
  }

  async function cadastrarPeriodo(evento: FormEvent) {
    evento.preventDefault();
    if (!novoValorTitular && !novoValorDependente) {
      mostrarToast("Informe o valor de Titular e/ou Dependente.", "erro");
      return;
    }
    if (valorInvalido(novoValorTitular) || valorInvalido(novoValorDependente)) {
      mostrarToast("Informe um valor válido.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const novos: PlanoSaudePeriodo[] = [];
      const erros: string[] = [];

      for (const [tipoPessoa, valorTexto] of [
        ["titular", novoValorTitular],
        ["dependente", novoValorDependente],
      ] as const) {
        if (!valorTexto) continue;
        const resultado = await planoSaudeService.salvarPeriodoPlanoSaude(filialAtiva, tipoPlano, tipoPessoa, parseFloat(valorTexto));
        if (resultado.status === "sucesso") {
          novos.push(resultado.dados);
        } else {
          erros.push(`${ROTULOS_PESSOA[tipoPessoa]}: ${resultado.status === "erro" ? resultado.mensagem : "falha ao salvar"}`);
        }
      }

      if (novos.length > 0) {
        setPeriodos((atual) => [...novos, ...atual]);
        if (novos.some((p) => p.tipoPessoa === "titular")) setNovoValorTitular("");
        if (novos.some((p) => p.tipoPessoa === "dependente")) setNovoValorDependente("");
      }
      if (erros.length > 0) {
        mostrarToast(erros.join(" — "), "erro");
      } else {
        mostrarToast("Período cadastrado com sucesso.", "sucesso");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function encerrarPeriodo(periodo: PlanoSaudePeriodo) {
    setEncerrandoId(periodo.id);
    try {
      const resultado = await planoSaudeService.encerrarPeriodoPlanoSaude(periodo);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao encerrar.", "erro");
        return;
      }
      setPeriodos((atual) => atual.map((p) => (p.id === periodo.id ? resultado.dados : p)));
      mostrarToast("Vigência do período encerrada.", "sucesso");
    } finally {
      setEncerrandoId(null);
    }
  }

  return (
    <div style={{ marginTop: "var(--esp-6)" }}>
      <h3 style={{ marginBottom: "var(--esp-3)" }}>Período do plano</h3>
      <p className="dica-campo" style={{ marginBottom: "var(--esp-4)" }}>
        Cadastre o valor vigente nesta filial — ele substitui o usado na aba Lançamento a partir da Data de Início. Titular
        e Dependente têm valor e vigência independentes: preencha só um dos campos ou os dois. Só pode existir um período
        vigente por vez (por tipo de plano e tipo de pessoa); para trocar o valor, encerre o atual e cadastre um novo.
        Períodos encerrados ficam como histórico.
      </p>

      <div className="acoes-tabela" style={{ justifyContent: "flex-start", marginBottom: "var(--esp-4)" }}>
        <Button variant={tipoPlano === "saude" ? "dourado" : "secundario"} onClick={() => setTipoPlano("saude")}>
          Plano de Saúde
        </Button>
        <Button variant={tipoPlano === "odontologico" ? "dourado" : "secundario"} onClick={() => setTipoPlano("odontologico")}>
          Plano Odontológico
        </Button>
      </div>

      {!filialSelecionada ? (
        <MensagemErro mensagem="Selecione uma filial específica (menu no topo) para cadastrar períodos do plano." />
      ) : (
        <>
          <form className="formulario grade-formulario" onSubmit={cadastrarPeriodo}>
            <div className="campo">
              <label htmlFor="periodo-novo-valor-titular">Valor Titular</label>
              <input
                id="periodo-novo-valor-titular"
                type="number"
                min={0}
                step={0.01}
                value={novoValorTitular}
                onChange={(e) => setNovoValorTitular(e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="periodo-novo-valor-dependente">Valor Dependente</label>
              <input
                id="periodo-novo-valor-dependente"
                type="number"
                min={0}
                step={0.01}
                value={novoValorDependente}
                onChange={(e) => setNovoValorDependente(e.target.value)}
              />
            </div>
            <div className="formulario-rodape" style={{ alignSelf: "end" }}>
              <Button type="submit" variant="dourado" carregando={salvando}>
                + Novo período
              </Button>
            </div>
          </form>

          {carregando ? (
            <Carregando />
          ) : erro ? (
            <MensagemErro mensagem={erro} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Data de Início</th>
                  <th>Tipo de Pessoa</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th>Data de Encerramento</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {periodos.length === 0 ? (
                  <LinhaVazia colSpan={6} mensagem={`Nenhum período cadastrado para ${ROTULOS_TIPO[tipoPlano]} nesta filial.`} />
                ) : (
                  periodos.map((periodo) => (
                    <tr key={periodo.id}>
                      <td>{formatarDataBr(periodo.dataCriacao)}</td>
                      <td>{ROTULOS_PESSOA[periodo.tipoPessoa]}</td>
                      <td className="celula-numerica">{formatarMoeda(periodo.valor)}</td>
                      <td>{periodo.ativo ? "Vigente" : "Encerrado"}</td>
                      <td>{periodo.dataValidade ? formatarDataBr(periodo.dataValidade) : "—"}</td>
                      <td className="celula-acoes-form">
                        {periodo.ativo ? (
                          <Button
                            variant="perigo"
                            carregando={encerrandoId === periodo.id}
                            onClick={() => encerrarPeriodo(periodo)}
                          >
                            Encerrar vigência
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
