# Testes — F1: Camada de dados (contrato + mock)

Data: 2026-08-10

## Escopo testado

F1 entregou: tipos/shapes de todas as entidades da Seção 5 do documento técnico (`src/types`), as interfaces de Serviço por domínio (`src/services`), o adapter mock completo persistindo em `localStorage` com dados seed (`src/adapters/mock`, 6 colaboradores reais do documento técnico), o wrapper HTTP genérico preparado e ainda não usado (`src/adapters/http/httpClient.ts`), o formato de retorno padronizado `Resultado<T>` e os utilitários compartilhados (formatação de moeda/mês, máscara de CPF, ciclo PEV, `mostrarToast`, helpers de filial).

Os testes cobrem: os utilitários puros, as funções de cálculo que vivem junto das interfaces de serviço (soma de categorias, base de cálculo PEV, PEV snapshot), e os fluxos principais do adapter mock contra `localStorage` (auth, colaboradores, premiação, comissão, bloqueio).

## Casos de teste

**Utilitários (`src/utils`)**
- [x] `formatarMoeda` formata em BRL com duas casas decimais, inclusive zero
- [x] `formatarMesReferencia` converte `"YYYY-MM"` para mês por extenso
- [x] `mascararCpf` aplica a máscara `000.000.000-00`, ignora não-dígitos e não quebra com entrada parcial
- [x] `obterAnoCicloAtual` usa o ano corrente (jan–nov) e o ano seguinte em dezembro
- [x] `obterMesesCicloPEV` gera as 12 chaves do ciclo (dez do ano anterior → nov do ano do ciclo)
- [x] `gerarIntervaloMeses` recorta `[de, ate]` inclusive, cobre a virada de ano, e retorna vazio para intervalo invertido ou fora do ciclo

**Funções de cálculo dos serviços**
- [x] `somarCategoriasPremiacao` soma as 5 categorias (Total, Seção 3.2)
- [x] `calcularBaseCalculoPev` = Total Acumulado × 0,28 (Seção 3.3)
- [x] `calcularPremiacaoAdicionalReceber` = Base − Adiantamento (inclusive quando fica negativo)
- [x] `obterPevDaPremiacao` retorna o PEV do vendedor ou 0 se não houver lançamento no mês
- [x] `chaveBloqueio` monta `"tela::filial::mesReferencia"`
- [x] `usuarioEstaBloqueadoNaTela`: Admin nunca bloqueado; bloqueia só o papel editor daquela tela

**Adapter mock (`src/adapters/mock`, contra `localStorage`)**
- [x] `authServiceMock.login`: Admin (filial `TODAS`), Gerente (filial `100`), vendedor seed (`carlos.silva`/`venda123`), e erro para credenciais inválidas
- [x] `colaboradoresServiceMock`: lista os 6 seed, filtra por filial, salva um novo gerando id, remove por id
- [x] `premiacaoServiceMock`: calcula e persiste o `total`, atualiza (não duplica) ao salvar de novo o mesmo vendedor/mês, não mistura meses diferentes
- [x] `comissaoServiceMock`: grava o PEV da Premiação como snapshot ao salvar, e esse snapshot **não** muda se a Premiação for alterada depois (Seção 3.5)
- [x] `bloqueioServiceMock`: não bloqueado por padrão, `alternarBloqueio` liga/desliga, e o bloqueio é isolado por `tela::filial::mês`

## Resultado da execução

- Comando: `npx vitest run`
- Total: **68 testes, 68 passaram**, 0 falharam (17 arquivos de teste — 7 de F0 + 10 novos de F1)
- `npx tsc -b --noEmit`, `npm run build` e `npx oxlint` executados sem erros após a implementação.
- Um ajuste de sintaxe foi necessário durante a implementação (parameter properties do TypeScript não são permitidas com `erasableSyntaxOnly` no `httpClient.ts`) — corrigido na hora, sem impacto em código já commitado; não gerou entrada em `Claude/eventos-roadmap.md` por não se tratar de correção em funcionalidade já pronta.
