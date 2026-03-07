# UI Components

Componentes de shadcn/ui usados en foxlabs-web.

## Componentes Disponibles

```
src/components/ui/
├── badge.tsx
├── button.tsx
├── card.tsx
├── checkbox.tsx
├── dialog.tsx
├── form.tsx
├── input.tsx
├── label.tsx
├── progress.tsx
├── radio-group.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── tabs.tsx
└── textarea.tsx
```

## Card Pattern

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card className="bg-zinc-900 border-zinc-800">
  <CardHeader>
    <CardTitle>Titulo</CardTitle>
    <CardDescription>Descripcion opcional</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## Buttons

```tsx
import { Button } from '@/components/ui/button'

// Primary (orange brand color)
<Button className="bg-orange-500 hover:bg-orange-600">
  <Plus size={16} className="mr-2" />
  Nuevo
</Button>

// Variants
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="ghost" size="sm">Small</Button>
<Button variant="destructive">Eliminar</Button>
```

## Badge

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>

// Custom colors
<span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
  Completado
</span>
```

## Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="general">
    {/* Content */}
  </TabsContent>
  <TabsContent value="settings">
    {/* Content */}
  </TabsContent>
</Tabs>
```

## ScrollArea

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-[300px]">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</ScrollArea>
```

## Form Inputs

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<div className="space-y-4">
  <div>
    <Label htmlFor="name">Nombre</Label>
    <Input id="name" name="name" required />
  </div>

  <div>
    <Label htmlFor="description">Descripcion</Label>
    <Textarea id="description" name="description" rows={4} />
  </div>

  <div>
    <Label>Tipo</Label>
    <Select name="type" defaultValue="feature">
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="feature">Feature</SelectItem>
        <SelectItem value="bug">Bug</SelectItem>
        <SelectItem value="change">Cambio</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

## Iconos (Lucide)

```tsx
import {
  Users, Briefcase, FolderKanban, ListTodo,
  Clock, CheckCircle, XCircle, AlertTriangle,
  Plus, ArrowRight, ExternalLink, LogOut,
  Play, Pause, RefreshCw, GitCommit, Rocket
} from 'lucide-react'

<Users size={20} />
<CheckCircle className="h-6 w-6 text-green-400" />
```

## Theme Colors

```css
/* Background */
bg-black          /* Page background */
bg-zinc-900       /* Card background */
bg-zinc-800       /* Secondary background */
bg-zinc-800/50    /* Subtle background */

/* Border */
border-zinc-800   /* Default border */
border-zinc-700   /* Hover border */

/* Text */
text-white        /* Primary text */
text-zinc-400     /* Muted text */
text-zinc-500     /* Subtle text */

/* Brand */
text-orange-500   /* Primary brand */
bg-orange-500     /* Primary button */
hover:bg-orange-600
```

## DO

- Usar colores zinc para backgrounds
- Usar orange-500 para CTAs y brand
- Combinar Badge con colores custom
- Usar lucide-react para iconos

## DON'T

- NO crear componentes UI desde cero
- NO usar colores fuera del tema
- NO mezclar estilos de diferentes frameworks
