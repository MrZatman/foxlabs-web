# Styles & Theme

Sistema de estilos con Tailwind CSS v4 y tema oscuro.

## Theme Colors

```css
/* Backgrounds */
bg-black           /* Main page background */
bg-zinc-900        /* Card/panel background */
bg-zinc-800        /* Secondary elements */
bg-zinc-800/50     /* Subtle/muted background */
bg-zinc-700        /* Hover states */

/* Borders */
border-zinc-800    /* Default border */
border-zinc-700    /* Hover border */
border-zinc-600    /* Active/focus border */

/* Text */
text-white         /* Primary text */
text-zinc-300      /* Secondary text */
text-zinc-400      /* Muted text */
text-zinc-500      /* Subtle/placeholder text */

/* Brand (Orange) */
text-orange-500    /* Brand color */
bg-orange-500      /* Primary buttons */
hover:bg-orange-600
```

## Status Colors

```css
/* Success (Green) */
text-green-400
bg-green-500/10
bg-green-500/20
border-green-500/30

/* Error (Red) */
text-red-400
bg-red-500/10
bg-red-500/20
border-red-500/30

/* Warning (Yellow) */
text-yellow-400
bg-yellow-500/10
bg-yellow-500/20
border-yellow-500/30

/* Info (Blue) */
text-blue-400
bg-blue-500/10
bg-blue-500/20
border-blue-500/30

/* Progress/Active (Orange) */
text-orange-400
bg-orange-500/20

/* Special (Purple, Cyan, Pink) */
text-purple-400    /* Approved */
text-cyan-400      /* Deploying */
text-pink-400      /* Deployed */
```

## Common Patterns

### Card con Hover

```tsx
<Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
  {/* content */}
</Card>
```

### Icon Container

```tsx
<div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
  <Icon size={20} />
</div>
```

### Status Indicator

```tsx
<span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
```

### Alert/Highlight Box

```tsx
<div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
  Contenido de alerta
</div>
```

### List Item Hover

```tsx
<div className="p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
  {/* item content */}
</div>
```

## Layout Patterns

### Page Container

```tsx
<div className="space-y-6">
  <div>
    <h1 className="text-2xl font-bold">Titulo</h1>
    <p className="text-zinc-400">Subtitulo</p>
  </div>

  {/* Content */}
</div>
```

### Grid Stats

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### Two Column Layout

```tsx
<div className="grid lg:grid-cols-2 gap-6">
  <Card>{/* Left */}</Card>
  <Card>{/* Right */}</Card>
</div>
```

### Navbar

```tsx
<nav className="border-b border-zinc-800 p-4">
  <div className="max-w-4xl mx-auto flex items-center justify-between">
    <Link className="text-xl font-bold text-orange-500">FoxLabs</Link>
    <div className="flex items-center gap-4">
      {/* nav items */}
    </div>
  </div>
</nav>
```

## Animations

```css
/* Pulse for loading/active states */
animate-pulse

/* Spin for loading icons */
animate-spin

/* Transition for hover */
transition-colors
transition-opacity
transition-all
```

## DO

- Usar zinc para neutrals
- Usar orange-500 para brand/CTA
- Usar `/10` o `/20` para backgrounds sutiles
- Combinar bg + text del mismo color
- Usar `space-y-N` para spacing vertical

## DON'T

- NO usar grays (usar zinc)
- NO usar colores fuera del tema
- NO hardcodear hex values
- NO olvidar estados hover
- NO usar white backgrounds
