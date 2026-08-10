import '@testing-library/jest-dom/vitest'

// jsdom não implementa ResizeObserver (usado pelo Shell para o "ajuste de
// espaço" do cabeçalho fixo, F2.SHELL-01) — stub mínimo só para os testes.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
