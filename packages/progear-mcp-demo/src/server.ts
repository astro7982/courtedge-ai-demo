import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { buildRestRouter } from './transport/rest.js';
import { mcpDomainHandler } from './transport/mcp.js';
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

// REST transport (backward compat with the Python custom agent)
app.use('/rest', buildRestRouter());

// MCP Streamable HTTP endpoints (one per domain)
app.post('/sales/mcp',     ...mcpDomainHandler('sales'));
app.post('/inventory/mcp', ...mcpDomainHandler('inventory'));
app.post('/customer/mcp',  ...mcpDomainHandler('customer'));
app.post('/pricing/mcp',   ...mcpDomainHandler('pricing'));

app.listen(config.port, () => {
  console.log(`ProGear MCP demo listening on ${config.port}`);
  console.log(`   Tools:     ${allTools.length}`);
  console.log(`   Health:    http://localhost:${config.port}/health`);
  console.log(`   MCP info:  http://localhost:${config.port}/.well-known/mcp-info`);
  console.log(`   MCP paths: /sales/mcp /inventory/mcp /customer/mcp /pricing/mcp`);
  console.log(`   REST:      /rest/tools/{name}`);
});
