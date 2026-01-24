"""
Demo Data Store - Manages JSON-based data for ProGear Basketball demo.

Provides access to inventory, pricing, customers, and discounts.
Data persists to a JSON file and can be reset to initial state.
"""

import json
import os
import shutil
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# File paths
DATA_DIR = Path(__file__).parent
INITIAL_DATA_FILE = DATA_DIR / "initial_data.json"
LIVE_DATA_FILE = DATA_DIR / "live_data.json"


class DemoStore:
    """
    Manages demo data with JSON persistence.

    Features:
    - Load/save data to JSON file
    - Reset to initial state
    - CRUD operations for inventory, pricing, customers
    - Thread-safe (single process assumption for demo)
    """

    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._load_data()

    def _load_data(self) -> None:
        """Load data from live file, or initialize from initial file."""
        if LIVE_DATA_FILE.exists():
            try:
                with open(LIVE_DATA_FILE, 'r') as f:
                    self._data = json.load(f)
                logger.info(f"Loaded live data from {LIVE_DATA_FILE}")
                return
            except Exception as e:
                logger.warning(f"Failed to load live data: {e}")

        # Fall back to initial data
        self.reset_to_initial()

    def _save_data(self) -> None:
        """Save current data to live file."""
        try:
            with open(LIVE_DATA_FILE, 'w') as f:
                json.dump(self._data, f, indent=2)
            logger.debug("Data saved to live file")
        except Exception as e:
            logger.error(f"Failed to save data: {e}")

    def reset_to_initial(self) -> None:
        """Reset all data to initial state."""
        try:
            with open(INITIAL_DATA_FILE, 'r') as f:
                self._data = json.load(f)
            self._save_data()
            logger.info("Data reset to initial state")
        except Exception as e:
            logger.error(f"Failed to reset data: {e}")
            self._data = {"inventory": {}, "pricing": {}, "customers": {}, "discounts": {}}

    # ==================== INVENTORY ====================

    def get_all_inventory(self) -> Dict[str, Any]:
        """Get all inventory items."""
        return self._data.get("inventory", {})

    def get_inventory_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        """Get a single inventory item by SKU."""
        return self._data.get("inventory", {}).get(sku)

    def get_inventory_by_category(self, category: str) -> Dict[str, Any]:
        """Get all inventory items in a category."""
        inventory = self._data.get("inventory", {})
        return {
            sku: item for sku, item in inventory.items()
            if item.get("category", "").lower() == category.lower()
        }

    def get_inventory_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find inventory item by name (prefers exact match, then best partial match)."""
        inventory = self._data.get("inventory", {})
        name_lower = name.lower().strip()

        # First try exact match
        for sku, item in inventory.items():
            if item.get("name", "").lower() == name_lower:
                return {**item, "sku": sku}

        # Then try partial matches - collect all and pick the best
        matches = []
        for sku, item in inventory.items():
            item_name = item.get("name", "").lower()
            # Check if search term is in item name OR item name is in search term
            if name_lower in item_name or item_name in name_lower:
                matches.append({**item, "sku": sku})

        if not matches:
            return None

        # Return the best match - prefer where search term is larger portion of name
        def match_score(item):
            item_name = item.get("name", "").lower()
            if name_lower == item_name:
                return 1000  # Exact match
            return len(name_lower) / len(item_name) * 100

        matches.sort(key=match_score, reverse=True)
        return matches[0]

    def search_inventory(self, query: str) -> List[Dict[str, Any]]:
        """Search inventory by name or category."""
        inventory = self._data.get("inventory", {})
        query_lower = query.lower()
        results = []
        for sku, item in inventory.items():
            if (query_lower in item.get("name", "").lower() or
                query_lower in item.get("category", "").lower()):
                results.append({**item, "sku": sku})
        return results

    def get_low_stock_items(self) -> List[Dict[str, Any]]:
        """Get all items with low stock status."""
        inventory = self._data.get("inventory", {})
        return [
            {**item, "sku": sku}
            for sku, item in inventory.items()
            if item.get("status") == "low" or item.get("quantity", 0) <= item.get("reorder_point", 0)
        ]

    def update_inventory_quantity(self, sku: str, quantity_change: int, operation: str = "set") -> Dict[str, Any]:
        """
        Update inventory quantity.

        Args:
            sku: Product SKU
            quantity_change: Amount to change (or absolute value for 'set')
            operation: 'increase', 'decrease', or 'set'

        Returns:
            Updated item info with previous and new quantities
        """
        inventory = self._data.get("inventory", {})
        if sku not in inventory:
            # Try to find by name
            item = self.get_inventory_by_name(sku)
            if item:
                sku = item.get("sku")
            else:
                return {"error": f"Product not found: {sku}"}

        item = inventory[sku]
        previous_qty = item["quantity"]

        if operation == "increase":
            item["quantity"] = previous_qty + quantity_change
        elif operation == "decrease":
            item["quantity"] = max(0, previous_qty - quantity_change)
        elif operation == "set":
            item["quantity"] = quantity_change
        else:
            return {"error": f"Unknown operation: {operation}"}

        # Update status based on quantity vs reorder point
        reorder_point = item.get("reorder_point", 100)
        if item["quantity"] <= reorder_point:
            item["status"] = "low"
        else:
            item["status"] = "good"

        self._save_data()

        return {
            "sku": sku,
            "name": item["name"],
            "previous_quantity": previous_qty,
            "new_quantity": item["quantity"],
            "change": item["quantity"] - previous_qty,
            "status": item["status"]
        }

    # ==================== PRICING ====================

    def get_all_pricing(self) -> Dict[str, Any]:
        """Get all pricing data."""
        return self._data.get("pricing", {})

    def get_price_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        """Get pricing for a product by SKU."""
        pricing = self._data.get("pricing", {}).get(sku)
        if pricing:
            inventory = self._data.get("inventory", {}).get(sku, {})
            return {
                "sku": sku,
                "name": inventory.get("name", "Unknown"),
                **pricing
            }
        return None

    def get_pricing_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get pricing for all products in a category."""
        inventory = self._data.get("inventory", {})
        pricing = self._data.get("pricing", {})

        results = []
        for sku, item in inventory.items():
            if item.get("category", "").lower() == category.lower():
                if sku in pricing:
                    results.append({
                        "sku": sku,
                        "name": item["name"],
                        **pricing[sku]
                    })
        return results

    def update_price(self, sku: str, new_price: float) -> Dict[str, Any]:
        """Update the price of a product."""
        pricing = self._data.get("pricing", {})
        if sku not in pricing:
            # Try to find by name
            item = self.get_inventory_by_name(sku)
            if item:
                sku = item.get("sku")
            else:
                return {"error": f"Product not found: {sku}"}

        if sku not in pricing:
            return {"error": f"Pricing not found for: {sku}"}

        old_price = pricing[sku]["price"]
        pricing[sku]["price"] = new_price

        # Recalculate margin
        cost = pricing[sku]["cost"]
        pricing[sku]["margin"] = round((new_price - cost) / new_price * 100, 1)

        self._save_data()

        inventory = self._data.get("inventory", {}).get(sku, {})
        return {
            "sku": sku,
            "name": inventory.get("name", "Unknown"),
            "old_price": old_price,
            "new_price": new_price,
            "margin": pricing[sku]["margin"]
        }

    # ==================== CUSTOMERS ====================

    def get_all_customers(self) -> Dict[str, Any]:
        """Get all customers."""
        return self._data.get("customers", {})

    def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get a customer by ID."""
        return self._data.get("customers", {}).get(customer_id)

    def get_customer_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find customer by name (partial match)."""
        customers = self._data.get("customers", {})
        name_lower = name.lower()
        for cust_id, customer in customers.items():
            if name_lower in customer.get("name", "").lower():
                return customer
        return None

    def get_customers_by_tier(self, tier: str) -> List[Dict[str, Any]]:
        """Get all customers in a tier."""
        customers = self._data.get("customers", {})
        return [
            customer for customer in customers.values()
            if customer.get("tier", "").lower() == tier.lower()
        ]

    def search_customers(self, query: str) -> List[Dict[str, Any]]:
        """Search customers by name, contact, or location."""
        customers = self._data.get("customers", {})
        query_lower = query.lower()
        results = []
        for customer in customers.values():
            if (query_lower in customer.get("name", "").lower() or
                query_lower in customer.get("contact", "").lower() or
                query_lower in customer.get("location", "").lower()):
                results.append(customer)
        return results

    # ==================== DISCOUNTS ====================

    def get_discount_structure(self) -> Dict[str, Any]:
        """Get the full discount structure."""
        return self._data.get("discounts", {})

    def get_tier_discount(self, tier: str) -> int:
        """Get discount percentage for a customer tier."""
        tier_discounts = self._data.get("discounts", {}).get("tier_discounts", {})
        return tier_discounts.get(tier, 0)

    def get_volume_discount(self, quantity: int) -> int:
        """Get volume discount percentage for a quantity."""
        volume_discounts = self._data.get("discounts", {}).get("volume_discounts", {})
        discount = 0
        for threshold, disc in sorted(volume_discounts.items(), key=lambda x: int(x[0])):
            if quantity >= int(threshold):
                discount = disc
        return discount

    def calculate_total_discount(self, tier: str, quantity: int) -> Dict[str, Any]:
        """Calculate total discount for a customer tier and quantity."""
        tier_disc = self.get_tier_discount(tier)
        volume_disc = self.get_volume_discount(quantity)
        total = tier_disc + volume_disc

        return {
            "tier": tier,
            "tier_discount": tier_disc,
            "quantity": quantity,
            "volume_discount": volume_disc,
            "total_discount": total
        }

    def update_tier_discount(self, tier: str, discount: int) -> Dict[str, Any]:
        """Update discount percentage for a tier."""
        if "discounts" not in self._data:
            self._data["discounts"] = {"tier_discounts": {}, "volume_discounts": {}}
        if "tier_discounts" not in self._data["discounts"]:
            self._data["discounts"]["tier_discounts"] = {}

        old_discount = self._data["discounts"]["tier_discounts"].get(tier, 0)
        self._data["discounts"]["tier_discounts"][tier] = discount
        self._save_data()

        return {
            "tier": tier,
            "old_discount": old_discount,
            "new_discount": discount
        }

    # ==================== SUMMARY METHODS ====================

    def get_inventory_summary(self) -> Dict[str, Any]:
        """Get summary of inventory by category."""
        inventory = self._data.get("inventory", {})

        categories = {}
        total_items = 0
        total_value = 0
        low_stock_count = 0

        pricing = self._data.get("pricing", {})

        for sku, item in inventory.items():
            category = item.get("category", "Other")
            qty = item.get("quantity", 0)
            price = pricing.get(sku, {}).get("price", 0)

            if category not in categories:
                categories[category] = {"count": 0, "total_quantity": 0, "total_value": 0}

            categories[category]["count"] += 1
            categories[category]["total_quantity"] += qty
            categories[category]["total_value"] += qty * price

            total_items += qty
            total_value += qty * price

            if item.get("status") == "low":
                low_stock_count += 1

        return {
            "total_products": len(inventory),
            "total_items": total_items,
            "total_value": round(total_value, 2),
            "low_stock_count": low_stock_count,
            "by_category": categories
        }

    def get_customer_summary(self) -> Dict[str, Any]:
        """Get summary of customers by tier."""
        customers = self._data.get("customers", {})

        tiers = {}
        total_spent = 0

        for customer in customers.values():
            tier = customer.get("tier", "Unknown")
            spent = customer.get("total_spent", 0)

            if tier not in tiers:
                tiers[tier] = {"count": 0, "total_spent": 0}

            tiers[tier]["count"] += 1
            tiers[tier]["total_spent"] += spent
            total_spent += spent

        return {
            "total_customers": len(customers),
            "total_revenue": total_spent,
            "by_tier": tiers
        }


# Global instance
demo_store = DemoStore()
