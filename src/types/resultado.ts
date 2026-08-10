/**
 * Formato de retorno padronizado de toda chamada de Serviço (F1-05).
 * A UI trata sempre os mesmos três estados, em qualquer tela, com ou sem
 * dados — ver "carregando / vazio / erro" no ROADMAP.md (F2.UI-01).
 */
export type Resultado<T> =
  | { status: "carregando" }
  | { status: "sucesso"; dados: T }
  | { status: "erro"; mensagem: string };

export function resultadoSucesso<T>(dados: T): Resultado<T> {
  return { status: "sucesso", dados };
}

export function resultadoErro(mensagem: string): Resultado<never> {
  return { status: "erro", mensagem };
}
