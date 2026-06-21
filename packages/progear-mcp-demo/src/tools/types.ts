import { z, ZodTypeAny } from 'zod';
import { checkScopes, ScopeDenial } from '../auth/scopeCheck.js';

export interface ToolContext {
  sub: string;
  scopes: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputShape: Record<string, ZodTypeAny>;
  requiredScopes: readonly string[];
  domain: 'sales' | 'inventory' | 'customer' | 'pricing';
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown> | unknown;
}

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; denial: ScopeDenial }
  | { ok: false; error: string; detail?: string };

export const runTool = async (tool: ToolDefinition, rawArgs: unknown, ctx: ToolContext): Promise<ToolResult> => {
  const denial = checkScopes(tool.requiredScopes, ctx.scopes);
  if (denial) return { ok: false, denial };

  try {
    const parsed = z.object(tool.inputShape).parse(rawArgs ?? {});
    const data = await tool.handler(parsed as Record<string, unknown>, ctx);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: 'invalid_arguments', detail: err.message };
    }
    return { ok: false, error: 'tool_error', detail: err instanceof Error ? err.message : String(err) };
  }
};
