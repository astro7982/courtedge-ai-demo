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
            requested_scopes = result.get("requested_scopes", agent_scopes.get(agent_type, []))

            exchange_record = {
                "agent": agent_type,
                "agent_name": result["agent_info"]["name"],  # MCP name for Token Exchange card
                "color": result["agent_info"]["color"],
                "success": result["success"],
                "access_denied": result.get("access_denied", False),
                "scopes": result.get("scopes", []),
                "requested_scopes": requested_scopes,  # What was requested
                "demo_mode": result.get("demo_mode", False),
            }

            if result.get("access_denied"):
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
                    exchange_result
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
        exchange_result: Dict[str, Any]
    ) -> str:
        """
        Invoke a specific agent to process the request.

        In full implementation, this would:
        1. Use the MCP token to call MCP tools
        2. Have the agent LLM process with tool results
        3. Return agent's response

        For now, returns simulated responses based on agent type.
        """
        # Get agent-specific data (will be replaced with MCP calls)
        data = self._get_demo_data(agent_type, message)

        agent_name = exchange_result["agent_info"]["name"]
        scopes = exchange_result.get("scopes", [])

        return f"[{agent_name}]\n{data}\n(Scopes: {', '.join(scopes)})"

    def _get_demo_data(self, agent_type: str, message: str) -> str:
        """Get demo data for an agent based on message context."""
        message_lower = message.lower()

        if agent_type == AGENT_SALES:
            if "order" in message_lower or "recent" in message_lower:
                return (
                    "Recent Orders:\n"
                    "- ORD-2024-001: State University Athletics - $7,109.53 (shipped)\n"
                    "- ORD-2024-002: Metro High School District - $23,796.60 (processing)\n"
                    "- ORD-2024-003: Riverside Youth League - $3,608.95 (pending)\n"
                    "- ORD-2024-004: City Pro Basketball Academy - $5,669.69 (shipped)\n"
                    "Pipeline Value: $40,184.77 this week"
                )
            return (
                "Sales Summary:\n"
                "- Active orders: 5 orders totaling $40,184.77\n"
                "- Top customer: Metro High School District ($124,500 lifetime)\n"
                "- Quote ready for 1,500 basketballs @ 20% bulk discount"
            )

        elif agent_type == AGENT_INVENTORY:
            if "basketball" in message_lower:
                return (
                    "Basketball Inventory:\n"
                    "- Pro Game Basketball: 2,847 units - GOOD\n"
                    "- Pro Composite: 1,523 units - GOOD\n"
                    "- Women's Official: 1,234 units - GOOD\n"
                    "- Youth Size 5: 3,567 units - GOOD\n"
                    "- Youth Size 4: 2,156 units - GOOD\n"
                    "Total basketballs: 12,219 units available"
                )
            return (
                "Inventory Summary:\n"
                "- Basketballs: 12,219 units (6 SKUs)\n"
                "- Hoops & Backboards: 769 units (4 SKUs)\n"
                "- Uniforms: 21,120 units (4 SKUs)\n"
                "- Training Equipment: 4,700 units (4 SKUs)\n"
                "Low stock alert: Pro Arena Hoop System (45 units)"
            )

        elif agent_type == AGENT_CUSTOMER:
            if "state" in message_lower or "university" in message_lower:
                return (
                    "Customer: State University Athletics\n"
                    "- Tier: Platinum\n"
                    "- Lifetime Value: $89,500 (156 orders)\n"
                    "- Contact: Coach Williams\n"
                    "- Territory: West | Payment: Net 45\n"
                    "Note: Preferred for bulk basketball orders"
                )
            if "platinum" in message_lower or "tier" in message_lower:
                return (
                    "Platinum Tier Customers:\n"
                    "1. Metro High School District - $124,500 lifetime\n"
                    "2. State University Athletics - $89,500 lifetime\n"
                    "3. City Pro Basketball Academy - $67,800 lifetime\n"
                    "Platinum benefits: 5% discount, Net 45-60 terms"
                )
            return (
                "Customer Overview:\n"
                "- Platinum: 3 accounts ($281,800 combined)\n"
                "- Gold: 3 accounts ($63,500 combined)\n"
                "- Silver: 2 accounts ($15,200 combined)\n"
                "Top: Metro High School District ($124,500)"
            )

        elif agent_type == AGENT_PRICING:
            if "basketball" in message_lower or "margin" in message_lower:
                return (
                    "Basketball Pricing:\n"
                    "- Pro Game: $149.99 (cost $62, margin 58.7%)\n"
                    "- Pro Composite: $89.99 (cost $38, margin 57.8%)\n"
                    "- Women's Official: $129.99 (cost $55, margin 57.7%)\n"
                    "- Youth Size 5: $34.99 (cost $14, margin 60.0%)\n"
                    "Average basketball margin: 58.8%"
                )
            if "bulk" in message_lower or "discount" in message_lower:
                return (
                    "Bulk Discounts:\n"
                    "- 10+ units: 5% | 50+ units: 10%\n"
                    "- 100+ units: 15% | 500+ units: 20%\n"
                    "Customer Tier Bonuses:\n"
                    "- Platinum: +5% | Gold: +3%\n"
                    "Example: 1,500 units @ Platinum = 25% total discount"
                )
            return (
                "Pricing Overview:\n"
                "- Average margin: 58.2% across all products\n"
                "- Highest: Youth basketballs (60%)\n"
                "- Volume discounts: 5-20% based on quantity\n"
                "- Tier discounts: 0-5% based on customer status"
            )

        return "Data not available for this query."

    async def _generate_response_node(self, state: WorkflowState) -> WorkflowState:
        """
        Generate a unified response combining all agent outputs.

        Clearly indicates which agents contributed and which were denied.
        """
        agent_results = state["agent_results"]

        # Collect successful responses and denied agents
        responses = []
        denied_agents = []

        for agent_type, result in agent_results.items():
            if result["success"] and "response" in result:
                responses.append(result["response"])
            elif result.get("access_denied"):
                denied_agents.append(result["agent_info"]["name"])

        # Generate combined response
        if responses:
            # Use LLM to create natural combined response
            combined_data = "\n\n".join(responses)
            synthesis_prompt = f"""Based on the following agent responses, provide a helpful, natural answer
to the user's question: "{state['user_message']}"

Agent responses:
{combined_data}

{"Note: The user was denied access to these agents: " + ", ".join(denied_agents) if denied_agents else ""}

Provide a concise, helpful response that combines the relevant information.
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
            final_response = (
                f"I apologize, but you don't have access to the agents needed for this request.\n\n"
                f"Access denied for: {', '.join(denied_agents)}\n\n"
                f"Please contact your administrator if you need access to this information."
            )
        else:
            final_response = (
                "I'm not sure how to help with that request. "
                "Try asking about orders, inventory, pricing, or customer information."
            )

        state["final_response"] = final_response

        # Add denied agents info if any
        if denied_agents:
            state["final_response"] += f"\n\n[Note: Limited access - denied agents: {', '.join(denied_agents)}]"

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
