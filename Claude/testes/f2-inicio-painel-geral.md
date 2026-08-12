# Testes — F2.INICIO: Início (Painel Geral)

Data: 2026-08-12

## Escopo testado

Conteúdo real da tela Início (`src/views/inicio/Inicio.tsx`), até então um placeholder mínimo — cartões de estatísticas e ações rápidas, conforme o protótipo (`view-inicio`/`inicio-gestor`/`inicio-vendedor`), reaproveitando `colaboradoresService`/`premiacaoService` já existentes (sem serviço próprio). Por decisão do usuário, os cartões de premiação usam o total do **mês atual** (`obterMesAtualISO`), não o histórico completo do protótipo original — ver `Claude/eventos-roadmap.md`.

Painel do gestor (Admin/Gerente/Coordenador): cartões Filial, Colaboradores cadastrados, Premiações lançadas (mês atual), Total a pagar (mês atual, destaque); ações rápidas "+ Cadastrar vendedor" (sempre) e "+ Preencher planilha do mês" (só se o papel acessa a tela `premiacao`, via `NAV_POR_PAPEL`).

Painel do vendedor: cartões Minha filial, Minha função, Premiações recebidas (mês atual), Total a receber (mês atual, destaque); ação rápida "Ver minhas premiações por mês".

Navegação: `Shell.tsx` passa `aoNavegar={setViewAtiva}` para `Inicio`, que os botões de ação rápida chamam para trocar de aba.

## Casos de teste

- [x] Painel do gestor mostra Filial, total de colaboradores da filial, quantidade de premiações lançadas no mês (só contando lançamentos com valor > 0, não colaboradores zerados) e o total a pagar do mês — resultado esperado: valores batem com os dados salvos via `premiacaoServiceMock`.
- [x] Admin em "Todas as filiais" mostra "Todas as filiais" no cartão Filial.
- [x] Botão "+ Cadastrar vendedor" chama `aoNavegar("vendedores")` (Admin).
- [x] Botão "+ Cadastrar vendedor" não aparece para Gerente nem Coordenador (só o Admin cadastra colaborador — corrigido em 2026-08-12, ver `Claude/eventos-roadmap.md`).
- [x] Botão "+ Preencher planilha do mês" chama `aoNavegar("premiacao")`.
- [x] Botão "+ Preencher planilha do mês" não aparece para quem não tem `premiacao` em `NAV_POR_PAPEL` (Coordenador).
- [x] Painel do vendedor mostra Minha filial, Minha função (cargo do colaborador), premiações recebidas e total a receber — só do próprio vendedor, mesmo com outro colaborador tendo lançamentos maiores no mesmo mês.
- [x] Botão "Ver minhas premiações por mês" chama `aoNavegar("consulta")`.
- [x] Vendedor não vê os cartões nem os botões do painel de gestor.
- [x] Shell: badge de filial no cabeçalho segue distinguível do cartão "Filial"/"Minha filial" da tela Início (ambos podem mostrar o mesmo texto, ex. "Filial 100" — teste ajustado para escopar a busca ao cabeçalho via `role="banner"`).

## Resultado da execução

- Comando: `npx vitest run src/views/inicio src/views/shell`
- Total: 14 testes (10 de `Inicio.test.tsx` + 4 de `Shell.test.tsx`), 14 passaram, 0 falharam.
- Suíte completa do projeto: `npx vitest run` — 202 testes, 202 passaram (mesma instabilidade de carga pré-existente e não relacionada em `CadastroColaboradores.test.tsx`, confirmada isolada/limpa; ver `Claude/eventos-roadmap.md` de sessões anteriores).
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
