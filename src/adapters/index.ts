/**
 * Ponto único de troca entre o adapter mock (F1-F6) e o HTTP real (F8).
 * As views nunca importam de `./mock` ou `./http` diretamente — sempre
 * daqui, para que a troca em F8 não exija tocar em nenhuma tela.
 */
export {
  authServiceMock as authService,
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
