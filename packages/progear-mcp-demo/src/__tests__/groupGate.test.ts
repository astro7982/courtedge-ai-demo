import { describe, it, expect } from 'vitest';
import { runTool, ToolContext } from '../tools/types.js';
import { inventoryTools } from '../tools/inventory.js';

// ----- helpers -----

const WRITE_TOOL_NAMES = new Set(['adjust_stock', 'add_inventory', 'reorder_product', 'transfer_stock']);

const writeTool = (name: string) => {
  const t = inventoryTools.find((tool) => tool.name === name);
  if (!t) throw new Error(`tool not found: ${name}`);
  return t;
};

// A real inventory read tool (no requiredGroups, so purely scope-gated)
const readTool = inventoryTools.find((t) => !WRITE_TOOL_NAMES.has(t.name))!;

// Minimal valid args for each write tool so Zod doesn't short-circuit before
// the group gate runs. (The gate runs before handler, which runs after parse.)
const WRITE_ARGS: Record<string, Record<string, unknown>> = {
  adjust_stock:   { productId: 'P-001', warehouseId: 'WH-WEST', delta: 1 },
  add_inventory:  { productId: 'P-001', warehouseId: 'WH-WEST', quantity: 5 },
  reorder_product:{ productId: 'P-001', quantity: 10 },
  transfer_stock: { productId: 'P-001', fromWarehouse: 'WH-WEST', toWarehouse: 'WH-EAST', quantity: 2 },
};

const READ_ARGS: Record<string, unknown> = {};

// Scopes that cover both read and write on inventory so only the GROUP gate
// differentiates the two personas.
const FULL_INVENTORY_SCOPES = ['inventory:read', 'inventory:write'];

// ----- fixtures -----

const sarahCtx: ToolContext = {
  sub: 'sarah@example.com',
  scopes: FULL_INVENTORY_SCOPES,
  groups: ['ProGear-Sales'],
};

const mikeCtx: ToolContext = {
  sub: 'mike@example.com',
  scopes: FULL_INVENTORY_SCOPES,
  groups: ['ProGear-Sales', 'ProGear-Warehouse'],
};

const noGroupCtx: ToolContext = {
  sub: 'anon@example.com',
  scopes: FULL_INVENTORY_SCOPES,
  groups: [],
};

// ----- tests -----

describe('Group gate — ProGear-Warehouse', () => {
  describe('Sarah (ProGear-Sales only, no ProGear-Warehouse)', () => {
    for (const name of WRITE_TOOL_NAMES) {
      it(`denies write tool: ${name}`, async () => {
        const result = await runTool(writeTool(name), WRITE_ARGS[name], sarahCtx);
        expect(result.ok).toBe(false);
        expect((result as { ok: false; denial: { error: string } }).denial.error).toBe('access_denied');
      });
    }

    it('allows inventory read tool: ' + readTool.name, async () => {
      const result = await runTool(readTool, READ_ARGS, sarahCtx);
      expect(result.ok).toBe(true);
    });
  });

  describe('Mike (ProGear-Sales + ProGear-Warehouse)', () => {
    for (const name of WRITE_TOOL_NAMES) {
      it(`allows write tool: ${name}`, async () => {
        const result = await runTool(writeTool(name), WRITE_ARGS[name], mikeCtx);
        expect(result.ok).toBe(true);
      });
    }
  });

  describe('Empty groups []', () => {
    for (const name of WRITE_TOOL_NAMES) {
      it(`denies write tool: ${name}`, async () => {
        const result = await runTool(writeTool(name), WRITE_ARGS[name], noGroupCtx);
        expect(result.ok).toBe(false);
        expect((result as { ok: false; denial: { error: string } }).denial.error).toBe('access_denied');
      });
    }
  });
});
