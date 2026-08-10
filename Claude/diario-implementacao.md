# Diário de Implementação

## 2026-08-10

- Projeto React + TypeScript + Vite iniciado do zero (scaffold, tooling, convenções de pastas em camadas).
- Documentos de referência trazidos para `Claude/` (documento técnico, protótipo HTML, `ARQUITETURA.md`, `DESIGN.md`) e roadmap (WBS) elaborado em `Claude/ROADMAP.md`.
- **F0 — Fundação e arquitetura:** tokens de design extraídos do protótipo, catálogo de componentes visuais base (`Button`, `Card`, `Badge`, `FloatingField`, `Table`, `Toast`, `Header`, `Nav`) e documento de arquitetura em camadas (UI ↔ Serviço ↔ Adapter ↔ HTTP).
- **F1 — Camada de dados:** tipos de todas as entidades, interfaces de serviço por domínio, adapter mock com persistência em `localStorage` e os 6 colaboradores seed do documento técnico.
- **F2 — Shell, autenticação e cadastros:** sessão/login/logout, shell do app (cabeçalho fixo, navegação por perfil, seletor de filial, guarda de rota) e tela de Cadastro de Colaboradores.
- **F3 — Núcleo de Premiação:** Planilha de Premiação, Consolidado PEV e Consulta por Período, com exportação CSV nas três telas.
- Quatro lacunas/bugs do adapter mock de F1 descobertos e corrigidos ao construir as telas de F3 (filtro `telas.premiacoes` no Consolidado PEV; suporte a `FILIAL_TODAS` na Planilha; `gerarIntervaloMeses` preso ao ciclo Dez-Nov; filtro de período vazio e falta de filial no `ConsultaService`).
- Três alterações fora do escopo original do protótipo, a pedido do usuário (registradas em `Claude/eventos-roadmap.md` e refletidas no `ROADMAP.md`): campo de Filial no cadastro de colaboradores; formulário de cadastro migrado de inline para modal ("+ Adicionar colaborador"); coluna Filial adicionada na Planilha de Premiação e no Consolidado PEV.
- Correção adicional: cargo do seed (`"Vendedor"`) não batia com nenhuma opção de `CARGOS_COLABORADOR`, causando substituição silenciosa do cargo ao salvar sem alterar o campo — corrigido para `"Consultor de Vendas Interno"`.
- Verificação visual real das telas de F2 e F3 feita com o dev server + Playwright headless, sem erros de console.
- Todo o histórico de implementação do dia (que havia sido feito numa única sessão sem commits) foi reconstruído e commitado em 15 commits separados por marco/alteração/correção (`chore` → `docs` → `feat(F0)` → `feat(F1)` → `feat(F2)` → 4× `fix(F1)` → `feat(F3)` → alterações não planejadas do cadastro/modal → `fix` do seed → coluna Filial → ajuste de CSS esquecido na reconstrução).

**Testes:** 119 testes executados, 119 passaram, 0 falharam (`npx vitest run`, 25 arquivos de teste).

**Pendências para próximo dia:** F0-03 (repositório/CI) e F0-04 (provisionamento de ambientes) seguem pendentes, dependem de decisão de hospedagem/infraestrutura. F4 (Comissão e Descontos) é o próximo marco do roadmap.
