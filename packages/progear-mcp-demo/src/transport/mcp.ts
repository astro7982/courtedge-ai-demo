import type { Request, Response, RequestHandler } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { validateToken } from '../auth/validateToken.js';
import { toolsByDomain, ToolDefinition } from '../tools/index.js';
import { runTool, ToolContext } from '../tools/types.js';

type Domain = ToolDefinition['domain'];

const buildServerForDomain = (domain: Domain, ctx: ToolContext): McpServer => {
  const server = new McpServer({
    name: `progear-${domain}-mcp`,
    version: '0.1.0',
  });

  for (const tool of toolsByDomain(domain)) {
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
  }

  return server;
};

export const mcpDomainHandler = (domain: Domain): RequestHandler[] => {
  const handler: RequestHandler = async (req: Request, res: Response) => {
    try {
      const ctx: ToolContext = { sub: req.auth!.sub, scopes: req.auth!.scopes };
      const server = buildServerForDomain(domain, ctx);
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

  return [validateToken, handler];
};
