import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { buildRestRouter } from './transport/rest.js';
import { mcpDomainHandler, mcpAllHandler, mcpSafeHandler, mcpWriteHandler } from './transport/mcp.js';
import { allTools } from './tools/index.js';

const app = express();
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '2mb' }));

// Health (unauthenticated for probes)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'progear-mcp-demo',
    toolCount: allTools.length,
    domains: ['sales', 'inventory', 'customer', 'pricing'],
  });
});

// Public metadata for MCP clients / Adapter configuration discovery
app.get('/.well-known/mcp-info', (_req, res) => {
  res.json({
    name: 'progear-mcp-demo',
    version: '0.1.0',
    description: 'ProGear sporting goods MCP demo with tool-level scope enforcement',
    endpoints: {
      all:       { mcp: '/mcp',           audience: config.oktaAudience },
      sales:     { mcp: '/sales/mcp',     audience: config.oktaAudience },
      inventory: { mcp: '/inventory/mcp', audience: config.oktaAudience },
      customer:  { mcp: '/customer/mcp',  audience: config.oktaAudience },
      pricing:   { mcp: '/pricing/mcp',   audience: config.oktaAudience },
    },
    issuer: config.oktaIssuer,
    rest: '/rest/tools',
    toolCount: allTools.length,
  });
});

// RFC 9728 OAuth Protected Resource Metadata. Lets an Okta Agent Gateway / MCP client
// discover this server's authorization server (the Okta custom AS in OKTA_ISSUER) and
// reach it via Cross App Access / ID-JAG. Env-driven: each deployment advertises its own
// configured AS (original -> oktaforai, clouditude copy -> clouditude), so this is safe on main.
const protectedResourceMetadata = (host: string, resourcePath: string) => ({
  resource: `https://${host}${resourcePath}`,
  authorization_servers: [config.oktaIssuer],
  scopes_supported: ['inventory:read', 'inventory:write', 'sales:read', 'customer:read', 'pricing:read'],
  bearer_methods_supported: ['header'],
  resource_name: 'ProGear MCP demo',
});
app.use('/.well-known/oauth-protected-resource', (req, res, next) => {
  if (req.method !== 'GET') return next();
  const sub = !req.path || req.path === '/' ? '/mcp' : req.path;
  res.json(protectedResourceMetadata(req.get('host') ?? '', sub));
});

// REST transport (backward compat with the Python custom agent)
app.use('/rest', buildRestRouter());

// MCP Streamable HTTP endpoints (one per domain)
app.post('/sales/mcp',     ...mcpDomainHandler('sales'));
app.post('/inventory/mcp', ...mcpDomainHandler('inventory'));
app.post('/customer/mcp',  ...mcpDomainHandler('customer'));
app.post('/pricing/mcp',   ...mcpDomainHandler('pricing'));

// Consolidated: all four domains' tools on one MCP server (per-tool scope enforcement unchanged)
app.post('/mcp',           ...mcpAllHandler());

// Resource-split endpoints for the Bridge (one slug per scope boundary):
//   /safe/mcp  → all tools except the 4 inventory:write tools (slug "progear", scoped to the read set)
//   /write/mcp → only the 4 inventory:write tools             (slug "progear-inventory-write", scoped to inventory:write)
app.post('/safe/mcp',      ...mcpSafeHandler());
app.post('/write/mcp',     ...mcpWriteHandler());

app.listen(config.port, () => {
  console.log(`ProGear MCP demo listening on ${config.port}`);
  console.log(`   Tools:     ${allTools.length}`);
  console.log(`   Health:    http://localhost:${config.port}/health`);
  console.log(`   MCP info:  http://localhost:${config.port}/.well-known/mcp-info`);
  console.log(`   MCP paths: /mcp (all) /sales/mcp /inventory/mcp /customer/mcp /pricing/mcp`);
  console.log(`   REST:      /rest/tools/{name}`);
});
