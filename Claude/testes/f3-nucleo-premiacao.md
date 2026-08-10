# Testes — F3: Núcleo de Premiação

Data: 2026-08-10

## Escopo testado

F3 entregou as três telas do núcleo de premiação, todas consumindo os serviços/mock de F1 (com correções pontuais, ver seção própria abaixo):

- `src/views/premiacao/Premiacao.tsx` (F3.PREM) — planilha editável, totais/rodapé em tempo real, bloqueio, filtro de mês, exportação CSV.
- `src/views/consolidadoPev/ConsolidadoPev.tsx` (F3.PEV) — colunas dinâmicas por mês, adiantamento de férias, derivados (Base 28%, Adicional a Receber), filtros de ciclo/período, exportação CSV.
- `src/views/consulta/ConsultaPeriodo.tsx` (F3.CONS) — cartões por mês, escopo restrito para vendedor, filtro de período, exportação CSV.
- Utilitário `baixarCSV` (`src/utils/exportar.ts`) e `exportarPremiacoesCSV` (`src/services/premiacaoService.ts`), replicando exatamente o padrão de nome/separador/BOM da Seção 4 do documento técnico.

Todas as três telas foram ligadas ao `Shell` (substituindo o placeholder `EmConstrucao`).

## Casos de teste

**Premiacao (F3.PREM)**
- [x] Lista só os colaboradores habilitados para a tela (`telas.premiacoes`)
- [x] Calcula Total e Planilha Deivson ao digitar nas categorias
- [x] Salva a planilha e os valores persistem ao recarregar a tela
- [x] Admin numa filial específica vê o botão de bloqueio; em "Todas as filiais", não
- [x] Gerente não vê o botão de bloqueio
- [x] Bloqueado pelo Admin, os campos do Gerente ficam desabilitados

**ConsolidadoPev (F3.PEV)**
- [x] Lista os colaboradores habilitados e soma o PEV lançado no mês corrente
- [x] Admin edita e salva o adiantamento; Premiação Adicional a Receber recalcula em tempo real (sem re-render das linhas)
- [x] Gerente não edita o adiantamento (célula somente leitura)
- [x] Mostra erro quando "De" vem depois de "Até"

**ConsultaPeriodo (F3.CONS)**
- [x] Agrupa os lançamentos em um cartão por mês, mais recente primeiro
- [x] Mostra mensagem vazia quando não há premiações lançadas
- [x] Vendedor vê só os próprios lançamentos, com título "Minhas Premiações por Período"
- [x] Vendedor não vê o botão de exportar CSV
- [x] Admin em "Todas as filiais" vê a coluna Filial
- [x] Filtra por período e "Ver todos os meses" limpa o filtro

## Resultado da execução

- Comando: `npx vitest run`
- Total: **107 testes, 107 passaram**, 0 falharam (24 arquivos de teste — 21 de F0+F1+F2 + 3 novos de F3)
- `npx tsc -b --noEmit`, `npm run build` e `npx oxlint` executados sem erros.
- **Verificação visual real**: rodei `npm run dev` e dirigi o app com Playwright headless (com `prefers-reduced-motion: reduce` emulado) — login Admin → filial 100 → Planilha de Premiação (preencher PEV/Iconic de Carlos Silva, total recalculado ao vivo sem perder foco, salvar) → Consolidado PEV (mostra o PEV salvo no mês certo, base de cálculo 28% correta) → Consulta por Período (cartão do mês com os mesmos valores, subtotal correto). Zero erros de console em todo o fluxo.

## Bugs e gaps reais encontrados e corrigidos durante a implementação

Ao escrever os testes e a verificação visual desta fase, três lacunas do adapter mock de F1 e um bug real de lógica foram descobertos (todos registrados em `Claude/eventos-roadmap.md`, seção "Correções em funcionalidades prontas"):

1. `premiacaoServiceMock` não tratava `FILIAL_TODAS` (Admin vendo todas as filiais).
2. `gerarIntervaloMeses` estava presa ao ciclo Dez-Nov; o protótipo permite qualquer intervalo.
3. `consolidadoPevServiceMock` não filtrava por `telas.premiacoes`.
4. `ConsultaService`/`consultaServiceMock` não filtravam por filial e não tinham o campo `filial` por linha.
5. **Bug real**: o filtro de período de `consultaServiceMock` usava `mesReferencia <= filtro.ate` sem tratar `ate=""` como "sem limite" — a comparação lexicográfica com string vazia é sempre falsa, então a tela de Consulta aparecia **sempre vazia por padrão** (filtro "ver todos os meses", o estado inicial da tela). Só apareceu ao testar com dados reais; corrigido antes de reportar F3 como concluído.

Nenhum desses veio à tona nos testes de F1 porque F1 testou os serviços isoladamente com parâmetros "de manual", sem exercitar os casos de uso reais das telas (Todas as filiais, filtro vazio, etc.) — exatamente o tipo de lacuna que a skill `testes-marco` existe para pegar antes de avançar no roadmap.
