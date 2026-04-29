const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 3002),

  oktaIssuer: required('OKTA_ISSUER'),
  oktaAudience: required('OKTA_AUDIENCE'),

  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export const SCOPES = {
  sales: { read: 'sales:read', quote: 'sales:quote', order: 'sales:order' },
  inventory: { read: 'inventory:read', write: 'inventory:write' },
  customer: { read: 'customer:read', write: 'customer:write' },
  pricing: { read: 'pricing:read', write: 'pricing:write' },
} as const;
