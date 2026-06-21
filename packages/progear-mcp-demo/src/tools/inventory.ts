import { z } from 'zod';
import { SCOPES } from '../config.js';
import type { ToolDefinition } from './types.js';
import {
  products, getProduct, productsByCategory, totalStock, lowStockProducts, categories,
  warehouses, getWarehouse,
  suppliers, getSupplier,
} from '../data/index.js';

const domain = 'inventory' as const;

export const inventoryTools: ToolDefinition[] = [
  {
    name: 'list_products', domain,
    description: 'List products in the catalog, optionally filtered by category.',
    inputShape: { category: z.string().optional(), limit: z.number().int().positive().optional() },
    requiredScopes: [SCOPES.inventory.read],
    handler: ({ category, limit }) => {
      let result = category ? productsByCategory(category as string) : products;
      if (limit) result = result.slice(0, limit as number);
      return {
        count: result.length,
        categories,
        products: result.map((p) => ({
          id: p.id, sku: p.sku, name: p.name,
          category: p.category, subcategory: p.subcategory,
          price: p.price, stock: totalStock(p), status: p.status,
        })),
      };
    },
  },
  {
    name: 'search_inventory', domain,
    description: 'Search products by keyword in name, category, or tags.',
    inputShape: { query: z.string() },
    requiredScopes: [SCOPES.inventory.read],
    handler: ({ query }) => {
      const q = (query as string).toLowerCase();
      const hits = products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
      );
      return {
        query, count: hits.length,
        products: hits.map((p) => ({ id: p.id, sku: p.sku, name: p.name, category: p.category, price: p.price, stock: totalStock(p) })),
      };
    },
  },
  {
    name: 'check_stock', domain,
    description: 'Check stock levels and reorder status for a specific product.',
    inputShape: { productId: z.string() },
    requiredScopes: [SCOPES.inventory.read],
    handler: ({ productId }) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const total = totalStock(p);
      const stockStatus = total <= p.reorderPoint ? 'low' : total >= p.reorderPoint * 3 ? 'abundant' : 'adequate';
      return {
        productId: p.id, sku: p.sku, name: p.name, category: p.category,
        totalStock: total, reorderPoint: p.reorderPoint, stockStatus,
        stockByWarehouse: p.stockByWarehouse,
        supplierId: p.supplierId, status: p.status,
      };
    },
  },
  {
    name: 'get_warehouse_stock', domain,
    description: 'Get stock levels for a specific warehouse.',
    inputShape: { warehouseId: z.string(), limit: z.number().int().positive().optional() },
    requiredScopes: [SCOPES.inventory.read],
    handler: ({ warehouseId, limit }) => {
      const wh = getWarehouse(warehouseId as string);
      if (!wh) return { error: 'warehouse_not_found', warehouseId };
      const key = wh.id as keyof typeof products[number]['stockByWarehouse'];
      const list = products
        .map((p) => ({ id: p.id, sku: p.sku, name: p.name, stock: p.stockByWarehouse[key], reorderPoint: p.reorderPoint }))
        .sort((a, b) => a.stock - b.stock);
      return {
        warehouse: wh,
        products: limit ? list.slice(0, limit as number) : list,
        totalProducts: list.length,
      };
    },
  },
  {
    name: 'get_low_stock_alerts', domain,
    description: 'List products that are at or below their reorder threshold.',
    inputShape: {},
    requiredScopes: [SCOPES.inventory.read],
    handler: () => {
      const low = lowStockProducts();
      return {
        count: low.length,
        alerts: low.map((p) => ({
          productId: p.id, sku: p.sku, name: p.name,
          totalStock: totalStock(p), reorderPoint: p.reorderPoint,
          supplierId: p.supplierId, category: p.category,
        })),
      };
    },
  },
  {
    name: 'get_supplier_info', domain,
    description: 'Get supplier details, including lead times and minimum order quantities.',
    inputShape: { supplierId: z.string().optional() },
    requiredScopes: [SCOPES.inventory.read],
    handler: ({ supplierId }) => {
      if (supplierId) {
        const s = getSupplier(supplierId as string);
        return s ? { supplier: s } : { error: 'supplier_not_found', supplierId };
      }
      return { suppliers, count: suppliers.length };
    },
  },

  // ---- Write tools (Sarah denied) ----
  {
    name: 'adjust_stock', domain,
    description: 'Adjust the stock level of a product in a specific warehouse (positive or negative delta).',
    inputShape: {
      productId: z.string(),
      warehouseId: z.enum(['WH-WEST', 'WH-CENTRAL', 'WH-EAST', 'WH-NORTH']),
      delta: z.number().int(),
      reason: z.string().optional(),
    },
    requiredScopes: [SCOPES.inventory.write],
    handler: ({ productId, warehouseId, delta, reason }, ctx) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const key = warehouseId as keyof typeof p.stockByWarehouse;
      const previous = p.stockByWarehouse[key];
      p.stockByWarehouse[key] = Math.max(0, previous + (delta as number));
      return {
        action: 'stock_adjusted',
        productId: p.id, warehouseId, previous, delta, newStock: p.stockByWarehouse[key],
        reason: reason || 'no reason provided',
        performedBy: ctx.sub,
      };
    },
  },
  {
    name: 'add_inventory', domain,
    description: 'Add a received shipment to inventory for a product at a warehouse.',
    inputShape: {
      productId: z.string(),
      warehouseId: z.enum(['WH-WEST', 'WH-CENTRAL', 'WH-EAST', 'WH-NORTH']),
      quantity: z.number().int().positive(),
      purchaseOrderRef: z.string().optional(),
    },
    requiredScopes: [SCOPES.inventory.write],
    handler: ({ productId, warehouseId, quantity, purchaseOrderRef }, ctx) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const key = warehouseId as keyof typeof p.stockByWarehouse;
      p.stockByWarehouse[key] += quantity as number;
      return {
        action: 'inventory_added',
        productId: p.id, warehouseId, added: quantity, newStock: p.stockByWarehouse[key],
        purchaseOrderRef: purchaseOrderRef || null,
        performedBy: ctx.sub,
      };
    },
  },
  {
    name: 'reorder_product', domain,
    description: 'Trigger a reorder request to the supplier for a product.',
    inputShape: { productId: z.string(), quantity: z.number().int().positive() },
    requiredScopes: [SCOPES.inventory.write],
    handler: ({ productId, quantity }, ctx) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const supplier = getSupplier(p.supplierId);
      return {
        action: 'reorder_submitted',
        productId: p.id, quantity,
        supplier: supplier ? { id: supplier.id, name: supplier.name, leadTimeDays: supplier.leadTimeDays } : null,
        estimatedArrival: supplier ? `in ${supplier.leadTimeDays} days` : 'unknown',
        performedBy: ctx.sub,
      };
    },
  },
  {
    name: 'transfer_stock', domain,
    description: 'Transfer stock of a product from one warehouse to another.',
    inputShape: {
      productId: z.string(),
      fromWarehouse: z.enum(['WH-WEST', 'WH-CENTRAL', 'WH-EAST', 'WH-NORTH']),
      toWarehouse: z.enum(['WH-WEST', 'WH-CENTRAL', 'WH-EAST', 'WH-NORTH']),
      quantity: z.number().int().positive(),
    },
    requiredScopes: [SCOPES.inventory.write],
    handler: ({ productId, fromWarehouse, toWarehouse, quantity }, ctx) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      if (fromWarehouse === toWarehouse) return { error: 'same_warehouse' };
      const fromKey = fromWarehouse as keyof typeof p.stockByWarehouse;
      const toKey = toWarehouse as keyof typeof p.stockByWarehouse;
      if (p.stockByWarehouse[fromKey] < (quantity as number)) {
        return { error: 'insufficient_stock', available: p.stockByWarehouse[fromKey], requested: quantity };
      }
      p.stockByWarehouse[fromKey] -= quantity as number;
      p.stockByWarehouse[toKey] += quantity as number;
      return {
        action: 'stock_transferred',
        productId: p.id, quantity, fromWarehouse, toWarehouse,
        newLevels: { [fromWarehouse as string]: p.stockByWarehouse[fromKey], [toWarehouse as string]: p.stockByWarehouse[toKey] },
        performedBy: ctx.sub,
      };
    },
  },
];
