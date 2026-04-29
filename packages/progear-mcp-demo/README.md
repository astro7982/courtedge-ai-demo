# ProGear MCP Demo

Parallel MCP demo exposing tool-level scope enforcement. Runs alongside the existing backend — does not modify it.

## What it shows

Sarah Sales (in `ProGear-Sales` group) can call every read tool across sales, inventory, customer, and pricing. When she tries a write tool that requires `inventory:write`, the MCP server returns `access_denied` because her Okta token does not carry that scope.

## Surfaces

- `POST /sales/mcp`, `/inventory/mcp`, `/customer/mcp`, `/pricing/mcp` — real MCP over Streamable HTTP for Claude Code (via the Okta MCP Adapter)
- `GET/POST /rest/tools/{name}` — backward-compatible REST for the existing Python LangGraph agent
- `GET /health` — unauthenticated health probe
- `GET /.well-known/mcp-info` — public metadata for Adapter configuration

## Tool inventory (34)

| Domain | Read | Write |
|---|---|---|
| sales | list_orders, get_order, search_orders, get_pipeline, get_quotes, get_rep_performance | create_quote (`sales:quote`), create_order (`sales:order`), cancel_order (`sales:order`) |
| inventory | list_products, search_inventory, check_stock, get_warehouse_stock, get_low_stock_alerts, get_supplier_info | **adjust_stock, add_inventory, reorder_product, transfer_stock** — all `inventory:write` → Sarah denied |
| customer | get_customer, search_customers, customer_history, get_top_customers | update_customer, add_customer_note, change_tier (`customer:write`) |
| pricing | get_price, category_pricing, calculate_bulk_price, get_margins, get_promotions | update_price, apply_promotion, set_discount (`pricing:write`) |

## Data

108 products (10 categories), 50 customers (4 tiers × 4 territories), 60 orders, 22 quotes, 10 reps, 15 suppliers, 4 warehouses, 8 promotions.

## Run locally

```bash
cd packages/progear-mcp-demo
npm install
OKTA_ISSUER=https://your-org.okta.com/oauth2/ausXXXXX \
  OKTA_AUDIENCE=api://progear-mcp-demo \
  npm run dev
```

Every request must carry a real Okta-issued `Authorization: Bearer <JWT>` header. There is no demo-token bypass.

## Deploy to Render

1. Push the repo.
2. New Web Service → pick this repo → set **Root Directory** to `packages/progear-mcp-demo`.
3. Build command: `npm install && npm run build` · Start command: `npm start`.
4. Environment:
   - `OKTA_ISSUER=https://<your-org>/oauth2/<custom-as-id>`
   - `OKTA_AUDIENCE=api://progear-mcp-demo`
   - `NODE_ENV=production`
5. Note the public URL — that's what the MCP Adapter will point at.

Or use `render.yaml` at the package root.

## Okta setup (one AS, all scopes)

1. Create Custom Authorization Server `progear-mcp-demo` with audience `api://progear-mcp-demo`.
2. Define scopes: `sales:read sales:quote sales:order inventory:read inventory:write customer:read customer:write pricing:read pricing:write`.
3. Access Policy rule for group `ProGear-Sales`: grant all scopes EXCEPT `inventory:write`.
4. Access Policy rule for group `ProGear-Warehouse`: grant `inventory:read inventory:write`.
5. Access Policy rule for group `ProGear-Finance`: grant `pricing:read pricing:write`.

## Wire up the MCP Adapter

Register four downstream MCP servers in your Adapter:

| Label | URL | Audience |
|---|---|---|
| ProGear Sales | `https://<render-url>/sales/mcp` | `api://progear-mcp-demo` |
| ProGear Inventory | `https://<render-url>/inventory/mcp` | `api://progear-mcp-demo` |
| ProGear Customer | `https://<render-url>/customer/mcp` | `api://progear-mcp-demo` |
| ProGear Pricing | `https://<render-url>/pricing/mcp` | `api://progear-mcp-demo` |

Point Claude Code at the Adapter's URL, sign in as Sarah, confirm the reads work and `adjust_stock` fails with `access_denied`.
