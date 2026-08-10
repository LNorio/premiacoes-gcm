# Arquitetura Frontend — Sistema de Premiações

Documento produzido no F0 do `ROADMAP.md` (F0-01 e F0-07). Descreve a arquitetura em camadas que todas as telas (F2 em diante) devem seguir.

## F0-01 — Stack

- **React 19 + TypeScript**, bundler **Vite**, lint **oxlint**.
- Decisão já tomada ao iniciar o projeto (framework, não vanilla) para ganhar tipagem, componentização e um ecossistema de testes (Vitest + Testing Library) alinhado ao que `ROADMAP.md` pede em F0-06/F9-01.

## F0-02 — Convenção de pastas

```
src/
  components/ui/   componentes visuais base, reutilizáveis por qualquer tela (catálogo do F0-06)
  views/            uma pasta por tela (F2..F6), consumindo componentes/ui + services
  services/         camada de Serviço: uma função por caso de uso (ex.: listarPremiacoes)
  adapters/         implementações da interface de serviço: mock (F1) e http (F7/F8)
  types/            tipos/shapes das entidades (Seção 5 do documento técnico)
  utils/            helpers compartilhados (formatação de moeda/mês, máscara de CPF, etc. — F1-06)
  styles/           tokens.css (design tokens) e estilos globais
```

Regra de nomenclatura: nomes de domínio (telas, campos, papéis) seguem o português usado no documento técnico e no protótipo (`premiacao`, `planoSaude`, `NAV_POR_PAPEL` etc.), para rastreabilidade 1:1 com a especificação.

## F0-07 — Camadas (UI ↔ Serviço ↔ Adapter ↔ HTTP)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────┐
│  UI (views,  │ --> │   Serviço    │ --> │      Adapter      │ --> │   HTTP   │
│  components) │     │ (contrato)   │     │ (mock ou http)    │     │ (F7/F8)  │
└──────────────┘     └──────────────┘     └──────────────────┘     └──────────┘
```

- **UI**: componentes React (views + componentes base). Só chama funções da camada de Serviço. **Nenhuma tela chama `fetch`, `localStorage` ou qualquer I/O diretamente** — essa é a convenção central da arquitetura.
- **Serviço**: uma interface por domínio (ex.: `PremiacaoService.listar(filial, mes)`), com assinatura estável independente de a implementação ser mock ou real. É o "contrato" que F1 define e F8 substitui sem tocar na UI.
- **Adapter**: implementa a interface de Serviço.
  - **Mock** (F1-03): dados seed persistidos em `localStorage`, usado até F8.
  - **HTTP** (F7-01…F8): implementa a mesma interface contra a API real; troca o mock sem mudar nenhuma tela.
- **HTTP**: wrapper genérico (base URL por ambiente, cabeçalhos, interceptors de auth/401) — construído em F7, consumido só pelo adapter HTTP.

### Formato de retorno padronizado (F1-05)

Toda chamada de Serviço devolve um formato uniforme (`carregando / dados / erro`), para que a UI trate os três estados (carregando, vazio, erro) de forma consistente em todas as telas, reutilizando os componentes de estado do F2.UI-01.

### Regras de negócio replicadas do protótipo (ver documento técnico, Seções 2 e 3)

- `NAV_POR_PAPEL` e `PAPEL_EDITOR_POR_TELA` (visibilidade de tela e quem edita/bloqueia) vivem na camada de Serviço/domínio, não espalhadas pela UI — a UI apenas consulta o resultado.
- Campos calculados (Total, Planilha Deivson, Base de Cálculo do PEV, Total a Receber de Estoque etc.) são recalculados na UI apenas como **preview**; a verdade definitiva vem do servidor a partir de F8 (Seção 6 do documento técnico).
