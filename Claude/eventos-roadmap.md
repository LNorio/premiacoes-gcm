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

### 2026-08-11 — F4: Comissão e Descontos

- Comissão (`src/views/comissao/Comissao.tsx`): grade Código/Colaborador/CPF/Função/[PEV]/Comissão/Garantido, sem coluna Total; PEV somente leitura (lido da Planilha de Premiação, gravado como snapshot ao salvar) e visível só para o Admin; bloqueio (editor Gerente); filtro de mês; exportação Excel.
- Descontos e Bonificações (`src/views/descontos/Descontos.tsx`): grade agrupada por colaborador com múltiplos lançamentos no mesmo mês, Tipo (lista fixa de 10 opções)/Valor/Observações por lançamento, Total por colaborador na primeira linha do grupo + rodapé geral, adicionar/remover lançamento, bloqueio (editor Coordenador), exportação Excel.
- Utilitário de exportação Excel (`baixarExcel` em `src/utils/exportar.ts`) carregando o SheetJS por CDN sob demanda (mesmo padrão do protótipo, Seção 1), com cache de carregamento que se limpa sozinho se o script falhar, para permitir nova tentativa depois. `exportarComissoesExcel` (`src/services/comissaoService.ts`) e `exportarDescontosExcel` (`src/services/descontosService.ts`) seguem exatamente as colunas da Seção 4 do documento técnico.
- As duas telas ligadas ao Shell, substituindo o placeholder `EmConstrucao`.
- 142 testes unitários no total (107 de F0+F1+F2+F3 + 35 novos), todos passando (`Claude/testes/f4-comissao-descontos.md`). Verificação visual real feita rodando o dev server e dirigindo o app com Playwright headless.
- **Ao construir a tela de Comissão, uma lacuna do adapter mock de F1 foi descoberta e corrigida** (ver seção "Correções em funcionalidades prontas" abaixo) — mesmo padrão dos bugs de `FILIAL_TODAS` já encontrados em F3.

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

### 2026-08-11 — Colaboradores consumindo a API real (F8.CAD, adiantado)

- **O que foi modificado:** `colaboradoresServiceHttp` (`src/adapters/http/colaboradoresService.http.ts`) implementado contra `GET/POST/PUT/DELETE /api/usuarios` (`Claude/API.md`) e ligado como `colaboradoresService` fora dos testes (`src/adapters/index.ts`); `CadastroColaboradores.tsx` ajustada para não exigir senha ao **editar** (só ao criar) — a API nunca devolve a senha existente (campo write-only), então o formulário agora mostra o campo em branco na edição e só reenvia `senha` se o usuário digitar uma nova.
- **Motivo:** pedido do usuário, seguindo a mesma trilha adiantada de F7/F8 já usada para o login (F7-01).
- **Riscos e limitações conhecidas, investigados ao vivo contra a API antes de implementar:**
  1. **IDs numéricos de `telas` não documentados.** `POST /api/usuarios` só aceita `telas` como array de IDs numéricos (`colaborador_has_telas.telas_id` é `bigint` — confirmado por um erro real de banco ao tentar enviar strings). Não há endpoint para consultar o mapeamento id → tela. **A pedido do usuário, o código assume a mesma ordem já usada internamente** (`premiacoes=1, comissao=2, planoSaude=3, estoque=4, descontos=5`, ver `ID_TELA` em `colaboradoresService.http.ts`) — **isso pode estar errado** e gravar um colaborador na tela errada silenciosamente até ser confirmado com quem mantém o backend.
  2. **A criação (`POST`) não retorna o registro criado.** Sem `id`, o adapter faz um segundo `GET /api/usuarios?filial=...` e casa pelo campo `usuario` (único) para descobrir o id real — funciona, mas custa uma requisição extra a cada cadastro.
  3. **`POST`/`PUT` sem transação no backend.** Ao testar um `telas` inválido, o colaborador foi gravado mesmo assim e só a associação de telas falhou, deixando um registro incompleto (limpo manualmente via `DELETE` durante a investigação). Se o mapeamento de IDs do item 1 estiver errado, o mesmo pode acontecer em uso real.
  4. **`GET /api/usuarios` devolve todos os papéis (admin/gerente/coordenador/vendedor) juntos**, sem paginação. Inicialmente o adapter filtrava `role === "vendedor"` no cliente; em 2026-08-11 esse filtro foi removido a pedido do usuário (ver campo Perfil abaixo) e a tela passou a gerenciar os 4 papéis.
  5. **Dados de teste órfãos na API real:** durante a investigação de `GET /api/premiacoes` (ver item de Premiação abaixo), foram criados lançamentos reais de agosto/2026 para os colaboradores 4 (Carlos) e 5 (Fernanda) que não puderam ser removidos — a API não tem `DELETE` de premiações.
- **Premiação (F8.PREM) não foi implementada nesta rodada:** `GET /api/premiacoes` não devolve nenhum id de colaborador na resposta (só `"nome colaborador"`) e agrega os valores pelo período pedido, em vez de expor um registro por colaborador/mês pronto para editar. A pedido do usuário, a Planilha de Premiação continua no mock até isso ser resolvido com quem mantém a API (idealmente expondo `id colaborador`/`mes de referencia` por linha). **Atualização em 2026-08-11:** implementada mesmo assim (ver evento abaixo) fazendo uma requisição por colaborador em vez de esperar a correção da API.

### 2026-08-11 — Campo de Perfil no Cadastro de Colaboradores

- **O que foi modificado:** o formulário de Cadastro de Colaboradores ganhou um campo "Perfil" (`<select>` com as opções Vendedor, Coordenador, Gerente, Administrador, nessa ordem — `PAPEIS_COLABORADOR`/`ROTULOS_PAPEL` em `src/utils/constantes.ts`), com "Vendedor" como padrão para novos cadastros. `Colaborador` (`src/types/colaborador.ts`) ganhou o campo `role: Papel`, reaproveitando o tipo já usado em `Sessao`. A listagem ganhou a coluna "Perfil". Como consequência direta, o filtro que escondia colaboradores com papel diferente de vendedor em `colaboradoresServiceHttp.listarColaboradores` (registrado no evento anterior) foi removido — a tela agora exibe e gerencia os 4 perfis.
- **Motivo:** pedido do usuário.
- **Impacto:** os 6 colaboradores seed do mock (`src/adapters/mock/seed.ts`) ganharam `role: "vendedor"`; `colaboradoresServiceHttp.salvarColaborador` passou a enviar `role: colaborador.role` para a API em vez do valor fixo `"vendedor"` usado antes. `authServiceMock` (login sob os testes) não foi alterado — continua resolvendo Admin/Gerente/Coordenador só via `CREDENCIAIS_GESTAO`, então um colaborador criado com Perfil "Administrador" pelo mock não ganha automaticamente as permissões de admin no login mockado (login via API real, fora dos testes, não tem essa limitação).

### 2026-08-11 — Planilha de Premiação e Consolidado PEV consumindo a API real (F8.PREM/F8.PEV, adiantado)

- **O que foi modificado:** `premiacaoServiceHttp` (`src/adapters/http/premiacaoService.http.ts`) e `consolidadoPevServiceHttp` (`src/adapters/http/consolidadoPevService.http.ts`) implementados e ligados fora dos testes, consumindo `GET/PUT /api/premiacoes` e `GET /api/consolidado` / `PUT /api/consolidado/adiantamento` (`Claude/API.md`).
- **Motivo:** pedido do usuário, motivado pela atualização do `Claude/API.md` (novo `POST /api/logout`, filtro `filial` em mais endpoints, papéis de acesso com autorização real). Confirmado ao vivo que nada mudou na resposta de `GET /api/premiacoes` que resolvesse a lacuna registrada no evento anterior — a decisão de implementar mesmo assim foi do usuário.
- **Consolidado PEV — solução limpa, a API tem `id` por linha:** diferente de Premiações, `GET /api/consolidado` devolve `"id"` (id do colaborador) em cada linha, então dá para casar com segurança sem depender de nome. A API não devolve a filial nem `telas.premiacoes` de cada colaborador nessa resposta — o adapter busca `/api/usuarios` em paralelo e cruza pelo id para preencher isso e para decidir quem aparece na tela (só quem tem `telas.premiacoes = true`). Os nomes de mês vêm em português fixos no ciclo Dez→Nov (`"valor dezembro"` … `"valor novembro"`); o adapter mapeia cada um para a chave `"YYYY-MM"` correspondente do ciclo pedido — meses fora do ciclo do `ano` consultado voltam como 0 (a API só cobre um ciclo de 12 meses por vez, então um filtro De/Até que cruze dois ciclos não é totalmente coberto — caso raro, não tratado).
- **Premiação — sem solução limpa, replicado o workaround já desenhado:** como `GET /api/premiacoes` continua sem id nenhum na resposta (só `"nome colaborador"`), `premiacaoServiceHttp.listarPremiacoes` faz **uma requisição por colaborador** (`?id={id}&data_inicio=<mês>-01&data_fim=<último dia do mês>`) em vez de uma chamada só — já que o id pedido em cada requisição é conhecido de antemão, nunca depende de casar por nome. Também não existe id de registro de premiação nessa API; `Premiacao.id` é preenchido com uma chave sintética `"{vendedorId}-{mesReferencia}"`, só para uso interno (React key), sem round-trip ao servidor.
- **Impacto:** filial → filial única (não mais array) já era a suposição usada desde o F8.CAD, sem mudança necessária aqui. Nenhuma tela precisou mudar (interface de serviço idêntica à do mock).
- **Consulta por Período (F8.CONS) não foi implementada nesta rodada:** diferente da Planilha (um valor por colaborador já basta), a Consulta precisa de **um cartão por mês** — e `GET /api/premiacoes` só devolve o total somado do intervalo inteiro pedido, não quebrado por mês. A única forma de montar os cartões seria uma requisição por mês por colaborador, e o filtro padrão da tela é "ver todos os meses" (sem teto), o que poderia significar dezenas/centenas de chamadas por carregamento. Perguntado ao usuário como proceder (limitar o padrão a um intervalo, aceitar o volume de chamadas, ou pausar) — a decisão foi **pausar**; Consulta continua no mock até isso ser retomado.

### 2026-08-11 — Efeito de carregamento em botões e barra global durante chamadas à API

- **O que foi modificado:** `Button` (`src/components/ui/Button.tsx`) ganhou a prop `carregando`, que desabilita o botão, marca `aria-busy` e mostra um spinner (`.spinner-botao`, respeitando `prefers-reduced-motion` via a regra global já existente). Ligado nos botões de ação que disparam chamadas à API em cada tela: Login ("Entrar"), Cadastro de Colaboradores ("Cadastrar"/"Salvar alterações" e "Remover" por linha), Planilha de Premiação ("Salvar planilha do mês" e bloquear/desbloquear), Comissão (idem), Descontos ("Salvar lançamento do mês", "Remover" por linha e bloquear/desbloquear) e Consolidado PEV ("Salvar adiantamentos de férias"). Além disso, `HttpClient.requisitar` (`src/adapters/http/httpClient.ts`) agora incrementa/decrementa um contador global (`src/utils/cargaHttp.ts`, mesmo padrão `useSyncExternalStore` já usado em `utils/toast.ts`) em volta de cada chamada; uma barra fina fixa no topo da tela (`src/components/BarraCarregamentoGlobal.tsx`, montada em `App.tsx`) aparece enquanto essa contagem for maior que zero — cobre login e Shell, já que fica fora do `if (sessao)`.
- **Motivo:** pedido do usuário — com a API real em uso desde F7/F8, a latência de rede (chegou a ~18s numa resposta de erro observada durante os testes de Colaboradores) tornava chamadas sem nenhum indicador visual de progresso.
- **Impacto:** só afeta os adapters HTTP (o mock não passa pelo `HttpClient`, então não aciona a barra global — coerente, já que o mock não tem latência real para comunicar). Nenhuma mudança de contrato nas interfaces de serviço.

### 2026-08-11 — Consulta por Período consumindo a API real (F8.CONS, adiantado — blocker anterior resolvido)

- **O que foi modificado:** `consultaServiceHttp` (novo arquivo `src/adapters/http/consultaService.http.ts`) implementado e ligado fora dos testes (`src/adapters/index.ts`), consumindo `GET /api/premiacoes` (mesmo endpoint de F8.PREM). Extraído um módulo compartilhado `src/adapters/http/respostaPremiacoesAgrupadas.ts` (tipos da resposta + `buscarPremiacoesAgrupadas(colaboradorId, filial, dataInicio?, dataFim?)`), usado tanto por `premiacaoServiceHttp` quanto por `consultaServiceHttp`, já que ambos fazem a mesma requisição por colaborador (`?id=`) e parseiam a mesma resposta.
- **Motivo:** pedido do usuário (`Claude/API (3).md`) — "verifique a nova versão da API e corriga as chamadas aos endpoints necessários". A atualização da API mudou `GET /api/premiacoes` para agrupar a resposta por mês (`"meses": [...]` em vez de `"dados": [...]` plano), confirmado ao vivo contra o backend real. Isso **resolve diretamente o motivo pelo qual F8.CONS tinha sido pausada** (ver evento anterior "Planilha de Premiação e Consolidado PEV..."): antes, uma única chamada por colaborador só devolvia o total somado do período inteiro, sem quebra por mês, o que exigiria uma requisição por mês por colaborador para montar os cartões da Consulta. Com a resposta já vindo quebrada em `meses`, uma única requisição por colaborador (mesmo padrão de F8.PREM) basta — o volume de chamadas volta a ser O(N colaboradores), não O(N×M meses).
- **Impacto:** nenhuma mudança de contrato (`ConsultaService.listarConsulta` idêntica à do mock). `listarConsulta` busca `colaboradoresServiceHttp.listarColaboradores(filial)`, restringe a um único `vendedorId` quando `escopo` é informado (perfil vendedor), faz uma requisição por colaborador via `buscarPremiacoesAgrupadas` e agrupa os resultados num `Map` por `mesReferencia`, ordenado cronologicamente. Como a API ainda não devolve id de colaborador por linha (só nome + filial), o casamento continua sempre por `?id=` conhecido, nunca por nome — mesma cautela já registrada em F8.PREM. `ultimoDiaDoMes` foi extraído de `premiacaoService.http.ts` para `src/utils/periodo.ts` (compartilhado entre os dois adapters).

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

### 2026-08-11 — Caixas de entrada da tela de Descontos sem o estilo/tamanho da planilha (`Descontos.tsx`, F4)

- **Erro/incompatibilidade encontrada:** o protótipo usa `class="tabela tabela-planilha"` na tabela de Descontos (mesma classe da Planilha de Premiação e da Comissão), mas `Descontos.tsx` foi implementada com `<Table>` sem a prop `planilha`. Sem a classe `tabela-planilha`, os campos de Tipo/Valor/Observações ficavam sem o `width: 100%`/`min-width` que a limita ao tamanho da coluna — o `<select>` de Tipo, em especial, se auto-dimensionava pela opção mais longa ("Desconto autorizado (descrever em observações)"), alargando a tabela além da largura da tela e escondendo os botões "+ Adicionar"/"Remover" atrás de rolagem horizontal. Confirmado inspecionando a página ao vivo com Playwright: a tabela ficava 152px mais larga que o contêiner antes da correção.
- **O que foi alterado para corrigir:** `src/views/descontos/Descontos.tsx` — `<Table>` trocado por `<Table planilha>`, alinhando com o protótipo e com o mesmo padrão visual já usado em Comissão/Premiação.

### 2026-08-11 — Cadastro de Colaboradores não exigia e-mail (`CadastroColaboradores.tsx`, F8.CAD)

- **Erro/incompatibilidade encontrada:** `POST /api/usuarios` exige `email` (`Claude/API.md`: "obrigatório, único"), mas o campo E-mail do formulário nunca foi `required` — comportamento herdado de quando só o mock existia (que não valida e-mail). Confirmado ao vivo contra a API real, testando o campo de Perfil: cadastrar um colaborador sem e-mail voltou `400 {"mensagem":"erro ao cadastrar The email field is required."}` depois de ~18s (a resposta de erro do backend para esse endpoint está bem mais lenta que as demais chamadas testadas até aqui), com o toast de erro correto, mas a modal ficando aberta sem indicação prévia do motivo.
- **O que foi alterado para corrigir:** `CadastroColaboradores.tsx` — campo E-mail ganhou `required`; a validação em `tratarSubmit` passou a exigir e-mail preenchido junto com código/nome/CPF, evitando a viagem de ida e volta até a API para descobrir o problema.

### 2026-08-11 — Editar Admin/Gerente/Coordenador travava no campo Código (`CadastroColaboradores.tsx`, F8.CAD)

- **Erro/incompatibilidade encontrada:** desde que o filtro de perfil foi removido (evento "Campo de Perfil no Cadastro de Colaboradores"), a tela passou a listar/editar Admin/Gerente/Coordenador — mas esses colaboradores vêm com `"codigo": null` da API real (só vendedores têm código tipo `V001`). O campo Código do formulário era `required`, então abrir "Editar" num desses colaboradores pré-preenchia o campo vazio e o navegador bloqueava o `submit` silenciosamente com a validação nativa (nenhum toast, nenhuma chamada à API) — encontrado testando o efeito de carregamento ao vivo: o botão "Salvar alterações" nunca ficava com `aria-busy`. Isso sempre foi uma inconsistência com a API (`Claude/API.md`: `"codigo": "string, opcional, único"`), só nunca tinha aparecido porque até então a tela só mostrava vendedores (que sempre têm código).
- **O que foi alterado para corrigir:** `CadastroColaboradores.tsx` — `required` removido do campo Código; `tratarSubmit` não exige mais código (só nome, CPF e e-mail), alinhando com o que a API sempre aceitou.

### 2026-08-11 — `premiacaoServiceHttp` quebrado pela nova resposta agrupada por mês da API (F8.PREM)

- **Erro/incompatibilidade encontrada:** a versão anterior de `GET /api/premiacoes` (`Claude/API (2).md`) devolvia um array plano `"dados"` com o total do período inteiro pedido. A versão atual (`Claude/API (3).md`), confirmada ao vivo contra o backend real, passou a agrupar a resposta por mês em `"meses": [{ "mes de referencia", dados: [...], totais: {...} }]`, ordenado do mês mais recente para o mais antigo. `premiacaoServiceHttp.listarPremiacoes` (que lia `resposta.dados[0]` direto) teria passado a devolver sempre valores zerados/`undefined` para todo mundo, já que esse campo não existe mais na resposta.
- **O que foi alterado para corrigir:** `src/adapters/http/premiacaoService.http.ts` reescrito para ler `resposta.meses[0]?.dados[0]` em vez de `resposta.dados[0]` (como cada requisição já é filtrada por `data_inicio`/`data_fim` de um único mês, `meses` tem no máximo uma entrada). A leitura da resposta foi extraída para o módulo compartilhado `src/adapters/http/respostaPremiacoesAgrupadas.ts` (ver evento "Consulta por Período consumindo a API real" acima), usado também por `consultaServiceHttp`. `src/adapters/http/premiacaoService.http.test.ts` foi atualizado para mockar o novo formato agrupado.
