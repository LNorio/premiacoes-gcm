import { FILIAL_TODAS, type Papel, type Tela } from "../types";

/** Filiais cadastradas (documento técnico, Seção 1.2) */
export const FILIAIS = [
  "100",
  "101",
  "200",
  "201",
  "202",
  "300",
  "301",
  "302",
  "303",
  "400",
  "401",
  "402",
  "403",
  "404",
  "600",
  "700",
  "701",
  "800",
  "900",
  "901",
  "902"
] as const;

/** Navegação por perfil (documento técnico, Seção 2.1) */
export const NAV_POR_PAPEL: Record<Papel, Tela[]> = {
  admin: [
    "inicio",
    "vendedores",
    "consulta",
    "consolidado-pev",
    "premiacao",
    "comissao",
    "premiacao-estoque",
    "descontos",
    "plano-saude",
  ],
  gerente: ["inicio", "vendedores", "premiacao", "comissao"],
  coordenador: ["inicio", "vendedores", "descontos", "plano-saude"],
  vendedor: ["inicio", "consulta"],
};

/** Rótulos de navegação por tela */
export const ROTULOS_TELAS: Record<Tela, string> = {
  inicio: "Início",
  vendedores: "Colaboradores",
  consulta: "Consulta",
  "consolidado-pev": "Consolidado PEV",
  premiacao: "Premiação",
  comissao: "Comissão",
  "premiacao-estoque": "Premiações Estoque",
  descontos: "Descontos/Bonificações",
  "plano-saude": "Plano de Saúde",
};

/** Quem edita/bloqueia cada tela (documento técnico, Seção 2.2) */
export const PAPEL_EDITOR_POR_TELA = {
  premiacao: "gerente",
  planoSaude: "coordenador",
  descontos: "coordenador",
  comissao: "gerente",
  estoque: "coordenador",
} as const satisfies Record<string, Papel>;

/** Cargos disponíveis no Cadastro de Colaboradores */
export const CARGOS_COLABORADOR = [
  "Assistente de Estoque",
  "Auxiliar de Estoque",
  "Consultor de Vendas Externo",
  "Consultor de Vendas Interno",
  "Coordenador",
  "Encarregado de Estoque",
  "Gerente",
  "Lubrificador",
  "Outros",
  "Supervisor",
] as const;

/** Rótulos de perfil (campo "Perfil" do Cadastro de Colaboradores) */
export const ROTULOS_PAPEL: Record<Papel, string> = {
  vendedor: "Vendedor",
  coordenador: "Coordenador",
  gerente: "Gerente",
  admin: "Administrador",
};

/** Opções do dropdown de Perfil, na ordem pedida (Vendedor, Coordenador, Gerente, Administrador) */
export const PAPEIS_COLABORADOR: Papel[] = ["vendedor", "coordenador", "gerente", "admin"];

/** Rótulos das telas habilitáveis por colaborador (checklist do Cadastro) */
export const ROTULOS_TELAS_COLABORADOR = {
  premiacoes: "Premiações",
  comissao: "Comissão",
  planoSaude: "Plano de Saúde",
  estoque: "Estoque",
  descontos: "Descontos",
} as const;

/** Credenciais de gestão (documento técnico, Seção 1.1) — só válidas no adapter mock */
export const CREDENCIAIS_GESTAO = {
  admin: { usuario: "admin", senha: "admin123", filial: FILIAL_TODAS },
  gerente: { usuario: "gerente", senha: "gerente123", filial: "100" },
  coordenador: { usuario: "coordenador", senha: "coord123", filial: "100" },
} as const;
