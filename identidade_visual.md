# Passis — Identidade Visual e Design Tokens

Guia de cores e padrões visuais para o dashboard web do Passis. Construído em cima do que já existe no projeto (cards brancos, `border-left` de destaque, sombra suave, `border-radius: 6px`) — não é um redesign do zero, é uma evolução de paleta e consistência.

---

## 1. Paleta de cores

### Cor de marca — Indigo
Evolução do `#667eea` que já está em uso. Mais saturado, vira protagonista real em vez de coadjuvante.

```css
--color-brand-50:  #EEF0FF;
--color-brand-100: #E0E3FE;
--color-brand-300: #A5ABF5;
--color-brand-500: #6366F1;  /* indigo padrão, hover/links */
--color-brand-600: #4F46E5;  /* cor de marca principal — border-left, botões primários */
--color-brand-800: #3730A3;
```

### Sucesso / positivo — Teal
Substitui o `#3498db` usado hoje no "live badge". Fica reservado para metas batidas, sync ok, tendência positiva.

```css
--color-success-50:  #E6FAF6;
--color-success-500: #14B8A6;
--color-success-700: #0F6E56;  /* texto sobre fundo success-50 */
```

### Alerta — Coral
Não existe hoje no projeto. Necessário para estados de atenção (meta não batida, sync falhou, dado fora do padrão).

```css
--color-warning-50:  #FFF3EC;
--color-warning-500: #F97316;
--color-warning-700: #C2410C;  /* texto sobre fundo warning-50 */
```

### Erro — Vermelho
Para falhas reais (não confundir com warning).

```css
--color-danger-50:  #FEEDED;
--color-danger-500: #E24B4A;
--color-danger-700: #A32D2D;
```

### Neutros — Slate
Substitui `#2c3e50` / `#34495e` / `#ecf0f1` por uma variante mais profunda da mesma família.

```css
--color-text-primary:    #1E293B;  /* títulos, h1, h2 */
--color-text-secondary:  #64748B;  /* texto de apoio, parágrafos */
--color-text-tertiary:   #94A3B8;  /* timestamps, legendas, .dashboard-sync-info */

--color-bg-page:         #F1F5F9;  /* fundo geral do app (body) */
--color-bg-surface:      #FFFFFF;  /* cards */
--color-border:          #E2E8F0;  /* bordas e divisores (dashboard-chart-header) */
```

---

## 2. Como mapear no que já existe

| Elemento atual | Cor atual | Trocar por |
|---|---|---|
| `body background-color` | `#ecf0f1` | `--color-bg-page` (`#F1F5F9`) |
| `h1`, `h2` color | `#2c3e50` / `#34495e` | `--color-text-primary` (`#1E293B`) |
| `p` color | `#555` | `--color-text-secondary` (`#64748B`) |
| `.dashboard-filters-card` / `.dashboard-chart-card` border-left | `#667eea` | `--color-brand-600` (`#4F46E5`) |
| `.dashboard-chart-header` border-bottom | `#ecf0f1` | `--color-border` (`#E2E8F0`) |
| `.live-badge` background | `#e3f2fd` | `--color-success-50` (`#E6FAF6`) |
| `.live-badge` border | `#bbdefb` | `--color-success-500` a 30% opacidade, ou remover |
| `.live-dot` background | `#3498db` | `--color-success-500` (`#14B8A6`) |
| `.live-badge span:last-child` color | `#3498db` | `--color-success-700` (`#0F6E56`) |
| `.dashboard-sync-info` color | `#95a5a6` | `--color-text-tertiary` (`#94A3B8`) |
| Seta do `<select>` (stroke do SVG) | `#3498db` | `--color-brand-600` (`#4F46E5`) |

**Novo, a criar:**
- Estado de alerta/warning nos cards (ex: meta não batida, sono baixo) — usar `--color-warning-50` como fundo de um badge ou borda lateral, `--color-warning-700` no texto, ícone de alerta.
- Estado de erro (ex: falha de sync) — mesma lógica com `--color-danger-*`.

---

## 3. Regras de uso

- **Indigo é a única cor "de marca"** — usar em: border-left de cards, botões primários, links, ícone do app, foco de inputs. Não usar indigo para indicar status (isso é papel do teal/coral/vermelho).
- **Teal = positivo**, sempre. Streak ativo, meta batida, sync concluído, tendência de melhora.
- **Coral = atenção, não erro**. Algo que merece o olhar do usuário mas não é uma falha do sistema (ex: dormiu pouco, não bateu meta de passos).
- **Vermelho = falha real**. Sync quebrado, erro de API, dado corrompido.
- **Texto sobre fundo colorido**: sempre usar a variante escura (700) da mesma família, nunca preto puro ou cinza genérico. Ex: badge com fundo `--color-success-50` usa texto `--color-success-700`, nunca `#000`.
- **Bordas com `border-left` (acento lateral)**: manter `border-radius: 0` nesse lado, ou usar `border-radius: 0 6px 6px 0` para não arredondar o canto que tem a borda colorida — hoje o CSS aplica `border-radius: 6px` nos 4 cantos junto com `border-left`, o que tecnicamente "corta" o canto esquerdo. Ajuste sugerido:

```css
.dashboard-filters-card,
.dashboard-chart-card {
  border-radius: 0 6px 6px 0;
}
```

---

## 4. Tipografia e espaçamento (mantidos como estão)

Sem mudanças — o stack `-apple-system, BlinkMacSystemFont, 'Segoe UI'...` e a escala de `h1` (2rem) / `h2` já funcionam bem para um dashboard de dados. Manter `box-sizing: border-box` e o padrão de `padding: 20px` nos cards.

---

## 5. Resumo rápido (copiar para `:root` do CSS)

```css
:root {
  /* marca */
  --color-brand-50:  #EEF0FF;
  --color-brand-100: #E0E3FE;
  --color-brand-300: #A5ABF5;
  --color-brand-500: #6366F1;
  --color-brand-600: #4F46E5;
  --color-brand-800: #3730A3;

  /* status */
  --color-success-50:  #E6FAF6;
  --color-success-500: #14B8A6;
  --color-success-700: #0F6E56;

  --color-warning-50:  #FFF3EC;
  --color-warning-500: #F97316;
  --color-warning-700: #C2410C;

  --color-danger-50:  #FEEDED;
  --color-danger-500: #E24B4A;
  --color-danger-700: #A32D2D;

  /* neutros */
  --color-text-primary:   #1E293B;
  --color-text-secondary: #64748B;
  --color-text-tertiary:  #94A3B8;

  --color-bg-page:    #F1F5F9;
  --color-bg-surface: #FFFFFF;
  --color-border:     #E2E8F0;
}
```