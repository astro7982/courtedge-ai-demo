import { z } from 'zod';
import { SCOPES } from '../config.js';
import type { ToolDefinition } from './types.js';
import {
  getProduct, productsByCategory, products,
  activePromotions, getPromotion, promotions,
  getCustomer,
} from '../data/index.js';

const domain = 'pricing' as const;

const volumeTiers = [
  { minQty: 10, discount: 5, label: '10+ units' },
  { minQty: 50, discount: 10, label: '50+ units' },
  { minQty: 100, discount: 15, label: '100+ units' },
  { minQty: 500, discount: 20, label: '500+ units' },
];
const tierDiscount = { Platinum: 5, Gold: 3, Silver: 0, Bronze: 0 };

export const pricingTools: ToolDefinition[] = [
  {
    name: 'get_price', domain,
    description: 'Get pricing for a product including cost, price, and margin.',
    inputShape: { productId: z.string() },
    requiredScopes: [SCOPES.pricing.read],
    handler: ({ productId }) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const margin = ((p.price - p.cost) / p.price) * 100;
      return {
        productId: p.id, name: p.name, category: p.category,
        price: p.price, cost: p.cost,
        marginPct: Math.round(margin * 10) / 10,
        volumeTiers, tierDiscount,
      };
    },
  },
  {
    name: 'category_pricing', domain,
    description: 'Get pricing summary for a product category, including average margin.',
    inputShape: { category: z.string() },
    requiredScopes: [SCOPES.pricing.read],
    handler: ({ category }) => {
      const cat = productsByCategory(category as string);
      if (cat.length === 0) return { error: 'category_not_found', category };
      const avgMargin = cat.reduce((s, p) => s + ((p.price - p.cost) / p.price) * 100, 0) / cat.length;
      return {
        category,
        count: cat.length,
        averageMarginPct: Math.round(avgMargin * 10) / 10,
        products: cat.map((p) => ({
          id: p.id, name: p.name, price: p.price, cost: p.cost,
          marginPct: Math.round(((p.price - p.cost) / p.price) * 1000) / 10,
        })),
      };
    },
  },
  {
    name: 'calculate_bulk_price', domain,
    description: 'Calculate bulk pricing for a product with volume and customer tier discounts.',
    inputShape: { productId: z.string(), quantity: z.number().int().positive(), customerId: z.string().optional() },
    requiredScopes: [SCOPES.pricing.read],
    handler: ({ productId, quantity, customerId }) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const qty = quantity as number;
      const c = customerId ? getCustomer(customerId as string) : undefined;

      let volumeDiscount = 0, volumeLabel = 'No volume discount';
      for (const t of volumeTiers) {
        if (qty >= t.minQty) { volumeDiscount = t.discount; volumeLabel = t.label; }
      }
      const tierDisc = c ? tierDiscount[c.tier] : 0;
      const totalDiscountPct = volumeDiscount + tierDisc;
      const subtotal = p.price * qty;
      const finalTotal = subtotal * (1 - totalDiscountPct / 100);
      const unitPrice = finalTotal / qty;

      return {
        product: p.name, productId: p.id,
        quantity: qty, basePrice: p.price, subtotal: Math.round(subtotal * 100) / 100,
        volumeDiscountPct: volumeDiscount, volumeLabel,
        customerTierDiscountPct: tierDisc, customerTier: c?.tier || null,
        totalDiscountPct,
        finalTotal: Math.round(finalTotal * 100) / 100,
        finalUnitPrice: Math.round(unitPrice * 100) / 100,
      };
    },
  },
  {
    name: 'get_margins', domain,
    description: 'Get margin analysis across products, optionally by category.',
    inputShape: { category: z.string().optional(), limit: z.number().int().positive().optional() },
    requiredScopes: [SCOPES.pricing.read],
    handler: ({ category, limit }) => {
      const pool = category ? productsByCategory(category as string) : products;
      const list = pool
        .map((p) => ({
          id: p.id, name: p.name, category: p.category,
          price: p.price, cost: p.cost,
          marginPct: Math.round(((p.price - p.cost) / p.price) * 1000) / 10,
        }))
        .sort((a, b) => b.marginPct - a.marginPct);
      const result = limit ? list.slice(0, limit as number) : list.slice(0, 20);
      const avg = list.reduce((s, x) => s + x.marginPct, 0) / list.length;
      return { count: result.length, averageMarginPct: Math.round(avg * 10) / 10, products: result };
    },
  },
  {
    name: 'get_promotions', domain,
    description: 'List active or all promotions with eligibility criteria.',
    inputShape: { activeOnly: z.boolean().optional() },
    requiredScopes: [SCOPES.pricing.read],
    handler: ({ activeOnly }) => {
      const list = activeOnly === false ? promotions : activePromotions();
      return { count: list.length, promotions: list };
    },
  },

  // ---- Write tools ----
  {
    name: 'update_price', domain,
    description: 'Update the list price of a product.',
    inputShape: { productId: z.string(), newPrice: z.number().positive() },
    requiredScopes: [SCOPES.pricing.write],
    handler: ({ productId, newPrice }, ctx) => {
      const p = getProduct(productId as string);
      if (!p) return { error: 'product_not_found', productId };
      const previous = p.price;
      p.price = newPrice as number;
      return { action: 'price_updated', productId: p.id, previous, newPrice, updatedBy: ctx.sub };
    },
  },
  {
    name: 'apply_promotion', domain,
    description: 'Apply a promotion code to a customer order preview (returns discounted total).',
    inputShape: { promoCode: z.string(), orderSubtotal: z.number().positive(), customerId: z.string().optional() },
    requiredScopes: [SCOPES.pricing.write],
    handler: ({ promoCode, orderSubtotal, customerId }, ctx) => {
      const promo = getPromotion(promoCode as string);
      if (!promo) return { error: 'promo_not_found', promoCode };
      if (!promo.active) return { error: 'promo_inactive', promoCode };
      const subtotal = orderSubtotal as number;
      if (promo.minOrderValue && subtotal < promo.minOrderValue) {
        return { error: 'min_order_value_not_met', minimum: promo.minOrderValue, orderSubtotal: subtotal };
      }
      if (promo.eligibleTiers && customerId) {
        const c = getCustomer(customerId as string);
        if (c && !promo.eligibleTiers.includes(c.tier)) return { error: 'tier_not_eligible', customerTier: c.tier, eligibleTiers: promo.eligibleTiers };
      }
      const discountAmount = Math.round(subtotal * promo.discountPct) / 100;
      return {
        action: 'promotion_applied',
        promoCode: promo.code, description: promo.description, discountPct: promo.discountPct,
        subtotal, discountAmount, finalTotal: Math.round((subtotal - discountAmount) * 100) / 100,
        appliedBy: ctx.sub,
      };
    },
  },
  {
    name: 'set_discount', domain,
    description: 'Apply an ad-hoc discount percentage to a customer\'s current pricing.',
    inputShape: { customerId: z.string(), discountPct: z.number().min(0).max(50), reason: z.string().optional() },
    requiredScopes: [SCOPES.pricing.write],
    handler: ({ customerId, discountPct, reason }, ctx) => {
      const c = getCustomer(customerId as string);
      if (!c) return { error: 'customer_not_found', customerId };
      return {
        action: 'discount_set',
        customerId: c.id, customer: c.name, discountPct, reason: reason || null, setBy: ctx.sub, timestamp: new Date().toISOString(),
      };
    },
  },
];
