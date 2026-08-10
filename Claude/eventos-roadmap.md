# Eventos do Roadmap

## Marcos alcançados

### 2026-08-10 — F0: Fundação e arquitetura

- Stack definida e registrada (React + TypeScript + Vite) em `Claude/ARQUITETURA.md`.
- Convenção de pastas em camadas criada em `src/` (`components/ui`, `services`, `adapters`, `types`, `utils`, `views`, `styles`).
- Tokens de design (paleta, tipografia, espaçamento, raios, sombras) extraídos do protótipo para `src/styles/tokens.css` e `src/styles/global.css`.
- Catálogo de componentes visuais base implementado em `src/components/ui/`: `Button`, `Card`/`CardGrid`, `BadgeInfo`/`BadgeTela`/`Selo`, `FloatingField`, `Table`/`LinhaVazia`, `Toast`, `Header`, `Nav`.
- Documento de arquitetura em camadas (UI ↔ Serviço ↔ Adapter ↔ HTTP) e a convenção "nenhuma tela chama fetch" escritos em `Claude/ARQUITETURA.md`.
- Vitest + Testing Library configurados; 27 testes unitários cobrindo os componentes base, todos passando (`Claude/testes/f0-fundacao-arquitetura.md`).
- **Pendente dentro do próprio F0:** F0-03 (repositório/CI) e F0-04 (provisionamento de ambientes) não avançaram — dependem de decisões de hospedagem/infraestrutura fora do escopo do código frontend.

### 2026-08-10 — F1: Camada de dados (contrato + mock)

- Tipos/shapes de todas as entidades da Seção 5 do documento técnico definidos em `src/types/`.
- Interfaces de Serviço por domínio (`src/services/`): auth, colaboradores, premiação, consolidado PEV, consulta, comissão, descontos, plano de saúde, estoque e bloqueio.
- Adapter mock completo (`src/adapters/mock/`), persistindo em `localStorage`, com os 6 colaboradores seed do documento técnico (usuários/senhas reais do protótipo).
- Wrapper HTTP genérico preparado e ainda não usado (`src/adapters/http/httpClient.ts`), pronto para F7/F8.
- Formato de retorno padronizado `Resultado<T>` (`src/types/resultado.ts`) e utilitários compartilhados (`src/utils/`): formatação de moeda/mês, máscara de CPF, ciclo PEV, `mostrarToast`, helpers de filial.
- 68 testes unitários no total (27 de F0 + 41 novos), todos passando (`Claude/testes/f1-camada-de-dados.md`).
