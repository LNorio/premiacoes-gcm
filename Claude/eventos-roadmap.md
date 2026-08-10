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
