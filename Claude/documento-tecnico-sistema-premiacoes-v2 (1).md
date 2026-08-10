# Sistema de Premiações — Comercial Mariano
## Documento Técnico de Especificação — v2.0 (Julho de 2026)

> Este documento descreve, com o máximo de precisão possível, o estado atual do protótipo (arquivo HTML único, autocontido, sem backend) para orientar a equipe de Desenvolvimento/TI na construção da versão real do sistema. Nomes de funções, IDs de campos e constantes citados abaixo são os literalmente usados no código-fonte do protótipo, para servir de referência exata durante a implementação.

---

## 1. Visão geral do protótipo

- Um único arquivo `.html` com HTML, CSS e JavaScript embutidos. Sem build, sem framework, sem servidor.
- Todo o estado da aplicação vive em um único objeto JavaScript em memória: `const estado = { ... }` (perdido ao recarregar a página — **não há persistência real**).
- Autenticação simples por usuário/senha comparados em texto puro no próprio código (`CREDENCIAIS_GESTAO`, e o campo `usuarioAcesso`/`senhaAcesso` de cada vendedor). **Não é segura e não deve ir para produção como está.**
- Exportações são geradas no próprio navegador: CSV via `Blob`/`URL.createObjectURL`, e Excel via a biblioteca **SheetJS**, carregada por CDN (`<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js">`).

### 1.1 Credenciais de teste (login)

| Perfil | Usuário | Senha | Filial vinculada |
|---|---|---|---|
| Administrador | `admin` | `admin123` | Todas (`FILIAL_TODAS`), pode restringir a uma no cabeçalho |
| Gerente | `gerente` | `gerente123` | `100` |
| Coordenador | `coordenador` | `coord123` | `100` |
| Colaborador (qualquer um dos 6 vendedores seed) | `carlos.silva`, `fernanda.lima`, `roberto.santos`, `juliana.costa`, `marcos.rocha` ou `patricia.ferreira` | `venda123` (igual para todos) | A do próprio cadastro |

A detecção de perfil no login é automática: `tratarSubmitLogin()` testa, nessa ordem, `CREDENCIAIS_GESTAO.admin` → `.gerente` → `.coordenador` → por fim, procura um vendedor com aquele `usuarioAcesso`/`senhaAcesso`.

### 1.2 Filiais cadastradas

```
'100', '101', '201', '202', '300', '302', '303', '401', '403',
'600', '601', '602', '603', '604', '700', '701', '800', '900', '901'
```
As filiais **401** e **403** têm regra diferenciada no módulo de Plano de Saúde (ver Seção 3.5).

---

## 2. Perfis de acesso e permissões

### 2.1 Navegação por perfil (`NAV_POR_PAPEL`)

```js
admin:       ['inicio', 'vendedores', 'consulta', 'consolidado-pev', 'premiacao', 'comissao', 'premiacao-estoque', 'descontos', 'plano-saude']
gerente:     ['inicio', 'vendedores', 'premiacao', 'comissao']
coordenador: ['inicio', 'vendedores', 'descontos', 'plano-saude']
vendedor:    ['inicio', 'consulta']
```

> **Coordenador não tem acesso à tela de Comissão** (não está na lista acima), mesmo sendo o "editor" de outras telas.

### 2.2 Quem edita cada tela — bloqueio (`PAPEL_EDITOR_POR_TELA`)

```js
{
  premiacao:  'gerente',
  planoSaude: 'coordenador',
  descontos:  'coordenador',
  comissao:   'gerente',
  estoque:    'coordenador'   // mantido no código mesmo com a tela oculta
}
```

- O **Administrador nunca é bloqueado** — sempre edita e sempre pode alternar o bloqueio (`usuarioEstaBloqueadoNaTela()` retorna `false` de cara se `role === 'admin'`).
- A chave de bloqueio é montada por `chaveBloqueio(tela, filial, mes)` → string `"tela::filial::mesReferencia"` (ex.: `"premiacao::100::2026-07"`), guardada na lista simples `estado.bloqueios` (array de strings).
- O botão de bloquear/desbloquear (`atualizarBotaoBloqueio()`) só aparece para o Admin, e só quando ele **não** está com a visão "Todas as filiais" ativa (precisa estar numa filial específica).

### 2.3 Aba "Premiações Estoque" — visível mas sem conteúdo

- Está em `NAV_POR_PAPEL.admin`, mas **não** em `gerente`, `coordenador` ou `vendedor` → só o Admin vê a aba no menu.
- Mesmo para o Admin, a função `renderizarPremiacaoEstoque()` tem, logo no início, um retorno antecipado:
  ```js
  function renderizarPremiacaoEstoque() {
    document.getElementById('estoque-conteudo-bloco').hidden = true;
    document.getElementById('estoque-conteudo-oculto').hidden = false;
    return; // todo o restante da função (não removido) fica inacessível
    // ...lógica original de política, coletivo e individual, intacta...
  }
  ```
- Isso faz com que apareça apenas o texto **"Esta tela está temporariamente oculta."** — para reativar, basta remover essas 3 linhas.

---

## 3. Módulos — regras de negócio

### 3.1 Cadastro de Colaboradores (`view-vendedores`)

Campos do formulário: `vendedor-codigo`, `vendedor-nome`, `vendedor-cpf`, `vendedor-cargo` (select), `vendedor-email`, `vendedor-usuario-acesso`, `vendedor-senha-acesso`, e 5 checkboxes de habilitação de tela: `vendedor-tela-premiacoes`, `-comissao`, `-plano-saude`, `-estoque`, `-descontos`.

Validação mínima em `tratarSubmitVendedor()`: exige código, nome e CPF preenchidos; bloqueia cadastro se o Admin estiver em "Todas as filiais" (precisa escolher uma filial específica primeiro).

### 3.2 Planilha de Premiação (`view-premiacao`)

**Colunas em tela, nesta ordem:** Código, Colaborador, CPF, PEV, Premiação Iconic, Filtros e demais fornecedores, Campanhas de fornecedores, Premiação Inadimplência, Total, Planilha Deivson.

- `CATEGORIAS_PREMIACAO` define as 5 categorias lançáveis: `pev`, `iconic`, `filtros`, `campanhasFornecedores`, `inadimplencia` (cada uma com seu `idCampo` de input, ex. `planilha-<vendedorId>-pev`).
- **Total** = `somarCategorias(valores)` → soma das 5 categorias.
- **Planilha Deivson** = `Total − pev`, calculado em `renderizarPlanilhaPremiacao()` e em `atualizarTotalLinha()`, nunca persistido como campo — é sempre recalculado na hora de exibir.
- Rodapé (`atualizarTotalGeralPlanilha()`): soma cada categoria (`rodape-total-pev`, `-iconic`, `-filtros`, `-campanhas-fornecedores`, `-inadimplencia`), mais `rodape-total-planilha` (Total) e `rodape-total-deivson`.
- Bloqueio: tela `'premiacao'`, editor `gerente`.
- Exportação: **CSV** (`exportarPremiacoesCSV()`) → colunas `CPF, Nome, Valor Total, Observações` (Observações sempre vazio — não há campo de observação nesta tela hoje).

### 3.3 Consolidado PEV (`view-consolidado-pev`)

- Ciclo de 12 meses (Dezembro → Novembro): `obterAnoCicloAtual()` decide o ano do ciclo corrente; `obterMesesCicloPEV(anoCiclo)` gera as 12 chaves de mês do ciclo; `gerarIntervaloMeses(de, ate)` gera o intervalo efetivamente exibido, conforme os filtros `pev-filtro-de` / `pev-filtro-ate`.
- Colunas dinâmicas: CPF, Nome, **uma coluna por mês do intervalo filtrado**, Total Acumulado, Base de Cálculo (28%), Adiantamento de Férias, Premiação Adicional a Receber.
- **Base de Cálculo** = `Total Acumulado × 0.28`.
- **Adiantamento de Férias**: só o Admin lança (`pev-adiantamento-<vendedorId>`), via `obterAdiantamento(vendedorId, anoCiclo)` / gravado em `estado.adiantamentosFerias`.
- **Premiação Adicional a Receber** = `Base − Adiantamento`.
- Rodapé (`atualizarRodapeConsolidadoPev()`): soma cada mês exibido + as 4 colunas finais; atualizado a cada tecla digitada no adiantamento, **sem re-renderizar as linhas** (só o `<tfoot>`), para não perder o foco do campo.
- Exportação: **CSV** (`exportarConsolidadoPevCSV()`) → **apenas** `CPF, Nome, Premiação Adicional a Receber` (não inclui os meses nem as colunas intermediárias).

### 3.4 Consulta por Período (`view-consulta`)

- Somente leitura. Agrupa os lançamentos de Premiação por mês (`agruparPremiacoesPorMes()`), um cartão por mês (`montarCartaoMes()`), com as mesmas 5 categorias + Total, e rodapé somando cada coluna do mês (`Total do mês`).
- Única tela visível ao perfil `vendedor`, e nesse caso já vem filtrada para `estado.sessao.vendedorId`.

### 3.5 Comissão (`view-comissao`)

**Colunas em tela:** Código, Colaborador, CPF, Função, **PEV** (só Admin), Comissão, Garantido.

- **PEV nunca é digitado aqui.** `obterPevDaPremiacao(vendedorId, mes)` busca em `estado.premiacoes` o registro daquele vendedor/mês e devolve o campo `pev` (ou `0`). É sempre somente leitura.
- `mostrarPev = estado.sessao.role === 'admin'` controla a visibilidade da coluna inteira (cabeçalho, linhas e rodapé) — Gerente não a vê.
- Ao salvar (`tratarSalvarComissao()`), o `pev` é gravado no registro de comissão como uma cópia/snapshot do valor de Premiação **no momento do salvamento** (não é um valor "ao vivo" depois de salvo).
- Rodapé (`atualizarRodapeComissao()`): soma PEV (se visível), Comissão e Garantido; recalculado a cada tecla digitada (sem re-renderizar as linhas).
- **Não existe coluna "Total"** nesta tela (removida a pedido do negócio) — nem na tela, nem na exportação.
- Bloqueio: tela `'comissao'`, editor `gerente`. **Coordenador não acessa esta tela** (fora do `NAV_POR_PAPEL` dele).
- Exportação: **Excel (.xlsx)** (`exportarComissoesExcel()`) → colunas `Código, Nome, PEV, Comissão, Garantido`.

### 3.6 Plano de Saúde (`view-plano-saude`)

Duas sub-abas de topo (`botao-subaba-plano-saude-cadastro` / `-lancamento`, controladas pela variável `subAbaPlanoSaudeAtiva`):

#### 3.6.1 Sub-aba "Titulares e Dependentes" (cadastro)

- Titulares = vendedores habilitados para a tela (`vendedoresParaTela('planoSaude')`); dependentes são cadastrados manualmente (nome + CPF) via `abrirFormularioDependente(titularId)`, armazenados em `estado.planoSaudeDependentes` = `{ id, vendedorId, nome, cpf }`.
- Cada titular tem duas checkboxes: **Plano de Saúde** (`adesao-saude-<id>`) e **Plano Odontológico** (`adesao-odonto-<id>`), refletindo os campos `titular.adesaoSaude` / `titular.adesaoOdontologico` no próprio objeto do vendedor (**por padrão `undefined`, tratado como `true`** — checagem sempre `!== false`).
- Só o Admin edita essas checkboxes (`podeGerenciarDependentes = estado.sessao.role === 'admin'`); para outros perfis (ex.: Coordenador), aparecem marcadas/desmarcadas mas com `disabled`.

#### 3.6.2 Sub-aba "Lançamento" — duas sub-sub-abas: Saúde / Odontológico

Controlado por `tipoPlanoSaudeAtivo` (`'saude'` ou `'odontologico'`), configurado em `COLUNAS_PLANO_SAUDE`:

```js
const FILIAIS_VALOR_DIFERENCIADO_SAUDE = ['401', '403'];
const VALOR_PADRAO_SAUDE_DIFERENCIADO = 255.54;  // filiais 401 e 403
const VALOR_PADRAO_SAUDE_PADRAO       = 185.27;  // todas as demais filiais
const VALOR_PADRAO_ODONTOLOGICO       = 13.56;   // todas as filiais
```

- `listarPessoasPlanoSaude(tipoPlano)` monta **uma linha por pessoa** (o titular, depois cada dependente dele), filtrando famílias sem adesão ao `tipoPlano` pedido.
- Colunas: Código, Nome Titular (na prática, nome da própria pessoa da linha), Descrição, [Titular / R$ Titular], [Dependente / R$ Dep.] (+ `R$ Adicional`/`R$ Coopart.` quando `camposExtras` estiver configurado para o tipo), Total.
- **Descrição** é sempre `"TITULAR"` ou `"DEPENDENTE"` (`pessoa.tipo`), texto fixo — nunca um campo digitável.
- Na coluna que **não** corresponde ao tipo da pessoa daquela linha, a célula mostra `***` com a classe CSS `celula-bloqueada` (fundo/realce de "não se aplica").
- Os valores de Titular/Dependente vêm de `config.valorPadrao(pessoa)` — **fixo por filial e tipo de plano, nunca digitado**.
- **A "Descrição" só é editável pelo Administrador** — para os demais perfis (Coordenador incluso), o campo aparece com `disabled`, mesmo com o mês em aberto (checagem independente do bloqueio mensal: `estado.sessao.role !== 'admin' || bloqueadoParaEdicao`).
- Rodapé (`atualizarRodapePlanoSaudeLancamento()`): soma Titular, Dependente, campos extras (se houver) e Total.
- Bloqueio: tela `'planoSaude'`, editor `coordenador`.
- Exportação: **Excel (.xlsx)** (`exportarPlanoSaudeExcel()`), respeitando a sub-aba (`tipoPlanoSaudeAtivo`) e a filial ativa.

### 3.7 Descontos e Bonificações (`view-descontos`)

**Colunas:** Cód, Nome, Tipo, Valor, Observações, Total, Ações.

- Um colaborador pode ter **múltiplos lançamentos no mesmo mês** (`estado.descontosBonificacoes` filtrado por `vendedorId` + `mesReferencia`).
- **Tipo** é uma lista suspensa fixa (`TIPOS_DESCONTO_BONIFICACAO`), sem opção de texto livre:
  ```
  Ajuda de Custo/Gratificação · Bonificação · Compra de mercadorias · Convênio Gás ·
  Desconto autorizado (descrever em observações) · Diária · Farmácia · Franquia ·
  Manutenção veículos · Multa
  ```
- **Observações** é texto livre (`descontos-obs-<id>`), pensado principalmente para detalhar o motivo quando o Tipo for "Desconto autorizado".
- **Total** (`celula-total`) aparece uma vez por colaborador (na primeira linha do grupo), somando **todos** os lançamentos daquele colaborador no mês.
- Rodapé (`atualizarRodapeDescontos()`): soma o Valor de **todos** os lançamentos de **todos** os colaboradores exibidos.
- **Correção de bug (importante para o dev entender o motivo do padrão de código usado):** as funções `adicionarLancamentoDesconto()` e `removerLancamentoDesconto()` chamam `sincronizarDescontosComTela()` **antes** de mexer no array e re-renderizar — essa função lê todos os `<select>`/`<input>` de Tipo/Valor/Observações atualmente na tela e regrava no `estado` antes de qualquer nova renderização. Sem isso, digitar em uma linha e clicar em "+ Adicionar" (que dispara um `innerHTML` novo) apagava o que não tinha sido salvo ainda.
- Bloqueio: tela `'descontos'`, editor `coordenador`.
- Exportação: **Excel (.xlsx)** (`exportarDescontosExcel()`) → colunas `CPF, Nome, Mês Referência, Tipo, Valor, Observações` (uma linha por lançamento, não agregado).

### 3.8 Premiações Estoque (`view-premiacao-estoque`) — conteúdo oculto

Documentado aqui porque o **código continua ativo** por trás da tela oculta (ver Seção 2.3), e deve ser levado em conta se a tela for reabilitada.

**Política de Estoque** (`estado.politicaEstoque`, só o Admin edita):
```js
metas: { romaneios: 0.90, contagens: 3, avaria: 0.0015, segregado: 0 }
valoresReferencia: { romaneios: 150, contagens: 100, avaria: 75, segregado: 25,
                     faltas: 75, organizacao: 75, volumeSeparado: 150 }
metaVolumeSeparadoTotal: 0.80
```

**Grupos de função** (`grupoFuncaoEstoque(cargo)`):
- `'encarregado_assistente'` → cargos "Encarregado de Estoque" ou "Assistente de Estoque"
- `'auxiliar'` → cargo "Auxiliar de Estoque"
- Qualquer outro cargo → `null` (não entra no módulo de Estoque)

**KPIs coletivos** (`KPIS_COLETIVOS_ESTOQUE`), lançados por filial/mês (`estado.estoqueColetivoMensal`):

| KPI | Unidade | Grupos que valem | Regra de "melhor" |
|---|---|---|---|
| `romaneios` — % Romaneios bipados | % | só encarregado/assistente | maior é melhor |
| `contagens` — Contagens Semanais | und | ambos os grupos | maior é melhor |
| `avaria` — % Estoque Avaria (99) | % | ambos os grupos | **menor** é melhor |
| `segregado` — R$ Estoque Segregado (88) | R$ | ambos os grupos | **menor/igual à meta** é melhor |

- `calcularAtingidoColetivoEstoque(chave, meta, realizado)`: para `avaria`, `meta / realizado` (capado, com `realizado <= 0` → 100%); para `segregado`, binário (`realizado <= meta` → 100%, senão 0%); para os demais, `realizado / meta`.
- `calcularValorPagoColetivoEstoque(...)`: **tudo ou nada** — só paga o `valorReferencia` cheio do KPI se o atingido for `>= 1` (100%); senão, paga `0`.
- `calcularTotalColetivoParaGrupo(grupo, filial, mes)`: soma o valor pago de cada KPI aplicável àquele grupo.

**Avaliação individual** (`estado.estoqueIndividualMensal`, um registro por colaborador/mês):
- `semFaltas` (bool) → paga `valoresReferencia.faltas` se verdadeiro.
- `organizacaoOk` (bool) → paga `valoresReferencia.organizacao` se verdadeiro.
- Se o colaborador é do grupo `'auxiliar'`: `metaIndividualVolume = metaVolumeSeparadoTotal / (nº de auxiliares da filial)`; se `volumeSeparadoRealizado >= metaIndividualVolume`, paga `valoresReferencia.volumeSeparado`.
- `calcularTotalReceberEstoque(individual, coletivo, diasFerias)`: soma individual + coletivo; se houve dias de férias no mês, **prorateia**: `(total / 30) × (30 − diasFerias)`.

Bloqueio: tela `'estoque'`, editor `coordenador`. Exportação: Excel (.xlsx) — `CPF, Nome, Valor Total, Observações` (Observações sempre vazio).

### 3.9 Bloqueio de Lançamentos (regra transversal)

Aplica-se a `premiacao`, `planoSaude`, `descontos`, `comissao` e `estoque` (ver mapeamento em 2.2). O Admin bloqueia por tela + filial + mês; o perfil responsável (Gerente ou Coordenador, conforme a tela) fica impedido de editar aquele período específico; o Admin nunca é bloqueado.

---

## 4. Exportações — tabela de referência exata

| Tela | Botão / função | Formato | Colunas (nesta ordem exata) |
|---|---|---|---|
| Planilha de Premiação | `botao-exportar-csv` → `exportarPremiacoesCSV()` | CSV | CPF, Nome, Valor Total, Observações |
| Consolidado PEV | `botao-exportar-csv-consolidado-pev` → `exportarConsolidadoPevCSV()` | CSV | CPF, Nome, Premiação Adicional a Receber |
| Comissão | `botao-exportar-excel-comissao` → `exportarComissoesExcel()` | Excel (.xlsx) | Código, Nome, PEV, Comissão, Garantido |
| Descontos e Bonificações | `botao-exportar-excel-descontos` → `exportarDescontosExcel()` | Excel (.xlsx) | CPF, Nome, Mês Referência, Tipo, Valor, Observações |
| Plano de Saúde | `botao-exportar-excel-plano-saude` → `exportarPlanoSaudeExcel()` | Excel (.xlsx) | Conforme sub-aba ativa (Saúde/Odontológico); uma linha por pessoa |
| Premiações Estoque | `botao-exportar-excel-estoque` → `exportarEstoqueExcel()` | Excel (.xlsx) | CPF, Nome, Valor Total, Observações |

Todos os arquivos CSV são gerados com separador `;`, BOM UTF-8 (`\uFEFF`), e nome no padrão `<base>_<filial-ou-todas-filiais>_<data-ISO>.csv` (função `baixarCSV()`). Os Excel seguem o mesmo padrão de nome, via `baixarExcel()` (uma aba chamada "Dados", gerada com `XLSX.utils.aoa_to_sheet`).

---

## 5. Modelo de dados (entidades e campos exatos)

### 5.1 Vendedor / Colaborador
```
id, codigo, nome, cpf, filial, cargo, email,
usuarioAcesso, senhaAcesso,
telas: { premiacoes, comissao, planoSaude, estoque, descontos },   // booleans
adesaoSaude,          // boolean | undefined (undefined = true)
adesaoOdontologico    // boolean | undefined (undefined = true)
```

### 5.2 Premiação (`estado.premiacoes`)
```
id, vendedorId, vendedorNome, filial, mesReferencia,
pev, iconic, filtros, campanhasFornecedores, inadimplencia,
total   // = soma das 5 categorias, gravado
// "Planilha Deivson" NÃO é persistido — é sempre total - pev, calculado na hora
```

### 5.3 Comissão (`estado.comissoes`)
```
id, vendedorId, vendedorNome, filial, mesReferencia,
pev,        // snapshot do PEV da Premiação no momento de salvar
valor,      // Comissão
garantido   // Garantido
// não existe campo "total"
```

### 5.4 Plano de Saúde
```
Dependente (estado.planoSaudeDependentes):
  id, vendedorId, nome, cpf

Lançamento (estado.planoSaudeLancamentos):
  id, pessoaId,          // id do vendedor (titular) OU do dependente
  mesReferencia,
  tipoPlano,             // 'saude' | 'odontologico'
  valorTitular, valorDependente,     // só um dos dois é != null por pessoa
  valorAdicional, valorCoparticipacao  // só usados na sub-aba "saude", se configurados
```

### 5.5 Descontos e Bonificações (`estado.descontosBonificacoes`)
```
id, vendedorId, mesReferencia,
tipo,          // um dos 10 valores fixos (ver 3.7)
valor,
observacoes    // texto livre
```

### 5.6 Adiantamento de Férias (`estado.adiantamentosFerias`)
```
id, vendedorId, anoCiclo, valor
```

### 5.7 Bloqueios (`estado.bloqueios`)
```
Array de strings no formato "tela::filial::mesReferencia"
tela ∈ { premiacao, planoSaude, descontos, comissao, estoque }
```

### 5.8 Política de Estoque (`estado.politicaEstoque`) — ver Seção 3.8

### 5.9 Estoque Coletivo / Individual — ver Seção 3.8

---

## 6. Requisitos técnicos para produção

Sem alteração de escopo em relação à primeira versão deste documento — seguem valendo integralmente:

1. **Backend/API REST** com CRUD para cada entidade da Seção 5; todo cálculo (Total, Planilha Deivson, apuração de Estoque, Base de Cálculo do PEV, etc.) deve ser **recalculado e validado no servidor**, nunca aceito pronto do front-end.
2. **Banco de dados relacional**, com índices por `mesReferencia` e `filial` (os filtros mais usados em todas as telas), e chave estrangeira para `vendedorId`.
3. **Autenticação real**: hash de senha (bcrypt/argon2), sessão ou JWT com expiração, HTTPS, e autorização por perfil reforçada em **cada endpoint**, replicando exatamente:
   - `NAV_POR_PAPEL` (Seção 2.1) para visibilidade de tela;
   - `PAPEL_EDITOR_POR_TELA` (Seção 2.2) para quem pode editar/estar sujeito a bloqueio;
   - A regra "Admin nunca é bloqueado";
   - A regra "Premiações Estoque visível só ao Admin, mas sem conteúdo exposto" (Seção 2.3) — ou a decisão de negócio vigente na época da implementação, caso tenha mudado.
4. **Auditoria/log**: quem lançou, alterou ou bloqueou cada informação, com data/hora — inexistente no protótipo hoje.
5. **Exportações**: seguir exatamente as colunas e formatos (CSV vs. Excel) da Seção 4.
6. **Migração de dados**: os 6 vendedores e os lançamentos de exemplo (`seed-v1`...`seed-v6`, `seed-p1`...`seed-p8`) são só massa de teste/homologação — não migrar para produção.

---

## Anexo — Glossário de termos

| Termo | Significado |
|---|---|
| **PEV** | Categoria de premiação apurada mensalmente por colaborador; base do Consolidado PEV; exibida como somente-leitura na Comissão |
| **Planilha Deivson** | Coluna calculada na Planilha de Premiação: `Total do mês − PEV` |
| **Adesão (Saúde/Odontológico)** | Flags por titular (`adesaoSaude`/`adesaoOdontologico`, padrão `true`) que decidem se a família aparece em cada sub-aba de Lançamento do Plano de Saúde |
| **Ciclo PEV** | Período de 12 meses, Dezembro → Novembro, usado no Consolidado PEV e no Adiantamento de Férias |
| **Filial** | Unidade/loja, identificada por código numérico; 401 e 403 têm valor diferenciado de Plano de Saúde (R$ 255,54 em vez de R$ 185,27) |
| **Bloqueio de lançamento** | Trava por `tela::filial::mesReferencia`, definida pelo Admin, que impede o perfil responsável de editar aquele período |
| **`***`** | Marcador visual (célula "bloqueada"/inaplicável) usado no Lançamento de Plano de Saúde quando a coluna Titular/Dependente não corresponde ao tipo da pessoa daquela linha |
