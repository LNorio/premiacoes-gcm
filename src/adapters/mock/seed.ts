import type { Colaborador, PoliticaEstoque } from "../../types";
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
    cargo: "Vendedor",
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
    cargo: "Vendedor",
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
    cargo: "Vendedor",
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
    cargo: "Vendedor",
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
    email: "patricia.ferreira@comercialmariano.com.br",
    usuarioAcesso: "patricia.ferreira",
    senhaAcesso: "venda123",
    telas: { premiacoes: false, comissao: false, planoSaude: true, estoque: true, descontos: true },
  },
];

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
  gravarValor("politicaEstoque", POLITICA_ESTOQUE_SEED);
  gravarValor(CHAVE_FLAG_SEED, true);
}
