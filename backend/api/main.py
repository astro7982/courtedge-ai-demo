"""
ProGear Sales AI - FastAPI Backend
Main entry point for the API server.

Features:
- Multi-agent orchestration with 4 specialized agents
- ID-JAG token exchange for each agent
- Access control based on user's Okta groups
- Agent flow visualization data for UI
"""

import os
import logging
import httpx
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from auth.okta_auth import get_okta_auth
from auth.agent_config import get_all_agent_configs, DEMO_AGENTS
from orchestrator.orchestrator import Orchestrator
from api.conversation_store import conversation_store

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ProGear AI Sales API",
    description="Multi-agent AI sales assistant with Okta governance",
    version="0.2.0",
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---

class ChatMessage(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    session_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class AgentInfo(BaseModel):
    """Information about an agent."""
    name: str
    type: str
    color: str
    status: str  # "granted", "denied", "pending"
    scopes: List[str] = []


class TokenExchange(BaseModel):
    """Token exchange result."""
    agent: str
    agent_name: str
    color: str
    success: bool
    access_denied: bool = False
    status: str  # "granted", "denied", "error"
    scopes: List[str] = []
    error: Optional[str] = None
    demo_mode: bool = False


class AgentFlowStep(BaseModel):
    """A step in the agent flow."""
    step: str
    action: str
    status: str
    color: Optional[str] = None
    agents: Optional[List[str]] = None


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    content: str
    session_id: str
    agent_flow: List[AgentFlowStep]
    token_exchanges: List[TokenExchange]
    user_info: Optional[Dict[str, Any]] = None


# --- Health Check ---

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "progear-ai-api",
        "version": "0.2.0",
        "agents": list(DEMO_AGENTS.keys())
    }


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "ProGear AI Sales API",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/health",
        "agents": 4
    }


# --- Chat Endpoint ---

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    Main chat endpoint.

    This will:
    1. Authenticate the user (via Okta token)
    2. Route to appropriate agent(s) via orchestrator
    3. Perform ID-JAG token exchange for each agent
    4. Return response with agent flow and token exchanges
    """
    logger.info(f"=== Chat Request ===")
    logger.info(f"Message: {request.message[:50]}...")
    logger.info(f"Has auth header: {authorization is not None}")

    okta_auth = get_okta_auth()
    user_info = None

    # Extract user token
    user_token = None
    if authorization and authorization.startswith("Bearer "):
        user_token = authorization[7:]

    # Validate user
    if user_token:
        try:
            user_claims = await okta_auth.validate_token(user_token)
            user_info = {
                "sub": user_claims.get("sub"),
                "email": user_claims.get("email"),
                "name": user_claims.get("name"),
                "groups": user_claims.get("groups", []),
            }
            logger.info(f"User authenticated: {user_info.get('email')}")
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            user_info = {"email": "anonymous", "groups": []}
    else:
        user_info = {"email": "anonymous", "groups": []}

    # Get or create conversation session
    session_id = conversation_store.get_or_create_session(request.session_id)

    # Get conversation context for routing
    conversation_context = conversation_store.get_context_summary(session_id, max_messages=6)

    # Store the user's message
    conversation_store.add_message(session_id, "user", request.message)

    # Create orchestrator and process request with conversation context
    try:
        orchestrator = Orchestrator(
            user_token=user_token or "",
            user_info=user_info
        )
        result = await orchestrator.process(request.message, conversation_context)

        # Store the assistant's response
        conversation_store.add_message(session_id, "assistant", result["content"])

        return ChatResponse(
            content=result["content"],
            session_id=session_id,
            agent_flow=[AgentFlowStep(**step) for step in result["agent_flow"]],
            token_exchanges=[TokenExchange(**ex) for ex in result["token_exchanges"]],
            user_info=user_info
        )

    except Exception as e:
        logger.error(f"Orchestrator error: {e}")

        # Return error response with empty flows
        return ChatResponse(
            content=f"I encountered an error processing your request: {str(e)}",
            session_id=request.session_id or "session-1",
            agent_flow=[
                AgentFlowStep(step="error", action=str(e), status="error")
            ],
            token_exchanges=[],
            user_info=user_info
        )


# --- Agent Status Endpoint ---

@app.get("/api/agents/status")
async def agent_status():
    """Get status of all agents and their configuration."""
    agents = []
    configs = get_all_agent_configs()

    for agent_type, config in configs.items():
        if config:
            agents.append({
                "name": config.name,
                "type": config.agent_type,
                "description": config.description,
                "color": config.color,
                "configured": bool(config.agent_id),
                "has_private_key": config.private_key is not None,
                "scopes": config.scopes,
            })
        else:
            # Use demo config
            demo = DEMO_AGENTS.get(agent_type, {})
            agents.append({
                "name": demo.get("name", f"{agent_type.title()} Agent"),
                "type": agent_type,
                "description": "Demo mode",
                "color": demo.get("color", "#888"),
                "configured": False,
                "has_private_key": False,
                "scopes": demo.get("scopes", []),
            })

    return {
        "agents": agents,
        "count": len(agents),
        "orchestrator": "langgraph",
    }


# --- Okta Config Endpoint (for frontend) ---

@app.get("/api/config/okta")
async def okta_config():
    """
    Return Okta configuration for frontend.
    Only returns public information.
    """
    return {
        "domain": os.getenv("OKTA_DOMAIN", ""),
        "clientId": os.getenv("OKTA_CLIENT_ID", ""),
        "issuer": os.getenv("OKTA_ISSUER", ""),
        # Never return secrets!
    }


# --- Agent Config Endpoint (for UI visualization) ---

@app.get("/api/agents/config")
async def agent_config():
    """Get agent configuration for UI display."""
    return {
        "agents": [
            {
                "type": "sales",
                "name": "ProGear Sales Agent",
                "description": "Orders, quotes, and sales pipeline",
                "color": "#3b82f6",
                "icon": "ShoppingCart",
            },
            {
                "type": "inventory",
                "name": "ProGear Inventory Agent",
                "description": "Stock levels, products, and warehouse",
                "color": "#10b981",
                "icon": "Package",
            },
            {
                "type": "customer",
                "name": "ProGear Customer Agent",
                "description": "Accounts, contacts, and purchase history",
                "color": "#8b5cf6",
                "icon": "Users",
            },
            {
                "type": "pricing",
                "name": "ProGear Pricing Agent",
                "description": "Pricing, margins, and discounts",
                "color": "#f59e0b",
                "icon": "DollarSign",
            },
        ]
    }


# --- Okta System Logs Endpoint (for governance demo) ---

@app.get("/api/okta/logs")
async def okta_system_logs(
    minutes: int = Query(default=10, description="Look back this many minutes"),
    limit: int = Query(default=20, description="Max number of logs to return")
):
    """
    Fetch recent Okta system logs for token exchange events.
    Shows both the AI agent (actor) and the user (on behalf of).

    This demonstrates Okta's governance in action.
    """
    okta_domain = os.getenv("OKTA_DOMAIN", "").strip()
    if okta_domain and not okta_domain.startswith("http"):
        okta_domain = f"https://{okta_domain}"

    okta_api_token = os.getenv("OKTA_API_TOKEN", "").strip()

    if not okta_domain or not okta_api_token:
        return {
            "logs": [],
            "error": "Okta API not configured",
            "demo_mode": True
        }

    # Calculate time range
    since = (datetime.utcnow() - timedelta(minutes=minutes)).strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        async with httpx.AsyncClient() as client:
            # Fetch token exchange related events
            response = await client.get(
                f"{okta_domain}/api/v1/logs",
                params={
                    "since": since,
                    "limit": limit,
                    "q": "token"  # Search for token-related events
                },
                headers={
                    "Authorization": f"SSWS {okta_api_token}",
                    "Accept": "application/json"
                },
                timeout=10.0
            )

            if response.status_code != 200:
                logger.error(f"Okta API error: {response.status_code} - {response.text}")
                return {
                    "logs": [],
                    "error": f"Okta API error: {response.status_code}"
                }

            raw_logs = response.json()

            # Filter and format relevant logs
            formatted_logs = []
            for log in raw_logs:
                event_type = log.get("eventType", "")

                # Focus on token grant events (both success and failure)
                if "token.grant" in event_type or "token_exchange" in event_type:
                    outcome = log.get("outcome", {})
                    actor = log.get("actor", {})
                    targets = log.get("target", [])
                    debug_data = log.get("debugContext", {}).get("debugData", {})

                    # Extract user from targets (the "on behalf of" user)
                    user_info = None
                    id_jag_info = None
                    for target in targets:
                        if target.get("type") == "User":
                            user_info = {
                                "id": target.get("id"),
                                "email": target.get("alternateId"),
                                "name": target.get("displayName")
                            }
                        elif target.get("type") == "id_jag":
                            id_jag_info = target.get("detailEntry", {})

                    formatted_log = {
                        "timestamp": log.get("published"),
                        "event_type": event_type,
                        "display_message": log.get("displayMessage"),
                        "outcome": {
                            "result": outcome.get("result"),
                            "reason": outcome.get("reason")
                        },
                        "actor": {
                            "id": actor.get("id"),
                            "type": actor.get("type"),
                            "name": actor.get("displayName"),
                            "alternate_id": actor.get("alternateId")
                        },
                        "user_on_behalf_of": user_info,
                        "id_jag": id_jag_info,
                        "details": {
                            "auth_server": debug_data.get("authorizationServerName"),
                            "requested_scopes": debug_data.get("requestedScopes"),
                            "granted_scopes": debug_data.get("grantedScopes"),
                            "grant_type": debug_data.get("grantType")
                        },
                        "severity": log.get("severity")
                    }
                    formatted_logs.append(formatted_log)

            return {
                "logs": formatted_logs,
                "count": len(formatted_logs),
                "time_range": {
                    "since": since,
                    "minutes": minutes
                }
            }

    except httpx.TimeoutException:
        logger.error("Okta API timeout")
        return {
            "logs": [],
            "error": "Okta API timeout"
        }
    except Exception as e:
        logger.error(f"Error fetching Okta logs: {e}")
        return {
            "logs": [],
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
