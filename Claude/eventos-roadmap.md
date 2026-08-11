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

### 2026-08-10 — F2: Shell, autenticação e cadastros

- Sessão (login/logout/erro/troca de filial) em `src/state/SessaoContext.tsx`, consumindo `authServiceMock`.
- Tela de login (`src/views/auth/Login.tsx`) com campo flutuante e mostrar/ocultar senha.
- Shell do app (`src/views/shell/Shell.tsx`): cabeçalho fixo com ajuste de espaço automático (ResizeObserver), navegação por `NAV_POR_PAPEL`, seletor de filial para o Admin vs. badge fixo para os demais, guarda de rota.
- Componentes de estado carregando/vazio/erro (`src/components/ui/Estado.tsx`) e `ToastHost` para a fila de `mostrarToast`.
- Tela de Cadastro de Colaboradores completa (`src/views/vendedores/CadastroColaboradores.tsx`): formulário com máscara de CPF e checklist de telas, validação, CRUD, visibilidade restrita a Admin numa filial específica.
- 88 testes unitários no total (68 de F0+F1 + 20 novos), todos passando (`Claude/testes/f2-shell-auth-cadastro.md`). Verificação visual real feita rodando o dev server e dirigindo o app com Playwright headless (login → shell → cadastro → logout, sem erros de console).
- **Pendência sinalizada, fora do escopo de F2:** o conteúdo real do Painel Geral (cartões com estatísticas) não tem subtarefa própria no `ROADMAP.md`; `Inicio.tsx` ficou como placeholder mínimo até isso ser agendado.

### 2026-08-10 — F3: Núcleo de Premiação

- Planilha de Premiação (`src/views/premiacao/Premiacao.tsx`): grade editável das 5 categorias, totais/Planilha Deivson em tempo real sem perder foco, bloqueio (Admin bloqueia/desbloqueia, Gerente fica travado quando bloqueado), filtro de mês, exportação CSV.
- Consolidado PEV (`src/views/consolidadoPev/ConsolidadoPev.tsx`): colunas dinâmicas por mês, adiantamento de férias editável só pelo Admin, derivados (Base 28%, Adicional a Receber) recalculados ao vivo, filtros de ciclo/período, exportação CSV.
- Consulta por Período (`src/views/consulta/ConsultaPeriodo.tsx`): cartões por mês, escopo restrito ao próprio vendedor com título "Minhas Premiações por Período", coluna Filial quando Admin vê todas, filtro de período, exportação CSV reaproveitando as mesmas colunas da Planilha.
- Utilitário de exportação CSV (`src/utils/exportar.ts`, `exportarPremiacoesCSV` em `src/services/premiacaoService.ts`) replicando exatamente o padrão da Seção 4 do documento técnico (separador `;`, BOM UTF-8, nome de arquivo).
- As três telas ligadas ao Shell, substituindo o placeholder `EmConstrucao`.
- 107 testes unitários no total (88 de F0+F1+F2 + 19 novos), todos passando (`Claude/testes/f3-nucleo-premiacao.md`). Verificação visual real feita rodando o dev server e dirigindo o app com Playwright headless (Premiação → Consolidado PEV → Consulta, dados fluindo corretamente entre as três telas, sem erros de console).
- **Ao construir estas telas, quatro lacunas/bugs do adapter mock de F1 foram descobertos e corrigidos** (commits `fix(F1)` anteriores a este) — nenhum tinha sido pego pelos testes isolados de F1 porque não exercitavam os cenários reais das telas (Admin em "Todas as filiais", filtro vazio, etc.).

## Alterações não planejadas

### 2026-08-10 — Campo de Filial no cadastro de colaboradores

- **O que foi modificado:** o formulário de Cadastro de Colaboradores (`src/views/vendedores/CadastroColaboradores.tsx`, `F2.CAD-04`) ganhou um campo `<select>` de Filial, preenchido por padrão com a filial ativa da sessão (ou a primeira filial, quando o Admin está em "Todas as filiais"). O formulário deixou de ficar bloqueado com aviso quando o Admin está em "Todas as filiais" — agora ele fica disponível e cada colaborador é salvo com a filial escolhida no próprio formulário, não mais implícita pelo cabeçalho.
- **Motivo:** pedido do usuário — ao cadastrar um usuário, é preciso indicar explicitamente a qual filial ele está vinculado, inclusive quando o Admin está vendo todas as filiais ao mesmo tempo.
- **Impacto:** `salvarColaborador` passou a receber `filial: formulario.filial` em vez de `sessao.filialAtiva`; a listagem ganhou uma coluna Filial quando o Admin está em "Todas as filiais".

### 2026-08-10 — Modal para adicionar/editar colaborador

- **O que foi modificado:** o formulário inline de Cadastro de Colaboradores (linha de `<input>`s no topo da tabela) foi substituído por uma modal. Um botão "+ Adicionar colaborador" abre a modal em branco; o botão "Editar" de cada linha abre a mesma modal pré-preenchida; salvar ou fechar (X, Escape, clique fora) fecha a modal. Novo componente base `src/components/ui/Modal.tsx` (`createPortal`, `role="dialog"`, fecha em Escape/overlay/X), com testes próprios.
- **Motivo:** pedido do usuário — o formulário inline ocupava espaço permanente no topo da tela mesmo quando ninguém estava cadastrando; a modal deixa a tabela como foco principal da tela.
- **Impacto:** `CadastroColaboradores.tsx` ganhou `abrirParaAdicionar`/`abrirParaEditar`/`fecharModal` e estado `modalAberto`; os campos do formulário passaram de células de tabela para divs `.grade-formulario`/`.campo` dentro da modal; `src/components/ui/index.ts` passou a exportar `Modal`.

### 2026-08-10 — Coluna Filial na Planilha de Premiação e no Consolidado PEV

- **O que foi modificado:** a Planilha de Premiação (`src/views/premiacao/Premiacao.tsx`, F3.PREM-03) e o Consolidado PEV (`src/views/consolidadoPev/ConsolidadoPev.tsx`, F3.PEV-03) ganharam uma coluna Filial, visível apenas quando o Admin está em "Todas as filiais" (mesmo padrão já usado no Cadastro de Colaboradores). `LinhaConsolidadoPev` (`src/services/consolidadoPevService.ts`) ganhou o campo `filial`, populado em `src/adapters/mock/consolidadoPevService.mock.ts` a partir do colaborador de cada linha.
- **Motivo:** pedido do usuário — com o Admin vendo todas as filiais ao mesmo tempo nessas duas telas, era preciso identificar visualmente a qual filial cada linha pertence (a Planilha de Premiação já resolvia isso agrupando por `vendedor.filial` internamente, mas não expunha a coluna).
- **Impacto:** nenhuma mudança de contrato para os demais perfis (a coluna só aparece para o Admin em "Todas as filiais"); testes de `Premiacao.test.tsx` e `ConsolidadoPev.test.tsx` atualizados para cobrir a nova coluna.

## Correções em funcionalidades prontas

### 2026-08-10 — `consolidadoPevServiceMock` (adapter mock, F1)

- **Erro/incompatibilidade encontrada:** o protótipo usa `vendedoresParaTela('premiacoes')` para listar quem aparece no Consolidado PEV — ou seja, só colaboradores com `telas.premiacoes = true`, o mesmo filtro da Planilha de Premiação (faz sentido: o PEV vem de lá). O `consolidadoPevServiceMock` de F1 listava todos os colaboradores da filial, sem checar `telas.premiacoes`.
- **O que foi alterado para corrigir:** `listarConsolidadoPev` (`src/adapters/mock/consolidadoPevService.mock.ts`) passou a filtrar também por `c.telas.premiacoes`.

### 2026-08-10 — `premiacaoServiceMock` (adapter mock, F1)

- **Erro/incompatibilidade encontrada:** ao construir a tela de Planilha de Premiação (F3.PREM), o protótipo mostrou que, com o Admin em "Todas as filiais", a planilha lista **todos** os colaboradores de todas as filiais e cada lançamento salvo grava a filial real do colaborador (`v.filial`), não uma filial única passada por parâmetro. O `premiacaoServiceMock` de F1 só filtrava/gravava por igualdade exata de filial, sem tratar `FILIAL_TODAS` — não sustentava esse caso.
- **O que foi alterado para corrigir:** `listarPremiacoes`/`salvarPremiacoes` (`src/adapters/mock/premiacaoService.mock.ts`) passaram a tratar `FILIAL_TODAS` como "sem filtro de filial" na leitura, e a gravar cada registro com a filial do próprio colaborador (`vendedor.filial`) em vez da filial recebida por parâmetro — mesmo padrão que `colaboradoresServiceMock` já usava desde F1.

### 2026-08-10 — `gerarIntervaloMeses` (utils, F1)

- **Erro/incompatibilidade encontrada:** ao construir o Consolidado PEV (F3.PEV), o protótipo mostrou que `gerarIntervaloMeses(de, ate)` gera os meses **cronologicamente entre `de` e `ate`, sem depender do ciclo Dez-Nov** — o ciclo (`anoCiclo`) é só uma sugestão inicial para preencher os filtros, não uma restrição. A versão de F1 exigia um `anoCiclo` e recortava dentro de um único ciclo de 12 meses, então um intervalo que cruzasse dois ciclos (ou anos distantes) retornava vazio incorretamente.
- **O que foi alterado para corrigir:** `gerarIntervaloMeses` (`src/utils/periodo.ts`) mudou de assinatura — `gerarIntervaloMeses(de, ate)`, sem `anoCiclo` — e passou a caminhar mês a mês cronologicamente entre as duas datas, replicando a função do protótipo. Testes de `src/utils/periodo.test.ts` atualizados de acordo.

### 2026-08-10 — `ConsultaService`/`consultaServiceMock` (F1)

- **Erro/incompatibilidade encontrada:** ao construir a tela de Consulta por Período (F3.CONS), o protótipo mostrou que a base de dados é `premiacoesDaFilial()` (filtrada pela filial da sessão, todas quando Admin em "Todas as filiais") e que cada linha do cartão precisa da filial do lançamento para mostrar a coluna "Filial" quando Admin vê todas. A interface `ConsultaService.listarConsulta` de F1 não recebia filial nenhuma (misturava lançamentos de todas as filiais sempre) e `CartaoMesConsulta` não tinha o campo `filial` por linha.
- **O que foi alterado para corrigir:** `listarConsulta` (`src/services/consultaService.ts`) ganhou um parâmetro `filial` (primeiro argumento); `CartaoMesConsulta.linhas` ganhou o campo `filial`; `consultaServiceMock` (`src/adapters/mock/consultaService.mock.ts`) passou a filtrar por filial (ou não filtrar quando `FILIAL_TODAS`) e a preencher `filial` a partir do próprio lançamento de premiação.
- **Bug real encontrado no mesmo arquivo:** o filtro de período usava `p.mesReferencia >= filtro.de && p.mesReferencia <= filtro.ate` direto — com `de`/`ate` vazios (filtro "ver todos os meses", o padrão da tela), a comparação `mesReferencia <= ""` é **sempre falsa** para qualquer mês real, então a tela sempre aparecia vazia por padrão. Só apareceu ao escrever os testes de F3.CONS com dados reais (F1 nunca testou o caso de filtro vazio). Corrigido para `(!filtro.de || ...) && (!filtro.ate || ...)`, tratando string vazia como "sem limite".

### 2026-08-10 — Cargo do seed não batia com as opções do formulário (`seed.ts`, F1)

- **Erro/incompatibilidade encontrada:** 4 dos 6 colaboradores seed tinham `cargo: "Vendedor"`, um valor que não existe em `CARGOS_COLABORADOR` (as opções do `<select>` de Função no cadastro). Isso fazia o campo Função exibir silenciosamente a primeira opção da lista em vez do cargo real, com risco de sobrescrever o cargo verdadeiro ao salvar sem querer, caso o usuário não tocasse nesse campo. Encontrado na verificação visual da modal de cadastro (F2.CAD) com Playwright, não pelos testes unitários (que não comparam contra a lista real de opções).
- **O que foi alterado para corrigir:** `src/adapters/mock/seed.ts` — `cargo: "Vendedor"` trocado por `cargo: "Consultor de Vendas Interno"` (um valor válido de `CARGOS_COLABORADOR`) nos 4 colaboradores afetados.

### 2026-08-11 — `comissaoServiceMock` (adapter mock, F1)

- **Erro/incompatibilidade encontrada:** ao construir a tela de Comissão (F4.COM), o mesmo padrão de bug já visto em F3 apareceu de novo: `buscar()` filtrava por igualdade exata de filial (`c.filial === filial`), então o Admin em "Todas as filiais" via a tela sempre vazia; e `salvarComissao` gravava a `filial` recebida por parâmetro em vez da filial real do colaborador, o que salvaria registros com `filial: "TODAS"` (um valor inválido) se o Admin estivesse vendo todas as filiais ao editar.
- **O que foi alterado para corrigir:** `buscar` (`src/adapters/mock/comissaoService.mock.ts`) passou a tratar `FILIAL_TODAS` como "sem filtro de filial"; `salvarComissao` passou a gravar `colaborador?.filial ?? existente?.filial ?? filial` em vez da filial recebida por parâmetro — mesmo padrão já usado em `premiacaoServiceMock` e `colaboradoresServiceMock`.
