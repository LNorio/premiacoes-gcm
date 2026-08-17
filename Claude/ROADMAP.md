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
- [x] **F2.SHELL-01** Estrutura do app: cabeçalho fixo + `ajuste de espaço` + `main`. → `src/views/shell/Shell.tsx` (ResizeObserver mede o cabeçalho e aplica padding-top).
- [x] **F2.SHELL-02** Navegação renderizada por perfil (`NAV_POR_PAPEL`) e roteamento entre telas (`mostrarView`). → `Shell.tsx` (estado `viewAtiva` + `Nav`).
- [x] **F2.SHELL-03** Seletor de filial (Admin) × badge de filial fixa (demais); re-render ao trocar filial. → `Shell.tsx` (`<select>` para Admin, `BadgeInfo` para os demais).
- [x] **F2.SHELL-04** Guarda de rotas no cliente (bloquear view fora do perfil). → `Shell.tsx` (mesma regra do protótipo: fora de `NAV_POR_PAPEL` cai em `inicio`).
- [x] **F2.AUTH-01** Tela de login (markup + campo flutuante + mostrar/ocultar senha). → `src/views/auth/Login.tsx`.
- [x] **F2.AUTH-02** `login`/`logout` via serviço (mock); montar sessão; tratar erro; alternar login/app. → `src/state/SessaoContext.tsx` + `App.tsx`.
- [x] **F2.UI-01** Componentes de estado **carregando / vazio / erro** reutilizáveis para todas as telas. → `src/components/ui/Estado.tsx`.

**Tela: Início (Painel Geral)** — código `F2.INICIO` *(view padrão do Shell)*
- [x] **F2.INICIO-01** Estrutura: cartões de estatísticas, dois painéis (gestor × vendedor) conforme protótipo (`view-inicio`/`inicio-gestor`/`inicio-vendedor`). → `src/views/inicio/Inicio.tsx`, reaproveitando `Card`/`CardGrid` de F0.
- [x] **F2.INICIO-02** Serviço: reaproveita `colaboradoresService`/`premiacaoService` já existentes (sem serviço próprio).
- [x] **F2.INICIO-03** Render + estados (carregando/erro).
- [x] **F2.INICIO-06** Painel do gestor (Admin/Gerente/Coordenador): cartões Filial, Colaboradores cadastrados, Premiações lançadas (mês atual), Total a pagar (mês atual, destaque); ações rápidas "+ Cadastrar vendedor" (só Admin) e "+ Preencher planilha do mês" (só se o papel acessa `premiacao`). Painel do vendedor: cartões Minha filial, Minha função, Premiações recebidas (mês atual), Total a receber (mês atual, destaque); ação rápida "Ver minhas premiações por mês". **Decisão de 2026-08-12:** os cartões de premiação usam o mês atual, não o histórico completo do protótipo (que soma todos os meses já lançados). **Corrigido em 2026-08-12:** "+ Cadastrar vendedor" restrito ao Admin (Gerente/Coordenador só têm leitura em Colaboradores) — ver `Claude/eventos-roadmap.md`.
- [x] **F2.INICIO-10** Testes da tela. → `Claude/testes/f2-inicio-painel-geral.md`.

**Tela: Cadastro de Colaboradores** — código `F2.CAD`
- [x] **F2.CAD-01** Estrutura: formulário + tabela da filial. → `src/views/vendedores/CadastroColaboradores.tsx`.
- [x] **F2.CAD-02** Serviço + mock: `listarColaboradores`, `salvarColaborador`, `removerColaborador`. → já implementado em F1 (`src/services`/`src/adapters/mock`). **F8.CAD iniciado adiantado em 2026-08-11:** `colaboradoresServiceHttp` (`src/adapters/http/colaboradoresService.http.ts`) consome `/api/usuarios` fora dos testes; riscos e limitações conhecidas registrados em `Claude/eventos-roadmap.md`.
- [x] **F2.CAD-03** Render da tabela + estados.
- [x] **F2.CAD-04** Formulário: campos (código, nome, CPF c/ máscara, **filial**, cargo, **perfil**, e-mail, usuário/senha de acesso), **5 checkboxes de habilitação de tela**, validação (exige código, nome, CPF, filial), salvar/editar/cancelar/remover. **Alterado em 2026-08-10:** campo de Filial adicionado ao formulário (era implícito pelo cabeçalho); depois o formulário inline foi substituído por uma modal ("+ Adicionar colaborador"). **Alterado em 2026-08-11:** campo de Perfil adicionado (Vendedor/Coordenador/Gerente/Administrador). Ver `Claude/eventos-roadmap.md`.
- [x] **F2.CAD-06** Visibilidade: apenas perfis com acesso à tela. → guarda de rota do Shell + formulário/Ações visíveis só para Admin numa filial específica.
- [x] **F2.CAD-10** Testes da tela. → `Claude/testes/f2-shell-auth-cadastro.md` (88 testes no total do projeto).

## F3 — Núcleo de Premiação

**Tela: Planilha de Premiação** — código `F3.PREM`
- [x] **F3.PREM-01** Estrutura: filtros (mês) + grade.
- [x] **F3.PREM-02** Serviço + mock: `listarPremiacoes(filial, mes)`, `salvarPremiacoes(...)`. → já existia de F1; ganhou suporte a `FILIAL_TODAS` (ver eventos-roadmap). **F8.PREM iniciado adiantado em 2026-08-11:** `premiacaoServiceHttp` (`src/adapters/http/premiacaoService.http.ts`) consome `/api/premiacoes` fora dos testes — uma requisição por colaborador (`?id=`), já que a API não devolve id nenhum na resposta; ajustado no mesmo dia para o novo formato agrupado por mês (`"meses"`) da API v3; ver `Claude/eventos-roadmap.md`.
- [x] **F3.PREM-03** Render das linhas (Código, Colaborador, CPF + 5 categorias) + estados. **Alterado em 2026-08-10:** coluna Filial adicionada quando o Admin está em "Todas as filiais"; ver `Claude/eventos-roadmap.md`.
- [x] **F3.PREM-04** Edição das **5 categorias** (pev, iconic, filtros, campanhasFornecedores, inadimplencia) + salvar.
- [x] **F3.PREM-05** Totais: **Total** = soma das 5; **Planilha Deivson** = Total − PEV (preview); rodapé por categoria + Total + Deivson, sem perder foco.
- [x] **F3.PREM-07** Bloqueio `premiacao` (editor Gerente; Admin nunca bloqueado).
- [x] **F3.PREM-08** Filtro de mês + reação à filial.
- [x] **F3.PREM-09** Exportação CSV (CPF, Nome, Valor Total, Observações).
- [x] **F3.PREM-10** Testes da tela. → `Claude/testes/f3-nucleo-premiacao.md`.

**Tela: Consolidado PEV** — código `F3.PEV`
- [x] **F3.PEV-01** Estrutura: filtros (ano-ciclo, de/até) + grade dinâmica.
- [x] **F3.PEV-02** Serviço + mock: `listarConsolidadoPev(filial, ciclo, intervalo)`, `salvarAdiantamento(...)`. → já existia de F1; ganhou filtro por `telas.premiacoes` (ver eventos-roadmap). **F8.PEV iniciado adiantado em 2026-08-11:** `consolidadoPevServiceHttp` (`src/adapters/http/consolidadoPevService.http.ts`) consome `/api/consolidado` fora dos testes, cruzando com `/api/usuarios` para obter filial e `telas.premiacoes` (a API não devolve isso); ver `Claude/eventos-roadmap.md`.
- [x] **F3.PEV-03** Render com **colunas dinâmicas por mês** do intervalo + colunas finais (Total Acumulado, Base 28%, Adiantamento, Premiação Adicional a Receber) + estados. **Alterado em 2026-08-10:** coluna Filial adicionada quando o Admin está em "Todas as filiais"; ver `Claude/eventos-roadmap.md`.
- [x] **F3.PEV-04** Lançamento do **Adiantamento de Férias** (somente Admin) + salvar.
- [x] **F3.PEV-05** Derivados: Base = Total × 0,28; A Receber = Base − Adiantamento; rodapé soma meses + 4 colunas.
- [x] **F3.PEV-06** Visibilidade da coluna Adiantamento conforme perfil.
- [x] **F3.PEV-08** Filtros de ciclo e intervalo de meses. **Alterado em 2026-08-12:** campos "De"/"Até" passaram a ser somente-leitura, sempre refletindo o ciclo do ano informado em "Ciclo" (ver `Claude/eventos-roadmap.md`).
- [x] **F3.PEV-09** Exportação CSV (CPF, Nome, Premiação Adicional a Receber).
- [x] **F3.PEV-10** Testes da tela. → `Claude/testes/f3-nucleo-premiacao.md`.

**Tela: Consulta por Período** — código `F3.CONS` *(somente leitura)*
- [x] **F3.CONS-01** Estrutura: filtros (de/até) + área de cartões.
- [x] **F3.CONS-02** Serviço + mock: `listarConsulta(filial, filtro, escopo)`. → assinatura ganhou `filial` (era uma lacuna de F1, ver eventos-roadmap). **F8.CONS iniciado adiantado em 2026-08-11:** `consultaServiceHttp` (`src/adapters/http/consultaService.http.ts`) consome `/api/premiacoes` fora dos testes — blocker original (sem quebra por mês) resolvido pela API v3, que passou a agrupar a resposta por mês; ver `Claude/eventos-roadmap.md`.
- [x] **F3.CONS-03** Render de **um cartão por mês** (5 categorias + Total) + rodapé por mês + estados.
- [x] **F3.CONS-06** Perfil vendedor: filtrado ao próprio; rótulo "Minhas Premiações por Período".
- [x] **F3.CONS-08** Filtros de período + limpar filtro. **Alterado em 2026-08-12:** padrão do primeiro carregamento passou de "todos os meses" para "só o mês passado" (ver `Claude/eventos-roadmap.md`).
- [x] **F3.CONS-09** Exportação CSV.
- [x] **F3.CONS-10** Testes da tela. → `Claude/testes/f3-nucleo-premiacao.md`.

## F4 — Comissão e Descontos

**Tela: Comissão** — código `F4.COM`
- [x] **F4.COM-01** Estrutura: filtro (mês) + grade. → `src/views/comissao/Comissao.tsx`.
- [x] **F4.COM-02** Serviço + mock: `listarComissoes(filial, mes)`, `salvarComissao(...)`; obter PEV da Premiação para leitura. → já existia de F1; ganhou suporte a `FILIAL_TODAS` (ver eventos-roadmap). **F8.COM iniciado adiantado em 2026-08-12:** `comissaoServiceHttp` (`src/adapters/http/comissaoService.http.ts`) consome `GET/PUT /api/comissoes` fora dos testes — o `pev` já vem calculado ao vivo pela própria API; ver `Claude/eventos-roadmap.md`.
- [x] **F4.COM-03** Render (Código, Colaborador, CPF, Função, [PEV], Comissão, Garantido) + estados. **Sem coluna Total.**
- [x] **F4.COM-04** Edição de Comissão e Garantido + salvar; ao salvar, gravar **snapshot do PEV**.
- [x] **F4.COM-05** Rodapé: PEV (se visível), Comissão, Garantido, sem perder foco.
- [x] **F4.COM-06** Coluna **PEV só para Admin** (cabeçalho/linhas/rodapé); Coordenador não acessa a tela (fora do `NAV_POR_PAPEL` dele, guarda de rota do Shell).
- [x] **F4.COM-07** Bloqueio `comissao` (editor Gerente); botão de bloqueio só para Admin numa filial específica.
- [x] **F4.COM-08** Filtro de mês + filial.
- [x] **F4.COM-09** Exportação Excel (Código, Nome, PEV, Comissão, Garantido). → `exportarComissoesExcel` (`src/services/comissaoService.ts`) + `baixarExcel` (SheetJS via CDN, `src/utils/exportar.ts`).
- [x] **F4.COM-10** Testes da tela. → `Claude/testes/f4-comissao-descontos.md`.

**Tela: Descontos e Bonificações** — código `F4.DESC`
- [x] **F4.DESC-01** Estrutura: filtro (mês) + grade agrupada por colaborador. → `src/views/descontos/Descontos.tsx`.
- [x] **F4.DESC-02** Serviço + mock: `listarDescontos(...)`, `salvarDescontos(...)`, `removerDesconto(...)` (persistência por linha). → já existia de F1, sem alterações. **F8.DESC iniciado adiantado em 2026-08-12:** `descontosServiceHttp` (`src/adapters/http/descontosService.http.ts`) consome `GET/PUT/DELETE /api/descontos-bonificacoes` fora dos testes — a API só cria lançamentos (nunca atualiza por id), então editar um lançamento existente apaga e recria; ver `Claude/eventos-roadmap.md`.
- [x] **F4.DESC-03** Render com **múltiplos lançamentos por colaborador** + estados.
- [x] **F4.DESC-04** Edição: **Tipo** (select fixo de 10 opções), Valor, Observações (livre); adicionar/remover lançamento; salvar.
- [x] **F4.DESC-05** Botão **"📊 Totais por tipo"** abre uma modal com um total por tipo de lançamento presente no mês (só entram tipos com pelo menos 1 lançamento) — soma simples e sempre positiva do valor de cada tipo, já que agora cada um aparece separado (não faz mais sentido a regra de sinal usada quando era um total só). A tabela da modal usa `<Table compacta>` (sem o min-width de 640px das tabelas normais) para não gerar rolagem horizontal. **Histórico:** até 2026-08-14 a tela tinha uma coluna "Total" por colaborador + rodapé "Total geral" únicos, com Bonificação/Ajuda de Custo somando e os demais tipos subtraindo (regra introduzida em 2026-08-13); foram retirados e viraram a modal atual — que por sua vez começou também com essa regra de sinal (só tipos "que descontam" apareciam negativos) e depois voltou a ser soma simples e positiva, a pedido do usuário. Ver `Claude/eventos-roadmap.md`.
- [x] **F4.DESC-07** Bloqueio `descontos` (editor Coordenador); botão de bloqueio só para Admin numa filial específica.
- [x] **F4.DESC-08** Filtro de mês + filial.
- [x] **F4.DESC-09** Exportação Excel (CPF, Nome, Mês Referência, Tipo, Valor, Observações — 1 linha por lançamento). → `exportarDescontosExcel` (`src/services/descontosService.ts`).
- [x] **F4.DESC-10** Testes da tela. → `Claude/testes/f4-comissao-descontos.md`.

## F5 — Plano de Saúde

**Tela: Cadastro (Titulares e Dependentes)** — código `F5.PS-CAD`
- [x] **F5.PS-CAD-01** Estrutura: sub-aba de cadastro + lista de titulares/dependentes. → `src/views/planoSaude/PlanoSaude.tsx` (sub-abas) + `CadastroTitulares.tsx`.
- [x] **F5.PS-CAD-02** Serviço + mock: `listarDependentes(titular)`, `salvarDependente(...)`, `removerDependente(...)`, `salvarAdesao(titular, tipo, valor)`. → já existia de F1 (`src/services/planoSaudeService.ts`); tipo `PlanoSaudeLancamento` corrigido (ver `Claude/eventos-roadmap.md`).
- [x] **F5.PS-CAD-03** Render: titulares (colaboradores habilitados) + dependentes + estados.
- [x] **F5.PS-CAD-04** Formulário de dependente (nome + CPF) adicionar/remover. → modal (`src/components/ui/Modal.tsx`, já existente).
- [x] **F5.PS-CAD-06** Checkboxes de **adesão Saúde/Odonto** por titular (default verdadeiro; **só Admin edita**; demais `disabled`). **Alterado em 2026-08-14:** dependentes também ganharam checkboxes próprias e marcáveis (antes eram só um ✓/— espelhando a adesão do titular) — adesão independente por pessoa, controla quem aparece na grade de Lançamento. Sem campo correspondente na API de Dependentes ainda (`Claude/API (7).md`); persiste de verdade só no mock, no HTTP real fica só na sessão da tela. Ver `Claude/eventos-roadmap.md`.
- [x] **F5.PS-CAD-10** Testes da tela. → `Claude/testes/f5-plano-saude.md`.

**Tela: Lançamento (Saúde / Odontológico)** — código `F5.PS-LAN`
- [x] **F5.PS-LAN-01** Estrutura: sub-aba de lançamento + sub-sub-abas Saúde/Odonto + filtro (mês) + grade. → `src/views/planoSaude/LancamentoPlanoSaude.tsx`.
- [x] **F5.PS-LAN-02** Serviço + mock: `listarLancamentosPlanoSaude(filial, mes, tipo)`, `salvarLancamentoPlanoSaude(...)`.
- [x] **F5.PS-LAN-03** Render **uma linha por pessoa** (titular + dependentes), filtrando famílias sem adesão ao tipo + estados.
- [x] **F5.PS-LAN-04** Descrição (TITULAR/DEPENDENTE, texto fixo — **nunca editável, nem pelo Admin**; ver decisão em `Claude/eventos-roadmap.md`, o protótipo contradiz uma frase do documento técnico); valor (mesmo para Titular e Dependente) vindo do período vigente cadastrado em `F5.PS-PER` (nunca digitado na grade de Lançamento); célula `***` na coluna não aplicável. **Alterado em 2026-08-14:** antes o valor era fixo por filial/tipo (185,27 padrão · 255,54 nas filiais 401/403 · 13,56 odonto); agora vem do período cadastrado pelo Admin — ver `F5.PS-PER` e `Claude/eventos-roadmap.md`.
- [x] **F5.PS-LAN-05** Rodapé (Titular, Dependente, extras, Total).
- [x] **F5.PS-LAN-06** Alternância de sub-aba (cadastro/lançamento/período) e de tipo (saúde/odonto).
- [x] **F5.PS-LAN-07** Bloqueio `planoSaude` (editor Coordenador) — só existe (botão/checagem) na sub-aba Saúde; Odontológico não tem nada editável para bloquear.
- [x] **F5.PS-LAN-08** Filtro de mês + filial.
- [x] **F5.PS-LAN-09** Exportação Excel respeitando sub-aba e filial. → `exportarPlanoSaudeExcel` (`src/services/planoSaudeService.ts`).
- [x] **F5.PS-LAN-10** Testes da tela. → `Claude/testes/f5-plano-saude.md`.

**Tela: Período do Plano** — código `F5.PS-PER` *(adicionado em 2026-08-14, fora do escopo original — ver `Claude/eventos-roadmap.md`)*
- [x] **F5.PS-PER-01** Sub-aba "Período do Plano", só visível para o Admin, na visão de uma única filial (fora de "Todas as filiais"). → `src/views/planoSaude/CadastroPeriodoPlano.tsx`.
- [x] **F5.PS-PER-02** Serviço + mock + HTTP: `listarPeriodosPlanoSaude(filial, tipo)`, `salvarPeriodoPlanoSaude(filial, tipo, tipoPessoa, valor, dataInicio?, dataFim?)`, `encerrarPeriodoPlanoSaude(periodo, dataValidade?)` (`src/services/planoSaudeService.ts` / `src/adapters/mock/planoSaudeService.mock.ts` / `src/adapters/http/planoSaudeService.http.ts`) — consumindo `GET/POST /api/valores-plano-saude` e `PUT /api/valores-plano-saude/{id}/encerrar` (`Claude/API (7).md`).
- [x] **F5.PS-PER-03** Botão **"+ Novo período"** abre uma modal com 4 campos: **Data de Início** (pode ser retroativa — corrige/lança um período que já deveria valer em meses passados; enviada como `"data inicio"`), **Valor Titular**, **Valor Dependente** (preenche só um dos dois ou os dois — cada preenchimento vira um `POST` separado, um por tipo de pessoa) e **Data de Encerramento** (opcional — se preenchida, vai como `"data fim"` no mesmo `POST`, e o período já nasce histórico/encerrado, sem passar por "Vigente" nem concorrer com um período vigente existente). **Alterado em 2026-08-14 (cinco vezes):** 1ª versão tinha data inicial/final livres e valor separado de Titular/Dependente no mesmo período; reescrita pra "fechamento de período" (só um vigente por vez, valor único, sem data); a API real ganhou `tipo pessoa` (Titular e Dependente com vigência independente) e a tela ganhou um toggle Titular/Dependente (duas sub-abas); as sub-abas viraram os dois campos lado a lado numa lista única; o formulário inline virou um botão que abre uma modal com os 4 campos, "Data de Início" só ilustrativa e "Data de Encerramento" fechando via uma 2ª chamada (`encerrar`); por fim, a API ganhou `"data inicio"`/`"data fim"` editáveis no `POST`, e a tela passou a enviar os dois direto num único `POST`, com "Data de Início" podendo ser retroativa de verdade — ver `Claude/eventos-roadmap.md`.
- [x] **F5.PS-PER-04** Lista única de períodos da filial/tipo de plano (Titular e Dependente juntos, vigente + histórico), com coluna **Tipo de Pessoa** identificando de quem é cada linha, e botão **Encerrar vigência** na linha vigente (sem botão de remover — o histórico é preservado; `PUT .../encerrar`).
- [x] **F5.PS-PER-05** O valor do período vigente substitui o valor usado em `F5.PS-LAN-04`; só existe um período vigente por filial + tipo de plano + tipo de pessoa por vez (o Admin precisa encerrar o atual antes de cadastrar um novo — a tentativa de duplicar é recusada). Filiais seguem com um período vigente pré-semeado por tipo de pessoa (mesmos valores que eram fixos antes, iguais para Titular e Dependente) para não ficar sem valor algum.
- [x] **F5.PS-PER-06** Testes da tela. → `Claude/testes/f5-plano-saude.md`.

**Migração para a API real** — código `F8.PS` *(adiantado, junto com F5.PS-PER)*
- [x] **F8.PS-01** `planoSaudeServiceHttp` (`src/adapters/http/planoSaudeService.http.ts`) implementa toda a interface `PlanoSaudeService` (dependentes, adesão, lançamentos, período) contra `Claude/API (5).md`; ligado fora dos testes em `src/adapters/index.ts` — Plano de Saúde deixa de ser mock-only.
- [x] **F8.PS-02** Adesão (`salvarAdesao`) grava via `PUT /api/usuarios/{id}` (`"plano saude"`/`"plano odontologico"`), reaproveitando o mesmo endpoint de Colaboradores.
- [x] **F8.PS-03** Shapes de resposta de `GET /api/dependentes`, `GET /api/lancamentos` e `GET/POST/PUT /api/valores-plano-saude` confirmados ao vivo contra o backend real antes de implementar (não são documentados com exemplo em `Claude/API (5).md`, exceto Valores de Plano de Saúde) — ver `Claude/eventos-roadmap.md`.

## F6 — Premiações Estoque *(decidido: não será implementado num primeiro momento — ver `Claude/eventos-roadmap.md`, 2026-08-13. A aba foi retirada de `NAV_POR_PAPEL` do Admin para não ficar visível.)*

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

- [x] **F7-01** Auth para API: guardar token/sessão e injetar `Authorization` no wrapper HTTP. → Iniciado adiantado (fora da ordem sequencial, a pedido do usuário): `authServiceHttp` (`src/adapters/http/authService.http.ts`) implementado contra `POST /api/valida-usuario` (`Claude/API.md`), token guardado em memória (`src/adapters/http/token.ts`) e injetado pelo `HttpClient` via `Authorization: Bearer`. `src/adapters/index.ts` já troca `authService` para HTTP fora dos testes (Vitest continua no mock). Sessão ainda não persiste entre reloads da página — isso não foi pedido nem implementado.
- **F7-02** Interceptor de 401/expiração (logout/refresh).
- [x] **F7-03** Config por ambiente: base URL da API por ambiente (variáveis), sem URL fixa. → Iniciado adiantado (fora da ordem sequencial, a pedido do usuário): `.env`/`.env.example` com `VITE_API_BASE_URL` criados; a leitura pelo `HttpClient` (`src/adapters/http/httpClient.ts`) e a troca mock↔HTTP continuam pendentes de F8.
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
- **F9-03** Acessibilidade (aria, teclado, contraste, `prefers-reduced-motion`). → Efeito de carregamento (spinner nos botões de ação + barra global no topo durante chamadas à API) adiantado em 2026-08-11, a pedido do usuário; ver `Claude/eventos-roadmap.md`.
- **F9-04** Responsividade (tabelas com rolagem, mobile).
- **F9-05** Performance e empacotamento de dependências (substituir SheetJS via CDN).
- **F9-06** UAT com os quatro perfis + correções.
- **F9-07** Deploy de produção + monitoramento de erros do frontend + rollback.
- **F9-08** Treinamento e documentação de uso.

---

## Resumo de códigos de tela

| Código | Tela | Fase |
|---|---|---|
| `F2.INICIO` | Início (Painel Geral) | F2 |
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
