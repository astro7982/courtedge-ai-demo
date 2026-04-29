import { z } from 'zod';
import { SCOPES } from '../config.js';
import type { ToolDefinition } from './types.js';
import {
  orders, getOrder, ordersByCustomer, ordersByStatus, ordersByRep, ordersBetween,
  quotes, getQuote, quotesByStatus, openPipeline, pipelineValue,
  salesReps, getRep,
  getCustomer, customers,
  getProduct,
} from '../data/index.js';

const domain = 'sales' as const;

export const salesTools: ToolDefinition[] = [
  {
    name: 'list_orders', domain,
    description: 'List orders, optionally filtered by status or date range.',
    inputShape: {
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.number().int().positive().optional(),
    },
    requiredScopes: [SCOPES.sales.read],
    handler: ({ status, from, to, limit }) => {
      let result = orders;
      if (status) result = ordersByStatus(status as typeof orders[number]['status']);
      if (from && to) result = ordersBetween(from as string, to as string);
      result = [...result].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
      if (limit) result = result.slice(0, limit as number);
      return {
        count: result.length,
        orders: result.map((o) => ({
          id: o.id, customerId: o.customerId, customer: getCustomer(o.customerId)?.name,
          total: o.total, status: o.status, orderDate: o.orderDate, shipDate: o.shipDate,
        })),
      };
    },
  },
  {
    name: 'get_order', domain,
    description: 'Get full details of a specific order including line items.',
    inputShape: { orderId: z.string() },
    requiredScopes: [SCOPES.sales.read],
    handler: ({ orderId }) => {
      const o = getOrder(orderId as string);
      if (!o) return { error: 'order_not_found', orderId };
      return {
        ...o,
        customer: getCustomer(o.customerId),
        rep: getRep(o.repId),
      };
    },
  },
  {
    name: 'search_orders', domain,
    description: 'Search orders by customer name or product ID.',
    inputShape: { query: z.string() },
    requiredScopes: [SCOPES.sales.read],
    handler: ({ query }) => {
      const q = (query as string).toLowerCase();
      const hits = orders.filter((o) => {
        const customer = getCustomer(o.customerId);
        if (customer && customer.name.toLowerCase().includes(q)) return true;
        return o.items.some((i) => i.productId.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
      });
      return {
        query, count: hits.length,
        orders: hits.map((o) => ({ id: o.id, customer: getCustomer(o.customerId)?.name, total: o.total, status: o.status, orderDate: o.orderDate })),
      };
    },
  },
  {
    name: 'get_pipeline', domain,
    description: 'Get the open sales pipeline with weighted value by probability.',
    inputShape: { repId: z.string().optional() },
    requiredScopes: [SCOPES.sales.read],
    handler: ({ repId }) => {
      let pipeline = openPipeline();
      if (repId) pipeline = pipeline.filter((q) => q.repId === repId);
      const totalValue = pipeline.reduce((s, q) => s + q.total, 0);
      const weighted = pipeline.reduce((s, q) => s + q.total * (q.probability / 100), 0);
      return {
        openCount: pipeline.length,
        totalValue: Math.round(totalValue * 100) / 100,
        weightedValue: Math.round(weighted * 100) / 100,
        globalWeightedValue: Math.round(pipelineValue() * 100) / 100,
        quotes: pipeline.map((q) => ({
          id: q.id, customer: getCustomer(q.customerId)?.name, total: q.total, probability: q.probability,
          status: q.status, expectedCloseDate: q.expectedCloseDate, repId: q.repId,
        })),
      };
    },
  },
  {
    name: 'get_quotes', domain,
    description: 'List quotes by status (draft/sent/negotiating/won/lost).',
    inputShape: { status: z.enum(['draft', 'sent', 'negotiating', 'won', 'lost']).optional() },
    requiredScopes: [SCOPES.sales.read],
    handler: ({ status }) => {
      const list = status ? quotesByStatus(status as 'draft') : quotes;
      return {
        count: list.length,
        quotes: list.map((q) => ({
          id: q.id, customer: getCustomer(q.customerId)?.name, rep: getRep(q.repId)?.name,
          total: q.total, probability: q.probability, status: q.status, expectedCloseDate: q.expectedCloseDate,
        })),
      };
    },
  },
  {
    name: 'get_rep_performance', domain,
    description: 'Get YTD performance metrics for sales reps.',
    inputShape: { repId: z.string().optional() },
    requiredScopes: [SCOPES.sales.read],
    handler: ({ repId }) => {
      const reps = repId ? salesReps.filter((r) => r.id === repId) : salesReps;
      return {
        reps: reps.map((r) => ({
          ...r,
          openOrders: ordersByRep(r.id).filter((o) => ['pending', 'processing', 'shipped'].includes(o.status)).length,
          closedYTD: ordersByRep(r.id).filter((o) => o.status === 'delivered').length,
          attainmentPct: Math.round((r.ytdSales / r.annualQuota) * 1000) / 10,
        })),
      };
    },
  },

  // ---- Write tools (Sarah has sales:quote + sales:order) ----
  {
    name: 'create_quote', domain,
    description: 'Create a new sales quote for a customer.',
    inputShape: {
      customerId: z.string(),
      items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })),
      notes: z.string().optional(),
    },
    requiredScopes: [SCOPES.sales.quote],
    handler: ({ customerId, items, notes }, ctx) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      const lineItems = (items as Array<{ productId: string; quantity: number }>)
        .map((i) => {
          const p = getProduct(i.productId);
          if (!p) return null;
          return { productId: p.id, sku: p.sku, quantity: i.quantity, unitPrice: p.price, lineTotal: Math.round(p.price * i.quantity * 100) / 100 };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
      const tierDiscount = { Platinum: 5, Gold: 3, Silver: 0, Bronze: 0 }[c.tier];
      const total = Math.round(subtotal * (1 - tierDiscount / 100) * 100) / 100;
      return {
        action: 'quote_created',
        quote: {
          id: `QT-NEW-${Date.now()}`,
          customerId, customer: c.name,
          items: lineItems, subtotal, discountPct: tierDiscount, total,
          status: 'draft', notes,
          createdBy: ctx.sub,
        },
      };
    },
  },
  {
    name: 'create_order', domain,
    description: 'Convert a quote or items into a new order.',
    inputShape: {
      customerId: z.string(),
      items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })),
      warehouseId: z.enum(['WH-WEST', 'WH-CENTRAL', 'WH-EAST', 'WH-NORTH']),
    },
    requiredScopes: [SCOPES.sales.order],
    handler: ({ customerId, items, warehouseId }, ctx) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      const lineItems = (items as Array<{ productId: string; quantity: number }>)
        .map((i) => {
          const p = getProduct(i.productId);
          return p ? { productId: p.id, sku: p.sku, quantity: i.quantity, unitPrice: p.price, lineTotal: Math.round(p.price * i.quantity * 100) / 100 } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
      return {
        action: 'order_created',
        order: {
          id: `ORD-NEW-${Date.now()}`, customerId, customer: c.name, warehouseId,
          items: lineItems, subtotal, total: subtotal, status: 'pending',
          orderDate: new Date().toISOString().slice(0, 10),
          createdBy: ctx.sub,
        },
      };
    },
  },
  {
    name: 'cancel_order', domain,
    description: 'Cancel an existing order.',
    inputShape: { orderId: z.string(), reason: z.string().optional() },
    requiredScopes: [SCOPES.sales.order],
    handler: ({ orderId, reason }, ctx) => {
      const o = getOrder(orderId as string);
      if (!o) return { error: 'order_not_found', orderId };
      if (['shipped', 'delivered'].includes(o.status)) return { error: 'cannot_cancel', currentStatus: o.status };
      o.status = 'cancelled';
      o.notes = reason as string | undefined;
      return { action: 'order_cancelled', orderId: o.id, newStatus: o.status, cancelledBy: ctx.sub, reason };
    },
  },
];
