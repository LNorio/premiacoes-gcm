# Paleta Mapeada (Design Tokens) — Sistema de Premiações

Paleta pronta para virar tema, em **duas camadas**:

1. **Tokens crus** — os valores hexadecimais nomeados (a paleta em si).
2. **Papéis semânticos** — nomes por função (primary, surface, text, border, estados) que **apontam** para os tokens crus. As telas usam os papéis, não os valores; trocar uma cor de papel muda o sistema inteiro sem caçar hex no código.

Abaixo, o mapeamento semântico e o mesmo tema expresso em CSS, TS/JS, Tailwind e SCSS — escolha o formato conforme a stack definida em F0.

---

## 1. Camada semântica (papel → token → hex)

| Papel | Aponta para | Hex | Onde se aplica |
|---|---|---|---|
| `primary` | azul-principal | `#0063B3` | Ação principal, marca, foco, valores em destaque |
| `primary-hover` | azul-escuro | `#00457E` | Hover/pressionado de elementos primários; títulos de destaque |
| `primary-subtle` | azul-claro | `#EAF3FB` | Fundo suave; hover de linha de tabela |
| `border` | azul-borda | `#CFE3F5` | Borda de campos e blocos |
| `background` | cinza-100 | `#F4F7FA` | Fundo de página; fundo de rodapé de tabela |
| `surface` | branco | `#FFFFFF` | Cartões, tabelas, superfícies |
| `divider` | cinza-300 | `#C9D2DC` | Divisórias e topos de rodapé |
| `text-primary` | cinza-950 | `#1B2430` | Texto principal |
| `text-secondary` | cinza-700 | `#45505E` | Texto de apoio |
| `text-muted` | cinza-500 | `#728093` | Rótulos, legendas |
| `text-on-fill` | branco | `#FFFFFF` | Texto sobre preenchimento sólido (azul/sucesso/alerta) |
| `accent` | dourado | `#C49A4E` | Acento de premiação; borda de destaque |
| `accent-text` | dourado-escuro | `#9D7B3E` | Texto de destaque/totais sobre fundo claro |
| `accent-subtle` | dourado-claro | `#F6F0E4` | Fundo de selo de perfil; base de gradiente |
| `success` | sucesso | `#1E8E5A` | Toast de sucesso; indicadores positivos |
| `success-subtle` | sucesso-claro | `#E4F5EC` | Fundo de mensagem de sucesso |
| `danger` | alerta | `#D64545` | Toast de erro; validações |
| `danger-subtle` | alerta-claro | `#FBE8E8` | Fundo de mensagem de erro |

---

## 2. CSS custom properties (fonte de verdade)

Serve a qualquer stack — inclusive React/Vue via classes utilitárias ou `var(--…)` direto.

```css
:root {
  /* --- tokens crus --- */
  --azul-principal: #0063B3;
  --azul-escuro:    #00457E;
  --azul-claro:     #EAF3FB;
  --azul-borda:     #CFE3F5;
  --branco:         #FFFFFF;
  --cinza-950: #1B2430;
  --cinza-700: #45505E;
  --cinza-500: #728093;
  --cinza-300: #C9D2DC;
  --cinza-100: #F4F7FA;
  --dourado:        #C49A4E;
  --dourado-escuro: #9D7B3E;
  --dourado-claro:  #F6F0E4;
  --sucesso:        #1E8E5A;
  --sucesso-claro:  #E4F5EC;
  --alerta:         #D64545;
  --alerta-claro:   #FBE8E8;

  /* --- papéis semânticos (apontam para os tokens acima) --- */
  --cor-primary:        var(--azul-principal);
  --cor-primary-hover:  var(--azul-escuro);
  --cor-primary-subtle: var(--azul-claro);
  --cor-border:         var(--azul-borda);
  --cor-background:     var(--cinza-100);
  --cor-surface:        var(--branco);
  --cor-divider:        var(--cinza-300);
  --cor-text-primary:   var(--cinza-950);
  --cor-text-secondary: var(--cinza-700);
  --cor-text-muted:     var(--cinza-500);
  --cor-text-on-fill:   var(--branco);
  --cor-accent:         var(--dourado);
  --cor-accent-text:    var(--dourado-escuro);
  --cor-accent-subtle:  var(--dourado-claro);
  --cor-success:        var(--sucesso);
  --cor-success-subtle: var(--sucesso-claro);
  --cor-danger:         var(--alerta);
  --cor-danger-subtle:  var(--alerta-claro);
}
```

---

## 3. Objeto de tokens (TS/JS) — React, Vue ou qualquer bundler

```ts
// theme/colors.ts
export const palette = {
  azul:    { principal: '#0063B3', escuro: '#00457E', claro: '#EAF3FB', borda: '#CFE3F5' },
  branco:  '#FFFFFF',
  cinza:   { 950: '#1B2430', 700: '#45505E', 500: '#728093', 300: '#C9D2DC', 100: '#F4F7FA' },
  dourado: { base: '#C49A4E', escuro: '#9D7B3E', claro: '#F6F0E4' },
  sucesso: { base: '#1E8E5A', claro: '#E4F5EC' },
  alerta:  { base: '#D64545', claro: '#FBE8E8' },
} as const;

export const theme = {
  primary:        palette.azul.principal,
  primaryHover:   palette.azul.escuro,
  primarySubtle:  palette.azul.claro,
  border:         palette.azul.borda,
  background:     palette.cinza[100],
  surface:        palette.branco,
  divider:        palette.cinza[300],
  textPrimary:    palette.cinza[950],
  textSecondary:  palette.cinza[700],
  textMuted:      palette.cinza[500],
  textOnFill:     palette.branco,
  accent:         palette.dourado.base,
  accentText:     palette.dourado.escuro,
  accentSubtle:   palette.dourado.claro,
  success:        palette.sucesso.base,
  successSubtle:  palette.sucesso.claro,
  danger:         palette.alerta.base,
  dangerSubtle:   palette.alerta.claro,
} as const;

export type ThemeColor = keyof typeof theme;
```

---

## 4. Tailwind CSS

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        azul:    { DEFAULT: '#0063B3', escuro: '#00457E', claro: '#EAF3FB', borda: '#CFE3F5' },
        cinza:   { 100: '#F4F7FA', 300: '#C9D2DC', 500: '#728093', 700: '#45505E', 950: '#1B2430' },
        dourado: { DEFAULT: '#C49A4E', escuro: '#9D7B3E', claro: '#F6F0E4' },
        sucesso: { DEFAULT: '#1E8E5A', claro: '#E4F5EC' },
        alerta:  { DEFAULT: '#D64545', claro: '#FBE8E8' },
        // aliases semânticos opcionais:
        primary:    '#0063B3',
        surface:    '#FFFFFF',
        background:  '#F4F7FA',
      },
    },
  },
};
```

Uso: `bg-azul text-white`, `hover:bg-azul-escuro`, `text-cinza-950`, `border-azul-borda`, `bg-cinza-100`, `text-dourado-escuro`, `bg-sucesso`, `bg-alerta-claro`.

---

## 5. SCSS

```scss
// _colors.scss
$azul-principal: #0063B3;
$azul-escuro:    #00457E;
$azul-claro:     #EAF3FB;
$azul-borda:     #CFE3F5;
$branco:         #FFFFFF;
$cinza-950: #1B2430;
$cinza-700: #45505E;
$cinza-500: #728093;
$cinza-300: #C9D2DC;
$cinza-100: #F4F7FA;
$dourado:        #C49A4E;
$dourado-escuro: #9D7B3E;
$dourado-claro:  #F6F0E4;
$sucesso:        #1E8E5A;
$sucesso-claro:  #E4F5EC;
$alerta:         #D64545;
$alerta-claro:   #FBE8E8;

// papéis semânticos
$cor-primary:       $azul-principal;
$cor-primary-hover: $azul-escuro;
$cor-surface:       $branco;
$cor-background:    $cinza-100;
$cor-text-primary:  $cinza-950;
$cor-accent-text:   $dourado-escuro;
$cor-success:       $sucesso;
$cor-danger:        $alerta;
```

---

## 6. Recomendações de uso

- **Programe contra os papéis semânticos**, não contra os tokens crus (`primary`, não `azul-principal`) — facilita ajustes e um eventual tema alternativo.
- **CSS custom properties como fonte única.** Mesmo com Tailwind ou objeto TS, mantenha o `:root` como referência; os demais formatos derivam dele.
- **Acessibilidade:** o dourado é acento — para texto use `accent-text` (`--dourado-escuro`); sobre preenchimentos sólidos use `text-on-fill` (branco). Valide os pares com meta WCAG AA.
- Se a stack for um kit de UI com tema próprio (Vuetify, MUI, etc.), mapeie os papéis da seção 1 para as chaves de tema do kit, mantendo os mesmos valores.
