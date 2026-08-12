import { finalizarRequisicaoHttp, iniciarRequisicaoHttp } from "../../utils/cargaHttp";

/**
 * Wrapper HTTP genérico (F1-04). Preparado para F7/F8 — nenhum adapter
 * real o usa ainda; o adapter mock (F1-03) é o único em uso até F8.
 */
export interface ConfigHttpClient {
  baseUrl: string;
  obterToken?: () => string | null;
  aoReceber401?: () => void;
}

export class ErroHttp extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErroHttp";
    this.status = status;
  }
}

/** A API usa `"mensagem"` (às vezes `"message"`) no corpo de erro — ver Claude/API.md. */
async function extrairMensagemErro(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.json();
    if (typeof corpo?.mensagem === "string" && corpo.mensagem) return corpo.mensagem;
    if (typeof corpo?.message === "string" && corpo.message) return corpo.message;
  } catch {
    // corpo não é JSON (ou está vazio) — usa a mensagem genérica abaixo.
  }
  return `Falha na requisição: ${resposta.status}`;
}

export class HttpClient {
  private readonly config: ConfigHttpClient;

  constructor(config: ConfigHttpClient) {
    this.config = config;
  }

  private async requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
    iniciarRequisicaoHttp();
    try {
      const token = this.config.obterToken?.();
      const resposta = await fetch(`${this.config.baseUrl}${caminho}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init?.headers,
        },
      });

      if (resposta.status === 401) {
        this.config.aoReceber401?.();
      }
      if (!resposta.ok) {
        throw new ErroHttp(await extrairMensagemErro(resposta), resposta.status);
      }
      if (resposta.status === 204) {
        return undefined as T;
      }
      return (await resposta.json()) as T;
    } finally {
      finalizarRequisicaoHttp();
    }
  }

  get<T>(caminho: string): Promise<T> {
    return this.requisitar<T>(caminho, { method: "GET" });
  }

  post<T>(caminho: string, corpo: unknown): Promise<T> {
    return this.requisitar<T>(caminho, { method: "POST", body: JSON.stringify(corpo) });
  }

  put<T>(caminho: string, corpo: unknown): Promise<T> {
    return this.requisitar<T>(caminho, { method: "PUT", body: JSON.stringify(corpo) });
  }

  delete<T>(caminho: string, corpo?: unknown): Promise<T> {
    return this.requisitar<T>(caminho, { method: "DELETE", ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}) });
  }
}
