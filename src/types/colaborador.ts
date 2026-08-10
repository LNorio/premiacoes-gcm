export interface TelasHabilitadas {
  premiacoes: boolean;
  comissao: boolean;
  planoSaude: boolean;
  estoque: boolean;
  descontos: boolean;
}

export interface Colaborador {
  id: string;
  codigo: string;
  nome: string;
  cpf: string;
  filial: string;
  cargo: string;
  email: string;
  usuarioAcesso: string;
  senhaAcesso: string;
  telas: TelasHabilitadas;
  /** undefined é tratado como true (adesão por padrão) */
  adesaoSaude?: boolean;
  adesaoOdontologico?: boolean;
}
