import type { ToolDefinition } from './types.js';
import { inventoryTools } from './inventory.js';
import { salesTools } from './sales.js';
import { customerTools } from './customer.js';
import { pricingTools } from './pricing.js';

export const allTools: ToolDefinition[] = [
  ...salesTools,
  ...inventoryTools,
  ...customerTools,
  ...pricingTools,
];

export const toolsByDomain = (domain: ToolDefinition['domain']) => allTools.filter((t) => t.domain === domain);
export const findTool = (name: string) => allTools.find((t) => t.name === name);
export { salesTools, inventoryTools, customerTools, pricingTools };
export type { ToolDefinition, ToolContext } from './types.js';
