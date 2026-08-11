/**
 * Ponto único de troca entre o adapter mock (F1-F6) e o HTTP real (F7/F8).
 * As views nunca importam de `./mock` ou `./http` diretamente — sempre
 * daqui, para que a troca em F8 não exija tocar em nenhuma tela.
 *
 * `authService` já consome a API real (F7-01, ver Claude/API.md). Sob os
 * testes (Vitest) continua no mock — os ~140 testes que logam via
 * `authService.login(...)` (`testUtils/ComSessao`/`ComoAdminNaFilial`)
 * dependem de um resultado síncrono e determinístico, não de rede.
 */
import { authServiceHttp } from "./http";
import { authServiceMock } from "./mock";

export const authService = import.meta.env.VITEST ? authServiceMock : authServiceHttp;

export {
  colaboradoresServiceMock as colaboradoresService,
  premiacaoServiceMock as premiacaoService,
  consolidadoPevServiceMock as consolidadoPevService,
  consultaServiceMock as consultaService,
  comissaoServiceMock as comissaoService,
  descontosServiceMock as descontosService,
  planoSaudeServiceMock as planoSaudeService,
  estoqueServiceMock as estoqueService,
  bloqueioServiceMock as bloqueioService,
} from "./mock";
