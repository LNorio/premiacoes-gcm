export const TIPOS_DESCONTO_BONIFICACAO = [
  "Ajuda de Custo/Gratificação",
  "Bonificação",
  "Compra de mercadorias",
  "Convênio Gás",
  "Desconto autorizado (descrever em observações)",
  "Diária",
  "Farmácia",
  "Franquia",
  "Manutenção veículos",
  "Multa",
] as const;
export type TipoDescontoBonificacao = (typeof TIPOS_DESCONTO_BONIFICACAO)[number];

export interface DescontoBonificacao {
  id: string;
  vendedorId: string;
  mesReferencia: string;
  tipo: TipoDescontoBonificacao;
  valor: number;
  observacoes: string;
}
