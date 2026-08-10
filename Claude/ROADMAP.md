# Plano de Trabalho Detalhado (WBS) — Frontend Sistema de Premiações

Decomposição das fases do roadmap em **tarefas pequenas** (meio dia a ~2 dias cada), prontas para virar cards. Todas as funcionalidades são **API-backed**: cada tarefa de dados é implementada primeiro no *adapter mock* e, em F8, ligada ao endpoint real sem mudar a UI.

**Padrão de ID:** `Fx.CÓDIGO-NN`. Telas têm um código próprio (ex.: `F3.PREM-03`).

---

## Template de decomposição de TELA (aplicar a cada tela)

Toda tela é construída com esta mesma sequência de subtarefas. Nas seções de cada tela, listo só as que se aplicam e os detalhes específicos.

| Suf. | Subtarefa | O que entrega |
|---|---|---|
| **-01** | Estrutura/markup | Migrar o markup da tela do protótipo para o componente/módulo; cabeçalho da view, filtros e contêiner da tabela/lista |
| **-02** | Serviço + mock | Criar os métodos de serviço da tela no contrato e implementá-los no adapter mock (shape por entidade) |
| **-03** | Render + estados | Renderizar linhas via serviço; estados de **carregando / vazio / erro** padronizados |
| **-04** | Edição + validação | Campos editáveis, máscaras, validações de entrada, salvar via serviço |
| **-05** | Totais/rodapé (preview) | Somatórios e colunas derivadas recalculados no rodapé sem re-render das linhas (preview; verdade é do servidor) |
| **-06** | Permissão/visibilidade | Aplicar visibilidade por perfil (colunas/campos/botões) conforme `NAV_POR_PAPEL` e regras da tela |
| **-07** | Bloqueio | Botão bloquear/desbloquear (só Admin, filial específica) e estado somente-leitura quando bloqueado |
| **-08** | Filtros | Seletor de mês/ciclo/período e reação à troca de filial |
| **-09** | Exportação | Botão + chamada de exportação (via serviço; geração no servidor em produção) |
| **-10** | Testes da tela | Testes de render, edição, permissão, bloqueio e exportação |

---

## F0 — Fundação e arquitetura

- [x] **F0-01** Definir stack (vanilla modular × framework) e registrar a decisão. → React + TypeScript + Vite (ver `Claude/ARQUITETURA.md`).
- [x] **F0-02** Configurar tooling: bundler/dev server, lint, formatação, convenções de pastas/nomes. → Vite + oxlint + Vitest; convenção de pastas em `src/` (`components/ui`, `services`, `adapters`, `types`, `utils`, `views`, `styles`).
- [ ] **F0-03** Criar repositório, branches e pipeline de CI (build + deploy em homologação). → Pendente: depende de decisão de hospedagem/CI (ex.: GitHub Actions) e de remoto configurado; repositório Git local já existe.
- [ ] **F0-04** Provisionar ambientes dev/homologação/produção. → Pendente: depende de decisão de infraestrutura (fora do escopo do frontend isoladamente).
- [x] **F0-05** Extrair os tokens CSS do protótipo (paleta, tipografia, espaçamentos, raios, sombras) para arquivos reutilizáveis. → `src/styles/tokens.css` (paleta conforme `Claude/DESIGN.md`) + `src/styles/global.css` (reset/base/layout).
- [x] **F0-06** Catalogar componentes visuais base: cartão, tabela com rolagem, campo flutuante, badge, toast, cabeçalho fixo, navegação. → `src/components/ui/` (`Button`, `Card`/`CardGrid`, `BadgeInfo`/`BadgeTela`/`Selo`, `FloatingField`, `Table`/`LinhaVazia`, `Toast`, `Header`, `Nav`), com testes unitários (`Claude/testes/f0-fundacao-arquitetura.md`).
- [x] **F0-07** Escrever o documento de arquitetura em camadas (UI ↔ Serviço ↔ Adapter ↔ HTTP) e a convenção "nenhuma tela chama fetch". → `Claude/ARQUITETURA.md`.

## F1 — Camada de dados (contrato + mock)

- [x] **F1-01** Definir os tipos/shapes de todas as entidades (base na Seção 5 do doc técnico). → `src/types/`.
- [x] **F1-02** Definir a interface do serviço por domínio (todos os métodos da tabela de cobertura do roadmap). → `src/services/`.
- [x] **F1-03** Implementar o **adapter mock** com dados seed, persistindo em `localStorage`/JSON para sobreviver ao reload. → `src/adapters/mock/` (6 colaboradores seed do documento técnico).
- [x] **F1-04** Criar o wrapper HTTP genérico (base URL, cabeçalhos, interceptors) — preparado, ainda não usado. → `src/adapters/http/httpClient.ts`.
- [x] **F1-05** Padronizar formato de retorno (dados / erro / carregando) consumido de forma uniforme pela UI. → `src/types/resultado.ts` (`Resultado<T>`).
- [x] **F1-06** Criar utilitários compartilhados: formatação de moeda/mês, máscara de CPF, `mostrarToast`, helpers de filial/mês. → `src/utils/` (testes em `Claude/testes/f1-camada-de-dados.md`).

## F2 — Shell, autenticação e cadastros

**Shell & Auth**
- **F2.SHELL-01** Estrutura do app: cabeçalho fixo + `ajuste de espaço` + `main`.
- **F2.SHELL-02** Navegação renderizada por perfil (`NAV_POR_PAPEL`) e roteamento entre telas (`mostrarView`).
- **F2.SHELL-03** Seletor de filial (Admin) × badge de filial fixa (demais); re-render ao trocar filial.
- **F2.SHELL-04** Guarda de rotas no cliente (bloquear view fora do perfil).
- **F2.AUTH-01** Tela de login (markup + campo flutuante + mostrar/ocultar senha).
- **F2.AUTH-02** `login`/`logout` via serviço (mock); montar sessão; tratar erro; alternar login/app.
- **F2.UI-01** Componentes de estado **carregando / vazio / erro** reutilizáveis para todas as telas.

**Tela: Cadastro de Colaboradores** — código `F2.CAD`
- **F2.CAD-01** Estrutura: formulário + tabela da filial.
- **F2.CAD-02** Serviço + mock: `listarColaboradores`, `salvarColaborador`, `removerColaborador`.
- **F2.CAD-03** Render da tabela + estados.
- **F2.CAD-04** Formulário: campos (código, nome, CPF c/ máscara, cargo, e-mail, usuário/senha de acesso), **5 checkboxes de habilitação de tela**, validação (exige código, nome, CPF; exige filial específica), salvar/editar/cancelar/remover.
- **F2.CAD-06** Visibilidade: apenas perfis com acesso à tela.
- **F2.CAD-10** Testes da tela.

## F3 — Núcleo de Premiação

**Tela: Planilha de Premiação** — código `F3.PREM`
- **F3.PREM-01** Estrutura: filtros (mês) + grade.
- **F3.PREM-02** Serviço + mock: `listarPremiacoes(filial, mes)`, `salvarPremiacoes(...)`.
- **F3.PREM-03** Render das linhas (Código, Colaborador, CPF + 5 categorias) + estados.
- **F3.PREM-04** Edição das **5 categorias** (pev, iconic, filtros, campanhasFornecedores, inadimplencia) + salvar.
- **F3.PREM-05** Totais: **Total** = soma das 5; **Planilha Deivson** = Total − PEV (preview); rodapé por categoria + Total + Deivson, sem perder foco.
- **F3.PREM-07** Bloqueio `premiacao` (editor Gerente; Admin nunca bloqueado).
- **F3.PREM-08** Filtro de mês + reação à filial.
- **F3.PREM-09** Exportação CSV (CPF, Nome, Valor Total, Observações).
- **F3.PREM-10** Testes da tela.

**Tela: Consolidado PEV** — código `F3.PEV`
- **F3.PEV-01** Estrutura: filtros (ano-ciclo, de/até) + grade dinâmica.
- **F3.PEV-02** Serviço + mock: `listarConsolidadoPev(filial, ciclo, intervalo)`, `salvarAdiantamento(...)`.
- **F3.PEV-03** Render com **colunas dinâmicas por mês** do intervalo + colunas finais (Total Acumulado, Base 28%, Adiantamento, Premiação Adicional a Receber) + estados.
- **F3.PEV-04** Lançamento do **Adiantamento de Férias** (somente Admin) + salvar.
- **F3.PEV-05** Derivados: Base = Total × 0,28; A Receber = Base − Adiantamento; rodapé soma meses + 4 colunas.
- **F3.PEV-06** Visibilidade da coluna Adiantamento conforme perfil.
- **F3.PEV-08** Filtros de ciclo e intervalo de meses.
- **F3.PEV-09** Exportação CSV (CPF, Nome, Premiação Adicional a Receber).
- **F3.PEV-10** Testes da tela.

**Tela: Consulta por Período** — código `F3.CONS` *(somente leitura)*
- **F3.CONS-01** Estrutura: filtros (de/até) + área de cartões.
- **F3.CONS-02** Serviço + mock: `listarConsulta(filtro, escopo)`.
- **F3.CONS-03** Render de **um cartão por mês** (5 categorias + Total) + rodapé por mês + estados.
- **F3.CONS-06** Perfil vendedor: filtrado ao próprio; rótulo "Minhas Premiações".
- **F3.CONS-08** Filtros de período + limpar filtro.
- **F3.CONS-09** Exportação CSV.
- **F3.CONS-10** Testes da tela.

## F4 — Comissão e Descontos

**Tela: Comissão** — código `F4.COM`
- **F4.COM-01** Estrutura: filtro (mês) + grade.
- **F4.COM-02** Serviço + mock: `listarComissoes(filial, mes)`, `salvarComissao(...)`; obter PEV da Premiação para leitura.
- **F4.COM-03** Render (Código, Colaborador, CPF, Função, [PEV], Comissão, Garantido) + estados. **Sem coluna Total.**
- **F4.COM-04** Edição de Comissão e Garantido + salvar; ao salvar, gravar **snapshot do PEV**.
- **F4.COM-05** Rodapé: PEV (se visível), Comissão, Garantido, sem perder foco.
- **F4.COM-06** Coluna **PEV só para Admin** (cabeçalho/linhas/rodapé); Coordenador não acessa a tela.
- **F4.COM-07** Bloqueio `comissao` (editor Gerente).
- **F4.COM-08** Filtro de mês + filial.
- **F4.COM-09** Exportação Excel (Código, Nome, PEV, Comissão, Garantido).
- **F4.COM-10** Testes da tela.

**Tela: Descontos e Bonificações** — código `F4.DESC`
- **F4.DESC-01** Estrutura: filtro (mês) + grade agrupada por colaborador.
- **F4.DESC-02** Serviço + mock: `listarDescontos(...)`, `salvarDescontos(...)`, `removerDesconto(...)` (persistência por linha).
- **F4.DESC-03** Render com **múltiplos lançamentos por colaborador** + estados.
- **F4.DESC-04** Edição: **Tipo** (select fixo de 10 opções), Valor, Observações (livre); adicionar/remover lançamento; salvar.
- **F4.DESC-05** **Total por colaborador** (1ª linha do grupo) + rodapé geral.
- **F4.DESC-07** Bloqueio `descontos` (editor Coordenador).
- **F4.DESC-08** Filtro de mês + filial.
- **F4.DESC-09** Exportação Excel (CPF, Nome, Mês Referência, Tipo, Valor, Observações — 1 linha por lançamento).
- **F4.DESC-10** Testes da tela.

## F5 — Plano de Saúde

**Tela: Cadastro (Titulares e Dependentes)** — código `F5.PS-CAD`
- **F5.PS-CAD-01** Estrutura: sub-aba de cadastro + lista de titulares/dependentes.
- **F5.PS-CAD-02** Serviço + mock: `listarDependentes(titular)`, `salvarDependente(...)`, `removerDependente(...)`, `salvarAdesao(titular, tipo, valor)`.
- **F5.PS-CAD-03** Render: titulares (colaboradores habilitados) + dependentes + estados.
- **F5.PS-CAD-04** Formulário de dependente (nome + CPF) adicionar/remover.
- **F5.PS-CAD-06** Checkboxes de **adesão Saúde/Odonto** por titular (default verdadeiro; **só Admin edita**; demais `disabled`).
- **F5.PS-CAD-10** Testes da tela.

**Tela: Lançamento (Saúde / Odontológico)** — código `F5.PS-LAN`
- **F5.PS-LAN-01** Estrutura: sub-aba de lançamento + sub-sub-abas Saúde/Odonto + filtro (mês) + grade.
- **F5.PS-LAN-02** Serviço + mock: `listarLancamentosPlanoSaude(filial, mes, tipo)`, `salvarLancamentoPlanoSaude(...)`.
- **F5.PS-LAN-03** Render **uma linha por pessoa** (titular + dependentes), filtrando famílias sem adesão ao tipo + estados.
- **F5.PS-LAN-04** Descrição (TITULAR/DEPENDENTE fixa; **editável só pelo Admin**); valores fixos por filial/tipo (185,27 padrão · **255,54 nas filiais 401/403** · 13,56 odonto), nunca digitados; célula `***` na coluna não aplicável.
- **F5.PS-LAN-05** Rodapé (Titular, Dependente, extras, Total).
- **F5.PS-LAN-06** Alternância de sub-aba (cadastro/lançamento) e de tipo (saúde/odonto).
- **F5.PS-LAN-07** Bloqueio `planoSaude` (editor Coordenador).
- **F5.PS-LAN-08** Filtro de mês + filial.
- **F5.PS-LAN-09** Exportação Excel respeitando sub-aba e filial.
- **F5.PS-LAN-10** Testes da tela.

## F6 — Premiações Estoque *(condicional à decisão de negócio)*

**Tela: Política de Estoque** — código `F6.EST-POL` *(só Admin)*
- **F6.EST-POL-01** Estrutura: formulário de metas e valores de referência.
- **F6.EST-POL-02** Serviço + mock: `obterPolitica`, `salvarPolitica`.
- **F6.EST-POL-04** Edição de metas (romaneios, contagens, avaria, segregado, volume) + salvar.
- **F6.EST-POL-06** Restringir edição ao Admin.

**Tela: Coletivo de Estoque** — código `F6.EST-COL`
- **F6.EST-COL-01** Estrutura: filtro (mês) + grade de KPIs.
- **F6.EST-COL-02** Serviço + mock: `listarColetivo(filial, mes)`, `salvarColetivo(...)`.
- **F6.EST-COL-03/04** Render + edição dos KPIs coletivos (romaneios, contagens, avaria, segregado) por filial/mês.
- **F6.EST-COL-05** Apuração (preview) por grupo de função.

**Tela: Individual de Estoque** — código `F6.EST-IND`
- **F6.EST-IND-01** Estrutura: filtro (mês) + grade por colaborador.
- **F6.EST-IND-02** Serviço + mock: `listarIndividual(filial, mes)`, `salvarIndividual(...)`.
- **F6.EST-IND-03/04** Render + edição (sem faltas, organização, volume separado, dias de férias) + salvar.
- **F6.EST-IND-05** Total a receber (preview) com prorateio por dias de férias.
- **F6.EST-IND-07** Bloqueio `estoque` (editor Coordenador).
- **F6.EST-IND-08** Filtro de mês + filial.
- **F6.EST-IND-09** Exportação Excel (CPF, Nome, Valor Total, Observações).
- **F6.EST-IND-10** Testes das telas de estoque.

## F7 — Preparação de integração

- **F7-01** Auth para API: guardar token/sessão e injetar `Authorization` no wrapper HTTP.
- **F7-02** Interceptor de 401/expiração (logout/refresh).
- **F7-03** Config por ambiente: base URL da API por ambiente (variáveis), sem URL fixa.
- **F7-04** Mapper por entidade (tradução payload API ↔ shape do front) — esqueleto pronto.
- **F7-05** Padronizar tratamento de erro por tipo (validação, permissão, rede, servidor) e retry onde couber.
- **F7-06** Marcar campos calculados que deixarão de ser calculados no front (passam a exibir o valor do serviço).

## F8 — Integração real com a API *(por tela)*

- **F8-00** Alinhar contrato da API (checklist do roadmap: URL/CORS, auth, endpoints por entidade, filtros mês/filial, payloads, erros, autorização).
- **F8-01** Implementar o adapter HTTP cumprindo a interface do serviço.
- **F8-02 … F8-nn** Migrar **cada tela** do mock para o HTTP (uma tarefa por tela: `F8.CAD`, `F8.PREM`, `F8.PEV`, `F8.CONS`, `F8.COM`, `F8.DESC`, `F8.PS-CAD`, `F8.PS-LAN`, `F8.EST-*`), validando dados, filtros e bloqueios.
- **F8-90** Preencher o mapper conforme payloads reais.
- **F8-91** Ajustar exportações se geradas no backend.
- **F8-92** Testes de integração/contrato por endpoint e por perfil.

## F9 — Qualidade, homologação e Go-live

- **F9-01** Testes unitários de componentes/serviços.
- **F9-02** Testes e2e por perfil (lançamento, bloqueio, exportação).
- **F9-03** Acessibilidade (aria, teclado, contraste, `prefers-reduced-motion`).
- **F9-04** Responsividade (tabelas com rolagem, mobile).
- **F9-05** Performance e empacotamento de dependências (substituir SheetJS via CDN).
- **F9-06** UAT com os quatro perfis + correções.
- **F9-07** Deploy de produção + monitoramento de erros do frontend + rollback.
- **F9-08** Treinamento e documentação de uso.

---

## Resumo de códigos de tela

| Código | Tela | Fase |
|---|---|---|
| `F2.CAD` | Cadastro de Colaboradores | F2 |
| `F3.PREM` | Planilha de Premiação | F3 |
| `F3.PEV` | Consolidado PEV | F3 |
| `F3.CONS` | Consulta por Período | F3 |
| `F4.COM` | Comissão | F4 |
| `F4.DESC` | Descontos e Bonificações | F4 |
| `F5.PS-CAD` | Plano de Saúde — Cadastro | F5 |
| `F5.PS-LAN` | Plano de Saúde — Lançamento | F5 |
| `F6.EST-POL` | Estoque — Política | F6 |
| `F6.EST-COL` | Estoque — Coletivo | F6 |
| `F6.EST-IND` | Estoque — Individual | F6 |

> Cada linha `-02` (serviço + mock) já corresponde ao método que, em F8, se liga ao endpoint real — mantendo a regra de que **toda funcionalidade é API-backed**.
