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

## 2026-08-11

- **F4 — Comissão e Descontos:** grade de Comissão (PEV somente leitura vindo da Planilha de Premiação, snapshot ao salvar, visível só ao Admin) e Descontos e Bonificações (lançamentos múltiplos por colaborador/mês, Tipo/Valor/Observações), com exportação Excel via SheetJS carregado por CDN sob demanda. Bug do mock corrigido no processo: `comissaoServiceMock` não suportava `FILIAL_TODAS` (mesmo padrão de bugs já visto em F3). Correção visual: tabela de Descontos sem a classe `tabela-planilha`, alargando a tela além do necessário.
- **F7 — Preparação para API real:** variáveis de ambiente (`VITE_API_BASE_URL`) para a URL base da API por ambiente; contrato da API trazido para `Claude/API.md`; login (`authServiceHttp`) ligado à API real fora dos testes.
- **F8 — Integração real com a API, adiantada por telas (a pedido do usuário, fora da ordem sequencial do roadmap):**
  - Colaboradores: `colaboradoresServiceHttp` consumindo `GET/POST/PUT/DELETE /api/usuarios`. Campo Perfil adicionado ao cadastro (Vendedor/Coordenador/Gerente/Administrador), removendo o filtro que escondia quem não era vendedor. Dois bugs reais encontrados e corrigidos testando ao vivo: e-mail não era exigido no formulário (a API exige) e o campo Código travava a edição de Admin/Gerente/Coordenador (a API aceita código nulo para esses perfis).
  - Planilha de Premiação e Consolidado PEV: `premiacaoServiceHttp` e `consolidadoPevServiceHttp` ligados a `/api/premiacoes` e `/api/consolidado`. Consolidado PEV com solução limpa (a API devolve id por linha); Premiação com workaround (uma requisição por colaborador via `?id=`, já que a API não devolve id nenhum na resposta).
  - Consulta por Período: inicialmente pausada (a API só devolvia o total do período inteiro, sem quebra por mês — inviável sem uma requisição por mês por colaborador). Uma atualização da API (`Claude/API (3).md`) passou a agrupar a resposta de `/api/premiacoes` por mês, o que resolveu o bloqueio original; `consultaServiceHttp` implementado na sequência, reaproveitando a mesma leitura de resposta de Premiação (extraída para `respostaPremiacoesAgrupadas.ts`).
  - Efeito de carregamento: prop `carregando` no `Button` (spinner + `aria-busy`) e uma barra fina fixa no topo da tela enquanto há requisições HTTP em voo, ligados em todos os botões de ação que chamam a API (Login, Cadastro de Colaboradores, Premiação, Comissão, Descontos, Consolidado PEV).
- Verificação visual real de Premiação e Consulta feita com o dev server + Playwright headless contra a API real, sem erros de console; dados de teste (lançamentos de premiação e um colaborador de teste) limpos da base ao final.
- `Claude/API*.md` (documentos de contrato da API, gerenciados manualmente pelo usuário) adicionado ao `.gitignore`.
- Todo o trabalho do dia foi commitado em commits separados por marco/funcionalidade (F4, F7-03, F7-01, integração de API por tela, efeito de carregamento, gitignore).

**Testes:** 178 testes executados, 178 passaram, 0 falharam (`npx vitest run`, 36 arquivos de teste).

**Pendências para próximo dia:** mapeamento de IDs numéricos de `telas` em `colaboradoresServiceHttp` segue assumido (não documentado/confirmado pelo backend) — risco registrado em `Claude/eventos-roadmap.md`. Demais telas de F8 (Comissão, Descontos, Plano de Saúde, Estoque) continuam no mock.
