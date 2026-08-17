# Testes — F5: Plano de Saúde

Data: 2026-08-12

## Escopo testado

Implementação completa do marco F5 — Plano de Saúde: `PlanoSaude.tsx` (contêiner com sub-abas), `CadastroTitulares.tsx` (F5.PS-CAD, titulares/dependentes/adesão) e `LancamentoPlanoSaude.tsx` (F5.PS-LAN, lançamento mensal Saúde/Odontológico). Também cobre o novo `case "plano-saude"` em `Shell.tsx`.

## Casos de teste

### CadastroTitulares (F5.PS-CAD)
- [x] Lista os titulares da filial (habilitados para `telas.planoSaude`), com adesão marcada por padrão (`undefined` tratado como aderido).
- [x] Admin desmarca a adesão de um titular e a mudança persiste (via `salvarAdesao`).
- [x] Coordenador vê as checkboxes desabilitadas (titular **e** dependente) e sem os botões de gerenciar dependente ("+ Dependente"/"Remover"). **(2026-08-14)**
- [x] Admin adiciona um dependente pela modal e ele aparece indentado, com checkbox própria de adesão marcada por padrão. **Alterado em 2026-08-14:** antes era só ✓/— como texto, espelhando sempre a adesão do titular — agora é checkbox própria, marcável/desmarcável.
- [x] Admin desmarca a adesão de um dependente, independente do titular (titular continua aderido). **(2026-08-14)**
- [x] Admin remove um dependente já cadastrado.
- [x] Admin em "Todas as filiais" vê a coluna Filial.

### LancamentoPlanoSaude (F5.PS-LAN)
- [x] Mostra o valor fixo padrão (R$ 185,27) na coluna Titular para a filial 100.
- [x] Usa o valor diferenciado (R$ 255,54) para as filiais 401/403.
- [x] Sub-aba Odontológico usa o valor fixo de R$ 13,56, sem campos editáveis nem botão de salvar (nada para lançar nesse plano).
- [x] Edita valor adicional/coparticipação (sub-aba Saúde), salva, e o total da linha reflete a soma em tempo real.
- [x] Admin numa filial específica vê o botão de bloqueio na sub-aba Saúde; em "Todas as filiais" ou na sub-aba Odontológico, não.
- [x] Admin em "Todas as filiais" vê a coluna Filial.
- [x] Dependente com adesão própria desmarcada não aparece na grade, mesmo com o titular aderido. **(2026-08-14)**
- [ ] Coluna `***` (`.celula-bloqueada`) na linha de dependente/titular — coberta indiretamente pelo snapshot de DOM durante o debug do bug do total por linha, mas sem asserção dedicada; considerar cobrir explicitamente se a tela for revisitada.

### CadastroPeriodoPlano (F5.PS-PER) — adicionado em 2026-08-14, reescrito cinco vezes no mesmo dia (fechamento de período → Titular/Dependente independentes → lista única + 2 campos → botão + modal → Data de Início retroativa)
- [x] Admin em "Todas as filiais" vê o pedido para selecionar uma filial específica (períodos são por filial, não fazem sentido em "Todas").
- [x] Admin numa filial específica vê Titular e Dependente juntos na mesma lista, com a coluna "Tipo de Pessoa" identificando cada linha (R$ 185,27 nos dois, situação "Vigente").
- [x] Usa o valor diferenciado semeado (R$ 255,54) para a filial 401, em Titular e Dependente.
- [x] Sub-aba Odontológico mostra o período semeado de R$ 13,56 para Titular e Dependente.
- [x] Botão "+ Novo período" abre uma modal com os 4 campos: Data de Início, Valor Titular, Valor Dependente, Data de Encerramento.
- [x] Rejeita cadastrar sem preencher nenhum dos dois campos de valor.
- [x] Rejeita cadastrar um novo período de Titular enquanto já existe um vigente, mesmo preenchendo só o campo de Titular (lista não muda).
- [x] Admin encerra o período vigente de Titular e cadastra um novo preenchendo só o campo de Titular, sem afetar o de Dependente.
- [x] Preenchendo Valor Titular e Valor Dependente ao mesmo tempo, cadastra um período pra cada (dois `POST` separados).
- [x] Preenchendo Data de Encerramento no cadastro, o período já é criado e encerrado nessa data (sem precisar clicar "Encerrar vigência" depois).
- [x] Data de Início pode ser retroativa e aparece na lista com a data escolhida (não mais "hoje" fixo).
- [x] Rejeita quando a Data de Encerramento é anterior à Data de Início.
- [x] Não existe botão de remover período — só "Encerrar vigência".

### PlanoSaude (sub-abas)
- [x] Começa na sub-aba "Titulares e Dependentes" e troca para "Lançamento" ao clicar, e volta.
- [x] Admin vê a sub-aba "Período do Plano" e consegue trocar para ela (adicionado em 2026-08-14).
- [x] Coordenador não vê a sub-aba "Período do Plano" — só o Admin gerencia períodos (adicionado em 2026-08-14).

### Shell
- [x] Aba "Plano de Saúde" já renderiza a tela real, não mais o placeholder `EmConstrucao`.

## Resultado da execução

- Comando: `npx vitest run src/views/planoSaude src/views/shell`
- Total: 19 testes novos (5 de `CadastroTitulares.test.tsx`, 7 de `LancamentoPlanoSaude.test.tsx`, 1 de `PlanoSaude.test.tsx`, 1 novo em `Shell.test.tsx`, + os já existentes de `Shell.test.tsx`), todos passando.
- Suíte completa do projeto: `npx vitest run` — 219 testes, 219 passaram, 0 falharam.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Bug real encontrado e corrigido antes de finalizar a tela:** o total por linha em `LancamentoPlanoSaude.tsx` usava o lançamento já salvo (`lancamentos.find(...)`, desatualizado) em vez do valor em edição (`valoresExtras`, estado local) — editar um campo mudava o rodapé (que já usava o estado certo) mas não o total daquela linha específica. Pego pelo teste "edita valor adicional/coparticipação, salva e o total da linha reflete a soma" antes de qualquer commit.
- **Achado à parte, sem relação com Plano de Saúde:** rodar a suíte completa revelou `Premiacao.test.tsx`/`Comissao.test.tsx` quebrados por um rótulo já renomeado pelo usuário diretamente no código ("PEV" → "PEV Atingida", "Comissão" → "Comissão (PEV Base)") — testes atualizados para os rótulos atuais; ver `Claude/eventos-roadmap.md`.

## Atualização — 2026-08-14 (F5.PS-PER: Período do Plano)

- Comando: `npx vitest run src/views/planoSaude src/adapters/mock`
- Total: 9 testes novos (7 de `CadastroPeriodoPlano.test.tsx`, 2 novos em `PlanoSaude.test.tsx`), todos passando; suíte de `planoSaude`/`adapters/mock` completa: 31 testes, 31 passaram.
- Suíte completa do projeto: `npx vitest run` — 231 testes, 227 passaram, 4 falharam — as 4 falhas são só do arquivo já conhecido como instável sob carga total (`CadastroColaboradores.test.tsx`, falha por timeout só quando a suíte inteira roda junto); rodado isolado (`npx vitest run src/views/vendedores/CadastroColaboradores.test.tsx`), 14/14 passaram — não é regressão, comportamento já documentado em sessões anteriores.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- Verificado ao vivo (Playwright, servidor real `localhost:5173`): sub-aba "Período do Plano" só aparece para Admin, exige filial específica selecionada, lista o período semeado (185,27/255,54 conforme filial), cadastro de novo período funciona e aparece na lista com toast de sucesso — sem erros de console. Não foi possível verificar visualmente o efeito do novo período na aba Lançamento com dados reais porque, neste ambiente, `colaboradoresService` consome a API HTTP real (`192.168.7.65:8000`, diferente de `planoSaudeService`, que é mock-only) e a chamada de colaboradores ficou sem responder durante o teste — o caminho período→lançamento em si é coberto pela suíte automatizada (`LancamentoPlanoSaude.test.tsx`, inalterada e passando, mais os novos testes de `CadastroPeriodoPlano.test.tsx`).

## Atualização — 2026-08-14 (F5.PS-PER reescrita para "fechamento de período" + F8.PS: Plano de Saúde consumindo a API real)

- Ainda no mesmo dia, sem nenhum commit do trabalho anterior, o usuário atualizou `Claude/API (4).md` com o módulo real `Valores de Plano de Saúde` e pediu pra consumir a API real de Plano de Saúde inteira — a 1ª versão do período (datas livres, valor separado de Titular/Dependente, mock-only) foi reescrita para bater com o modelo real (valor único, só um vigente por vez, `encerrar` em vez de `remover`) — ver `Claude/eventos-roadmap.md` pro detalhe completo.
- Comando: `npx vitest run src/views/planoSaude src/adapters/http/planoSaudeService.http.test.ts`
- Total: 7 testes de `CadastroPeriodoPlano.test.tsx` (reescritos), 2 de `PlanoSaude.test.tsx` (inalterados), 7 de `LancamentoPlanoSaude.test.tsx` (inalterados, continuam passando porque o período semeado mantém os mesmos valores) + 10 testes novos de `planoSaudeService.http.test.ts` (`listarDependentes`, `salvarDependente`, `removerDependente`, `salvarAdesao`, `listarLancamentosPlanoSaude`, `salvarLancamentoPlanoSaude`, `listarPeriodosPlanoSaude`, `salvarPeriodoPlanoSaude` × 2 casos, `encerrarPeriodoPlanoSaude`) — todos passando.
- Suíte completa do projeto: `npx vitest run` — 241 testes, 237 passaram, 4 falharam — de novo só o arquivo já conhecido como instável sob carga total (`CadastroColaboradores.test.tsx`); isolado, 14/14 passaram — não é regressão.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Shapes de resposta confirmados ao vivo contra o backend real antes de implementar** (leitura apenas — login como Admin, `GET /api/dependentes`, `GET /api/valores-plano-saude`, `GET /api/lancamentos`, via `curl`, sem nenhuma escrita):
  - `GET /api/valores-plano-saude` bate exatamente com o exemplo já documentado em `Claude/API (4).md`.
  - `GET /api/lancamentos` (sem exemplo na documentação) devolve `{"dados": [...], "total titular", "total dependente", "total adicional", "total coparticipacao", "total geral"}` — cada linha com `"tipo pessoa"`, `"id colaborador"`, `"id dependente"`, `"codigo"`, `"nome"`, `"valor titular"`, `"valor dependente"`, `"valor adicional"`, `"valor coparticipacao"`, `"total"` (já vem com o cálculo pronto, mas o adapter usa só os campos de id/extras — o valor de Titular/Dependente é recalculado na tela a partir do período, não do que a API devolve nessa listagem, pra ficar coerente com a exportação Excel e o rodapé).
  - `GET /api/dependentes` (sem exemplo na documentação) devolve array puro (igual `/api/valores-plano-saude`, não `{"dados": [...]}` como Lançamentos/Descontos); só foi possível confirmar o shape vazio (`[]`, não havia dependente cadastrado na filial testada) — os campos de cada item (`id`, `nome`, `cpf`, `"id colaborador"`) foram assumidos a partir do corpo do `POST`/`PUT`, não confirmados com um registro real.
  - **Escrita não testada ao vivo nesta rodada** (`POST`/`PUT .../encerrar` de Período, `PUT /api/lancamentos`, `POST`/`PUT`/`DELETE` de Dependentes, `PUT` de adesão) — por não ter autorização explícita pra alterar dados reais de configuração de filial nesta sessão; shape do corpo enviado segue exatamente o documentado em `Claude/API (4).md`. Recomendação: confirmar numa próxima sessão com autorização explícita para escrita de teste (seguindo o padrão já usado em Descontos: testar ao vivo e limpar os dados de teste ao final).
- Verificado ao vivo (Playwright, servidor real `localhost:5173`, só leitura): login, seleção da filial 100, sub-abas "Titulares e Dependentes" e "Lançamento" renderizam corretamente o estado vazio real (nenhum colaborador da filial 100 tem a tela `planoSaude` habilitada nos dados reais atuais — mensagem de vazio correta, não erro); sub-aba "Período do Plano" mostra o período vigente real da filial 100 (R$ 185,27, "01/01/2000", situação "Vigente", botão "Encerrar vigência", sem botão de remover) — bate exatamente com a resposta confirmada via `curl`. Nenhum erro de console em nenhuma das telas.

## Atualização — 2026-08-14 (F5.PS-PER: Titular e Dependente com valor/vigência independentes, `Claude/API (5).md`)

- Ainda no mesmo dia, sem commit do trabalho anterior, o usuário atualizou `Claude/API (5).md`: `valores_plano_saude` ganhou `"tipo pessoa"` — Titular e Dependente deixaram de compartilhar o mesmo `"valor"`/vigência do período e passaram a ter registros (e fechamento de período) independentes. Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/planoSaude src/adapters/http/planoSaudeService.http.test.ts src/adapters/mock`
- Total: 8 testes de `CadastroPeriodoPlano.test.tsx` (reescritos, +1 caso novo cobrindo a independência Titular/Dependente), demais testes de `planoSaude`/`adapters/mock`/`planoSaudeService.http.test.ts` (10 testes, ajustados pro campo `"tipo pessoa"`) inalterados na cobertura e passando — suíte de `planoSaude`+`adapters/http`+`adapters/mock` completa: 51 testes, 51 passaram.
- Suíte completa do projeto: `npx vitest run` — 242 testes, 242 passaram (dessa vez até o arquivo historicamente instável sob carga, `CadastroColaboradores.test.tsx`, passou limpo).
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Shape confirmado ao vivo contra o backend real antes de implementar** (leitura apenas, `GET /api/valores-plano-saude?filial=100` via `curl`): a filial 100 já tinha os 4 períodos vigentes (saúde/odontológico × titular/dependente) com o campo `"tipo pessoa"` presente, todos com o mesmo valor de antes (185,27/13,56) — confirma que a migração do backend preservou os dados existentes, só adicionando a granularidade nova.
- Verificado ao vivo (Playwright, servidor real `localhost:5173`, só leitura): sub-aba "Período do Plano" da filial 100, toggle Titular/Dependente troca a lista mostrada — cada um exibe seu próprio período vigente (R$ 185,27, "01/01/2000", "Vigente"), batendo exatamente com o `curl`. Nenhum erro de console. (Um cuidado do próprio script de verificação, não do app: `getByText` do Playwright é case-insensitive por padrão, então a primeira tentativa deu falso-positivo casando com a palavra "vigente" minúscula do texto de ajuda da tela, não com a célula da tabela — corrigido usando `getByRole("cell", { exact: true })`.)
- Escrita (`POST`/`PUT .../encerrar` com `"tipo pessoa"`) continua não testada ao vivo nesta rodada, pelo mesmo motivo da atualização anterior.

## Atualização — 2026-08-14 (F5.PS-PER: sub-abas Titular/Dependente viram lista única + 2 campos de valor)

- Ainda no mesmo dia, sem commit do trabalho anterior, o usuário pediu pra não separar Titular/Dependente em sub-abas — lista única com coluna "Tipo de Pessoa" e formulário com dois campos de valor (Titular/Dependente), preenchendo um ou os dois. Só mudou a tela (`CadastroPeriodoPlano.tsx`); nada mudou em `PlanoSaudeService`/mock/HTTP. Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/planoSaude/CadastroPeriodoPlano.test.tsx`
- Total: `CadastroPeriodoPlano.test.tsx` reescrito — 9 testes, todos passando: lista combinada com a coluna nova; valor diferenciado (401) e odontológico (13,56) em Titular e Dependente juntos; rejeita cadastro sem preencher nenhum campo; rejeita cadastro de Titular com vigente duplicado mesmo preenchendo só esse campo; encerra Titular e recadastra sem afetar Dependente; preenchendo os dois campos ao mesmo tempo cria dois períodos (um `POST` por tipo de pessoa); sem botão de remover.
- Suíte completa do projeto: `npx vitest run` — 243 testes, 239 passaram, 4 falharam — de novo só o arquivo já conhecido como instável sob carga total (`CadastroColaboradores.test.tsx`); não é regressão.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Bug de teste encontrado e corrigido durante a reescrita (não é bug do app):** com as duas linhas (Titular/Dependente) agora na mesma tabela, `screen.findByText("01/01/2000")` passou a bater em dois elementos ao mesmo tempo (erro do Testing Library, não da tela) — trocado por `findAllByText`. Um teste também tentava clicar em dois botões "Encerrar vigência" reaproveitando referências capturadas antes do primeiro clique — o primeiro clique some do DOM (o período correspondente deixa de estar vigente) e o segundo clique, num elemento já desmontado, não fazia nada; corrigido reconsultando o botão a cada clique.
- Verificado ao vivo (Playwright, servidor real `localhost:5173`, só leitura): sub-aba "Período do Plano" da filial 100 mostra as duas linhas (Titular e Dependente, R$ 185,27 cada, "Vigente") juntas numa lista só, com a coluna "Tipo de Pessoa" — bate com o `curl` já confirmado nas rodadas anteriores. Nenhum erro de console.

## Atualização — 2026-08-14 (F5.PS-PER: formulário inline vira botão "+ Novo período" com modal de 4 campos)

- Ainda no mesmo dia, sem commit do trabalho anterior, o usuário pediu pra trocar o formulário inline (sempre visível) por um botão "+ Novo período" que abre uma modal com 4 campos: Data de Início, Valor Titular, Valor Dependente, Data de Encerramento. Alinhado antes de implementar: Data de Início é só ilustrativa (API não aceita data na criação); preencher Data de Encerramento cria e encerra o período na mesma ação. Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/planoSaude/CadastroPeriodoPlano.test.tsx src/adapters/http/planoSaudeService.http.test.ts`
- Total: `CadastroPeriodoPlano.test.tsx` — 12 testes (reescritos pra abrir a modal antes de preencher campos; casos novos: modal mostra os 4 campos, criar+encerrar numa ação via Data de Encerramento, Data de Início não afeta o cadastro). `planoSaudeService.http.test.ts` — 11 testes (+1 novo confirmando que `"data validade"` vai no corpo do `PUT .../encerrar` quando informada).
- Suíte completa do projeto: `npx vitest run` — 247 testes, 247 passaram (nenhuma falha, nem o arquivo historicamente instável sob carga).
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Cuidado ao escrever o teste (não é bug do app):** `user.type` do Testing Library não preenche `<input type="date">` de forma confiável em jsdom (digitar "12312026" não vira `2026-12-31`) — corrigido usando `fireEvent.change(input, { target: { value: "2026-12-31" } })` nos dois testes que preenchem datas.
- Verificado ao vivo (Playwright, servidor real, filial 100, **só leitura — sem submeter o formulário contra a API real**, para não escrever dados de configuração de filial sem autorização explícita): o botão "+ Novo período" abre a modal com os 4 campos na ordem pedida, "Data de Início" pré-preenchida com a data de hoje, texto de ajuda visível explicando o campo ilustrativo e o comportamento de criar+encerrar. Nenhum erro de console. Escrita (`POST`/`PUT .../encerrar` com `"data validade"`) coberta pela suíte automatizada (mock + testes unitários do adapter HTTP), não testada ao vivo nesta rodada.

## Atualização — 2026-08-14 (F5.PS-PER: Data de Início vira retroativa de verdade, `Claude/API (7).md`)

- Ainda no mesmo dia, sem commit do trabalho anterior, `Claude/API (7).md` trouxe `"data inicio"`/`"data fim"` editáveis no `POST/PUT /api/valores-plano-saude` — o usuário pediu pra atualizar a chamada de cadastro pra usar isso, com a Data de Início podendo ser retroativa (deixa de ser um campo ilustrativo). Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/planoSaude/CadastroPeriodoPlano.test.tsx src/adapters/http/planoSaudeService.http.test.ts`
- Total: `CadastroPeriodoPlano.test.tsx` — 13 testes (o teste que provava "Data de Início não tem efeito" virou o oposto: prova que uma data retroativa aparece na lista; caso novo de rejeição quando Data de Encerramento < Data de Início; o teste de criar+encerrar numa ação passou a validar o fluxo de um único `POST`, sem a 2ª chamada de encerrar). `planoSaudeService.http.test.ts` — 13 testes (+2 novos: `"data inicio"` retroativa enviada corretamente; `"data fim"` cria já como histórico e o adapter acha o registro certo ao relistar mesmo com um período vigente concorrente na lista).
- Suíte completa do projeto: `npx vitest run` — 250 testes, 250 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- **Correção de lógica de negócio junto com o campo (não só UI):** `encontrarPeriodoPlano` (`src/services/planoSaudeService.ts`) comparava `dataCriacao` pra decidir qual período vale num mês — errado agora que `dataInicio` pode divergir de `dataCriacao` (retroativa). Trocado pra comparar `dataInicio`, senão um período retroativo continuaria sendo ignorado no cálculo da aba Lançamento mesmo aparecendo certo na lista de períodos.
- Verificado ao vivo (Playwright, servidor real, filial 100, só leitura — sem submeter o formulário, mesmo motivo da rodada anterior): a modal abre com o texto de ajuda atualizado (sem mais "campo ilustrativo"), sem erros de console. Escrita (`POST` com `"data inicio"`/`"data fim"`) coberta pela suíte automatizada, não testada ao vivo nesta rodada.

## Atualização — 2026-08-14 (F5.PS-CAD-06: checkboxes próprias de adesão pros dependentes)

- Ainda no mesmo dia, o usuário pediu pra trocar o ✓/— (texto, espelhando sempre a adesão do titular) por checkboxes marcáveis pros dependentes, na tela "Titulares e Dependentes" — desmarcando, o dependente sai da grade de Lançamento daquele tipo de plano, mesmo com o titular aderido. Alinhado antes de implementar: a API de Dependentes não tem campo de adesão, então isso funciona só local por enquanto (mock persiste, HTTP real não tem onde salvar). Detalhe completo em `Claude/eventos-roadmap.md`.
- Comando: `npx vitest run src/views/planoSaude src/adapters/http/planoSaudeService.http.test.ts`
- Total: `CadastroTitulares.test.tsx` — 7 testes (o teste "adesão do dependente espelha o titular" virou "checkbox própria, marcada por padrão"; caso novo de desmarcar a adesão de um dependente sem afetar o titular; o teste do Coordenador passou a cadastrar um dependente primeiro, como Admin, e confere que o checkbox dele também fica desabilitado). `LancamentoPlanoSaude.test.tsx` — 8 testes (+1 novo: dependente com adesão própria desmarcada não aparece na grade, montado direto via `planoSaudeService` mock, sem depender da tela de Titulares). `planoSaudeService.http.test.ts` — 14 testes (+1 novo confirmando que `salvarAdesaoDependente` nunca chama `fetch`).
- Suíte completa do projeto: `npx vitest run` — 253 testes, 253 passaram.
- `npx tsc -b --noEmit`, `npx oxlint` e `npm run build` sem erros.
- Verificado ao vivo (Playwright, servidor real, filial 100): já existia um dependente real ("teste dependente") na filial — o checkbox de Plano de Saúde dele é clicável de verdade agora e desmarcou visualmente ao clicar, sem afetar o checkbox do titular; zero chamadas de rede feitas nesse clique (confirma o no-op do adapter HTTP, seguro mesmo sem autorização de escrita — não existe nenhum jeito desse clique alterar o backend real). Nenhum erro de console. Como nada é persistido no backend real, um recarregamento da página volta a mostrar como aderido — comportamento esperado, não regressão.
