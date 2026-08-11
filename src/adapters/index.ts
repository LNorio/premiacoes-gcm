/**
 * Ponto único de troca entre o adapter mock (F1-F6) e o HTTP real (F7/F8).
 * As views nunca importam de `./mock` ou `./http` diretamente — sempre
 * daqui, para que a troca em F8 não exija tocar em nenhuma tela.
 *
 * `authService`/`colaboradoresService`/`consolidadoPevService`/`consultaService`/
 * `premiacaoService` já consomem a API real (ver Claude/API.md). Sob os testes (Vitest) continuam
 * no mock — os testes que logam/gerenciam dados via `testUtils/ComSessao`/
 * `ComoAdminNaFilial` dependem de um resultado síncrono e determinístico, não
 * de rede.
 */
import {
  authServiceHttp,
  colaboradoresServiceHttp,
  consolidadoPevServiceHttp,
  consultaServiceHttp,
  premiacaoServiceHttp,
} from "./http";
import {
  authServiceMock,
  colaboradoresServiceMock,
  consolidadoPevServiceMock,
  consultaServiceMock,
  premiacaoServiceMock,
} from "./mock";

export const authService = import.meta.env.VITEST ? authServiceMock : authServiceHttp;
export const colaboradoresService = import.meta.env.VITEST ? colaboradoresServiceMock : colaboradoresServiceHttp;
export const consolidadoPevService = import.meta.env.VITEST ? consolidadoPevServiceMock : consolidadoPevServiceHttp;
export const consultaService = import.meta.env.VITEST ? consultaServiceMock : consultaServiceHttp;
export const premiacaoService = import.meta.env.VITEST ? premiacaoServiceMock : premiacaoServiceHttp;

export {
  comissaoServiceMock as comissaoService,
  descontosServiceMock as descontosService,
  planoSaudeServiceMock as planoSaudeService,
  estoqueServiceMock as estoqueService,
  bloqueioServiceMock as bloqueioService,
} from "./mock";
