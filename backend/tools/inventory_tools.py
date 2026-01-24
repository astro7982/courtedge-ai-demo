"""
Inventory Tools - LangChain tools for inventory operations.

These tools interact with the demo data store and require appropriate
scopes from the MCP token to execute.
"""

from typing import Optional, List
from langchain_core.tools import tool
from data.demo_store import demo_store
import logging

logger = logging.getLogger(__name__)


@tool
def get_inventory(product_name: str) -> str:
    """
    Get inventory information for a specific product.
    Use this to check stock levels, status, and details for a product.

    Args:
        product_name: Name or partial name of the product to look up

    Returns:
        Product inventory details including quantity and status
    """
    item = demo_store.get_inventory_by_name(product_name)
    if item:
        return (
            f"**{item['name']}** (SKU: {item['sku']})\n"
            f"- Category: {item['category']}\n"
            f"- Quantity: {item['quantity']:,} units\n"
            f"- Status: {item['status'].upper()}\n"
            f"- Reorder Point: {item['reorder_point']} units"
        )
    return f"Product not found: {product_name}"


@tool
def search_inventory(query: str) -> str:
    """
    Search inventory by product name or category.
    Use this to find products or list items in a category.

    Args:
        query: Search term (product name, category like 'Basketballs', 'Hoops', etc.)

    Returns:
        List of matching products with quantities
    """
    results = demo_store.search_inventory(query)
    if not results:
        return f"No products found matching: {query}"

    lines = [f"**Found {len(results)} products matching '{query}':**\n"]
    for item in results[:15]:  # Limit to 15 results
        status_icon = "🔴" if item['status'] == 'low' else "🟢"
        lines.append(f"- {status_icon} {item['name']}: {item['quantity']:,} units ({item['category']})")

    if len(results) > 15:
        lines.append(f"\n... and {len(results) - 15} more")

    return "\n".join(lines)


@tool
def update_inventory(product_name: str, quantity: int, operation: str = "increase") -> str:
    """
    Update inventory quantity for a product. REQUIRES inventory:write scope.
    Use this to increase, decrease, or set inventory levels.

    Args:
        product_name: Name of the product to update
        quantity: Amount to change (positive number)
        operation: 'increase', 'decrease', or 'set'

    Returns:
        Confirmation of the update with old and new quantities
    """
    # Find the product first
    item = demo_store.get_inventory_by_name(product_name)
    if not item:
        return f"Product not found: {product_name}"

    sku = item['sku']
    result = demo_store.update_inventory_quantity(sku, quantity, operation)

    if "error" in result:
        return f"Error: {result['error']}"

    change_text = f"+{result['change']}" if result['change'] > 0 else str(result['change'])
    status_icon = "🔴" if result['status'] == 'low' else "🟢"

    return (
        f"**Inventory Updated Successfully**\n\n"
        f"**{result['name']}** (SKU: {result['sku']})\n"
        f"- Previous: {result['previous_quantity']:,} units\n"
        f"- Change: {change_text} units\n"
        f"- New: {result['new_quantity']:,} units\n"
        f"- Status: {status_icon} {result['status'].upper()}"
    )


@tool
def update_inventory_by_percentage(product_name: str, percentage: float, operation: str = "increase") -> str:
    """
    Update inventory by a percentage. REQUIRES inventory:write scope.
    Use this when the user asks to increase or decrease inventory by a percentage (e.g., "increase by 20%").

    Args:
        product_name: Name of the product to update (use exact or partial name)
        percentage: The percentage to change (e.g., 20 for 20%, not 0.2)
        operation: 'increase' or 'decrease'

    Returns:
        Confirmation of the update with old and new quantities
    """
    # Find the product first
    item = demo_store.get_inventory_by_name(product_name)
    if not item:
        return f"Product not found: {product_name}"

    current_qty = item['quantity']
    sku = item['sku']

    # Calculate the change amount
    change_amount = int(round(current_qty * (percentage / 100)))

    if change_amount == 0:
        return f"Percentage change too small - would result in 0 unit change for {item['name']} (current: {current_qty:,} units)"

    result = demo_store.update_inventory_quantity(sku, change_amount, operation)

    if "error" in result:
        return f"Error: {result['error']}"

    change_text = f"+{result['change']}" if result['change'] > 0 else str(result['change'])
    status_icon = "🔴" if result['status'] == 'low' else "🟢"
    pct_text = f"+{percentage}%" if operation == "increase" else f"-{percentage}%"

    return (
        f"**Inventory Updated by {pct_text}**\n\n"
        f"**{result['name']}** (SKU: {result['sku']})\n"
        f"- Previous: {result['previous_quantity']:,} units\n"
        f"- Change: {change_text} units ({pct_text})\n"
        f"- New: {result['new_quantity']:,} units\n"
        f"- Status: {status_icon} {result['status'].upper()}"
    )


@tool
def get_low_stock_alerts() -> str:
    """
    Get all products with low stock that need attention.
    Use this to check what items need to be reordered.

    Returns:
        List of products with low stock status
    """
    low_stock = demo_store.get_low_stock_items()
    if not low_stock:
        return "✅ No low stock alerts - all inventory levels are good!"

    lines = [f"**⚠️ Low Stock Alert - {len(low_stock)} items need attention:**\n"]
    for item in low_stock:
        lines.append(
            f"- 🔴 **{item['name']}**: {item['quantity']} units "
            f"(reorder point: {item['reorder_point']})"
        )

    return "\n".join(lines)


@tool
def get_inventory_summary() -> str:
    """
    Get a summary of inventory across all categories.
    Use this for an overview of stock levels and value.

    Returns:
        Summary statistics of inventory
    """
    summary = demo_store.get_inventory_summary()

    lines = [
        "**ProGear Basketball - Inventory Summary**\n",
        f"- Total Products: {summary['total_products']}",
        f"- Total Items in Stock: {summary['total_items']:,}",
        f"- Total Inventory Value: ${summary['total_value']:,.2f}",
        f"- Low Stock Alerts: {summary['low_stock_count']}",
        "\n**By Category:**"
    ]

    for category, data in summary['by_category'].items():
        lines.append(
            f"- {category}: {data['count']} products, "
            f"{data['total_quantity']:,} units (${data['total_value']:,.2f})"
        )

    return "\n".join(lines)


# List of all inventory tools for export
INVENTORY_TOOLS = [
    get_inventory,
    search_inventory,
    update_inventory,
    update_inventory_by_percentage,
    get_low_stock_alerts,
    get_inventory_summary
]
