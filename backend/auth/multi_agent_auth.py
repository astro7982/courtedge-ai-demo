"""
Multi-Agent Token Exchange Manager

Handles ID-JAG token exchange for all 4 AI agents with proper access control.
Each agent gets tokens from its own authorization server.

Key feature: Graceful access denial
When a user doesn't have access to an agent (based on group membership),
the exchange returns access_denied instead of failing.
"""

import logging
import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

from .agent_config import (
    AgentConfig, get_agent_config, get_all_agent_configs,
    AGENT_SALES, AGENT_INVENTORY, AGENT_CUSTOMER, AGENT_PRICING,
    DEMO_AGENTS
)

logger = logging.getLogger(__name__)

# Try to import the Okta AI SDK
SDK_AVAILABLE = False
try:
    from okta_ai_sdk import OktaAISDK, OktaAIConfig, AuthServerTokenRequest
    SDK_AVAILABLE = True
    logger.info("Okta AI SDK loaded successfully")
except ImportError as e:
    logger.warning(f"Okta AI SDK not available: {e}. Using demo mode.")


class MultiAgentTokenExchange:
    """
    Manages token exchange for multiple AI agents.

    Each agent has its own credentials and auth server.
    Returns access_denied for unauthorized requests instead of errors.
    """

    def __init__(self):
        """Initialize token exchange managers for all configured agents."""
        self.okta_domain = os.getenv("OKTA_DOMAIN", "").strip()
        if self.okta_domain and not self.okta_domain.startswith("http"):
            self.okta_domain = f"https://{self.okta_domain}"

        self.main_auth_server_id = os.getenv("OKTA_MAIN_AUTH_SERVER_ID", "default").strip()

        # SDK instances per agent
        self._sdks: Dict[str, OktaAISDK] = {}
        self._configs: Dict[str, OktaAIConfig] = {}

        if SDK_AVAILABLE:
            self._initialize_sdks()

    def _initialize_sdks(self):
        """Initialize SDK instances for each configured agent."""
        for agent_type in [AGENT_SALES, AGENT_INVENTORY, AGENT_CUSTOMER, AGENT_PRICING]:
            config = get_agent_config(agent_type)
            if not config or not config.agent_id or not config.private_key:
                logger.info(f"Agent {agent_type} not fully configured, skipping SDK init")
                continue

            try:
                okta_config = OktaAIConfig(
                    oktaDomain=self.okta_domain,
                    clientId=config.agent_id,
                    clientSecret="",  # Not used with JWT bearer
                    authorizationServerId=config.auth_server_id,
                    principalId=config.agent_id,
                    privateJWK=config.private_key
                )
                self._configs[agent_type] = okta_config
                self._sdks[agent_type] = OktaAISDK(okta_config)
                logger.info(f"Initialized SDK for {agent_type} agent")
            except Exception as e:
                logger.error(f"Failed to initialize SDK for {agent_type}: {e}")

    def is_agent_available(self, agent_type: str) -> bool:
        """Check if an agent's SDK is properly initialized."""
        return agent_type in self._sdks

    async def exchange_token_for_agent(
        self,
        agent_type: str,
        user_id_token: str,
        requested_scopes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Exchange user's ID token for agent-specific access token.

        Args:
            agent_type: sales, inventory, customer, or pricing
            user_id_token: User's Okta ID token
            requested_scopes: Optional specific scopes to request

        Returns:
            Dict with:
            - success: bool
            - access_denied: bool (True if user lacks permission)
            - access_token: str (if successful)
            - scopes: List[str]
            - agent_info: Dict
            - error: str (if failed)
        """
        config = get_agent_config(agent_type)
        if not config:
            return self._demo_result(agent_type, user_id_token, requested_scopes)

        scopes = requested_scopes or config.scopes

        # Check if SDK is available for this agent
        if agent_type not in self._sdks:
            return self._demo_result(agent_type, user_id_token, scopes)

        sdk = self._sdks[agent_type]
        okta_config = self._configs[agent_type]

        try:
            # Step 1: Exchange ID token for ID-JAG token
            target_audience = f"{self.okta_domain}/oauth2/{config.auth_server_id}"
            scope_string = " ".join(scopes)

            logger.info(f"[{agent_type}] Step 1: ID token -> ID-JAG, audience={target_audience}")

            # First, we need the main auth server SDK for ID-JAG exchange
            main_sdk = self._get_main_sdk(config)
            if not main_sdk:
                return self._error_result(agent_type, config, "Main SDK not available")

            id_jag_result = main_sdk.cross_app_access.exchange_id_token(
                id_token=user_id_token,
                audience=target_audience,
                scope=scope_string
            )

            logger.info(f"[{agent_type}] Step 1 SUCCESS: expires_in={id_jag_result.expires_in}s")

            # Step 2: Exchange ID-JAG for auth server token
            logger.info(f"[{agent_type}] Step 2: ID-JAG -> Auth Server Token")

            auth_server_request = AuthServerTokenRequest(
                id_jag_token=id_jag_result.access_token,
                authorization_server_id=config.auth_server_id,
                principal_id=okta_config.principal_id,
                private_jwk=okta_config.private_jwk
            )

            token_result = sdk.cross_app_access.exchange_id_jag_for_auth_server_token(
                auth_server_request
            )

            logger.info(f"[{agent_type}] Step 2 SUCCESS: expires_in={token_result.expires_in}s")

            return {
                "success": True,
                "access_denied": False,
                "access_token": token_result.access_token,
                "token_type": getattr(token_result, "token_type", "Bearer"),
                "expires_in": token_result.expires_in,
                "scopes": scopes,
                "requested_scopes": scopes,  # Track what was requested
                "agent_info": {
                    "name": config.name,  # For Token Exchange card (e.g., "Inventory MCP")
                    "display_name": config.display_name,  # For Agent Flow card (e.g., "Inventory Agent")
                    "type": agent_type,
                    "agent_id": config.agent_id,
                    "color": config.color,
                },
                "auth_server": config.auth_server_id,
                "audience": config.audience,
                "demo_mode": False,
                "exchanged_at": datetime.now().isoformat(),
            }

        except Exception as e:
            error_str = str(e).lower()

            # Check for access denied errors (various error messages from Okta)
            policy_denied_keywords = [
                "no_matching_policy",
                "access_denied",
                "policy evaluation failed",
                "policy_evaluation_failed",
                "authorization server token exchange failed"
            ]
            if any(keyword in error_str for keyword in policy_denied_keywords):
                logger.info(f"[{agent_type}] ACCESS DENIED for user - policy restriction. Requested scopes: {scopes}")
                return {
                    "success": False,
                    "access_denied": True,
                    "access_token": None,
                    "scopes": [],
                    "requested_scopes": scopes,  # What was requested but denied
                    "agent_info": {
                        "name": config.name,
                        "display_name": config.display_name,
                        "type": agent_type,
                        "color": config.color,
                    },
                    "error": f"Access denied for scope(s): {', '.join(scopes)}",
                    "error_code": "access_denied",
                    "demo_mode": False,
                }

            # Other errors
            logger.error(f"[{agent_type}] Token exchange failed: {e}")
            return self._error_result(agent_type, config, str(e), scopes)

    def _get_main_sdk(self, agent_config: AgentConfig):
        """Get or create an SDK for the main auth server (for ID-JAG exchange)."""
        if not SDK_AVAILABLE or not agent_config.private_key:
            return None

        try:
            main_config = OktaAIConfig(
                oktaDomain=self.okta_domain,
                clientId=agent_config.agent_id,
                clientSecret="",
                authorizationServerId=self.main_auth_server_id,
                principalId=agent_config.agent_id,
                privateJWK=agent_config.private_key
            )
            return OktaAISDK(main_config)
        except Exception as e:
            logger.error(f"Failed to create main SDK: {e}")
            return None

    def _demo_result(self, agent_type: str, user_id_token: str, requested_scopes: Optional[List[str]] = None) -> Dict[str, Any]:
        """Return demo mode result when SDK is not configured."""
        demo_config = DEMO_AGENTS.get(agent_type, {})
        scopes = requested_scopes or demo_config.get("scopes", [])
        return {
            "success": True,
            "access_denied": False,
            "access_token": f"demo-{agent_type}-token-{int(datetime.now().timestamp())}",
            "token_type": "Bearer",
            "expires_in": 3600,
            "scopes": scopes,
            "requested_scopes": scopes,
            "agent_info": {
                "name": demo_config.get("name", f"{agent_type.title()} MCP"),
                "display_name": demo_config.get("display_name", f"{agent_type.title()} Agent"),
                "type": agent_type,
                "color": demo_config.get("color", "#888888"),
            },
            "demo_mode": True,
            "exchanged_at": datetime.now().isoformat(),
        }

    def _error_result(
        self, agent_type: str, config: Optional[AgentConfig], error: str, requested_scopes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Return error result."""
        return {
            "success": False,
            "access_denied": False,
            "access_token": None,
            "scopes": [],
            "requested_scopes": requested_scopes or [],
            "agent_info": {
                "name": config.name if config else f"{agent_type.title()} MCP",
                "display_name": config.display_name if config else f"{agent_type.title()} Agent",
                "type": agent_type,
                "color": config.color if config else "#888888",
            },
            "error": error,
            "demo_mode": False,
        }

    async def exchange_for_all_agents(
        self,
        user_id_token: str,
        agent_types: Optional[List[str]] = None,
        agent_scopes: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Exchange tokens for multiple agents at once.

        Args:
            user_id_token: User's ID token
            agent_types: List of agent types, or None for all
            agent_scopes: Optional dict mapping agent_type to specific scopes to request

        Returns:
            Dict mapping agent_type to exchange result
        """
        if agent_types is None:
            agent_types = [AGENT_SALES, AGENT_INVENTORY, AGENT_CUSTOMER, AGENT_PRICING]

        results = {}
        for agent_type in agent_types:
            # Get specific scopes for this agent if provided
            scopes = agent_scopes.get(agent_type) if agent_scopes else None
            results[agent_type] = await self.exchange_token_for_agent(
                agent_type, user_id_token, scopes
            )

        return results


# Singleton instance
_multi_agent_exchange: Optional[MultiAgentTokenExchange] = None


def get_multi_agent_exchange() -> MultiAgentTokenExchange:
    """Get or create the MultiAgentTokenExchange singleton."""
    global _multi_agent_exchange
    if _multi_agent_exchange is None:
        _multi_agent_exchange = MultiAgentTokenExchange()
    return _multi_agent_exchange
