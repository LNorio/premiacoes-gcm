import { HttpClient } from "./httpClient";
import { obterToken } from "./token";

/** Instância única do wrapper HTTP, compartilhada por todos os adapters HTTP (F7/F8). */
export const httpClient = new HttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  obterToken,
});
