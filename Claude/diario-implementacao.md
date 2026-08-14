# Diário de Implementação

## 2026-08-10

- Projeto React + TypeScript + Vite iniciado do zero (scaffold, tooling, convenções de pastas em camadas).
- Documentos de referência trazidos para `Claude/` (documento técnico, protótipo HTML, `ARQUITETURA.md`, `DESIGN.md`) e roadmap (WBS) elaborado em `Claude/ROADMAP.md`.
- **F0 — Fundação e arquitetura:** tokens de design extraídos do protótipo, catálogo de componentes visuais base (`Button`, `Card`, `Badge`, `FloatingField`, `Table`, `Toast`, `Header`, `Nav`) e documento de arquitetura em camadas (UI ↔ Serviço ↔ Adapter ↔ HTTP).
- **F1 — Camada de dados:** tipos de todas as entidades, interfaces de serviço por domínio, adapter mock com persistência em `localStorage` e os 6 colaboradores seed do documento técnico.
- **F2 — Shell, autenticação e cadastros:** sessão/login/logout, shell do app (cabeçalho fixo, navegação por perfil, seletor de filial, guarda de rota) e tela de Cadastro de Colaboradores.
- **F3 — Núcleo de Premiação:** Planilha de Premiação, Consolidado PEV e Consulta por Período, com exportação CSV nas três telas.
- Quatro lacunas/bugs do adapter mock de F1 descobertos e corrigidos ao construir as telas de F3 (filtro `telas.premiacoes` no Consolidado PEV; suporte a `FILIAL_TODAS` na Planilha; `gerarIntervaloMeses` preso ao ciclo Dez-Nov; filtro de período vazio e falta de filial no `ConsultaService`).
- Três alterações fora do escopo original do protótipo, a pedido do usuário (registradas em `Claude/eventos-roadmap.md` e refletidas no `ROADMAP.md`): campo de Filial no cadastro de colaboradores; formulário de cadastro migrado de inline para modal ("+ Adicionar colaborador"); coluna Filial adicionada na Planilha de Premiação e no Consolidado PEV.
- Correção adicional: cargo do seed (`"Vendedor"`) não batia com nenhuma opção de `CARGOS_COLABORADOR`, causando substituição silenciosa do cargo ao salvar sem alterar o campo — corrigido para `"Consultor de Vendas Interno"`.
- Verificação visual real das telas de F2 e F3 feita com o dev server + Playwright headless, sem erros de console.
- Todo o histórico de implementação do dia (que havia sido feito numa única sessão sem commits) foi reconstruído e commitado em 15 commits separados por marco/alteração/correção (`chore` → `docs` → `feat(F0)` → `feat(F1)` → `feat(F2)` → 4× `fix(F1)` → `feat(F3)` → alterações não planejadas do cadastro/modal → `fix` do seed → coluna Filial → ajuste de CSS esquecido na reconstrução).

**Testes:** 119 testes executados, 119 passaram, 0 falharam (`npx vitest run`, 25 arquivos de teste).

**Pendências para próximo dia:** F0-03 (repositório/CI) e F0-04 (provisionamento de ambientes) seguem pendentes, dependem de decisão de hospedagem/infraestrutura. F4 (Comissão e Descontos) é o próximo marco do roadmap.

## 2026-08-11

- **F4 — Comissão e Descontos:** grade de Comissão (PEV somente leitura vindo da Planilha de Premiação, snapshot ao salvar, visível só ao Admin) e Descontos e Bonificações (lançamentos múltiplos por colaborador/mês, Tipo/Valor/Observações), com exportação Excel via SheetJS carregado por CDN sob demanda. Bug do mock corrigido no processo: `comissaoServiceMock` não suportava `FILIAL_TODAS` (mesmo padrão de bugs já visto em F3). Correção visual: tabela de Descontos sem a classe `tabela-planilha`, alargando a tela além do necessário.
- **F7 — Preparação para API real:** variáveis de ambiente (`VITE_API_BASE_URL`) para a URL base da API por ambiente; contrato da API trazido para `Claude/API.md`; login (`authServiceHttp`) ligado à API real fora dos testes.
- **F8 — Integração real com a API, adiantada por telas (a pedido do usuário, fora da ordem sequencial do roadmap):**
  - Colaboradores: `colaboradoresServiceHttp` consumindo `GET/POST/PUT/DELETE /api/usuarios`. Campo Perfil adicionado ao cadastro (Vendedor/Coordenador/Gerente/Administrador), removendo o filtro que escondia quem não era vendedor. Dois bugs reais encontrados e corrigidos testando ao vivo: e-mail não era exigido no formulário (a API exige) e o campo Código travava a edição de Admin/Gerente/Coordenador (a API aceita código nulo para esses perfis).
  - Planilha de Premiação e Consolidado PEV: `premiacaoServiceHttp` e `consolidadoPevServiceHttp` ligados a `/api/premiacoes` e `/api/consolidado`. Consolidado PEV com solução limpa (a API devolve id por linha); Premiação com workaround (uma requisição por colaborador via `?id=`, já que a API não devolve id nenhum na resposta).
  - Consulta por Período: inicialmente pausada (a API só devolvia o total do período inteiro, sem quebra por mês — inviável sem uma requisição por mês por colaborador). Uma atualização da API (`Claude/API (3).md`) passou a agrupar a resposta de `/api/premiacoes` por mês, o que resolveu o bloqueio original; `consultaServiceHttp` implementado na sequência, reaproveitando a mesma leitura de resposta de Premiação (extraída para `respostaPremiacoesAgrupadas.ts`).
  - Efeito de carregamento: prop `carregando` no `Button` (spinner + `aria-busy`) e uma barra fina fixa no topo da tela enquanto há requisições HTTP em voo, ligados em todos os botões de ação que chamam a API (Login, Cadastro de Colaboradores, Premiação, Comissão, Descontos, Consolidado PEV).
- Verificação visual real de Premiação e Consulta feita com o dev server + Playwright headless contra a API real, sem erros de console; dados de teste (lançamentos de premiação e um colaborador de teste) limpos da base ao final.
- `Claude/API*.md` (documentos de contrato da API, gerenciados manualmente pelo usuário) adicionado ao `.gitignore`.
- Todo o trabalho do dia foi commitado em commits separados por marco/funcionalidade (F4, F7-03, F7-01, integração de API por tela, efeito de carregamento, gitignore).

**Testes:** 178 testes executados, 178 passaram, 0 falharam (`npx vitest run`, 36 arquivos de teste).

**Pendências para próximo dia:** mapeamento de IDs numéricos de `telas` em `colaboradoresServiceHttp` segue assumido (não documentado/confirmado pelo backend) — risco registrado em `Claude/eventos-roadmap.md`. Demais telas de F8 (Comissão, Descontos, Plano de Saúde, Estoque) continuam no mock.

## 2026-08-12

- **Correção:** `authServiceHttp` fazia o Admin entrar vendo a própria filial em vez de "Todas as filiais" (documento técnico, Seção 1) — a API real devolve a filial vinculada ao usuário admin, diferente do mock. Corrigido para forçar `FILIAL_TODAS` quando `role === "admin"`.
- Filtros padrão ajustados a pedido do usuário: Consulta por Período passou a trazer só o mês passado no primeiro carregamento (antes trazia tudo); Consolidado PEV passou a ter os campos De/Até somente-leitura, sempre sincronizados com o Ciclo.
- **Correção mais ampla:** descoberta uma corrida de resposta desatualizada nas seis telas que buscam dados via serviço (Premiação, Comissão, Descontos, Consolidado PEV, Consulta, Cadastro de Colaboradores) — uma resposta de rede mais antiga podia terminar depois de uma mais nova e sobrescrever a tela com dados velhos (visível testando Comissão: salvar um valor logo após abrir a tela fazia o campo voltar a ficar vazio, mesmo salvo certo no servidor). Corrigido com um hook novo, `useEfeitoAssincrono`, aplicado nas seis telas.
- **F8 — Comissão e Descontos (F8.COM/F8.DESC) via API real:** `comissaoServiceHttp` (`GET/PUT /api/comissoes`, PEV já vem calculado ao vivo pela API) e `descontosServiceHttp` (`GET/PUT/DELETE /api/descontos-bonificacoes`). Achado importante testado ao vivo: o `PUT` de descontos só cria lançamentos, nunca atualiza por id — editar um lançamento existente precisa apagar e recriar, implementado assim no adapter.
- **F2.INICIO — conteúdo real da aba Início (Painel Geral):** até então um placeholder mínimo desde F2 por falta de subtarefa própria no roadmap; adicionada como `F2.INICIO` a pedido do usuário antes de implementar. Cartões de estatísticas e ações rápidas, diferentes para gestor (Filial, Colaboradores cadastrados, Premiações lançadas, Total a pagar — mês atual, não o histórico completo do protótipo, por decisão do usuário) e vendedor (Minha filial, Minha função, Premiações recebidas, Total a receber). Correção no mesmo dia: o atalho "+ Cadastrar vendedor" foi restrito ao Admin (Gerente/Coordenador só têm leitura em Colaboradores).
- Rótulo da aba "Descontos" na navegação corrigido para "Descontos/Bonificações", batendo com o protótipo.
- Logo da Comercial Mariano adicionado na tela de login (versão completa, com slogan) e no cabeçalho do app (versão compacta) — arquivos fornecidos pelo usuário em `src/assets/`.
- Verificação visual real feita ao vivo com o dev server + Playwright contra a API real ao longo do dia (Comissão, Descontos, Início como gestor e como vendedor, rótulo da navegação, logo do login); o logo do cabeçalho não pôde ser confirmado da mesma forma porque a API real ficou indisponível no fim do dia — implementado com o mesmo padrão já testado do `Header`, sem pendência de código.
- Trabalho do dia commitado em commits separados por marco/correção/funcionalidade; as mudanças de logo e o registro do evento no `eventos-roadmap.md` ainda não foram commitados nesta sessão.

**Testes:** 204 testes executados, 201 passaram, 3 falharam (`npx vitest run`) — todas as falhas no mesmo arquivo (`CadastroColaboradores.test.tsx`), por instabilidade de carga ao rodar a suíte inteira (timeout de 5s), não por regressão: confirmado passando limpo (14/14) quando executado isolado várias vezes ao longo do dia.

**Pendências para próximo dia:** commitar as mudanças de logo (`src/assets/`, `Login.tsx`, `Login.css`, `Shell.tsx`) e o evento correspondente no `eventos-roadmap.md`; confirmar visualmente o logo do cabeçalho assim que a API real voltar; considerar investigar a instabilidade de carga em `CadastroColaboradores.test.tsx` (aumentar timeout ou isolar o que causa a lentidão sob suíte completa), já que se repete há dois dias.

## 2026-08-13

- Logo do cabeçalho confirmado visualmente ao vivo (API real estava fora do ar no fim do dia anterior) — sem mudança de código, só a verificação que ficou pendente.
- **F5 — Plano de Saúde, marco completo:** `src/views/planoSaude/PlanoSaude.tsx` (contêiner com sub-abas) + `CadastroTitulares.tsx` (F5.PS-CAD: titulares vindos do Cadastro de Colaboradores, dependentes adicionados/removidos por modal, duas checkboxes de adesão — Saúde/Odontológico — só editáveis pelo Admin) + `LancamentoPlanoSaude.tsx` (F5.PS-LAN: sub-sub-abas Saúde/Odontológico, uma linha por pessoa — titular e cada dependente —, valor sempre fixo por filial e tipo — R$185,27 padrão, R$255,54 nas filiais 401/403, R$13,56 odontológico —, nunca digitado; célula `***` na coluna que não se aplica à pessoa da linha). Ligado ao Shell, substituindo o placeholder `EmConstrucao`.
- Odontológico não tem nada editável (só o valor fixo) — botão de salvar e de bloqueio ficam ocultos nessa sub-aba, só aparecem em Saúde (que tem os campos extras Adicional/Coparticipação).
- Duas decisões/correções ao implementar: (1) resolvida uma contradição entre o documento técnico e o protótipo sobre a coluna Descrição (TITULAR/DEPENDENTE) — seguido o protótipo (texto fixo, nunca editável, nem pelo Admin), já que é o código executável e a API não tem campo para persistir isso; (2) corrigido um erro de scaffolding de F1 no tipo `PlanoSaudeLancamento` (tinha campos `valorTitular`/`valorDependente` obrigatórios que nunca chegaram a ser persistidos nem pelo protótipo nem pela API real).
- Um teste pegou um bug real antes de qualquer commit: o total por linha do Lançamento usava o lançamento já salvo em vez do valor em edição, então não reagia ao que o usuário acabava de digitar — corrigido na mesma sessão.
- Achado à parte, sem relação com Plano de Saúde: rodar a suíte completa revelou `Premiacao.test.tsx`/`Comissao.test.tsx` quebrados por rótulos que já tinham sido renomeados direto no código ("PEV" → "PEV Atingida", "Comissão" → "Comissão (PEV Base)") — testes atualizados para os rótulos atuais.
- Verificação visual real feita ao vivo com o dev server + Playwright contra a API real (cadastro de titular/dependente, lançamento Saúde e Odontológico), sem erros de console.
- Nada foi commitado ainda nesta sessão — inclui também o trabalho de logo do dia anterior, que já estava pendente de commit.

**Testes:** 219 testes executados, 219 passaram, 0 falharam (`npx vitest run`, 43 arquivos de teste) — execução limpa, sem a instabilidade de carga que apareceu em dias anteriores.

**Pendências para próximo dia:** commitar todo o trabalho pendente (logo + F5 Plano de Saúde + correções de rótulo); F6 (Premiações Estoque, condicional à decisão de negócio) e o restante de F8 (Comissão/Descontos/Plano de Saúde ainda no mock, sem adapter HTTP) seguem como próximos marcos do roadmap.
