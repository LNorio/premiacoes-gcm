import {
  VALOR_PADRAO_ODONTOLOGICO,
  VALOR_PADRAO_SAUDE_DIFERENCIADO,
  VALOR_PADRAO_SAUDE_PADRAO,
  type Colaborador,
  type PlanoSaudePeriodo,
  type PoliticaEstoque,
} from "../../types";
import { gravarColecao, gravarValor, lerValor } from "./db";

/**
 * Massa de teste/homologação (documento técnico, Seções 1.1 e 6): os 6
 * vendedores citados no protótipo, todos com senha "venda123". **Não deve
 * ser migrada para produção** — ver Seção 6 do documento técnico.
 */
const COLABORADORES_SEED: Colaborador[] = [
  {
    id: "seed-v1",
    codigo: "001",
    nome: "Carlos Silva",
    cpf: "111.111.111-11",
    filial: "100",
    cargo: "Consultor de Vendas Interno",
    role: "vendedor",
    email: "carlos.silva@comercialmariano.com.br",
    usuarioAcesso: "carlos.silva",
    senhaAcesso: "venda123",
    telas: { premiacoes: true, comissao: true, planoSaude: true, estoque: false, descontos: true },
  },
  {
    id: "seed-v2",
    codigo: "002",
    nome: "Fernanda Lima",
    cpf: "222.222.222-22",
    filial: "100",
    cargo: "Consultor de Vendas Interno",
    role: "vendedor",
    email: "fernanda.lima@comercialmariano.com.br",
    usuarioAcesso: "fernanda.lima",
    senhaAcesso: "venda123",
    telas: { premiacoes: true, comissao: true, planoSaude: true, estoque: false, descontos: true },
  },
  {
    id: "seed-v3",
    codigo: "003",
    nome: "Roberto Santos",
    cpf: "333.333.333-33",
    filial: "401",
    cargo: "Consultor de Vendas Interno",
    role: "vendedor",
    email: "roberto.santos@comercialmariano.com.br",
    usuarioAcesso: "roberto.santos",
    senhaAcesso: "venda123",
    telas: { premiacoes: true, comissao: true, planoSaude: true, estoque: false, descontos: true },
  },
  {
    id: "seed-v4",
    codigo: "004",
    nome: "Juliana Costa",
    cpf: "444.444.444-44",
    filial: "403",
    cargo: "Consultor de Vendas Interno",
    role: "vendedor",
    email: "juliana.costa@comercialmariano.com.br",
    usuarioAcesso: "juliana.costa",
    senhaAcesso: "venda123",
    telas: { premiacoes: true, comissao: true, planoSaude: true, estoque: false, descontos: true },
  },
  {
    id: "seed-v5",
    codigo: "005",
    nome: "Marcos Rocha",
    cpf: "555.555.555-55",
    filial: "201",
    cargo: "Auxiliar de Estoque",
    role: "vendedor",
    email: "marcos.rocha@comercialmariano.com.br",
    usuarioAcesso: "marcos.rocha",
    senhaAcesso: "venda123",
    telas: { premiacoes: false, comissao: false, planoSaude: true, estoque: true, descontos: true },
  },
  {
    id: "seed-v6",
    codigo: "006",
    nome: "Patricia Ferreira",
    cpf: "666.666.666-66",
    filial: "100",
    cargo: "Encarregado de Estoque",
    role: "vendedor",
    email: "patricia.ferreira@comercialmariano.com.br",
    usuarioAcesso: "patricia.ferreira",
    senhaAcesso: "venda123",
    telas: { premiacoes: false, comissao: false, planoSaude: true, estoque: true, descontos: true },
  },
];

/**
 * Período vigente padrão inicial do Plano de Saúde/Odontológico, por filial + tipo de plano +
 * tipo de pessoa (Titular e Dependente têm vigência independente na API real, mas começam com o
 * mesmo valor que era fixo antes do Admin poder cadastrar períodos — ver
 * `Claude/eventos-roadmap.md`, 2026-08-14). `dataCriacao` bem antiga pra não deixar nenhum mês
 * sem período vigente; o Admin encerra e cadastra um novo quando quiser trocar o valor.
 */
const FILIAIS_SEED = ["100", "201", "401", "403"] as const;
const FILIAIS_VALOR_DIFERENCIADO = new Set<string>(["401", "403"]);
const TIPOS_PESSOA_SEED = ["titular", "dependente"] as const;
const PERIODOS_PLANO_SAUDE_SEED: PlanoSaudePeriodo[] = FILIAIS_SEED.flatMap((filial) =>
  TIPOS_PESSOA_SEED.flatMap((tipoPessoa) => [
    {
      id: `psp-seed-${filial}-saude-${tipoPessoa}`,
      filial,
      tipoPlano: "saude" as const,
      tipoPessoa,
      ativo: true,
      dataInicio: "2000-01-01",
      dataCriacao: "2000-01-01 00:00:00",
      dataValidade: null,
      valor: FILIAIS_VALOR_DIFERENCIADO.has(filial) ? VALOR_PADRAO_SAUDE_DIFERENCIADO : VALOR_PADRAO_SAUDE_PADRAO,
    },
    {
      id: `psp-seed-${filial}-odontologico-${tipoPessoa}`,
      filial,
      tipoPlano: "odontologico" as const,
      tipoPessoa,
      ativo: true,
      dataInicio: "2000-01-01",
      dataCriacao: "2000-01-01 00:00:00",
      dataValidade: null,
      valor: VALOR_PADRAO_ODONTOLOGICO,
    },
  ]),
);

/** Valores padrão do documento técnico, Seção 3.8 */
const POLITICA_ESTOQUE_SEED: PoliticaEstoque = {
  metas: { romaneios: 0.9, contagens: 3, avaria: 0.0015, segregado: 0 },
  valoresReferencia: { romaneios: 150, contagens: 100, avaria: 75, segregado: 25, faltas: 75, organizacao: 75, volumeSeparado: 150 },
  metaVolumeSeparadoTotal: 0.8,
};

const CHAVE_FLAG_SEED = "seed-aplicado";

export function garantirSeed(): void {
  if (lerValor(CHAVE_FLAG_SEED, false)) return;
  gravarColecao("colaboradores", COLABORADORES_SEED);
  gravarColecao("planoSaudePeriodos", PERIODOS_PLANO_SAUDE_SEED);
  gravarValor("politicaEstoque", POLITICA_ESTOQUE_SEED);
  gravarValor(CHAVE_FLAG_SEED, true);
}
