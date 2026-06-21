import { z, ZodTypeAny } from 'zod';
import { checkScopes, ScopeDenial } from '../auth/scopeCheck.js';

export interface ToolContext {
  sub: string;
  scopes: string[];
  groups: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputShape: Record<string, ZodTypeAny>;
  requiredScopes: readonly string[];
  requiredGroups?: readonly string[];
  domain: 'sales' | 'inventory' | 'customer' | 'pricing';
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown> | unknown;
}

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; denial: ScopeDenial }
  | { ok: false; error: string; detail?: string };

const checkGroups = (required: readonly string[], granted: readonly string[]): ScopeDenial | null => {
  const hasAny = required.some((g) => granted.includes(g));
  if (hasAny) return null;
  return {
    error: 'access_denied',
    reason: `Access to this tool requires membership in one of the following groups: ${required.join(', ')}.`,
    required_scopes: [],
    missing_scopes: [],
    granted_scopes: [],
  };
};

export const runTool = async (tool: ToolDefinition, rawArgs: unknown, ctx: ToolContext): Promise<ToolResult> => {
  const denial = checkScopes(tool.requiredScopes, ctx.scopes);
  if (denial) return { ok: false, denial };

  if (tool.requiredGroups) {
    const groupDenial = checkGroups(tool.requiredGroups, ctx.groups);
    if (groupDenial) return { ok: false, denial: groupDenial };
  }

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
