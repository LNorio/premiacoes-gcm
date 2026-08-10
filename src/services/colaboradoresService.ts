import type { Colaborador, Resultado } from "../types";

export interface ColaboradoresService {
  listarColaboradores(filial: string): Promise<Resultado<Colaborador[]>>;
  salvarColaborador(colaborador: Colaborador): Promise<Resultado<Colaborador>>;
  removerColaborador(id: string): Promise<Resultado<void>>;
}
