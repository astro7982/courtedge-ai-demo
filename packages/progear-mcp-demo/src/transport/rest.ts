import { Router } from 'express';
import { validateToken } from '../auth/validateToken.js';
import { allTools, findTool } from '../tools/index.js';
import { runTool, ToolContext } from '../tools/types.js';

export const buildRestRouter = (): Router => {
  const router = Router();

  router.get('/tools', validateToken, (_req, res) => {
    res.json({
      count: allTools.length,
      tools: allTools.map((t) => ({
        name: t.name,
        domain: t.domain,
        description: t.description,
        requiredScopes: t.requiredScopes,
      })),
    });
  });

  const exec = async (toolName: string, args: unknown, ctx: ToolContext, res: import('express').Response) => {
    const tool = findTool(toolName);
    if (!tool) return res.status(404).json({ error: 'tool_not_found', toolName });

    const result = await runTool(tool, args, ctx);
    if (!result.ok && 'denial' in result) return res.status(403).json(result.denial);
    if (!result.ok) return res.status(400).json(result);
    return res.json({ tool: toolName, result: result.data });
  };

  router.get('/tools/:name', validateToken, async (req, res) => {
    const ctx: ToolContext = { sub: req.auth!.sub, scopes: req.auth!.scopes };
    await exec(req.params.name, req.query, ctx, res);
  });

  router.post('/tools/:name', validateToken, async (req, res) => {
    const ctx: ToolContext = { sub: req.auth!.sub, scopes: req.auth!.scopes };
    await exec(req.params.name, req.body, ctx, res);
  });

  return router;
};
