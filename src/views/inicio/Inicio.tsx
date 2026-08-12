import { useState } from "react";
import { colaboradoresService, premiacaoService } from "../../adapters";
import { Button, Card, CardGrid, Carregando, MensagemErro } from "../../components/ui";
import { useSessao } from "../../state/SessaoContext";
import { FILIAL_TODAS, type Tela } from "../../types";
import { NAV_POR_PAPEL } from "../../utils/constantes";
import { rotuloFilial } from "../../utils/filial";
import { formatarMoeda } from "../../utils/formatadores";
import { obterMesAtualISO } from "../../utils/periodo";
import { useEfeitoAssincrono } from "../../utils/useEfeitoAssincrono";

interface InicioProps {
  aoNavegar: (tela: Tela) => void;
}

interface Resumo {
  totalColaboradores: number;
  cargoVendedor: string;
  premiacoesLancadas: number;
  totalPremiacoes: number;
}

const RESUMO_VAZIO: Resumo = { totalColaboradores: 0, cargoVendedor: "-", premiacoesLancadas: 0, totalPremiacoes: 0 };

/** Painel Geral (view padrão do Shell) — cartões de estatísticas do protótipo (F2.INICIO). */
export function Inicio({ aoNavegar }: InicioProps) {
  const { sessao } = useSessao();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<Resumo>(RESUMO_VAZIO);

  const filialAtiva = sessao?.filialAtiva ?? FILIAL_TODAS;
  const ehVendedor = sessao?.role === "vendedor";
  const mostrarFilial = filialAtiva === FILIAL_TODAS;
  const mesAtual = obterMesAtualISO();
  const ehAdmin = sessao?.role === "admin";
  const acessaPremiacao = sessao ? NAV_POR_PAPEL[sessao.role].includes("premiacao") : false;

  useEfeitoAssincrono(
    (foiCancelado) => {
      if (!sessao) return;
      setCarregando(true);
      setErro(null);

      Promise.all([
        colaboradoresService.listarColaboradores(filialAtiva),
        premiacaoService.listarPremiacoes(filialAtiva, mesAtual),
      ]).then(([resColaboradores, resPremiacoes]) => {
        if (foiCancelado()) return;

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

        if (ehVendedor) {
          const vendedor = resColaboradores.dados.find((c) => c.id === sessao.vendedorId);
          const minhasPremiacoes = resPremiacoes.dados.filter((p) => p.vendedorId === sessao.vendedorId);
          setResumo({
            totalColaboradores: 0,
            cargoVendedor: vendedor?.cargo ?? "-",
            premiacoesLancadas: minhasPremiacoes.filter((p) => p.total > 0).length,
            totalPremiacoes: minhasPremiacoes.reduce((soma, p) => soma + p.total, 0),
          });
        } else {
          setResumo({
            totalColaboradores: resColaboradores.dados.length,
            cargoVendedor: "-",
            premiacoesLancadas: resPremiacoes.dados.filter((p) => p.total > 0).length,
            totalPremiacoes: resPremiacoes.dados.reduce((soma, p) => soma + p.total, 0),
          });
        }

        setCarregando(false);
      });
    },
    [sessao?.filialAtiva, sessao?.role, sessao?.vendedorId, mesAtual],
  );

  const subtitulo = ehVendedor
    ? "Suas métricas pessoais de premiação (mês atual)"
    : mostrarFilial
      ? "Visão resumida de todas as filiais (mês atual)"
      : `Visão resumida da ${rotuloFilial(filialAtiva)} (mês atual)`;

  return (
    <section className="view">
      <div className="view-cabecalho">
        <h2>Painel Geral</h2>
        <span className="view-subtitulo">{subtitulo}</span>
      </div>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <MensagemErro mensagem={erro} />
      ) : ehVendedor ? (
        <>
          <CardGrid>
            <Card titulo="Minha filial">{rotuloFilial(filialAtiva)}</Card>
            <Card titulo="Minha função">{resumo.cargoVendedor}</Card>
            <Card titulo="Premiações recebidas">{resumo.premiacoesLancadas}</Card>
            <Card titulo="Total a receber" destaque>
              {formatarMoeda(resumo.totalPremiacoes)}
            </Card>
          </CardGrid>
          <div className="acoes-rapidas">
            <Button variant="primario" onClick={() => aoNavegar("consulta")}>
              Ver minhas premiações por mês
            </Button>
          </div>
        </>
      ) : (
        <>
          <CardGrid>
            <Card titulo="Filial">{rotuloFilial(filialAtiva)}</Card>
            <Card titulo="Colaboradores cadastrados">{resumo.totalColaboradores}</Card>
            <Card titulo="Premiações lançadas">{resumo.premiacoesLancadas}</Card>
            <Card titulo="Total a pagar" destaque>
              {formatarMoeda(resumo.totalPremiacoes)}
            </Card>
          </CardGrid>
          <div className="acoes-rapidas">
            {ehAdmin ? (
              <Button variant="primario" onClick={() => aoNavegar("vendedores")}>
                + Cadastrar vendedor
              </Button>
            ) : null}
            {acessaPremiacao ? (
              <Button variant="dourado" onClick={() => aoNavegar("premiacao")}>
                + Preencher planilha do mês
              </Button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
