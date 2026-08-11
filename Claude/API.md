# API — Sistema de Premiação (Comercial Mariano)

Referência dos parâmetros de entrada de cada endpoint. Contrato completo (arquitetura, banco de dados, convenções) está em [CLAUDE.md](CLAUDE.md).

**Autenticação:** todas as rotas abaixo, exceto `/valida-usuario`, exigem o header:

```
Authorization: Bearer {token}
```

O token é obtido no login (`POST /api/valida-usuario`) e não expira automaticamente (Sanctum).

**Convenção de chaves:** os corpos de request/response usam chaves em português, algumas com espaço (ex.: `"id colaborador"`, `"mes de referencia"`) — não é erro de digitação, é o contrato usado em toda a API.

---

## Índice

- [Autenticação](#autenticação)
- [Colaboradores (Usuários)](#colaboradores-usuários)
- [Premiações](#premiações)
- [Consolidado PEV](#consolidado-pev)
- [Comissões](#comissões)
- [Descontos e Bonificações](#descontos-e-bonificações)
- [Lançamentos (Plano de Saúde/Odontológico)](#lançamentos-plano-de-saúdeodontológico)
- [Dependentes](#dependentes)
- [Bloqueios](#bloqueios)

---

## Autenticação

### `POST /api/valida-usuario`

Não exige token. Valida usuário/senha e emite o token Sanctum usado em todas as demais chamadas.

```json
{
  "usuario": "string, obrigatório",
  "senha": "string, obrigatório"
}
```

**Resposta (sucesso):**
```json
{
  "id colaborador": 1,
  "codigo": "V001",
  "funcao": "Consultor de Vendas Interno",
  "nome": "Carlos Eduardo Silva",
  "role": "vendedor",
  "filial": "100",
  "quantidade de premiacoes": 3,
  "valor premiacoes": 1250.00,
  "token": "1|abcdef...",
  "mensagem": "usuario encontrado"
}
```

---

## Colaboradores (Usuários)

### `GET /api/usuarios`

| Parâmetro | Onde | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `filial` | query | string | não | Código da filial (ex: `"100"`) para filtrar a lista |

### `POST /api/usuarios`

Só o **Admin** pode chamar (403 para os demais papéis).

```json
{
  "codigo": "string, opcional, único",
  "nome": "string, obrigatório",
  "cpf": "string, obrigatório, único",
  "funcao": "string, obrigatório",
  "email": "string, obrigatório, único",
  "usuario": "string, obrigatório, único",
  "senha": "string, obrigatório",
  "role": "admin | gerente | coordenador | vendedor — obrigatório",
  "filial": "string, obrigatório — código de uma filial existente",
  "plano saude": "boolean, opcional",
  "plano odontologico": "boolean, opcional",
  "telas": "array de ids de tela, opcional"
}
```

### `PUT /api/usuarios/{id}`

Só o **Admin** pode chamar. Mesmos campos do `POST`, todos opcionais — só o que for enviado é alterado. `senha` só é atualizada se enviada.

### `DELETE /api/usuarios/{id}`

Só o **Admin** pode chamar. Sem parâmetros de entrada.

---

## Premiações

### `GET /api/premiacoes`

| Parâmetro | Onde | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `id` | query | int | não | Filtra por id do colaborador |
| `data_inicio` | query | date | não* | Início do período (usar junto com `data_fim`) |
| `data_fim` | query | date | não* | Fim do período |

### `PUT /api/premiacoes`

Aceita array puro `[...]` **ou** objeto `{"dados": [...]}`.

```json
{
  "mes_de_referencia": "date — usado como padrão para itens que não trazem 'mes de referencia' próprio",
  "dados": [
    {
      "id colaborador": "int, obrigatório, deve existir",
      "mes de referencia": "date, obrigatório (ou herda do campo do topo)",
      "pev": "numeric, opcional",
      "premiacao iconic": "numeric, opcional",
      "filtros": "numeric, opcional",
      "campanhas de fornecedores": "numeric, opcional",
      "inadimplencia": "numeric, opcional"
    }
  ]
}
```

Bloqueado (`403`) se a tela `premiacao` estiver travada para a filial/mês do lançamento (ver [Bloqueios](#bloqueios)) — exceto para o Admin.

### `GET /api/premiacoes/exportar-csv`

Mesmos parâmetros do `GET /api/premiacoes`. Retorna `{"arquivo csv": "<base64>", "mensagem": "..."}`.

---

## Consolidado PEV

### `GET /api/consolidado`

| Parâmetro | Onde | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `ano` | query | int | não | Ano do ciclo fiscal (padrão: ano atual). Ciclo = dezembro do ano anterior até novembro do ano informado |
| `filial` | query | string | não | Código da filial |

Base de cálculo = 28% do total acumulado no ciclo.

### `PUT /api/consolidado/adiantamento`

Aceita array puro `[...]` ou `{"dados": [...]}`.

```json
[
  {
    "id colaborador": "int, obrigatório, deve existir",
    "ano referencia": "int, obrigatório",
    "adiantamento": "numeric, obrigatório"
  }
]
```

### `GET /api/consolidado/exportar-csv`

Mesmos parâmetros do `GET /api/consolidado`.

---

## Comissões

### `GET /api/comissoes`

| Parâmetro | Onde | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `mes_de_referencia` | query | date | sim (na prática) | Filtra comissões desse mês |

O campo `pev` da resposta é buscado ao vivo em Premiações (nunca é gravável nesta tela).

### `PUT /api/comissoes`

Aceita array puro `[...]` ou `{"dados": [...]}`.

```json
[
  {
    "id colaborador": "int, obrigatório, deve existir",
    "mes de referencia": "date, obrigatório",
    "comissao": "numeric, obrigatório",
    "garantido": "numeric, obrigatório"
  }
]
```

Bloqueado (`403`) se a tela `comissao` estiver travada para a filial/mês — exceto para o Admin.

### `GET /api/comissoes/exportar-csv`

| Parâmetro | Onde | Tipo | Obrigatório |
|---|---|---|---|
| `mes_de_referencia` | query | date | sim |

---

## Descontos e Bonificações

### `GET /api/descontos-bonificacoes`

| Parâmetro | Onde | Tipo | Obrigatório |
|---|---|---|---|
| `mes_de_referencia` | query | date | sim |

### `PUT /api/descontos-bonificacoes`

Aceita array puro `[...]` ou `{"dados": [...]}`.

```json
[
  {
    "id colaborador": "int, obrigatório, deve existir",
    "mes de referencia": "date, obrigatório",
    "dados": [
      {
        "tipo": "string, obrigatório — um dos 10 valores fixos abaixo",
        "valor": "numeric, obrigatório",
        "observacoes": "string, opcional"
      }
    ]
  }
]
```

Valores válidos de `"tipo"`:
`Ajuda de Custo/Gratificação`, `Bonificação`, `Compra de mercadorias`, `Convênio Gás`, `Desconto autorizado (descrever em observações)`, `Diária`, `Farmácia`, `Franquia`, `Manutenção veículos`, `Multa`.

Bloqueado (`403`) se a tela `descontos` estiver travada para a filial/mês — exceto para o Admin.

### `DELETE /api/descontos-bonificacoes`

```json
{
  "id_do_desconto": "int, obrigatório, deve existir",
  "id_do_colaborador": "int, obrigatório, deve existir"
}
```

### `GET /api/descontos-bonificacoes/exportar-csv`

| Parâmetro | Onde | Tipo | Obrigatório |
|---|---|---|---|
| `mes_de_referencia` | query | date | sim |

---

## Lançamentos (Plano de Saúde/Odontológico)

Lançamento mensal **por pessoa** (titular OU dependente) × **tipo de plano**. O valor titular/dependente **não é enviado** — é calculado automaticamente (filiais `401`/`403` = R$255,54 saúde; demais = R$185,27; odontológico = R$13,56 fixo para todos). Só `valor adicional`/`valor coparticipacao` são graváveis, e só têm efeito no plano de saúde.

### `GET /api/lancamentos`

| Parâmetro | Onde | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `mes_de_referencia` | query | date | sim | |
| `tipo_plano` | query | string | sim | `saude` ou `odontologico` |
| `filial` | query | string | não | Código da filial |

### `PUT /api/lancamentos`

Aceita array puro `[...]` ou `{"dados": [...]}`.

```json
[
  {
    "id colaborador": "int, obrigatório, deve existir — sempre o titular",
    "id dependente": "int, opcional, deve existir — só se o lançamento for do dependente, não do titular",
    "tipo plano": "saude | odontologico, obrigatório",
    "mes de referencia": "date, obrigatório",
    "valor adicional": "numeric, opcional — só tem efeito se 'tipo plano' = saude",
    "valor coparticipacao": "numeric, opcional — só tem efeito se 'tipo plano' = saude"
  }
]
```

Bloqueado (`403`) se a tela `planoSaude` estiver travada para a filial/mês — exceto para o Admin.

### `GET /api/lancamentos/exportar-csv`

Mesmos parâmetros do `GET /api/lancamentos`.

---

## Dependentes

Cadastro permanente do titular — não vinculado a um lançamento específico.

### `GET /api/dependentes`

| Parâmetro | Onde | Tipo | Obrigatório |
|---|---|---|---|
| `id colaborador` | query | int | não |

### `POST /api/dependentes`

Só o **Admin** pode chamar.

```json
{
  "nome": "string, obrigatório",
  "cpf": "string, opcional",
  "id colaborador": "int, obrigatório, deve existir"
}
```

### `PUT /api/dependentes/{id}`

Só o **Admin** pode chamar.

```json
{
  "nome": "string, opcional",
  "cpf": "string, opcional"
}
```

### `DELETE /api/dependentes/{id}`

Só o **Admin** pode chamar. Sem parâmetros de entrada.

---

## Bloqueios

Admin trava lançamentos de uma tela numa filial/mês — enquanto travado, quem não é Admin não consegue salvar naquela tela/filial/mês.

### `GET /api/bloqueios`

| Parâmetro | Onde | Tipo | Obrigatório |
|---|---|---|---|
| `filial` | query | string | não |
| `mes_de_referencia` | query | date | não |

### `PUT /api/bloqueios/alternar`

Só o **Admin** pode chamar. Alterna: se já estiver travado, destrava; se não, trava.

```json
{
  "tela": "premiacao | planoSaude | descontos | comissao | estoque — obrigatório",
  "filial": "string, obrigatório — código de filial existente",
  "mes de referencia": "date, obrigatório"
}
```

**Resposta:** `{"bloqueado": true|false, "mensagem": "..."}`
