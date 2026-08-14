import { useState, type FormEvent } from "react";
import { colaboradoresService, planoSaudeService } from "../../adapters";
import { Button, Carregando, LinhaVazia, MensagemErro, Modal, Table } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, type Colaborador, type PlanoSaudeDependente } from "../../types";
import { mascararCpf } from "../../utils/formatadores";
import { mostrarToast } from "../../utils/toast";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";

export function CadastroTitulares() {
  const { sessao } = useSessao();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [titulares, setTitulares] = useState<Colaborador[]>([]);
  const [dependentes, setDependentes] = useState<PlanoSaudeDependente[]>([]);
  const [titularModal, setTitularModal] = useState<Colaborador | null>(null);
  const [formulario, setFormulario] = useState({ nome: "", cpf: "" });
  const [salvandoDependente, setSalvandoDependente] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [alternandoAdesao, setAlternandoAdesao] = useState<string | null>(null);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;

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
        const respostas = await Promise.all(habilitados.map((t) => planoSaudeService.listarDependentes(t.id)));
        if (foiCancelado()) return;

        setTitulares(habilitados);
        setDependentes(respostas.flatMap((r) => (r.status === "sucesso" ? r.dados : [])));
        setCarregando(false);
      });
    },
    [sessao?.filialAtiva],
  );

  async function alternarAdesao(titular: Colaborador, tipo: "saude" | "odontologico") {
    const campo = tipo === "saude" ? "adesaoSaude" : "adesaoOdontologico";
    const valorAtual = titular[campo] !== false;
    setAlternandoAdesao(`${titular.id}-${tipo}`);
    try {
      const resultado = await planoSaudeService.salvarAdesao(titular.id, tipo, !valorAtual);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
        return;
      }
      setTitulares((atual) => atual.map((t) => (t.id === titular.id ? { ...t, [campo]: !valorAtual } : t)));
    } finally {
      setAlternandoAdesao(null);
    }
  }

  function abrirModalDependente(titular: Colaborador) {
    setTitularModal(titular);
    setFormulario({ nome: "", cpf: "" });
  }

  function fecharModal() {
    setTitularModal(null);
  }

  async function salvarDependente(evento: FormEvent) {
    evento.preventDefault();
    if (!titularModal) return;
    if (!formulario.nome.trim()) {
      mostrarToast("Informe o nome do dependente.", "erro");
      return;
    }

    setSalvandoDependente(true);
    try {
      const resultado = await planoSaudeService.salvarDependente({
        vendedorId: titularModal.id,
        nome: formulario.nome.trim(),
        cpf: formulario.cpf.trim(),
      });
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao salvar.", "erro");
        return;
      }
      setDependentes((atual) => [...atual, resultado.dados]);
      mostrarToast("Dependente adicionado com sucesso.", "sucesso");
      fecharModal();
    } finally {
      setSalvandoDependente(false);
    }
  }

  async function removerDependente(dependente: PlanoSaudeDependente) {
    setRemovendoId(dependente.id);
    try {
      const resultado = await planoSaudeService.removerDependente(dependente.id);
      if (resultado.status !== "sucesso") {
        mostrarToast(resultado.status === "erro" ? resultado.mensagem : "Falha ao remover.", "erro");
        return;
      }
      setDependentes((atual) => atual.filter((d) => d.id !== dependente.id));
    } finally {
      setRemovendoId(null);
    }
  }

  const totalColunas = 6 + (mostrarFilial ? 1 : 0);

  return (
    <div>
      <h3 style={{ marginBottom: "var(--esp-3)" }}>Titulares e dependentes</h3>
      <p className="dica-campo" style={{ marginBottom: "var(--esp-4)" }}>
        Os titulares são os vendedores já cadastrados na filial. Use o botão "+ Dependente" para adicionar os dependentes de
        cada colaborador. Marque, para cada titular, se a família tem Plano de Saúde, Plano Odontológico ou os dois — isso
        decide quem aparece em cada aba do Lançamento.
      </p>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <MensagemErro mensagem={erro} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              {mostrarFilial ? <th>Filial</th> : null}
              <th>Tipo</th>
              <th>Plano de Saúde</th>
              <th>Plano Odontológico</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {titulares.length === 0 ? (
              <LinhaVazia
                colSpan={totalColunas}
                mensagem="Nenhum colaborador habilitado para esta tela ainda (marque o checklist no Cadastro de Colaboradores)."
              />
            ) : (
              titulares.flatMap((titular) => {
                const temSaude = titular.adesaoSaude !== false;
                const temOdonto = titular.adesaoOdontologico !== false;
                const dependentesDoTitular = dependentes.filter((d) => d.vendedorId === titular.id);

                const linhaTitular = (
                  <tr key={titular.id}>
                    <td>{titular.nome}</td>
                    <td>{titular.cpf}</td>
                    {mostrarFilial ? <td>Filial {titular.filial}</td> : null}
                    <td>Titular</td>
                    <td className="celula-checkbox">
                      <input
                        type="checkbox"
                        aria-label={`Plano de Saúde de ${titular.nome}`}
                        checked={temSaude}
                        disabled={!ehAdmin || alternandoAdesao === `${titular.id}-saude`}
                        onChange={() => void alternarAdesao(titular, "saude")}
                      />
                    </td>
                    <td className="celula-checkbox">
                      <input
                        type="checkbox"
                        aria-label={`Plano Odontológico de ${titular.nome}`}
                        checked={temOdonto}
                        disabled={!ehAdmin || alternandoAdesao === `${titular.id}-odontologico`}
                        onChange={() => void alternarAdesao(titular, "odontologico")}
                      />
                    </td>
                    <td className="celula-acoes-form">
                      {ehAdmin ? (
                        <Button variant="secundario" onClick={() => abrirModalDependente(titular)}>
                          + Dependente
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );

                const linhasDependentes = dependentesDoTitular.map((dependente) => (
                  <tr key={dependente.id}>
                    <td style={{ paddingLeft: "var(--esp-6)" }}>{dependente.nome}</td>
                    <td>{dependente.cpf || "—"}</td>
                    {mostrarFilial ? <td>Filial {titular.filial}</td> : null}
                    <td>Dependente</td>
                    <td className="celula-checkbox">{temSaude ? "✓" : "—"}</td>
                    <td className="celula-checkbox">{temOdonto ? "✓" : "—"}</td>
                    <td className="celula-acoes-form">
                      {ehAdmin ? (
                        <Button
                          variant="perigo"
                          carregando={removendoId === dependente.id}
                          onClick={() => removerDependente(dependente)}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ));

                return [linhaTitular, ...linhasDependentes];
              })
            )}
          </tbody>
        </Table>
      )}

      <Modal aberto={titularModal !== null} titulo={`Adicionar dependente de ${titularModal?.nome ?? ""}`} onFechar={fecharModal}>
        <form onSubmit={salvarDependente}>
          <div className="grade-formulario">
            <div className="campo">
              <label htmlFor="dependente-nome">Nome completo</label>
              <input
                id="dependente-nome"
                type="text"
                required
                value={formulario.nome}
                onChange={(e) => setFormulario((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="campo">
              <label htmlFor="dependente-cpf">CPF</label>
              <input
                id="dependente-cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                value={formulario.cpf}
                onChange={(e) => setFormulario((f) => ({ ...f, cpf: mascararCpf(e.target.value) }))}
              />
            </div>
          </div>
          <div className="formulario-rodape" style={{ marginTop: "var(--esp-5)" }}>
            <Button type="submit" variant="primario" carregando={salvandoDependente}>
              Adicionar
            </Button>
            <Button type="button" variant="secundario" onClick={fecharModal} disabled={salvandoDependente}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
