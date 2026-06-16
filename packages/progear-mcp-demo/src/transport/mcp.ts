import type { Request, Response, RequestHandler } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { validateToken, makeValidateToken } from '../auth/validateToken.js';
import { toolsByDomain, allTools, ToolDefinition } from '../tools/index.js';
import { runTool, ToolContext } from '../tools/types.js';
import { domainAuth } from '../config.js';

type Domain = ToolDefinition['domain'];

const addTool = (server: McpServer, tool: ToolDefinition, ctx: ToolContext) => {
  server.tool(
    tool.name,
    tool.description,
    tool.inputShape,
    async (args) => {
      const result = await runTool(tool, args, ctx);
      if (!result.ok && 'denial' in result) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.denial, null, 2) }],
          isError: true,
        };
      }
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );
};

const buildServerForDomain = (domain: Domain, ctx: ToolContext): McpServer => {
  const server = new McpServer({ name: `progear-${domain}-mcp`, version: '0.1.0' });
  for (const tool of toolsByDomain(domain)) addTool(server, tool, ctx);
  return server;
};

const buildServerForAllDomains = (ctx: ToolContext): McpServer => {
  const server = new McpServer({ name: 'progear-mcp', version: '0.1.0' });
  for (const tool of allTools) addTool(server, tool, ctx);
  return server;
};

const runMcp = async (
  build: (ctx: ToolContext) => McpServer,
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ctx: ToolContext = { sub: req.demoAuth!.sub, scopes: req.demoAuth!.scopes };
    const server = build(ctx);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close?.();
      server.close?.();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: err instanceof Error ? err.message : 'internal_error' },
        id: null,
      });
    }
  }
};

// Per-domain endpoint: validates the domain's own AS (issuer + audience), then
// serves that domain's tools. The Bridge brokers a distinct ID-JAG token per
// domain/resource, so each resource maps 1:1 to its authorization server.
export const mcpDomainHandler = (domain: Domain): RequestHandler[] => {
  return [
    makeValidateToken(domainAuth[domain]),
    (req: Request, res: Response) => runMcp((ctx) => buildServerForDomain(domain, ctx), req, res),
  ];
};

// Consolidated endpoint: every domain's tools on one MCP server, validated
// against the JC AS. Single-resource path; not used in the four-resource model.
export const mcpAllHandler = (): RequestHandler[] => {
  return [
    validateToken,
    (req: Request, res: Response) => runMcp(buildServerForAllDomains, req, res),
  ];
};
