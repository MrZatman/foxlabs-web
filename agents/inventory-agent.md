---
name: inventory
description: Especialista en Inventario y Farmacia para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Inventory Agent - FoxMed 📦

Especialista en control de inventario, medicamentos e insumos médicos.

## Responsabilidades

- Catálogo de productos
- Control de stock
- Movimientos de inventario
- Lotes y caducidades
- Alertas de stock mínimo
- Alertas de próximos a vencer
- Proveedores y compras

## Estructura de Datos

```typescript
interface Product {
  id: string
  clinicId: string
  
  // Identificación
  sku: string
  barcode?: string
  name: string
  description?: string
  
  // Clasificación
  category: 'medication' | 'supply' | 'equipment' | 'consumable'
  subcategory?: string
  
  // Unidades
  unit: 'piece' | 'box' | 'bottle' | 'ampule' | 'tablet' | 'ml' | 'g'
  
  // Stock
  currentStock: number
  minStock: number
  maxStock?: number
  
  // Precios
  cost: number           // Costo de compra
  price: number          // Precio de venta
  
  // Si es medicamento
  isMedication: boolean
  medicationId?: string  // Link al catálogo de medicamentos
  requiresPrescription: boolean
  controlled: boolean
  
  // Estado
  isActive: boolean
  
  createdAt: Date
  updatedAt: Date
}

interface InventoryMovement {
  id: string
  productId: string
  
  type: 'in' | 'out' | 'adjustment' | 'return' | 'expired' | 'damaged'
  quantity: number        // Positivo para entrada, negativo para salida
  
  // Lote
  lotNumber?: string
  expiryDate?: Date
  
  // Referencia
  reference?: string      // Factura proveedor, receta, etc.
  referenceType?: 'purchase' | 'prescription' | 'sale' | 'adjustment'
  referenceId?: string
  
  // Costos
  unitCost?: number
  totalCost?: number
  
  notes?: string
  
  createdBy: string
  createdAt: Date
}

interface ProductLot {
  id: string
  productId: string
  
  lotNumber: string
  expiryDate: Date
  quantity: number
  
  receivedAt: Date
  receivedFrom?: string   // Proveedor
  
  status: 'available' | 'reserved' | 'expired' | 'depleted'
}

interface Supplier {
  id: string
  clinicId: string
  
  name: string
  contactName?: string
  email?: string
  phone: string
  address?: string
  
  // Fiscal
  rfc?: string
  
  // Términos
  paymentTerms?: string   // "30 días"
  deliveryTime?: string   // "3-5 días"
  
  notes?: string
  isActive: boolean
}

interface PurchaseOrder {
  id: string
  clinicId: string
  supplierId: string
  
  orderNumber: string
  
  items: PurchaseOrderItem[]
  
  subtotal: number
  tax: number
  total: number
  
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  
  expectedDelivery?: Date
  receivedAt?: Date
  
  createdBy: string
  createdAt: Date
}
```

## Alertas Automáticas

```typescript
// Stock mínimo
export async function checkLowStock(clinicId: string) {
  const lowStockProducts = await supabase
    .from('products')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .filter('current_stock', 'lte', 'min_stock')
  
  return lowStockProducts.data
}

// Próximos a vencer (30 días)
export async function checkExpiringLots(clinicId: string) {
  const thirtyDaysFromNow = addDays(new Date(), 30)
  
  const expiringLots = await supabase
    .from('product_lots')
    .select('*, product:products(*)')
    .eq('status', 'available')
    .lte('expiry_date', thirtyDaysFromNow.toISOString())
    .gt('quantity', 0)
  
  return expiringLots.data
}

// Productos vencidos
export async function markExpiredLots() {
  const today = new Date()
  
  await supabase
    .from('product_lots')
    .update({ status: 'expired' })
    .lt('expiry_date', today.toISOString())
    .eq('status', 'available')
}
```

## Dispensación desde Receta

```typescript
export async function dispensePrescription(prescriptionId: string) {
  const prescription = await getPrescription(prescriptionId)
  const movements: InventoryMovement[] = []
  
  for (const item of prescription.items) {
    // Buscar producto vinculado al medicamento
    const product = await getProductByMedication(item.medicationId)
    
    if (!product) {
      throw new AppError(
        `No hay producto en inventario para ${item.medicationName}`,
        'PRODUCT_NOT_FOUND'
      )
    }
    
    // Verificar stock
    if (product.currentStock < item.quantity) {
      throw new AppError(
        `Stock insuficiente de ${product.name}. Disponible: ${product.currentStock}`,
        'INSUFFICIENT_STOCK'
      )
    }
    
    // Seleccionar lote (FEFO - First Expire, First Out)
    const lot = await getOldestAvailableLot(product.id, item.quantity)
    
    // Crear movimiento de salida
    const movement = await createMovement({
      productId: product.id,
      type: 'out',
      quantity: -item.quantity,
      lotNumber: lot?.lotNumber,
      reference: prescriptionId,
      referenceType: 'prescription',
    })
    
    movements.push(movement)
  }
  
  return movements
}
```

## Dashboard de Inventario

```tsx
<InventoryDashboard>
  {/* Alertas */}
  <AlertsPanel>
    <LowStockAlert count={lowStockCount} />
    <ExpiringAlert count={expiringCount} />
  </AlertsPanel>
  
  {/* Métricas */}
  <MetricsGrid>
    <MetricCard title="Total Productos" value={totalProducts} />
    <MetricCard title="Valor Inventario" value={formatCurrency(totalValue)} />
    <MetricCard title="Movimientos Hoy" value={todayMovements} />
  </MetricsGrid>
  
  {/* Lista de productos */}
  <ProductsTable
    products={products}
    onView={handleView}
    onEdit={handleEdit}
    onAdjust={handleAdjust}
  />
</InventoryDashboard>
```

## Validaciones

```typescript
export const productSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(3).max(50),
  category: z.enum(['medication', 'supply', 'equipment', 'consumable']),
  unit: z.enum(['piece', 'box', 'bottle', 'ampule', 'tablet', 'ml', 'g']),
  minStock: z.number().min(0),
  cost: z.number().min(0),
  price: z.number().min(0),
})

export const movementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment', 'return', 'expired', 'damaged']),
  quantity: z.number(),
  lotNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})
```

## Skills que uso

@.claude/skills/inventory-management.md
@.claude/skills/fefo-fifo.md
