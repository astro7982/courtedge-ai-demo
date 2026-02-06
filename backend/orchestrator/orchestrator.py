"""
Orchestrator - Coordinates multiple agents using LangGraph.

This is the brain of the multi-agent system. It:
1. Receives user messages
2. Determines which agent(s) to invoke (LLM-powered routing)
3. Manages token exchange for each agent
4. Handles access denied scenarios gracefully
5. Coordinates multi-agent workflows
6. Returns unified responses with audit trail

Key feature for demo: Shows which agents are accessible based on user's
group membership, with clear success/denied visualization.
"""

from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
import logging
import json

from auth.multi_agent_auth import (
    get_multi_agent_exchange,
    AGENT_SALES, AGENT_INVENTORY, AGENT_CUSTOMER, AGENT_PRICING
)
from auth.agent_config import get_agent_config, DEMO_AGENTS
from data.demo_store import demo_store

logger = logging.getLogger(__name__)


class WorkflowState(TypedDict):
    """State passed through the LangGraph workflow."""
    messages: List[Any]
    user_message: str
    conversation_context: str  # Previous conversation for context-aware routing
    user_info: Dict[str, Any]
    user_token: str

    # Routing decision
    agents_to_invoke: List[str]
    agent_scopes: Dict[str, List[str]]  # Maps agent_type to required scopes based on intent

    # Agent results (with access status)
    agent_results: Dict[str, Dict[str, Any]]

    # Tracking for demo visibility
    agent_flow: List[Dict[str, Any]]
    token_exchanges: List[Dict[str, Any]]

    # Final response
    final_response: Optional[str]


# Agent type to keywords mapping for fallback routing
# NOTE: These must include both read AND write operation keywords for proper routing
AGENT_KEYWORDS = {
    AGENT_SALES: [
        "order", "quote", "deal", "sale", "revenue", "pipeline", "opportunity",
        "proposal", "estimate", "fulfill", "create order", "place order",
        "ship", "deliver"
    ],
    AGENT_INVENTORY: [
        "stock", "inventory", "product", "warehouse", "supply", "available", "in stock",
        "add", "update", "increase", "decrease", "adjust", "restock", "replenish",
        "reduce", "remove", "alert", "notify", "reorder", "low stock",
        "basketball", "tennis", "racket", "uniform", "equipment"
    ],
    AGENT_CUSTOMER: [
        "customer", "account", "client", "contact", "tier", "loyalty", "history",
        "lookup", "find", "search", "purchased", "transactions"
    ],
    AGENT_PRICING: [
        "price", "discount", "margin", "cost", "profit", "bulk", "wholesale", "retail",
        "markup", "profitability", "volume", "special price",
        "reduce", "cut", "lower", "mark down", "mark up"
    ],
}

# Scope definitions for each MCP - maps operation type to required scope
# This enables intent-based scope detection to demonstrate Okta governance
SCOPE_DEFINITIONS = {
    AGENT_INVENTORY: {
        "read": {
            "scope": "inventory:read",
            "keywords": ["what", "show", "list", "check", "available", "in stock", "how many", "do we have", "stock level"],
            "description": "View inventory levels"
        },
        "write": {
            "scope": "inventory:write",
            "keywords": ["add", "update", "change", "modify", "increase", "decrease", "set", "put", "remove", "delete", "adjust"],
            "description": "Modify inventory"
        },
        "alert": {
            "scope": "inventory:alert",
            "keywords": ["alert", "notify", "reorder", "low stock", "warning"],
            "description": "Inventory alerts"
        },
    },
    AGENT_PRICING: {
        "read": {
            "scope": "pricing:read",
            "keywords": ["price", "cost", "how much", "what's the price", "pricing"],
            "description": "View prices"
        },
        "margin": {
            "scope": "pricing:margin",
            "keywords": ["margin", "profit", "markup", "profitability", "cost breakdown"],
            "description": "View profit margins"
        },
        "discount": {
            "scope": "pricing:discount",
            "keywords": ["discount", "bulk pricing", "wholesale", "deal", "special price", "volume"],
            "description": "View/apply discounts"
        },
    },
    AGENT_CUSTOMER: {
        "read": {
            "scope": "customer:read",
            "keywords": ["who", "customer", "account", "client", "contact"],
            "description": "View customer info"
        },
        "lookup": {
            "scope": "customer:lookup",
            "keywords": ["lookup", "find", "search", "look up"],
            "description": "Search customers"
        },
        "history": {
            "scope": "customer:history",
            "keywords": ["history", "orders", "purchased", "past", "previous", "transactions"],
            "description": "View purchase history"
        },
    },
    AGENT_SALES: {
        "read": {
            "scope": "sales:read",
            "keywords": ["orders", "sales", "revenue", "pipeline", "show orders"],
            "description": "View sales data"
        },
        "quote": {
            "scope": "sales:quote",
            "keywords": ["quote", "proposal", "estimate", "quotation"],
            "description": "Create quotes"
        },
        "order": {
            "scope": "sales:order",
            "keywords": ["create order", "place order", "new order", "fulfill", "submit order"],
            "description": "Create orders"
        },
    },
}


class Orchestrator:
    """
    Multi-agent orchestrator using LangGraph.

    Routes requests to appropriate agents and coordinates
    complex multi-agent workflows with proper access control.
    """

    def __init__(self, user_token: str, user_info: Optional[Dict[str, Any]] = None):
        """
        Initialize the orchestrator with user context.

        Args:
            user_token: User's ID token (for token exchange)
            user_info: Optional user info from token validation
        """
        self.user_token = user_token
        self.user_info = user_info or {}

        # Get multi-agent token exchange manager
        self.token_exchange = get_multi_agent_exchange()

        # Initialize router LLM (fast model for routing decisions)
        self.router_llm = ChatAnthropic(
            model="claude-sonnet-4-20250514",
            temperature=0,
        )

        # Initialize response LLM (for combining results)
        self.response_llm = ChatAnthropic(
            model="claude-sonnet-4-20250514",
            temperature=0.7,
        )

        # Build the workflow
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(WorkflowState)

        # Add nodes
        workflow.add_node("router", self._router_node)
        workflow.add_node("exchange_tokens", self._exchange_tokens_node)
        workflow.add_node("process_agents", self._process_agents_node)
        workflow.add_node("generate_response", self._generate_response_node)

        # Linear flow: router -> exchange -> process -> response
        workflow.set_entry_point("router")
        workflow.add_edge("router", "exchange_tokens")
        workflow.add_edge("exchange_tokens", "process_agents")
        workflow.add_edge("process_agents", "generate_response")
        workflow.add_edge("generate_response", END)

        return workflow.compile()

    async def _router_node(self, state: WorkflowState) -> WorkflowState:
        """
        Determine which agents to invoke and what scopes are needed.

        Uses LLM-powered routing with keyword fallback.
        CRITICAL: Detects intent to determine specific scopes needed.
        """
        message = state["user_message"]
        conversation_context = state.get("conversation_context", "")

        state["agent_flow"].append({
            "step": "router",
            "action": "Analyzing request to determine relevant agents and required scopes",
            "status": "processing"
        })

        # Build context section if we have conversation history
        context_section = ""
        if conversation_context:
            context_section = f"""
CONVERSATION HISTORY (for context):
{conversation_context}

NOTE: The user's current message may reference the conversation above.
For example, "Yes", "Do it", "Go ahead" likely refers to the previous assistant suggestion.
Consider this context when determining which agents and scopes are needed.

"""

        # Use LLM to determine which agents are relevant AND what operations are needed
        try:
            routing_prompt = f"""Analyze this user request and determine:
1. Which AI agents should handle it
2. What specific operations/scopes are needed for each agent

Available agents and their scopes:
1. SALES:
   - sales:read - View orders, sales data, revenue (read-only queries)
   - sales:quote - Create quotes/proposals
   - sales:order - Create/modify orders

2. INVENTORY:
   - inventory:read - View stock levels, product availability (read-only queries like "what do we have", "check stock")
   - inventory:write - Add/update/modify inventory (write operations like "add 5000 basketballs", "update stock", "increase stock")
   - inventory:alert - Manage inventory alerts

3. CUSTOMER:
   - customer:read - View customer information
   - customer:lookup - Search/find customers
   - customer:history - View purchase history

4. PRICING:
   - pricing:read - View prices (basic price queries)
   - pricing:margin - View profit margins (margin/profit queries)
   - pricing:discount - View/apply discounts (bulk/discount queries)
{context_section}
CURRENT USER REQUEST: "{message}"

Return a JSON object with agents and their required scopes:
{{
  "sales": {{"needed": true/false, "scopes": ["sales:read"]}},
  "inventory": {{"needed": true/false, "scopes": ["inventory:read"]}},
  "customer": {{"needed": true/false, "scopes": ["customer:read"]}},
  "pricing": {{"needed": true/false, "scopes": ["pricing:read"]}}
}}

IMPORTANT: Choose scopes based on the operation type:
- READ operations (view, show, list, check, what, how many) -> use :read scopes
- WRITE operations (add, update, modify, change, set, put, increase, decrease) -> use :write scopes
- For margin/profit queries -> use pricing:margin
- For discount/bulk queries -> use pricing:discount
- If the user says "yes", "do it", "go ahead", "confirm" - look at conversation history to determine the operation

Return ONLY the JSON object, no other text."""

            response = await self.router_llm.ainvoke([HumanMessage(content=routing_prompt)])
            routing_json = json.loads(response.content)

            agents = []
            agent_scopes = {}

            for agent_type, config in [
                (AGENT_SALES, routing_json.get("sales", {})),
                (AGENT_INVENTORY, routing_json.get("inventory", {})),
                (AGENT_CUSTOMER, routing_json.get("customer", {})),
                (AGENT_PRICING, routing_json.get("pricing", {}))
            ]:
                if config.get("needed"):
                    agents.append(agent_type)
                    agent_scopes[agent_type] = config.get("scopes", [f"{agent_type}:read"])

            logger.info(f"LLM routing decision: agents={agents}, scopes={agent_scopes}")

        except Exception as e:
            logger.warning(f"LLM routing failed, using keyword fallback: {e}")
            agents = self._keyword_routing(message)
            agent_scopes = self._detect_scopes_from_keywords(message, agents)

        # Default to at least one agent
        if not agents:
            agents = [AGENT_SALES]
            agent_scopes = {AGENT_SALES: ["sales:read"]}

        state["agents_to_invoke"] = agents
        state["agent_scopes"] = agent_scopes

        # Build scope summary for display
        scope_summary = ", ".join([f"{a}: {agent_scopes.get(a, [])}" for a in agents])
        state["agent_flow"].append({
            "step": "router",
            "action": f"Selected agents: {', '.join(agents)}",
            "status": "completed",
            "agents": agents,
            "scopes": agent_scopes
        })

        return state

    def _detect_scopes_from_keywords(self, message: str, agents: List[str]) -> Dict[str, List[str]]:
        """Detect required scopes based on keywords in the message."""
        message_lower = message.lower()
        agent_scopes = {}

        for agent_type in agents:
            if agent_type in SCOPE_DEFINITIONS:
                scopes = []
                for op_type, op_config in SCOPE_DEFINITIONS[agent_type].items():
                    if any(kw in message_lower for kw in op_config["keywords"]):
                        scopes.append(op_config["scope"])

                # Default to read scope if no specific scope detected
                if not scopes:
                    scopes = [f"{agent_type}:read"]

                agent_scopes[agent_type] = scopes
            else:
                agent_scopes[agent_type] = [f"{agent_type}:read"]

        return agent_scopes

    def _keyword_routing(self, message: str) -> List[str]:
        """Fallback keyword-based routing."""
        message_lower = message.lower()
        agents = []

        for agent_type, keywords in AGENT_KEYWORDS.items():
            if any(keyword in message_lower for keyword in keywords):
                agents.append(agent_type)

        return agents if agents else [AGENT_SALES]

    async def _exchange_tokens_node(self, state: WorkflowState) -> WorkflowState:
        """
        Exchange tokens for all selected agents with the detected scopes.

        This is where access control happens - users may be denied
        access to certain scopes based on group membership.
        """
        agents_to_invoke = state["agents_to_invoke"]
        agent_scopes = state.get("agent_scopes", {})

        state["agent_flow"].append({
            "step": "token_exchange",
            "action": "Requesting access tokens with required scopes",
            "status": "processing"
        })

        # Exchange tokens for all selected agents with their specific scopes
        exchange_results = await self.token_exchange.exchange_for_all_agents(
            self.user_token,
            agents_to_invoke,
            agent_scopes  # Pass the intent-based scopes
        )

        # Record token exchanges - use "name" for Token Exchange card (MCP name)
        for agent_type, result in exchange_results.items():
            # Always use agent_scopes as authoritative source for what was requested
            requested_scopes = agent_scopes.get(agent_type, [])
            # Fall back to result if agent_scopes is empty
            if not requested_scopes:
                requested_scopes = result.get("requested_scopes", [])

            # Detect if this is a policy denial even if not explicitly marked
            is_access_denied = result.get("access_denied", False)
            error_msg = result.get("error", "").lower()
            if not is_access_denied and error_msg:
                policy_keywords = ["policy", "denied", "unauthorized", "forbidden"]
                is_access_denied = any(kw in error_msg for kw in policy_keywords)

            exchange_record = {
                "agent": agent_type,
                "agent_name": result["agent_info"]["name"],  # MCP name for Token Exchange card
                "color": result["agent_info"]["color"],
                "success": result["success"],
                "access_denied": is_access_denied,
                "scopes": result.get("scopes", []),
                "requested_scopes": requested_scopes,  # What was requested
                "demo_mode": result.get("demo_mode", False),
            }

            if is_access_denied:
                exchange_record["error"] = result.get("error", f"Access denied for scope(s): {', '.join(requested_scopes)}")
                exchange_record["status"] = "denied"
            elif result["success"]:
                exchange_record["status"] = "granted"
                exchange_record["audience"] = result.get("audience")
            else:
                exchange_record["error"] = result.get("error", "Unknown error")
                exchange_record["status"] = "error"

            state["token_exchanges"].append(exchange_record)

        # Store results for next node
        state["agent_results"] = exchange_results

        # Summary for flow
        granted = sum(1 for r in exchange_results.values() if r["success"] and not r.get("access_denied"))
        denied = sum(1 for r in exchange_results.values() if r.get("access_denied"))

        state["agent_flow"].append({
            "step": "token_exchange",
            "action": f"Token exchange complete: {granted} granted, {denied} denied",
            "status": "completed",
            "summary": {
                "total": len(exchange_results),
                "granted": granted,
                "denied": denied
            }
        })

        return state

    async def _process_agents_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process requests through agents that have access.

        Agents with denied access are skipped but noted in the response.
        """
        agent_results = state["agent_results"]

        state["agent_flow"].append({
            "step": "process_agents",
            "action": "Running authorized agents",
            "status": "processing"
        })

        # For each agent with access, simulate processing
        # In a full implementation, this would call MCP tools
        for agent_type, exchange_result in agent_results.items():
            # Use display_name for Agent Flow card
            display_name = exchange_result["agent_info"].get("display_name", exchange_result["agent_info"]["name"])
            requested_scopes = exchange_result.get("requested_scopes", [])

            if exchange_result["success"] and not exchange_result.get("access_denied"):
                # Agent has access - process the request
                agent_response = await self._invoke_agent(
                    agent_type,
                    state["user_message"],
                    exchange_result,
                    state.get("conversation_context", "")
                )
                agent_results[agent_type]["response"] = agent_response

                state["agent_flow"].append({
                    "step": f"{agent_type}_agent",
                    "action": f"{display_name}",
                    "detail": f"Via {exchange_result['agent_info']['name']}",
                    "status": "completed",
                    "color": exchange_result["agent_info"]["color"],
                    "scopes": exchange_result.get("scopes", [])
                })
            elif exchange_result.get("access_denied"):
                state["agent_flow"].append({
                    "step": f"{agent_type}_agent",
                    "action": f"{display_name}",
                    "detail": f"DENIED: {', '.join(requested_scopes)}",
                    "status": "denied",
                    "color": exchange_result["agent_info"]["color"],
                    "requested_scopes": requested_scopes
                })

        state["agent_results"] = agent_results
        return state

    async def _invoke_agent(
        self,
        agent_type: str,
        message: str,
        exchange_result: Dict[str, Any],
        conversation_context: str = ""
    ) -> str:
        """
        Invoke a specific agent to process the request using real data.

        Uses the demo_store to get/modify actual data based on:
        1. The agent type (inventory, pricing, customer, sales)
        2. The user's message intent
        3. The granted scopes (determines if writes are allowed)
        """
        agent_name = exchange_result["agent_info"]["name"]
        scopes = exchange_result.get("scopes", [])

        # Get real data based on agent type
        data = self._execute_agent_action(agent_type, message, scopes, conversation_context)

        return f"[{agent_name}]\n{data}"

    def _execute_agent_action(
        self,
        agent_type: str,
        message: str,
        scopes: List[str],
        conversation_context: str = ""
    ) -> str:
        """Execute the appropriate action based on agent type and message intent."""
        message_lower = message.lower()
        full_context = f"{conversation_context}\n{message}".lower()

        if agent_type == AGENT_INVENTORY:
            return self._handle_inventory_action(message_lower, scopes, full_context)
        elif agent_type == AGENT_PRICING:
            return self._handle_pricing_action(message_lower, scopes, full_context)
        elif agent_type == AGENT_CUSTOMER:
            return self._handle_customer_action(message_lower, scopes, full_context)
        elif agent_type == AGENT_SALES:
            return self._handle_sales_action(message_lower, scopes, full_context)

        return "Data not available for this query."

    def _handle_inventory_action(self, message: str, scopes: List[str], context: str) -> str:
        """Handle inventory-related actions with real data."""

        # Check for write operations (increase, decrease, update, add)
        write_keywords = ["increase", "decrease", "update", "add", "set", "adjust", "reduce", "remove"]
        is_write_operation = any(kw in context for kw in write_keywords)

        if is_write_operation:
            if "inventory:write" in scopes:
                # Parse the operation from the message
                return self._execute_inventory_write(message, context)
            else:
                # User wants to write but doesn't have permission
                return (
                    "⚠️ **Access Denied: Write Permission Required**\n\n"
                    "You requested to modify inventory, but your account does not have "
                    "`inventory:write` scope.\n\n"
                    "**Your current permissions:** `inventory:read` (view only)\n\n"
                    "To modify inventory levels, please contact your administrator "
                    "or log in with a manager account that has write access."
                )

        # Check for low stock / alerts
        if any(kw in message for kw in ["low stock", "alert", "reorder", "warning"]):
            low_stock = demo_store.get_low_stock_items()
            if not low_stock:
                return "✅ No low stock alerts - all inventory levels are good!"
            lines = [f"⚠️ **Low Stock Alert - {len(low_stock)} items need attention:**\n"]
            for item in low_stock:
                lines.append(f"- 🔴 **{item['name']}**: {item['quantity']} units (reorder point: {item['reorder_point']})")
            return "\n".join(lines)

        # Check for specific product search
        product_keywords = ["basketball", "hoop", "net", "uniform", "jersey", "shoe", "training", "backboard", "rim"]
        for keyword in product_keywords:
            if keyword in message:
                results = demo_store.search_inventory(keyword)
                if results:
                    lines = [f"**{keyword.title()} Inventory:**\n"]
                    total_qty = 0
                    for item in results:
                        status_icon = "🔴" if item['status'] == 'low' else "🟢"
                        lines.append(f"- {status_icon} {item['name']}: {item['quantity']:,} units")
                        total_qty += item['quantity']
                    lines.append(f"\n**Total: {total_qty:,} units across {len(results)} products**")
                    return "\n".join(lines)

        # Default: return inventory summary
        summary = demo_store.get_inventory_summary()
        lines = [
            "**ProGear Basketball - Inventory Summary**\n",
            f"Total Products: {summary['total_products']}",
            f"Total Items in Stock: {summary['total_items']:,}",
            f"Total Inventory Value: ${summary['total_value']:,.2f}",
        ]
        if summary['low_stock_count'] > 0:
            lines.append(f"⚠️ Low Stock Alerts: {summary['low_stock_count']}")

        lines.append("\n**By Category:**")
        for category, data in summary['by_category'].items():
            lines.append(f"- {category}: {data['total_quantity']:,} units")

        return "\n".join(lines)

    def _execute_inventory_write(self, message: str, context: str) -> str:
        """Execute an inventory write operation."""
        import re

        # Try to find product name and quantity from context
        # Look for patterns like "increase X by Y" or "add Y to X" or "increase X inventory by Y"

        # Find quantity (look for numbers)
        qty_match = re.search(r'(\d+)\s*(?:units?|%)?', context)
        quantity = int(qty_match.group(1)) if qty_match else 100  # Default to 100 if not found

        # Check if it's a percentage increase
        is_percentage = '%' in context or 'percent' in context

        # Determine operation
        if any(kw in context for kw in ["decrease", "reduce", "remove", "subtract"]):
            operation = "decrease"
        elif any(kw in context for kw in ["increase", "add", "restock", "replenish"]):
            operation = "increase"
        else:
            operation = "set"

        # Try to identify the product
        # Check common product references
        product_mappings = {
            "pro arena": "Pro Arena Hoop System",
            "arena hoop": "Pro Arena Hoop System",
            "pro game basketball": "Pro Game Basketball",
            "pro game": "Pro Game Basketball",
            "composite basketball": "Pro Composite Basketball",
            "pro composite": "Pro Composite Basketball",
            "women's basketball": "Women's Official Basketball",
            "women's official": "Women's Official Basketball",
            "youth size 5": "Youth Size 5 Basketball",
            "youth size 4": "Youth Size 4 Basketball",
            "indoor basketball": "Indoor Premium Basketball",
            "indoor premium": "Indoor Premium Basketball",
            "outdoor basketball": "Outdoor Rubber Basketball",
            "outdoor rubber": "Outdoor Rubber Basketball",
            "training basketball": "Training Heavy Basketball",
            "training heavy": "Training Heavy Basketball",
            "portable hoop": "Portable Hoop System",
            "wall mount": "Wall-Mount Hoop",
            "wall-mount": "Wall-Mount Hoop",
            "youth hoop": "Youth Adjustable Hoop",
            "breakaway rim": "Breakaway Rim Pro",
            "backboard": "Replacement Backboard 72\"",
            "replacement backboard": "Replacement Backboard 72\"",
            "competition net": "Pro Competition Net (White)",
            "chain net": "Heavy Duty Chain Net",
            "ball pump": "Ball Pump Pro",
            "ball bag": "Ball Bag (holds 10)",
            "ball rack": "Ball Rack (holds 16)",
            "game jersey": "Pro Game Jersey",
            "pro jersey": "Pro Game Jersey",
            "game shorts": "Pro Game Shorts",
            "pro shorts": "Pro Game Shorts",
            "practice jersey": "Reversible Practice Jersey",
            "reversible jersey": "Reversible Practice Jersey",
            "warm-up jacket": "Warm-Up Jacket",
            "warmup jacket": "Warm-Up Jacket",
            "warm-up pants": "Warm-Up Pants",
            "warmup pants": "Warm-Up Pants",
            "shooting shirt": "Shooting Shirt",
            "team hoodie": "Team Hoodie",
            "hoodie": "Team Hoodie",
            "practice shorts": "Practice Shorts",
            "agility cones": "Agility Cones (set of 20)",
            "cones": "Agility Cones (set of 20)",
            "agility ladder": "Agility Ladder",
            "ladder": "Agility Ladder",
            "dribble goggles": "Dribble Goggles",
            "goggles": "Dribble Goggles",
            "resistance bands": "Resistance Bands Set",
            "shot arc": "Shot Arc Trainer",
            "arc trainer": "Shot Arc Trainer",
            "slide trainer": "Defensive Slide Trainer",
            "defensive slide": "Defensive Slide Trainer",
            "court shoe": "Pro Court Basketball Shoe",
            "basketball shoe": "Pro Court Basketball Shoe",
            "youth shoe": "Youth Basketball Shoe",
            "training shoe": "Training Shoe",
            "referee shoe": "Referee Shoe",
        }

        product_name = None
        for pattern, name in product_mappings.items():
            if pattern in context:
                product_name = name
                break

        if not product_name:
            # Try to find from the inventory
            results = demo_store.search_inventory("")
            for item in results:
                if item['name'].lower() in context:
                    product_name = item['name']
                    break

        if not product_name:
            return "I couldn't identify which product to update. Please specify the product name."

        # Get current quantity for percentage calculation
        item = demo_store.get_inventory_by_name(product_name)
        if not item:
            return f"Product not found: {product_name}"

        if is_percentage:
            # Calculate percentage of current quantity
            actual_quantity = int(item['quantity'] * quantity / 100)
            quantity = actual_quantity

        # Execute the update
        result = demo_store.update_inventory_quantity(item['sku'], quantity, operation)

        if "error" in result:
            return f"Error: {result['error']}"

        change_text = f"+{result['change']}" if result['change'] > 0 else str(result['change'])
        status_icon = "🔴" if result['status'] == 'low' else "🟢"

        return (
            f"**✅ Inventory Updated Successfully**\n\n"
            f"**{result['name']}** (SKU: {result['sku']})\n"
            f"- Previous: {result['previous_quantity']:,} units\n"
            f"- Change: {change_text} units\n"
            f"- New: {result['new_quantity']:,} units\n"
            f"- Status: {status_icon} {result['status'].upper()}"
        )

    def _handle_pricing_action(self, message: str, scopes: List[str], context: str) -> str:
        """Handle pricing-related actions with real data."""

        # Check for discount calculation
        if any(kw in message for kw in ["discount", "calculate", "total"]):
            # Try to find customer and quantity
            customers = demo_store.get_all_customers()
            for customer in customers.values():
                if customer['name'].lower() in context:
                    # Found a customer, look for quantity
                    import re
                    qty_match = re.search(r'(\d+)\s*(?:units?)?', context)
                    quantity = int(qty_match.group(1)) if qty_match else 100

                    discount_info = demo_store.calculate_total_discount(customer['tier'], quantity)
                    return (
                        f"**Discount Calculation for {customer['name']}**\n\n"
                        f"- Customer Tier: {discount_info['tier']}\n"
                        f"- Tier Discount: {discount_info['tier_discount']}%\n"
                        f"- Order Quantity: {discount_info['quantity']:,} units\n"
                        f"- Volume Discount: {discount_info['volume_discount']}%\n"
                        f"- **Total Discount: {discount_info['total_discount']}%**"
                    )

        # Check for specific product pricing
        product_keywords = ["basketball", "hoop", "net", "uniform", "jersey", "shoe", "training"]
        for keyword in product_keywords:
            if keyword in message:
                pricing_list = demo_store.get_pricing_by_category(
                    "Basketballs" if keyword == "basketball" else
                    "Hoops & Backboards" if keyword in ["hoop", "backboard"] else
                    "Nets & Accessories" if keyword == "net" else
                    "Uniforms & Apparel" if keyword in ["uniform", "jersey"] else
                    "Footwear" if keyword == "shoe" else
                    "Training Equipment"
                )
                if pricing_list:
                    lines = [f"**{keyword.title()} Pricing:**\n"]
                    has_margin_access = "pricing:margin" in scopes
                    total_margin = 0
                    for item in pricing_list:
                        if has_margin_access:
                            lines.append(f"- {item['name']}: ${item['price']:.2f} (cost: ${item['cost']:.2f}, margin: {item['margin']}%)")
                            total_margin += item['margin']
                        else:
                            lines.append(f"- {item['name']}: ${item['price']:.2f}")
                    if has_margin_access:
                        avg_margin = total_margin / len(pricing_list)
                        lines.append(f"\n**Average margin: {avg_margin:.1f}%**")
                    return "\n".join(lines)

        # Check for margin queries - requires pricing:margin scope
        if "margin" in message or "profit" in message:
            if "pricing:margin" not in scopes:
                return (
                    "⚠️ **Access Denied: Margin Data Restricted**\n\n"
                    "You requested profit margin information, but your account does not have "
                    "`pricing:margin` scope.\n\n"
                    "**Your current permissions:** `pricing:read` (prices only, no margins)\n\n"
                    "Margin data is restricted to management accounts. "
                    "I can still help you with product prices and discount structures."
                )

            # Get all pricing and calculate averages by category
            inventory = demo_store.get_all_inventory()
            pricing = demo_store.get_all_pricing()

            categories = {}
            for sku, item in inventory.items():
                if sku in pricing:
                    cat = item['category']
                    if cat not in categories:
                        categories[cat] = []
                    categories[cat].append(pricing[sku]['margin'])

            lines = ["**Margin Analysis by Category:**\n"]
            for cat, margins in sorted(categories.items()):
                avg = sum(margins) / len(margins)
                lines.append(f"- {cat}: {avg:.1f}% average margin")

            return "\n".join(lines)

        # Default: return discount structure
        discounts = demo_store.get_discount_structure()
        return (
            "**ProGear Basketball - Pricing & Discounts**\n\n"
            "**Tier Discounts:**\n"
            + "\n".join(f"- {tier}: {disc}%" for tier, disc in discounts.get('tier_discounts', {}).items())
            + "\n\n**Volume Discounts:**\n"
            + "\n".join(f"- {qty}+ units: {disc}%" for qty, disc in sorted(discounts.get('volume_discounts', {}).items(), key=lambda x: int(x[0])))
            + "\n\n*Discounts are combinable (e.g., Platinum + 500 units = 25% off)*"
        )

    def _handle_customer_action(self, message: str, scopes: List[str], context: str) -> str:
        """Handle customer-related actions with real data."""

        # Check for specific customer lookup
        customers = demo_store.get_all_customers()
        for customer in customers.values():
            if customer['name'].lower() in context or customer['contact'].lower() in context:
                tier_emoji = {"Platinum": "💎", "Gold": "🥇", "Silver": "🥈", "Bronze": "🥉"}.get(customer['tier'], "")
                return (
                    f"**{customer['name']}** {tier_emoji}\n"
                    f"- Customer ID: {customer['id']}\n"
                    f"- Tier: {customer['tier']}\n"
                    f"- Contact: {customer['contact']}\n"
                    f"- Email: {customer['email']}\n"
                    f"- Location: {customer['location']}\n"
                    f"- Total Spent: ${customer['total_spent']:,}"
                )

        # Check for tier-based query
        for tier in ["platinum", "gold", "silver", "bronze"]:
            if tier in message:
                tier_customers = demo_store.get_customers_by_tier(tier.title())
                if tier_customers:
                    tier_emoji = {"Platinum": "💎", "Gold": "🥇", "Silver": "🥈", "Bronze": "🥉"}.get(tier.title(), "")
                    customers_sorted = sorted(tier_customers, key=lambda x: x['total_spent'], reverse=True)
                    lines = [f"**{tier_emoji} {tier.title()} Tier Customers ({len(tier_customers)}):**\n"]
                    total = 0
                    for c in customers_sorted:
                        lines.append(f"- **{c['name']}** - ${c['total_spent']:,} ({c['location']})")
                        total += c['total_spent']
                    lines.append(f"\n**Total {tier.title()} Revenue: ${total:,}**")
                    return "\n".join(lines)

        # Default: customer summary
        summary = demo_store.get_customer_summary()
        tier_emoji = {"Platinum": "💎", "Gold": "🥇", "Silver": "🥈", "Bronze": "🥉"}

        lines = [
            "**ProGear Basketball - Customer Summary**\n",
            f"Total Customers: {summary['total_customers']}",
            f"Total Revenue: ${summary['total_revenue']:,}",
            "\n**By Tier:**"
        ]

        for tier in ["Platinum", "Gold", "Silver", "Bronze"]:
            if tier in summary['by_tier']:
                data = summary['by_tier'][tier]
                emoji = tier_emoji.get(tier, "")
                lines.append(f"- {emoji} {tier}: {data['count']} customers, ${data['total_spent']:,}")

        return "\n".join(lines)

    def _handle_sales_action(self, message: str, scopes: List[str], context: str) -> str:
        """Handle sales-related actions."""
        # Sales data is more complex - for now return summary with real customer/inventory context

        summary = demo_store.get_customer_summary()
        inv_summary = demo_store.get_inventory_summary()

        # Get top customers for orders context
        platinum = demo_store.get_customers_by_tier("Platinum")
        top_customer = max(platinum, key=lambda x: x['total_spent']) if platinum else None

        lines = [
            "**ProGear Basketball - Sales Overview**\n",
            f"Total Customer Base: {summary['total_customers']} customers",
            f"Total Revenue: ${summary['total_revenue']:,}",
            f"Inventory Value: ${inv_summary['total_value']:,.2f}",
        ]

        if top_customer:
            lines.append(f"\n**Top Customer:** {top_customer['name']} (${top_customer['total_spent']:,})")

        # Add discount info for context
        discounts = demo_store.get_discount_structure()
        lines.append("\n**Available Discounts:**")
        lines.append(f"- Tier-based: up to {max(discounts.get('tier_discounts', {}).values() or [0])}%")
        lines.append(f"- Volume-based: up to {max(discounts.get('volume_discounts', {}).values() or [0])}%")

        return "\n".join(lines)

    async def _generate_response_node(self, state: WorkflowState) -> WorkflowState:
        """
        Generate a unified response combining all agent outputs.

        Clearly indicates which agents contributed and which were denied.
        """
        agent_results = state["agent_results"]
        conversation_context = state.get("conversation_context", "")

        # Collect successful responses and denied agents with their scopes
        responses = []
        denied_agents = []
        denied_scopes_by_agent = {}

        for agent_type, result in agent_results.items():
            if result["success"] and "response" in result:
                responses.append(result["response"])
            elif result.get("access_denied"):
                agent_name = result["agent_info"]["name"]
                denied_agents.append(agent_name)
                # Get the scopes that were requested but denied
                denied_scopes = result.get("requested_scopes", [])
                if denied_scopes:
                    denied_scopes_by_agent[agent_name] = denied_scopes

        # Build context section for response synthesis
        context_section = ""
        if conversation_context:
            context_section = f"""
CONVERSATION HISTORY (for context - understand what "it", "that", "this" refers to):
{conversation_context}

"""

        # Generate combined response
        if responses:
            # Use LLM to create natural combined response
            combined_data = "\n\n".join(responses)
            synthesis_prompt = f"""Based on the following agent responses, provide a helpful, natural answer
to the user's question: "{state['user_message']}"
{context_section}
Agent responses:
{combined_data}

{"Note: The user was denied access to these agents: " + ", ".join(denied_agents) if denied_agents else ""}

Provide a concise, helpful response that combines the relevant information.
If the user's message refers to something from the conversation history (like "it", "that", "yes"), use the context to understand what they mean.
If some agents were denied, acknowledge what information is missing but focus on what IS available."""

            try:
                response = await self.response_llm.ainvoke([
                    SystemMessage(content="You are a helpful AI assistant for ProGear Sporting Goods."),
                    HumanMessage(content=synthesis_prompt)
                ])
                final_response = response.content
            except Exception as e:
                logger.error(f"Response synthesis failed: {e}")
                final_response = combined_data

        elif denied_agents:
            # Build a clear message about which scopes the user doesn't have access to
            scope_details = []
            for agent_name in denied_agents:
                scopes = denied_scopes_by_agent.get(agent_name, [])
                if scopes:
                    scope_details.append(f"  - {agent_name}: {', '.join(scopes)}")
                else:
                    scope_details.append(f"  - {agent_name}")

            scope_info = "\n".join(scope_details)
            final_response = (
                f"You do not have access to the following scopes required for this request:\n\n"
                f"{scope_info}\n\n"
                f"Your Okta administrator can grant access through group membership policies."
            )
        else:
            final_response = (
                "I'm not sure how to help with that request. "
                "Try asking about orders, inventory, pricing, or customer information."
            )

        state["final_response"] = final_response

        state["agent_flow"].append({
            "step": "generate_response",
            "action": "Generated combined response",
            "status": "completed"
        })

        return state

    async def process(self, message: str, conversation_context: str = "") -> Dict[str, Any]:
        """
        Process a user message through the orchestrator.

        Args:
            message: User's message
            conversation_context: Previous conversation history for context-aware routing

        Returns:
            Dict with:
            - content: Final response
            - agent_flow: Steps taken
            - token_exchanges: Token exchange results per agent
        """
        # Initialize state
        initial_state: WorkflowState = {
            "messages": [],
            "user_message": message,
            "conversation_context": conversation_context,
            "user_info": self.user_info,
            "user_token": self.user_token,
            "agents_to_invoke": [],
            "agent_scopes": {},  # Will be populated by router based on intent
            "agent_results": {},
            "agent_flow": [],
            "token_exchanges": [],
            "final_response": None,
        }

        # Run the workflow
        final_state = await self.workflow.ainvoke(initial_state)

        return {
            "content": final_state["final_response"],
            "agent_flow": final_state["agent_flow"],
            "token_exchanges": final_state["token_exchanges"],
        }
