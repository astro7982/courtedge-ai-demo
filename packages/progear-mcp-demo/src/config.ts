const optional = (name: string, fallback: string): string => process.env[name] || fallback;

const ORG = 'https://oktaforai.oktapreview.com';

export const config = {
  port: Number(process.env.PORT || 3002),

  // Consolidated /mcp endpoint validates the JC AS (single-resource path).
  oktaIssuer: optional('OKTA_ISSUER', `${ORG}/oauth2/ausy8wy877gzO1vX41d7`),
  oktaAudience: optional('OKTA_AUDIENCE', 'api://progear-jc'),

  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

// Per-domain authorization servers (four-resource model): each domain endpoint
// validates tokens minted by its own custom AS / audience. Env-overridable.
export type DomainName = 'sales' | 'inventory' | 'customer' | 'pricing';
export const domainAuth: Record<DomainName, { issuer: string; audience: string }> = {
  sales:     { issuer: optional('OKTA_ISSUER_SALES',     `${ORG}/oauth2/ausuoore19keC2SZt1d7`), audience: optional('OKTA_AUDIENCE_SALES',     'api://progear-sales') },
  inventory: { issuer: optional('OKTA_ISSUER_INVENTORY', `${ORG}/oauth2/ausuoodihgxiDhdJH1d7`), audience: optional('OKTA_AUDIENCE_INVENTORY', 'api://progear-inventory') },
  customer:  { issuer: optional('OKTA_ISSUER_CUSTOMER',  `${ORG}/oauth2/ausuop8bitEQYw3mc1d7`), audience: optional('OKTA_AUDIENCE_CUSTOMER',  'api://progear-customer') },
  pricing:   { issuer: optional('OKTA_ISSUER_PRICING',   `${ORG}/oauth2/ausuoot3b28EYY7nU1d7`), audience: optional('OKTA_AUDIENCE_PRICING',   'api://progear-pricing') },
};

export const SCOPES = {
  sales: { read: 'sales:read', quote: 'sales:quote', order: 'sales:order' },
  inventory: { read: 'inventory:read', write: 'inventory:write' },
  customer: { read: 'customer:read', write: 'customer:write' },
  pricing: { read: 'pricing:read', write: 'pricing:write' },
} as const;
