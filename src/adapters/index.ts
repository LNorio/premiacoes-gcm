/**
 * Ponto único de troca entre o adapter mock (F1-F6) e o HTTP real (F7/F8).
 * As views nunca importam de `./mock` ou `./http` diretamente — sempre
 * daqui, para que a troca em F8 não exija tocar em nenhuma tela.
 *
 * `authService`/`colaboradoresService`/`comissaoService`/`consolidadoPevService`/`consultaService`/
 * `descontosService`/`planoSaudeService`/`premiacaoService` já consomem a API real (ver
 * Claude/API (4).md). Sob os testes (Vitest) continuam no mock — os testes que logam/gerenciam
 * dados via `testUtils/ComSessao`/`ComoAdminNaFilial` dependem de um resultado síncrono e
 * determinístico, não de rede. `estoqueService`/`bloqueioService` seguem mock-only (sem endpoint
 * real ainda, no caso de Estoque; Bloqueio não migrado nesta rodada).
 */
import {
  authServiceHttp,
  colaboradoresServiceHttp,
  comissaoServiceHttp,
  consolidadoPevServiceHttp,
  consultaServiceHttp,
  descontosServiceHttp,
  planoSaudeServiceHttp,
  premiacaoServiceHttp,
} from "./http";
import {
  authServiceMock,
  colaboradoresServiceMock,
  comissaoServiceMock,
  consolidadoPevServiceMock,
  consultaServiceMock,
  descontosServiceMock,
  planoSaudeServiceMock,
  premiacaoServiceMock,
} from "./mock";

export const authService = import.meta.env.VITEST ? authServiceMock : authServiceHttp;
export const colaboradoresService = import.meta.env.VITEST ? colaboradoresServiceMock : colaboradoresServiceHttp;
export const comissaoService = import.meta.env.VITEST ? comissaoServiceMock : comissaoServiceHttp;
export const consolidadoPevService = import.meta.env.VITEST ? consolidadoPevServiceMock : consolidadoPevServiceHttp;
export const consultaService = import.meta.env.VITEST ? consultaServiceMock : consultaServiceHttp;
export const descontosService = import.meta.env.VITEST ? descontosServiceMock : descontosServiceHttp;
export const planoSaudeService = import.meta.env.VITEST ? planoSaudeServiceMock : planoSaudeServiceHttp;
export const premiacaoService = import.meta.env.VITEST ? premiacaoServiceMock : premiacaoServiceHttp;

export { estoqueServiceMock as estoqueService, bloqueioServiceMock as bloqueioService } from "./mock";
