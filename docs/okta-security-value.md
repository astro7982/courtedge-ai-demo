# Why Okta AI Agent Governance Matters

> A practical guide to understanding the security value for CISOs, security teams, and compliance officers

---

## Table of Contents

1. [The Challenge in Plain Terms](#the-challenge-in-plain-terms)
2. [The Four Scenarios: How AI Agents Access Your Data](#the-four-scenarios-how-ai-agents-access-your-data)
3. [Scenario 1: Standard Token Exchange (No Governance)](#scenario-1-standard-token-exchange-no-governance)
4. [Scenario 2: ID-JAG with Okta Authorization Servers (This Demo)](#scenario-2-id-jag-with-okta-authorization-servers-this-demo)
5. [Scenario 3: ID-JAG/XAA with Customer-Controlled External Auth Server](#scenario-3-id-jagxaa-with-customer-controlled-external-auth-server)
6. [Scenario 4: ID-JAG/XAA with ISV Authorization Servers](#scenario-4-id-jagxaa-with-isv-authorization-servers)
7. [Industry Validation: MCP Adopts Cross App Access](#industry-validation-mcp-adopts-cross-app-access)
8. [The Workload Principal: Your AI Agent's Identity](#the-workload-principal-your-ai-agents-identity)
9. [Proof: What You See in Audit Logs](#proof-what-you-see-in-audit-logs)
10. [Real Demo Scenarios with Evidence](#real-demo-scenarios-with-evidence)
11. [Security and Governance FAQ](#security-and-governance-faq)

---

## The Challenge in Plain Terms

Your organization is building AI agents. These agents need to access company data - customer records, inventory systems, pricing engines, sales pipelines.

**The security question is simple:** When an AI agent accesses your data, can you answer these questions?

1. **WHO** requested this access? (Which user?)
2. **WHAT** AI system performed the action? (Which agent?)
3. **WHEN** did it happen? (Timestamp?)
4. **WHY** was access granted or denied? (Which policy?)
5. **CAN** we shut it down immediately if needed? (Kill switch?)

Your ability to answer these questions depends on *how* your AI agents authenticate and access resources. There are four distinct scenarios, each with different governance capabilities.

---

## The Four Scenarios: How AI Agents Access Your Data

Before diving into technical details, understand that there are four ways an AI agent can access your data. The governance capabilities differ dramatically between them.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   THE FOUR AI AGENT ACCESS SCENARIOS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SCENARIO 1: Standard Token Exchange                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  App ──▶ Okta ──▶ API                                                  │ │
│  │  • No workload principal                                               │ │
│  │  • No user attribution in tokens                                       │ │
│  │  • Audit shows "app got token" - nothing more                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  SCENARIO 2: ID-JAG with Okta Auth Servers (THIS DEMO)                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AI Agent (wlp) ──▶ Okta ID-JAG ──▶ Okta Auth Server                   │ │
│  │  • Workload principal with full visibility                             │ │
│  │  • User + agent identity in every token                                │ │
│  │  • Complete audit trail: who, what, when, why                          │ │
│  │  • Works TODAY - no external dependencies                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  SCENARIO 3: ID-JAG/XAA with Customer External Auth Server                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AI Agent (wlp) ──▶ Okta ID-JAG ──▶ Customer's Auth Server             │ │
│  │  • Same workload principal visibility                                  │ │
│  │  • Customer builds resource server to validate ID-JAG                  │ │
│  │  • Full governance - customer controls both sides                      │ │
│  │  • Works TODAY - requires customer engineering effort                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  SCENARIO 4: ID-JAG/XAA with ISV Auth Servers                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AI Agent (wlp) ──▶ Okta ID-JAG ──▶ Salesforce/ServiceNow/etc.         │ │
│  │  • Same workload principal visibility                                  │ │
│  │  • ISV builds resource server to validate ID-JAG                       │ │
│  │  • Same governance model extends to external SaaS                      │ │
│  │  • Growing ecosystem - MCP has adopted this pattern                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Comparison

| Scenario | Workload Principal | User Attribution | Who Implements Resource Server | Status |
|----------|-------------------|------------------|-------------------------------|--------|
| 1. Standard Token Exchange | No | No | N/A | Works, no governance |
| 2. ID-JAG + Okta Auth Servers | **Yes** | **Yes** | Okta (config only) | **Works today** |
| 3. ID-JAG/XAA + Customer Auth Server | **Yes** | **Yes** | Customer builds it | Works today (effort required) |
| 4. ID-JAG/XAA + ISV Auth Server | **Yes** | **Yes** | ISV builds it | Ecosystem growing |

**Key Insight:** Scenarios 2, 3, and 4 are technically identical - they all use Cross App Access (XAA) with the ID-JAG grant type. The only difference is who implements the resource server side.

---

## Scenario 1: Standard Token Exchange (No Governance)

### What It Is

Traditional OAuth 2.0 token exchange (RFC 8693) between applications. This is what most organizations use today for app-to-app communication.

### How It Works

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   Your App     │ ───▶ │     OKTA       │ ───▶ │   Your API     │
│   (0oa...)     │      │ Token Exchange │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
```

### The Token

```json
{
  "sub": "0oa8x5nsjp8aDUpB70g7",
  "scp": ["inventory:read"],
  "aud": "api://progear-inventory"
}
```

**Problem:** Who is `0oa8x5nsjp8aDUpB70g7`? Is this a user? A service? An AI agent? Who authorized this access?

### The Audit Log

```json
{
  "eventType": "app.oauth2.as.token.grant",
  "actor": {
    "id": "0oa8x5nsjp8aDUpB70g7",
    "type": "PublicClientApp",
    "displayName": "AI-Sales-Service"
  },
  "target": [
    {
      "type": "AuthorizationServer",
      "displayName": "Inventory API"
    }
  ]
}
```

**What You Know:** An app called "AI-Sales-Service" got a token.
**What You Don't Know:** Which user triggered this? Was it Sarah in Sales or Mike in Warehouse?

### The Governance Gap

| Capability | Available? |
|------------|-----------|
| Identify which AI agents exist | No - mixed with other apps |
| Know who owns each AI agent | No - optional field |
| See which user the agent acted for | No - not in token |
| Revoke AI agent access instantly | Partially - credential rotation required |
| Audit AI actions by user | No - requires custom implementation |

### When This Is Acceptable

- Internal services with no user context
- Batch jobs that don't act on behalf of users
- Legacy integrations where governance isn't required

### When This Is NOT Acceptable

- AI agents that access user data on behalf of users
- Systems that require compliance auditing
- Environments where you need to answer "who did this?"

---

## Scenario 2: ID-JAG with Okta Authorization Servers (This Demo)

### What It Is

Cross App Access (XAA) using the Identity Assertion JWT Authorization Grant (ID-JAG) with Okta-managed authorization servers. This is what this demo implements.

### How It Works

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   AI Agent     │ ───▶ │     OKTA       │ ───▶ │ Okta Auth      │
│   (wlp...)     │      │    ID-JAG      │      │ Server         │
└────────────────┘      └────────────────┘      └────────────────┘
        │                       │                       │
        │ Workload Principal    │ act claim             │ Scoped token
        │ in Universal Dir      │ with user+agent       │ for your API
        ▼                       ▼                       ▼
```

### The Token

```json
{
  "sub": "sarah.sales@progear-demo.com",
  "act": {
    "sub": "wlp8x5q7mvH86KvFJ0g7"
  },
  "scp": ["inventory:read"],
  "aud": "api://progear-inventory"
}
```

**Clear Answer:** Sarah Sales (`sub`) is the user. The AI agent `wlp8x5q7mvH86KvFJ0g7` (`act.sub`) is acting on her behalf.

### The Audit Log

```json
{
  "eventType": "app.oauth2.token.grant.id_jag",
  "actor": {
    "id": "wlp8x5q7mvH86KvFJ0g7",
    "type": "AI Agent",
    "displayName": "ProGear Sales Agent"
  },
  "target": [
    {
      "id": "00u8x5nsjp8aDUpB70g7",
      "type": "User",
      "displayName": "Sarah Sales",
      "alternateId": "sarah.sales@progear-demo.com"
    },
    {
      "type": "AuthorizationServer",
      "displayName": "ProGear Inventory MCP"
    }
  ]
}
```

**What You Know:** Everything.
- **WHO:** Sarah Sales
- **WHAT:** ProGear Sales Agent accessed Inventory API
- **WHEN:** Timestamp in log
- **WHY:** Policy allowed it (or denied it with reason)

### The Governance Capability

| Capability | Available? |
|------------|-----------|
| Identify which AI agents exist | **Yes** - dedicated AI Agents section |
| Know who owns each AI agent | **Yes** - mandatory owner field |
| See which user the agent acted for | **Yes** - in token and logs |
| Revoke AI agent access instantly | **Yes** - one-click deactivate |
| Audit AI actions by user | **Yes** - query by user or agent |

### What This Demo Proves

This demo implements Scenario 2 with four internal authorization servers:
- ProGear Sales API (`api://progear-sales`)
- ProGear Inventory API (`api://progear-inventory`)
- ProGear Customer API (`api://progear-customer`)
- ProGear Pricing API (`api://progear-pricing`)

**This works today. No external dependencies. No waiting for anyone.**

### Admin Console Visibility

```
┌─────────────────────────────────────────────────────────────────────┐
│  Applications → AI Agents                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ProGear Sales Agent                                                │
│  ID: wlp8x5q7mvH86KvFJ0g7                                           │
│  Owner: john.admin@company.com                                      │
│  Status: ● Active                                                   │
│  Managed Connections: 4 APIs                                        │
│                                                                     │
│  Every AI agent visible. Every owner identified. One click to stop. │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Scenario 3: ID-JAG/XAA with Customer-Controlled External Auth Server

### What It Is

Cross App Access (XAA) using ID-JAG where the resource server is an authorization server you own and control, but is external to Okta.

### When This Applies

- You have a custom authorization server (not Okta-managed)
- Your internal applications use this auth server for API access
- You want the same governance and visibility as Scenario 2
- You can modify your auth server to validate Okta's ID-JAG tokens

### How It Works

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   AI Agent     │ ───▶ │     OKTA       │ ───▶ │ Your Custom    │
│   (wlp...)     │      │    ID-JAG      │      │ Auth Server    │
└────────────────┘      └────────────────┘      └────────────────┘
        │                       │                       │
        │ Workload Principal    │ ID-JAG token          │ Validates JWT
        │ still in Okta         │ with act claim        │ trusts Okta
        ▼                       ▼                       ▼
```

### What You Get From Okta

- **Workload Principal (`wlp`)** - the AI agent identity
- **ID-JAG token** - contains `sub` (user) and `act.sub` (agent)
- **Okta audit logs** - `app.oauth2.token.grant.id_jag` events

### What You Build

Your external authorization server must:

1. **Accept ID-JAG tokens** via RFC 8693 token exchange
2. **Validate against Okta's JWKS** (`https://your-org.okta.com/oauth2/v1/keys`)
3. **Read the `sub` and `act.sub` claims** for user and agent identity
4. **Issue your own access tokens** for your protected resources

### Pseudocode for Your Auth Server

```python
def token_exchange(subject_token):
    # 1. Validate the ID-JAG from Okta
    claims = validate_jwt(
        token=subject_token,
        jwks_url="https://your-org.okta.com/oauth2/v1/keys"
    )

    # 2. Extract identities
    user_id = claims["sub"]           # "sarah.sales@company.com"
    agent_id = claims["act"]["sub"]   # "wlp8x5q7mvH86KvFJ0g7"

    # 3. Make policy decision
    scopes = determine_scopes(user_id, agent_id)

    # 4. Issue your own token
    return issue_token(
        sub=user_id,
        act={"sub": agent_id},  # Preserve the delegation chain
        scopes=scopes
    )
```

### The Value

| Capability | Available? |
|------------|-----------|
| Workload principal visibility | **Yes** - in Okta |
| User attribution in tokens | **Yes** - you read the `act` claim |
| Audit in Okta | **Yes** - ID-JAG issuance logged |
| Audit in your system | **Yes** - you log with both identities |
| Instant revocation | **Yes** - deactivate agent in Okta |

### Status

**Works today** - requires engineering effort to implement the resource server side, but you control both ends.

---

## Scenario 4: ID-JAG/XAA with ISV Authorization Servers

### What It Is

Cross App Access (XAA) using ID-JAG where the resource server is a third-party SaaS application (Salesforce, ServiceNow, Box, etc.) that you don't control.

### How It Works

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   AI Agent     │ ───▶ │     OKTA       │ ───▶ │  Salesforce /  │
│   (wlp...)     │      │    ID-JAG      │      │  ServiceNow /  │
└────────────────┘      └────────────────┘      │  Box, etc.     │
        │                       │               └────────────────┘
        │                       │                       │
        │ Workload Principal    │ ID-JAG token          │ ISV validates
        │ still in Okta         │ with act claim        │ and issues token
        ▼                       ▼                       ▼
```

### The Difference from Scenario 3

| Aspect | Scenario 3 (Customer Auth Server) | Scenario 4 (ISV Auth Server) |
|--------|-----------------------------------|------------------------------|
| Who builds resource server | You | The ISV |
| When it's available | Now (you build it) | When ISV adopts XAA |
| Your control | Complete | Limited to Okta config |

### What the ISV Must Implement

The same thing you would build in Scenario 3:
1. Accept ID-JAG tokens via token exchange
2. Validate against Okta's JWKS
3. Read `sub` and `act.sub` claims
4. Issue scoped access tokens

### The Value When ISVs Adopt

- **Same governance model** extends to external SaaS
- **No reconfiguration needed** - just add managed connections in Okta
- **User identity preserved** across all AI interactions, internal and external
- **Centralized audit** - Okta logs every ID-JAG issuance

### Status

**Ecosystem growing.** The pattern is standardized (IETF ID-JAG specification). ISV adoption is accelerating.

---

## Industry Validation: MCP Adopts Cross App Access

### The Significance

In May 2025, the **Model Context Protocol (MCP)** - Anthropic's open standard for connecting AI agents to external tools - officially adopted Cross App Access as the enterprise authentication pattern.

### What MCP Is

MCP is how AI agents like Claude connect to external resources (databases, APIs, SaaS tools). When an employee uses Claude to access company data, MCP handles the connection.

### The Problem MCP Solves with XAA

**Before XAA (current state):**
- Employee connects Claude to Salesforce
- Claude prompts user for OAuth consent
- User approves, Claude gets a token
- **Enterprise admin has no visibility or control**
- Each employee manages their own connections
- No centralized governance, no audit trail

**With XAA:**
- Employee logs into Claude via SSO (Okta)
- Claude requests ID-JAG from Okta
- Okta checks: Is this user allowed to use Claude to access Salesforce?
- If yes, issues ID-JAG with user + agent identity
- Salesforce validates the ID-JAG, issues scoped token
- **Enterprise admin controls everything through Okta**

### Why This Matters

1. **Validation of the pattern** - MCP choosing XAA confirms this is the right approach for enterprise AI
2. **Ecosystem acceleration** - MCP servers will implement XAA, driving ISV adoption
3. **Centralized control** - IT admins manage AI agent access through existing identity infrastructure
4. **Standards-based** - IETF specification, not proprietary

### The Quote

> "Enterprise admin has no visibility or control over individual OAuth connections. Cross-App Access shifts control to IT administrators who can enforce policies centrally."
>
> — Aaron Parecki, on MCP enterprise authentication

### What This Means for You

If you implement AI Agent Governance today (Scenarios 2 or 3), you're building on the same pattern that MCP has adopted. When MCP servers implement XAA, your governance model extends automatically.

---

## The Workload Principal: Your AI Agent's Identity

### What is a Workload Principal?

A **Workload Principal** (ID starts with `wlp`) is Okta's identity type for AI agents and automated workloads. It's not a service account. It's not an API key. It's a first-class identity designed for AI systems.

### Key Properties

| Property | What It Means | Why It Matters |
|----------|---------------|----------------|
| **Unique ID** | `wlp8x5q7mvH86KvFJ0g7` | Every agent has a trackable identity |
| **Mandatory Owner** | A real person is responsible | Governance and accountability |
| **Cryptographic Credentials** | RS256 key pair (no passwords) | Secure, rotatable authentication |
| **Linked Applications** | Which apps can trigger this agent | Controlled entry points |
| **Managed Connections** | Which APIs this agent can access | Explicit scope boundaries |
| **Enable/Disable Toggle** | One click to activate or deactivate | Instant revocation capability |

### One Identity, Multiple APIs

A common point of confusion: how does **one** Workload Principal work with **multiple** APIs and **multiple** internal agents?

| Concept | Count | What It Is |
|---------|-------|------------|
| **Okta Workload Principal** | 1 | The governed identity (`wlp...`) registered in Okta Universal Directory |
| **Authorization Servers** | 4 | APIs the agent can access (Sales, Inventory, Customer, Pricing) |
| **Application Agents** | Many | Internal workflow components (LangGraph nodes, MCP tools, etc.) |

**Why one identity?** Okta governs at the identity level, not the implementation level. Your AI application might use LangChain, LangGraph, CrewAI, or custom orchestration with dozens of internal "agents" - Okta doesn't care. What matters for governance is:

- **Who is acting?** → The single Workload Principal identity
- **On whose behalf?** → The authenticated user (via ID-JAG)
- **Accessing what?** → The Authorization Server determines allowed scopes

Your internal architecture (how many LangGraph nodes, which tools, what routing logic) is an implementation detail. Okta provides the security boundary: one governed identity that can be monitored, audited, and revoked - regardless of how complex your internal orchestration becomes.

```
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION                               │
│                                                                 │
│   LangGraph Orchestrator                                        │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│   │  Sales   │ │Inventory │ │ Customer │ │ Pricing  │           │
│   │   MCP    │ │    MCP   │ │   MCP    │ │   MCP    │           │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│        │            │            │            │                 │
│        └────────────┴─────┬──────┴────────────┘                 │
│                           │                                     │
│                           ▼                                     │
│              ┌─────────────────────────┐                        │
│              │  ONE Workload Principal │                        │
│              │  (wlp8x5q7mvH86KvFJ0g7) │                        │
│              └─────────────────────────┘                        │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼ All token exchanges use this ONE identity
                         ┌──────┐
                         │ OKTA │
                         └──────┘
```

### Where It Lives

```
┌───────────────────────────────────────────────────────────────────┐
│                     OKTA UNIVERSAL DIRECTORY                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   USERS (People)                GROUPS                            │
│   ┌────────────────┐            ┌─────────────────────┐           │
│   │ sarah.sales    │            │ ProGear-Sales       │           │
│   │ mike.manager   │            │ ProGear-Warehouse   │           │
│   │ frank.finance  │            │ ProGear-Finance     │           │
│   └────────────────┘            └─────────────────────┘           │
│                                                                   │
│   AI AGENTS (Workload Principals)       ← First-class identity    │
│   ┌─────────────────────────────────────────────────────┐         │
│   │ ProGear Sales Agent (wlp8x5q7mvH86KvFJ0g7)          │         │
│   │   • Owner: admin@company.com                        │         │
│   │   • Credentials: RS256 key pair                     │         │
│   │   • Linked Apps: ProGear Sales Agent App            │         │
│   │   • Status: ACTIVE                                  │         │
│   └─────────────────────────────────────────────────────┘         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Why This Matters for Security

**Before (Service Account - Scenario 1):**
- Service account created, credentials shared
- No clear owner after employee leaves
- Scattered across different systems
- Hard to audit, hard to revoke

**With Workload Principal (Scenarios 2-4):**
- Centralized in Universal Directory
- Owner is required and visible
- All access policies in one place
- Disable with one click, audit with one query

---

## Proof: What You See in Audit Logs

### Sample Log: Successful Token Exchange

When Sarah Sales asks the AI agent to check inventory:

```json
{
  "eventType": "app.oauth2.token.grant.id_jag",
  "displayMessage": "OAuth 2.0 Identity Assertion Authorization Grant is granted",
  "outcome": {
    "result": "SUCCESS"
  },
  "published": "2024-12-15T14:23:47.123Z",
  "actor": {
    "id": "wlp8x5q7mvH86KvFJ0g7",
    "type": "AI Agent",
    "displayName": "ProGear Sales Agent"
  },
  "target": [
    {
      "id": "00u8x5nsjp8aDUpB70g7",
      "type": "User",
      "displayName": "Sarah Sales",
      "alternateId": "sarah.sales@progear-demo.com"
    },
    {
      "id": "aus8xdg1oaSVfDgxa0g7",
      "type": "AuthorizationServer",
      "displayName": "ProGear Inventory MCP"
    }
  ],
  "debugContext": {
    "grantedScopes": "inventory:read",
    "requestedScopes": "inventory:read"
  }
}
```

### What This Log Tells You

| Field | Value | Security Insight |
|-------|-------|------------------|
| `actor.displayName` | "ProGear Sales Agent" | **WHICH AI** performed this action |
| `actor.id` | `wlp8x5q7mvH86KvFJ0g7` | Unique, trackable agent ID |
| `target[0].displayName` | "Sarah Sales" | **WHICH USER** the agent acted for |
| `target[1].displayName` | "ProGear Inventory MCP" | **WHICH API** was accessed |
| `grantedScopes` | "inventory:read" | **WHAT PERMISSIONS** were granted |
| `outcome.result` | "SUCCESS" | Access was allowed |
| `published` | Timestamp | **WHEN** this happened |

### Sample Log: Access Denied

When Mike Manager (warehouse team) tries to access customer data:

```json
{
  "eventType": "app.oauth2.token.grant.id_jag",
  "displayMessage": "OAuth 2.0 Identity Assertion Authorization Grant failed",
  "outcome": {
    "result": "FAILURE",
    "reason": "no_matching_policy"
  },
  "published": "2024-12-15T14:25:12.456Z",
  "actor": {
    "id": "wlp8x5q7mvH86KvFJ0g7",
    "type": "AI Agent",
    "displayName": "ProGear Sales Agent"
  },
  "target": [
    {
      "id": "00u8x5abc123def456",
      "type": "User",
      "displayName": "Mike Manager",
      "alternateId": "mike.manager@progear-demo.com"
    },
    {
      "id": "aus8xdfti92mIRSAE0g7",
      "type": "AuthorizationServer",
      "displayName": "ProGear Customer MCP"
    }
  ],
  "debugContext": {
    "requestedScopes": "customer:read customer:lookup",
    "denialReason": "User not in required group: ProGear-Sales"
  }
}
```

**This is the audit trail your compliance team needs.**

---

## Real Demo Scenarios with Evidence

### Scenario: Full Access User (Sarah Sales)

**User Profile:**
- Name: Sarah Sales
- Group: `ProGear-Sales`
- Role: Sales Representative

**What She Can Access:**

| Agent/API | Access Level | Scopes Granted |
|-----------|--------------|----------------|
| Sales MCP | Full | `sales:read`, `sales:quote`, `sales:order` |
| Inventory MCP | Read Only | `inventory:read` |
| Customer MCP | Full | `customer:read`, `customer:lookup`, `customer:history` |
| Pricing MCP | Full | `pricing:read`, `pricing:margin`, `pricing:discount` |

**Audit Trail:** 4 successful token exchanges, all tied to Sarah Sales, each with specific scopes.

### Scenario: Limited Access User (Mike Manager)

**User Profile:**
- Name: Mike Manager
- Group: `ProGear-Warehouse`
- Role: Warehouse Manager

**What He Can Access:**

| Agent/API | Access Level | Scopes Granted |
|-----------|--------------|----------------|
| Sales MCP | **DENIED** | - |
| Inventory MCP | Full | `inventory:read`, `inventory:write`, `inventory:alert` |
| Customer MCP | **DENIED** | - |
| Pricing MCP | **DENIED** | - |

**Audit Trail:** 1 success, 3 denials - all logged with Mike Manager as the user.

---

## Security and Governance FAQ

### "Which AI systems can access our data?"

**Answer:** Go to **Applications** → **AI Agents** in Okta Admin Console. You'll see every registered AI agent, its owner, its status, and what it can access.

### "Who is responsible for this AI agent?"

**Answer:** The **Owner** field is mandatory. Click on any AI agent to see who owns it.

### "What can this AI agent access?"

**Answer:** Click the agent → **Managed Connections** tab. You'll see exactly which authorization servers (APIs) this agent can request tokens from.

### "Who did this AI act for?"

**Answer:** Every token issued contains both identities:
- `sub` (subject): The user the agent acted for
- `act` (actor): The AI agent that performed the action

### "Can we shut it down NOW?"

**Answer:** Yes. **Deactivate** button on the AI Agent page. One click, immediate effect.

### "How do we prove compliance to auditors?"

**Answer:** Export System Log with filter: `eventType eq "app.oauth2.token.grant.id_jag"`

---

## Summary: The Security Value

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   OKTA AI AGENT GOVERNANCE                                      │
│                                                                 │
│   ✓ Centralized visibility of all AI agents                     │
│   ✓ Mandatory ownership for accountability                      │
│   ✓ User identity preserved in every AI action                  │
│   ✓ Policy-based access control (same as humans)                │
│   ✓ Complete audit trail for compliance                         │
│   ✓ Instant revocation with one click                           │
│                                                                 │
│   ✓ Works today for internal APIs (Scenarios 2 & 3)             │
│   ✓ Same pattern extends to external SaaS (Scenario 4)          │
│   ✓ Validated by MCP adoption of Cross App Access               │
│                                                                 │
│   Your AI agents should be as governed as your employees.       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Run the Demo** - See Scenario 2 in action with real token exchanges
2. **Check the Logs** - Verify the audit trail in your Okta System Log
3. **Try Different Users** - Log in as Sarah, Mike, and Frank to see different access levels
4. **Plan for Scenarios 3 & 4** - Same infrastructure, expanding scope

---

*This document accompanies the ProGear Sales AI demo showcasing Okta AI Agent Governance with Cross App Access (XAA).*
