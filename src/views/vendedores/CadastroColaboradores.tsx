import { useEffect, useState, type FormEvent } from "react";
import { colaboradoresService } from "../../adapters";
import { Carregando, MensagemErro, MensagemVazia } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, type Colaborador, type Resultado, type TelasHabilitadas } from "../../types";
import { CARGOS_COLABORADOR, FILIAIS, ROTULOS_TELAS_COLABORADOR } from "../../utils/constantes";
import { mascararCpf } from "../../utils/formatadores";
import { mostrarToast } from "../../utils/toast";

const TELAS_COLABORADOR = Object.keys(ROTULOS_TELAS_COLABORADOR) as (keyof TelasHabilitadas)[];

const TELAS_VAZIAS: TelasHabilitadas = {
  premiacoes: false,
  comissao: false,
  planoSaude: false,
  estoque: false,
  descontos: false,
};

interface FormularioColaborador {
  codigo: string;
  nome: string;
  cpf: string;
  cargo: string;
  filial: string;
  email: string;
  usuarioAcesso: string;
  senhaAcesso: string;
  telas: TelasHabilitadas;
}

function formularioVazio(filialPadrao: string): FormularioColaborador {
  return {
    codigo: "",
    nome: "",
    cpf: "",
    cargo: CARGOS_COLABORADOR[0],
    filial: filialPadrao,
    email: "",
    usuarioAcesso: "",
    senhaAcesso: "",
    telas: TELAS_VAZIAS,
  };
}

export function CadastroColaboradores() {
  const { sessao } = useSessao();
  const [resultado, setResultado] = useState<Resultado<Colaborador[]>>({ status: "carregando" });
  const filialPadrao = sessao && sessao.filialAtiva !== FILIAL_TODAS ? sessao.filialAtiva : FILIAIS[0];
  const [formulario, setFormulario] = useState<FormularioColaborador>(() => formularioVazio(filialPadrao));
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);

  const ehAdmin = sessao?.role === "admin";
  const mostrarFilial = ehAdmin && sessao?.filialAtiva === FILIAL_TODAS;
  const mostrarFormulario = ehAdmin;

  async function carregar() {
    if (!sessao) return;
    setResultado({ status: "carregando" });
    setResultado(await colaboradoresService.listarColaboradores(sessao.filialAtiva));
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.filialAtiva]);

  function cancelarEdicao() {
    setIdEmEdicao(null);
    setFormulario(formularioVazio(filialPadrao));
  }

  function iniciarEdicao(colaborador: Colaborador) {
    if (!ehAdmin) return;
    setIdEmEdicao(colaborador.id);
    setFormulario({
      codigo: colaborador.codigo,
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      cargo: colaborador.cargo,
      filial: colaborador.filial,
      email: colaborador.email,
      usuarioAcesso: colaborador.usuarioAcesso,
      senhaAcesso: colaborador.senhaAcesso,
      telas: colaborador.telas,
    });
  }

  async function remover(id: string) {
    if (!ehAdmin) return;
    if (idEmEdicao === id) cancelarEdicao();
    await colaboradoresService.removerColaborador(id);
    void carregar();
  }

  async function tratarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!sessao || sessao.role !== "admin") {
      mostrarToast("Apenas o Administrador pode cadastrar colaboradores.", "erro");
      return;
    }
    if (!formulario.filial) {
      mostrarToast("Selecione a filial do colaborador.", "erro");
      return;
    }
    if (!formulario.codigo || !formulario.nome || !formulario.cpf) {
      mostrarToast("Preencha ao menos código, nome e CPF do colaborador.", "erro");
      return;
    }
    if (!formulario.usuarioAcesso || !formulario.senhaAcesso) {
      mostrarToast("Defina um usuário e uma senha de acesso para o colaborador.", "erro");
      return;
    }

    const todos = await colaboradoresService.listarColaboradores(FILIAL_TODAS);
    const usuarioDuplicado =
      todos.status === "sucesso" &&
      todos.dados.some((c) => c.usuarioAcesso === formulario.usuarioAcesso && c.id !== idEmEdicao);
    if (usuarioDuplicado) {
      mostrarToast("Já existe um colaborador com esse usuário de acesso.", "erro");
      return;
    }

    const salvo = await colaboradoresService.salvarColaborador({
      id: idEmEdicao ?? "",
      ...formulario,
    });

    if (salvo.status === "erro") {
      mostrarToast(salvo.mensagem, "erro");
      return;
    }

    mostrarToast(idEmEdicao ? "Colaborador atualizado com sucesso." : "Colaborador cadastrado com sucesso.", "sucesso");
    cancelarEdicao();
    void carregar();
  }

  const lista = resultado.status === "sucesso" ? resultado.dados : [];
  const colspanVazio = 7 + (mostrarFilial ? 1 : 0) + (ehAdmin ? 1 : 0);

  const subtitulo = mostrarFilial
    ? "Colaboradores de todas as filiais — escolha a filial de cada novo colaborador no formulário"
    : ehAdmin
      ? "Colaboradores da filial — cada um recebe um usuário próprio para acessar suas métricas"
      : `Consulta dos colaboradores da Filial ${sessao?.filialAtiva}`;

  const mensagemVazia = ehAdmin
    ? mostrarFilial
      ? "Nenhum colaborador cadastrado ainda em nenhuma filial. Utilize o formulário acima."
      : "Nenhum colaborador cadastrado ainda nesta filial. Utilize o formulário acima."
    : "Nenhum colaborador cadastrado ainda nesta filial.";

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Cadastro de Colaboradores</h2>
        <span className="view-subtitulo">{subtitulo}</span>
      </div>

      {mostrarFormulario ? (
        <form onSubmit={tratarSubmit}>
          <div className="tabela-wrapper">
            <table className="tabela tabela-planilha">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome completo</th>
                  <th>CPF</th>
                  <th>Filial</th>
                  <th>Função</th>
                  <th>E-mail</th>
                  <th>Usuário de acesso</th>
                  <th>Senha de acesso</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="celula-input">
                    <input
                      type="text"
                      placeholder="Código"
                      required
                      value={formulario.codigo}
                      onChange={(e) => setFormulario((f) => ({ ...f, codigo: e.target.value }))}
                    />
                  </td>
                  <td className="celula-input">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      required
                      value={formulario.nome}
                      onChange={(e) => setFormulario((f) => ({ ...f, nome: e.target.value }))}
                    />
                  </td>
                  <td className="celula-input">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      required
                      value={formulario.cpf}
                      onChange={(e) => setFormulario((f) => ({ ...f, cpf: mascararCpf(e.target.value) }))}
                    />
                  </td>
                  <td className="celula-input">
                    <select
                      aria-label="Filial"
                      required
                      value={formulario.filial}
                      onChange={(e) => setFormulario((f) => ({ ...f, filial: e.target.value }))}
                    >
                      {FILIAIS.map((filial) => (
                        <option key={filial} value={filial}>
                          Filial {filial}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="celula-input">
                    <select value={formulario.cargo} onChange={(e) => setFormulario((f) => ({ ...f, cargo: e.target.value }))}>
                      {CARGOS_COLABORADOR.map((cargo) => (
                        <option key={cargo} value={cargo}>
                          {cargo}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="celula-input">
                    <input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formulario.email}
                      onChange={(e) => setFormulario((f) => ({ ...f, email: e.target.value }))}
                    />
                  </td>
                  <td className="celula-input">
                    <input
                      type="text"
                      placeholder="usuario.acesso"
                      required
                      value={formulario.usuarioAcesso}
                      onChange={(e) => setFormulario((f) => ({ ...f, usuarioAcesso: e.target.value }))}
                    />
                  </td>
                  <td className="celula-input">
                    <input
                      type="text"
                      placeholder="senha"
                      required
                      value={formulario.senhaAcesso}
                      onChange={(e) => setFormulario((f) => ({ ...f, senhaAcesso: e.target.value }))}
                    />
                  </td>
                  <td className="celula-acoes-form">
                    <button type="submit" className="botao botao-primario">
                      {idEmEdicao ? "Salvar alterações" : "Cadastrar"}
                    </button>
                    {idEmEdicao ? (
                      <button type="button" className="botao botao-secundario" onClick={cancelarEdicao}>
                        Cancelar
                      </button>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="checklist-telas">
            <span className="checklist-telas-titulo">Este colaborador aparece nas telas:</span>
            {TELAS_COLABORADOR.map((chave) => (
              <label key={chave}>
                <input
                  type="checkbox"
                  checked={formulario.telas[chave]}
                  onChange={(e) => setFormulario((f) => ({ ...f, telas: { ...f.telas, [chave]: e.target.checked } }))}
                />
                {ROTULOS_TELAS_COLABORADOR[chave]}
              </label>
            ))}
          </div>

          <p className="dica-campo" style={{ marginTop: "var(--esp-3)" }}>
            O colaborador é vinculado à filial escolhida acima e usa o usuário/senha para ver apenas as próprias
            métricas.
          </p>
        </form>
      ) : null}

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              {mostrarFilial ? <th>Filial</th> : null}
              <th>CPF</th>
              <th>Função</th>
              <th>E-mail</th>
              <th>Usuário de acesso</th>
              <th>Telas</th>
              {ehAdmin ? <th aria-label="Ações" /> : null}
            </tr>
          </thead>
          <tbody>
            {resultado.status === "carregando" ? (
              <tr>
                <td colSpan={colspanVazio}>
                  <Carregando />
                </td>
              </tr>
            ) : resultado.status === "erro" ? (
              <tr>
                <td colSpan={colspanVazio}>
                  <MensagemErro mensagem={resultado.mensagem} />
                </td>
              </tr>
            ) : lista.length === 0 ? (
              <tr className="linha-vazia">
                <td colSpan={colspanVazio}>
                  <MensagemVazia mensagem={mensagemVazia} />
                </td>
              </tr>
            ) : (
              lista.map((colaborador) => {
                const telasAtivas = TELAS_COLABORADOR.filter((chave) => colaborador.telas[chave]);
                return (
                  <tr key={colaborador.id}>
                    <td>{colaborador.codigo || "—"}</td>
                    <td>{colaborador.nome}</td>
                    {mostrarFilial ? <td>Filial {colaborador.filial}</td> : null}
                    <td>{colaborador.cpf}</td>
                    <td>{colaborador.cargo}</td>
                    <td>{colaborador.email || "—"}</td>
                    <td>{colaborador.usuarioAcesso}</td>
                    <td>
                      {telasAtivas.length
                        ? telasAtivas.map((chave) => (
                            <span key={chave} className="badge-tela">
                              {ROTULOS_TELAS_COLABORADOR[chave]}
                            </span>
                          ))
                        : "—"}
                    </td>
                    {ehAdmin ? (
                      <td className="celula-acoes-form">
                        <button type="button" className="botao botao-secundario" onClick={() => iniciarEdicao(colaborador)}>
                          Editar
                        </button>
                        <button type="button" className="botao botao-perigo" onClick={() => remover(colaborador.id)}>
                          Remover
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
