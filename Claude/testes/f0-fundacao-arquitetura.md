# Testes — F0: Fundação e arquitetura

Data: 2026-08-10

## Escopo testado

F0 entregou: convenção de pastas em camadas (`components/ui`, `services`, `adapters`, `types`, `utils`, `views`, `styles`), os design tokens extraídos do protótipo (`src/styles/tokens.css`), o documento de arquitetura (`Claude/ARQUITETURA.md`) e o catálogo de componentes visuais base (`src/components/ui`): `Button`, `Card`/`CardGrid`, `BadgeInfo`/`BadgeTela`/`Selo`, `FloatingField`, `Table`/`LinhaVazia`, `Toast`, `Header`, `Nav`.

Como F0 não tem regra de negócio (isso começa em F1/F2), os testes cobrem exclusivamente o comportamento estrutural desses componentes: classes CSS aplicadas por variant/estado, associação label↔input, propagação de eventos e renderização condicional.

## Casos de teste

**Button**
- [x] Aplica a classe do `variant` informado
- [x] Usa `primario` como variant padrão
- [x] Aplica `botao-largo` quando `largo=true`
- [x] Dispara `onClick`
- [x] Respeita o atributo `disabled`

**Card / CardGrid**
- [x] Renderiza título e conteúdo
- [x] Aplica `cartao-destaque` quando `destaque=true`
- [x] Não aplica `cartao-destaque` por padrão
- [x] `CardGrid` envolve os filhos em `.grade-cartoes`

**Badge (BadgeInfo, BadgeTela, Selo)**
- [x] `BadgeInfo` sem `badge-perfil` por padrão
- [x] `BadgeInfo` aplica `badge-perfil` quando `perfil=true`
- [x] `BadgeTela` renderiza com a classe `badge-tela`
- [x] `Selo` aplica a classe da variante (`sucesso`/`alerta`)

**FloatingField**
- [x] Associa `label` ao `input` via `htmlFor`/`id`
- [x] Não aplica `com-icone` sem ícone
- [x] Aplica `com-icone` e renderiza o ícone quando fornecido
- [x] Repassa eventos de mudança para o input

**Table**
- [x] Renderiza `<table>` dentro de `.tabela-wrapper`, sem `tabela-planilha` por padrão
- [x] Aplica `tabela-planilha` quando `planilha=true`
- [x] `LinhaVazia` renderiza a mensagem com o `colSpan` informado

**Toast**
- [x] Sem classe de variante para `info` (padrão)
- [x] Aplica `toast-sucesso`
- [x] Aplica `toast-erro`

**Nav**
- [x] Marca o item ativo com a classe `ativo` e `aria-current="page"`
- [x] Chama `onSelecionar` com a chave do item clicado
- [x] Renderiza um item por entrada da lista

## Resultado da execução

- Comando: `npx vitest run`
- Total: 27 testes, **27 passaram**, 0 falharam (7 arquivos de teste)
- `npm run build` (tsc + vite build) e `npm run lint` (oxlint) também executados sem erros após a adição dos testes.
- Nenhum bug encontrado nesta rodada — não houve necessidade de registrar correção em `Claude/eventos-roadmap.md`.
