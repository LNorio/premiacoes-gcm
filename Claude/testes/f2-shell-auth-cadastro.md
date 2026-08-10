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
