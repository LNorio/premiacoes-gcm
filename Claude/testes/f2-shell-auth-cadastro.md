# Testes — F2: Shell, autenticação e cadastros

Data: 2026-08-10

## Escopo testado

F2 entregou o shell do app e a autenticação (`F2.SHELL-01..04`, `F2.AUTH-01/02`, `F2.UI-01`) e a tela de Cadastro de Colaboradores (`F2.CAD-01..04/06`), consumindo o `authServiceMock`/`colaboradoresServiceMock` de F1:

- `src/state/SessaoContext.tsx` — sessão (login/logout/erro/troca de filial).
- `src/views/auth/Login.tsx` — tela de login com campo flutuante e mostrar/ocultar senha.
- `src/views/shell/Shell.tsx` — cabeçalho fixo com ajuste de espaço, navegação por `NAV_POR_PAPEL`, seletor de filial (Admin) vs. badge fixo, guarda de rota.
- `src/views/vendedores/CadastroColaboradores.tsx` — formulário + tabela, visibilidade por perfil, validação, CRUD completo.
- `src/components/ui/Estado.tsx` (F2.UI-01) e `src/components/ToastHost.tsx`.

Os testes cobrem os fluxos de sessão, a montagem/guarda do shell por perfil, e o CRUD + regras de visibilidade do Cadastro de Colaboradores — replicando as regras exatas do documento técnico (Seção 3.1: exige código/nome/CPF, exige filial específica, só Admin cadastra/edita/remove).

## Casos de teste

**SessaoContext**
- [x] Começa sem sessão
- [x] `entrar` com credenciais válidas monta a sessão (role, filialAtiva)
- [x] `entrar` com credenciais inválidas seta erro e não monta sessão
- [x] `sair` limpa a sessão
- [x] `definirFilialAtiva` atualiza a filial da sessão

**Login**
- [x] Renderiza campos de usuário e senha (campo flutuante)
- [x] Senha começa oculta; botão alterna type e aria-label ("Mostrar senha" ↔ "Ocultar senha")
- [x] Mostra mensagem de erro para credenciais inválidas

**Shell**
- [x] Admin vê as 9 abas de `NAV_POR_PAPEL.admin`
- [x] Vendedor vê só Início e Consulta (guarda de rota por perfil)
- [x] Clicar numa aba de navegação troca a view exibida
- [x] Perfis não-admin veem badge de filial fixa, não o seletor

**CadastroColaboradores**
- [x] Gerente vê a listagem só da própria filial (sem colaboradores de outra filial)
- [x] Gerente (não-admin) não vê formulário nem coluna de Ações
- [x] Admin em "Todas as filiais" vê aviso e não vê o formulário
- [x] Telas habilitadas do colaborador aparecem como badges
- [x] Validação: código/nome/CPF obrigatórios — submit vazio não cria registro
- [x] Cadastra um novo colaborador e ele aparece na tabela, formulário limpa após salvar
- [x] Editar carrega os dados no formulário; Cancelar volta ao estado de novo cadastro
- [x] Remover tira o colaborador da lista
- [x] **(2026-08-18)** Editar/Remover/Resetar senha ficam atrás de um menu "⋮" (`MenuAcoes`) — ver "Atualização" ao final deste documento.

## Resultado da execução

- Comando: `npx vitest run`
- Total: **88 testes, 88 passaram**, 0 falharam (21 arquivos de teste — 17 de F0+F1 + 4 novos de F2)
- `npx tsc -b --noEmit`, `npm run build` e `npx oxlint` executados sem erros.
- **Verificação visual real** (não só testes automatizados): rodei `npm run dev` e dirigi o app com Playwright headless — login → shell (admin) → navegação até Cadastro de Colaboradores com os 6 colaboradores seed reais → logout. Zero erros de console em todo o fluxo. Screenshots confirmaram o design system (cores, cartões, tabela, badges) renderizando conforme `Claude/DESIGN.md`.

## Ajustes feitos durante a implementação (não são bugs em código já pronto — corrigidos antes de considerar a tarefa concluída)

- `Shell.tsx` chamava `useEffect`/`useLayoutEffect` depois de um `return null` condicional — violação de "rules of hooks"; reordenado para os hooks rodarem sempre antes do guard de sessão nula.
- jsdom (ambiente de teste) não implementa `ResizeObserver`, usado no ajuste de espaço do cabeçalho fixo — adicionado um stub mínimo em `src/setupTests.ts` só para o ambiente de teste.
- Durante a checagem visual, o Chromium headless mostrou a animação de entrada (`surgir`) extremamente lenta/travada em opacidade — é *throttling* de animação do próprio Chromium headless para páginas em segundo plano, não um bug do app; confirmado emulando `prefers-reduced-motion: reduce` (a mesma regra de acessibilidade que o app já respeita), que renderizou tudo corretamente.

## Pendência sinalizada ao usuário (fora do escopo de F2)

O conteúdo real do Painel Geral (cartões com estatísticas, como no protótipo) não tem subtarefa própria no `ROADMAP.md`. `Inicio.tsx` ficou como placeholder mínimo (só cabeçalho) até isso ser agendado explicitamente.

## Atualização — 2026-08-18 (F2.CAD-04: menu "⋮" substitui os botões Editar/Remover, + Resetar senha novo)

- Pedido do usuário, fora do escopo original do `ROADMAP.md` — os botões "Editar"/"Remover" da coluna de Ações viraram um ícone de três pontos verticais que abre um menu com três ações: Editar, **Resetar senha** (nova — grava a senha do colaborador como o próprio CPF, o que já força `"precisa trocar senha": true` na API) e Remover. Componente novo e reutilizável `MenuAcoes` (`src/components/ui/`). Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/vendedores/CadastroColaboradores.test.tsx`
- Total: `CadastroColaboradores.test.tsx` — 16 testes (14 antes; os testes de Editar/Remover passaram a abrir o menu primeiro; 2 casos novos: "Resetar senha" grava `senhaAcesso` igual ao CPF, e o menu fecha com Escape/clique fora).
- Suíte completa do projeto: `npx vitest run` — 264 testes, 264 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Bug pego e corrigido durante a escrita dos testes (antes de qualquer commit):** o "clique fora" do `MenuAcoes` só reconhecia o botão "⋮" como parte do menu — clicar num item da lista (renderizada via portal, fora da árvore do botão) contava como clique "fora" e fechava o menu antes do `onClick` do item disparar, cancelando a ação escolhida. Corrigido adicionando a própria lista como uma segunda referência reconhecida.
- **Não verificado ao vivo contra o backend real nesta rodada:** a tentativa esbarrou num problema externo — o login do usuário `admin` no backend real passou a responder `404 {"mensagem":"usuario nao encontrado"}` no meio da sessão de verificação (confirmado via `curl`, sem passar pelo front-end), enquanto o login de `gerente` continuou funcionando normalmente. Não foi causado por nada desta sessão (nenhuma chamada de escrita chegou a ser feita contra o colaborador `admin` — a falha aconteceu antes de qualquer clique em "Resetar senha"/"Remover", só na etapa de login do próprio script de verificação). Recomenda-se ao usuário checar o cadastro do usuário `admin` no backend numa próxima sessão.

## Atualização — 2026-08-18 (F2.CAD-04: menu "⋮" ganha "Ativar"/"Inativar colaborador")

- Pedido do usuário — quarta ação no menu "⋮", alternando entre "Inativar colaborador" e "Ativar colaborador" conforme o status atual; nova coluna Status na tabela (selo Ativo/Inativo). Reaproveita `salvarColaborador` com o campo `desligado` (já documentado desde `Claude/API (8).md`, nunca modelado no front até agora). Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/vendedores/CadastroColaboradores.test.tsx src/adapters/http/colaboradoresService.http.test.ts`
- Total: `CadastroColaboradores.test.tsx` — 19 testes (16 antes; 3 casos novos: inativar grava `desligado: true` e troca o rótulo do menu; ativar de volta grava `false`; editar outros campos de um colaborador inativado não o reativa). `colaboradoresService.http.test.ts` — 8 testes (2 novos: mapeia `desligado` na leitura, envia `desligado: true` na escrita).
- Suíte completa do projeto: `npx vitest run` — 269 testes, 269 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Bug pego e corrigido antes de qualquer commit (não foi reportado pelo usuário, achado revisando o fluxo de Editar):** o formulário de Editar não tinha campo `desligado`, então salvar qualquer edição (nome, cargo etc.) de um colaborador já inativado reenviava `desligado: false` por padrão e reativava ele em silêncio. Corrigido preservando o `desligado` atual do colaborador (buscado na lista já carregada) ao montar o corpo do `PUT`, independente do que o formulário contém.
- **Não verificado ao vivo contra o backend real nesta rodada** — mesmo bloqueio externo já registrado na atualização anterior (login de `admin` retornando `404` no backend real).

## Atualização — 2026-08-18 (F2.AUTH-02: login redireciona pra troca de senha obrigatória)

- Pedido do usuário — sessão com `"precisa trocar senha": true` (acesso novo, ou senha resetada pelo Admin) cai numa tela só de troca de senha em vez do Shell; ao salvar, desloga e volta pro login. Alinhado antes de implementar: a API real não tem endpoint de autoatendimento (`PUT /api/usuarios/{id}` é só Admin) — implementado mesmo assim, com mensagem clara de 403 pros perfis que ainda não conseguem usar. Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/App.test.tsx src/views/auth src/adapters/http/authService.http.test.ts`
- Total: `authService.http.test.ts` — 8 testes (2 novos: mapeia `precisaTrocarSenha`; `trocarSenhaPropria` envia o corpo certo e trata 403 com mensagem própria). `TrocarSenhaObrigatoria.test.tsx` (novo) — 4 testes (aparece no lugar do Shell; valida senhas iguais; salva e volta pro login; mostrar/ocultar senha). `App.test.tsx` (novo) — 3 testes (sem sessão → Login; sessão normal → Shell; `precisaTrocarSenha` → tela de troca).
- Suíte completa do projeto: `npx vitest run` — 279 testes, 279 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Não verificado ao vivo contra o backend real nesta rodada — e um problema novo encontrado:** além do `admin` continuar com `404` (já registrado), o login de `gerente` (que funcionava até a atualização anterior desta mesma sessão) passou a responder `403 "colaborador desligado da empresa - acesso bloqueado"`. Nenhuma ação desta sessão alterou o cadastro de `gerente` — a funcionalidade de Ativar/Inativar da atualização anterior nunca foi clicada ao vivo. Recomenda-se ao usuário checar o estado das contas `admin`/`gerente` no backend real.

## Atualização — 2026-08-18 (F2.AUTH-02: `PUT /api/trocar-senha` substitui a chamada provisória, `Claude/API (10).md`)

- No mesmo dia, `Claude/API (10).md` trouxe `PUT /api/trocar-senha` — autoatendimento de verdade (exige a senha atual, qualquer papel), substituindo a chamada provisória (`PUT /api/usuarios/{id}`, só Admin) da atualização anterior. Tela ganhou um 3º campo (Senha atual); `Sessao.idColaborador` foi removido por não fazer mais falta (o novo endpoint identifica o colaborador pelo token, não por id). Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/adapters/http/authService.http.test.ts src/adapters/mock src/views/auth src/App.test.tsx`
- Total: `authService.http.test.ts` — 8 testes (fixtures de login sem `idColaborador`; `trocarSenhaPropria` reescrito pro novo endpoint/corpo, e o teste de erro passou a provar "senha atual incorreta" em vez de "sem permissão"). `TrocarSenhaObrigatoria.test.tsx` — 6 testes (5 antes; todos os que submetem o formulário passaram a preencher "Senha atual"; caso novo de rejeição por senha atual incorreta).
- Suíte completa do projeto: `npx vitest run` — 281 testes, 281 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- Verificado ao vivo (Playwright, servidor real, filial 100, só leitura — sem clicar em "Salvar senha", por não ter autorização de escrita nesta sessão): login de `admin` voltou a funcionar (diferente da rodada anterior); nenhum erro de console nas telas verificadas. A troca de senha em si não pôde ser testada ao vivo por depender de uma sessão com `"precisa trocar senha": true`, que não existe no momento nas contas disponíveis.

## Atualização — 2026-08-18 (F2.CAD-03: barra de busca em Cadastro de Colaboradores)

- Pedido do usuário — barra de busca acima da tabela (nome, código, CPF, e-mail ou usuário de acesso, sem diferenciar maiúscula/acento), filtro só no cliente, visível pra qualquer perfil. Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/vendedores/CadastroColaboradores.test.tsx`
- Total: `CadastroColaboradores.test.tsx` — 23 testes (19 antes; 4 casos novos: filtra por nome sem diferenciar maiúscula/acento; filtra por CPF/usuário de acesso; mensagem de vazio específica da busca, lista volta ao normal depois de limpar; Gerente não-admin também vê e usa a busca).
- Suíte completa do projeto: `npx vitest run` — 286 testes, 286 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- Verificado ao vivo (Playwright, servidor real, Admin, "Todas as filiais"): busca por "carlos" filtra pra só o colaborador certo; busca sem resultado mostra "Nenhum colaborador encontrado para '...'"; nenhum erro de console.
