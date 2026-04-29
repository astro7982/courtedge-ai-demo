import { z } from 'zod';
import { SCOPES } from '../config.js';
import type { ToolDefinition } from './types.js';
import {
  customers, getCustomer, searchCustomers, customersByTier, topCustomersByLTV,
  ordersByCustomer,
} from '../data/index.js';

const domain = 'customer' as const;

export const customerTools: ToolDefinition[] = [
  {
    name: 'get_customer', domain,
    description: 'Get full customer profile including tier, territory, and contact info.',
    inputShape: { customerId: z.string() },
    requiredScopes: [SCOPES.customer.read],
    handler: ({ customerId }) => {
      const c = getCustomer(customerId as string);
      return c ? { customer: c } : { error: 'customer_not_found', customerId };
    },
  },
  {
    name: 'search_customers', domain,
    description: 'Search customers by name, contact, territory, or customer type.',
    inputShape: {
      query: z.string().optional(),
      tier: z.enum(['Platinum', 'Gold', 'Silver', 'Bronze']).optional(),
    },
    requiredScopes: [SCOPES.customer.read],
    handler: ({ query, tier }) => {
      let result = query ? searchCustomers(query as string) : customers;
      if (tier) result = result.filter((c) => c.tier === tier);
      return {
        count: result.length,
        customers: result.map((c) => ({ id: c.id, name: c.name, type: c.type, tier: c.tier, territory: c.territory, lifetimeValue: c.lifetimeValue })),
      };
    },
  },
  {
    name: 'customer_history', domain,
    description: 'Get a customer\'s purchase history summary.',
    inputShape: { customerId: z.string() },
    requiredScopes: [SCOPES.customer.read],
    handler: ({ customerId }) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      const orders = ordersByCustomer(c.id);
      return {
        customer: { id: c.id, name: c.name, tier: c.tier, lifetimeValue: c.lifetimeValue, totalOrders: c.totalOrders, lastOrderDate: c.lastOrderDate },
        orderCount: orders.length,
        orders: orders.map((o) => ({ id: o.id, total: o.total, status: o.status, orderDate: o.orderDate })),
      };
    },
  },
  {
    name: 'get_top_customers', domain,
    description: 'Get top customers ranked by lifetime value.',
    inputShape: { limit: z.number().int().positive().optional(), tier: z.enum(['Platinum', 'Gold', 'Silver', 'Bronze']).optional() },
    requiredScopes: [SCOPES.customer.read],
    handler: ({ limit, tier }) => {
      const pool = tier ? customersByTier(tier as 'Platinum') : customers;
      const sorted = [...pool].sort((a, b) => b.lifetimeValue - a.lifetimeValue);
      const list = limit ? sorted.slice(0, limit as number) : sorted.slice(0, 10);
      return { count: list.length, topCustomers: list.map((c) => ({ id: c.id, name: c.name, tier: c.tier, lifetimeValue: c.lifetimeValue, territory: c.territory })) };
    },
  },

  // ---- Write tools ----
  {
    name: 'update_customer', domain,
    description: 'Update customer profile fields (contact, email, phone, paymentTerms).',
    inputShape: {
      customerId: z.string(),
      contact: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      paymentTerms: z.string().optional(),
    },
    requiredScopes: [SCOPES.customer.write],
    handler: ({ customerId, contact, email, phone, paymentTerms }, ctx) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      if (contact) c.contact = contact as string;
      if (email) c.email = email as string;
      if (phone) c.phone = phone as string;
      if (paymentTerms) c.paymentTerms = paymentTerms as string;
      return { action: 'customer_updated', customer: c, updatedBy: ctx.sub };
    },
  },
  {
    name: 'add_customer_note', domain,
    description: 'Add a free-form note to a customer record (stored in-memory for demo).',
    inputShape: { customerId: z.string(), note: z.string() },
    requiredScopes: [SCOPES.customer.write],
    handler: ({ customerId, note }, ctx) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      return { action: 'note_added', customerId, note, timestamp: new Date().toISOString(), addedBy: ctx.sub };
    },
  },
  {
    name: 'change_tier', domain,
    description: 'Change a customer\'s tier (e.g., promote to Gold).',
    inputShape: { customerId: z.string(), newTier: z.enum(['Platinum', 'Gold', 'Silver', 'Bronze']) },
    requiredScopes: [SCOPES.customer.write],
    handler: ({ customerId, newTier }, ctx) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      const previous = c.tier;
      c.tier = newTier as typeof c.tier;
      return { action: 'tier_changed', customerId: c.id, previous, newTier, changedBy: ctx.sub };
    },
  },
];
