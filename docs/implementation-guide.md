# Implementation Guide: ProGear Sales AI with Okta AI Agent Governance

> Complete step-by-step guide to deploying this demo in your own environment

## Table of Contents

1. [Introduction](#introduction)
2. [Deployment Order Overview](#deployment-order-overview)
3. [Understanding the Architecture](#understanding-the-architecture)
4. [What is Vercel?](#what-is-vercel)
5. [What is Render?](#what-is-render)
6. [How Vercel and Render Work Together](#how-vercel-and-render-work-together)
7. [Prerequisites](#prerequisites)
8. [Okta Configuration](#okta-configuration)
9. [Clone and Deploy to Vercel (Frontend)](#clone-and-deploy-to-vercel-frontend)
10. [Deploy to Render (Backend)](#deploy-to-render-backend)
11. [Connect Frontend to Backend](#connect-frontend-to-backend)
12. [Environment Variables Reference](#environment-variables-reference)
13. [Demo Scenarios](#demo-scenarios)
14. [Demo Script](#demo-script)
15. [Troubleshooting](#troubleshooting)
16. [Verification Checklist](#verification-checklist)

---

## Introduction

This guide is designed for two types of users:

### Who This Guide is For

**1. Learners Building Their Own Chatbot**
If you want to understand how to build a multi-agent AI chatbot with enterprise-grade security using Okta AI Agent Governance, this guide walks through every configuration step. You'll learn:
- How AI agents authenticate and act on behalf of users
- How to implement Role-Based Access Control (RBAC) with Okta groups
- How MCP (Model Context Protocol) servers integrate with Okta authorization
- How token exchange flows preserve user identity through the AI pipeline

**2. Quick Deployers**
If you want to clone this repository, deploy it to Vercel and Render, and configure your own Okta instance to see the demo in action, follow the step-by-step deployment sections.

### What You'll Deploy

A basketball equipment sales AI assistant with:
- **4 AI Agents**: Sales, Inventory, Customer, and Pricing
- **3 Demo Users**: Each with different access levels
- **Role-Based Access Control**: Users only see data they're authorized to access
- **Visual Token Exchange**: See exactly which scopes are granted/denied in real-time
- **Sample Data Included**: The repository includes realistic demo data for customers, products, inventory, and pricing - no database setup required

---

## Deployment Order Overview

Before diving in, understand the order of operations. There's a circular dependency between services that we solve by deploying in stages:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RECOMMENDED DEPLOYMENT ORDER                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: Initial Okta Setup                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ • Create OIDC App (use placeholder redirect URIs for now)        │  │
│  │ • Create Demo Users and Groups                                    │  │
│  │ • Register AI Agent and download private key                      │  │
│  │ • Create 4 Authorization Servers with policies                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   ▼                                     │
│  PHASE 2: Deploy Frontend to Vercel                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ • Fork repo and import to Vercel                                  │  │
│  │ • Get your Vercel URL (e.g., my-app.vercel.app)                   │  │
│  │ • Configure environment variables                                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   ▼                                     │
│  PHASE 3: Deploy Backend to Render                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ • Create web service from your fork                               │  │
│  │ • Get your Render URL (e.g., my-backend.onrender.com)             │  │
│  │ • Configure environment variables (including CORS for Vercel)    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   ▼                                     │
│  PHASE 4: Connect Everything                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ • Update Vercel with Render URL                                   │  │
│  │ • Update Okta redirect URIs with real Vercel URL                  │  │
│  │ • Test the complete flow                                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Why this order?** You need the Vercel URL to configure Okta redirects, and you need the Render URL to configure the frontend. By using placeholder values initially, you can complete each phase and then circle back to connect them.

---

## Understanding the Architecture

Before diving into deployment, understand how the pieces fit together:

```
┌───────────────────────────────────────────────────────────────────┐
│                             USER                                  │
│                   (Browser on any device)                         │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                        VERCEL (Frontend)                          │
│                                                                   │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │                   Next.js Application                     │   │
│   │                                                           │   │
│   │  • Chat interface                                         │   │
│   │  • Token exchange visualization                           │   │
│   │  • User authentication (NextAuth.js + Okta)               │   │
│   │  • Security dashboard                                     │   │
│   └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│   URL: https://your-app.vercel.app                                │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  │ API calls with ID token
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                        RENDER (Backend)                           │
│                                                                   │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │                   FastAPI Application                     │   │
│   │                                                           │   │
│   │  • LangGraph orchestrator (routes to agents)              │   │
│   │  • Okta token exchange (ID → ID-JAG → MCP token)          │   │
│   │  • 4 MCP servers (Sales, Inventory, Customer, Pricing)    │   │
│   │  • Claude AI integration                                  │   │
│   └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│   URL: https://your-backend.onrender.com                          │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  │ Token exchange requests
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                             OKTA                                  │
│                                                                   │
│   • User authentication (OIDC)                                    │
│   • AI Agent identity (wlp...)                                    │
│   • 4 Authorization servers (MCP APIs)                            │
│   • Group-based access policies                                   │
│   • Audit logging                                                 │
│                                                                   │
│   URL: https://your-org.okta.com                                  │
└───────────────────────────────────────────────────────────────────┘
```

### The Token Exchange Flow

When a user sends a message:

```
1. User authenticates via Okta → Frontend receives ID token
2. Frontend sends message + ID token to Backend
3. Backend exchanges ID token → ID-JAG token (AI Agent acting for user)
4. Backend exchanges ID-JAG → MCP access tokens (one per agent)
5. If user's group doesn't match policy → token denied (access control!)
6. Backend calls MCP servers with granted tokens
7. Response flows back to user with visualization of what was granted/denied
```

---

## What is Vercel?

### Overview

**Vercel** is a cloud platform optimized for frontend frameworks, especially Next.js (which was created by Vercel). It handles deployment, hosting, and scaling of web applications.

### Why We Use Vercel for the Frontend

| Feature | Benefit for This Demo |
|---------|----------------------|
| **Zero-config deployment** | Push to GitHub → automatically deployed |
| **Global CDN** | Fast load times worldwide |
| **Serverless functions** | API routes run as serverless functions |
| **Environment variables** | Secure storage for Okta credentials |
| **Preview deployments** | Every PR gets its own URL for testing |
| **HTTPS by default** | Required for Okta OAuth callbacks |

### How Vercel Works

1. **Connect your GitHub repo** - Vercel watches for changes
2. **Automatic builds** - Every push triggers a new deployment
3. **Instant rollbacks** - Previous versions always available
4. **Custom domains** - Use your own domain or Vercel's subdomain

### What Vercel Hosts in This Demo

```
packages/progear-sales-agent/
├── app/                    # Next.js pages and API routes
│   ├── api/auth/           # NextAuth.js Okta integration
│   ├── api/chat/           # Proxy to backend
│   └── page.tsx            # Main chat interface
├── components/             # React components
│   ├── ChatInterface.tsx   # Chat UI
│   ├── TokenExchangeCard.tsx
│   └── AgentFlowCard.tsx
└── public/                 # Static assets
```

### Vercel Pricing

- **Free tier**: Perfect for demos, includes custom domains
- **Pro**: $20/month for teams, more bandwidth
- This demo works fine on the free tier

---

## What is Render?

### Overview

**Render** is a cloud platform for hosting backends, databases, and services. It's an alternative to Heroku, AWS, or Google Cloud, but simpler to use.

### Why We Use Render for the Backend

| Feature | Benefit for This Demo |
|---------|----------------------|
| **Native Python support** | Runs FastAPI directly |
| **Persistent services** | Backend stays running (vs serverless) |
| **Environment groups** | Share env vars across services |
| **Private networking** | Secure service-to-service communication |
| **Automatic HTTPS** | Required for API calls from Vercel |
| **Built-in monitoring** | Logs, metrics, and alerts |

### How Render Works

1. **Connect your GitHub repo** - Render watches the `backend` directory
2. **Auto-detect runtime** - Sees `requirements.txt`, knows it's Python
3. **Build and deploy** - Installs dependencies, starts uvicorn
4. **Assign URL** - Your backend gets `https://your-app.onrender.com`

### What Render Hosts in This Demo

```
backend/
├── api/
│   └── main.py             # FastAPI app, CORS, routes
├── mcp_servers/
│   ├── sales_mcp.py        # Sales data and tools
│   ├── inventory_mcp.py    # Inventory data and tools
│   ├── customer_mcp.py     # Customer data and tools
│   └── pricing_mcp.py      # Pricing data and tools
├── workflows/
│   └── okta_langgraph_workflow.py  # LangGraph orchestrator
├── services/
│   └── okta_auth.py        # Token exchange logic
└── requirements.txt        # Python dependencies
```

### Render Pricing

- **Free tier**: Services spin down after inactivity (15-minute cold starts)
- **Starter ($7/month)**: Always-on services, recommended for demos
- **Standard ($25/month)**: More resources for production

---

## How Vercel and Render Work Together

### The Split Architecture

| Component | Platform | Why |
|-----------|----------|-----|
| **Frontend** (Next.js) | Vercel | Optimized for React/Next.js, great DX |
| **Backend** (FastAPI) | Render | Python support, persistent processes |

### Communication Flow

```
┌──────────────┐       HTTPS API calls        ┌──────────────┐
│    Vercel    │ ──────────────────────────▶  │    Render    │
│  (Frontend)  │                              │   (Backend)  │
│              │ ◀──────────────────────────  │              │
└──────────────┘       JSON responses         └──────────────┘
       │                                             │
       │                                             │
       │ Okta OAuth login                            │ Okta token exchange
       │ (browser redirect)                          │ (server-to-server)
       ▼                                             ▼
┌───────────────────────────────────────────────────────────┐
│                          OKTA                             │
│                                                           │
│  • Authenticates users (issues ID tokens to frontend)     │
│  • Validates AI Agent identity (backend JWT assertion)    │
│  • Issues MCP tokens based on user's group membership     │
└───────────────────────────────────────────────────────────┘
```

### Key Configuration Points

For Vercel and Render to communicate:

1. **CORS**: Render must allow requests from your Vercel URL
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```

2. **API URL**: Vercel must know where to send API requests
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

3. **Okta callbacks**: Both URLs must be in Okta's redirect URIs
   ```
   Sign-in: https://your-app.vercel.app/api/auth/callback/okta
   ```

### Why This Architecture?

| Consideration | Why Split? |
|--------------|-----------|
| **Language optimization** | Next.js (JavaScript) + FastAPI (Python) |
| **Scaling** | Frontend and backend scale independently |
| **Cost efficiency** | Use best-fit platform for each workload |
| **Developer experience** | Vercel's Next.js tooling is unmatched |
| **AI libraries** | Python has better AI/ML ecosystem (LangChain, etc.) |

---

## Prerequisites

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Okta** | Identity & AI Agent Governance | [developer.okta.com](https://developer.okta.com) |
| **Anthropic** | Claude AI for LLM | [console.anthropic.com](https://console.anthropic.com) |
| **Vercel** | Frontend hosting | [vercel.com](https://vercel.com) |
| **Render** | Backend hosting | [render.com](https://render.com) |
| **GitHub** | Repository hosting | [github.com](https://github.com) |

> **Important Account Setup Notes:**
> - **Sign up for Vercel and Render using your GitHub account** - this makes connecting your repository seamless
> - **Okta Developer accounts are free** and include all features needed for this demo
> - **Anthropic requires a credit card** - Claude API calls have a small cost (~$0.01-0.10 per demo session)

### Okta Requirements

Your Okta org must have:
- **AI Agent feature enabled** (contact Okta support if not visible in admin console)
- **Custom Authorization Servers** enabled (Okta Developer accounts have this by default)
- Admin access to create applications and authorization servers

### Render Tier Consideration

> **⚠️ Render Free Tier Limitation**
>
> The free tier works but has a significant limitation: **services spin down after 15 minutes of inactivity**. When you visit the demo after inactivity, the first request takes 30-60 seconds while Render "wakes up" the backend.
>
> | Tier | Cost | Behavior |
> |------|------|----------|
> | **Free** | $0/month | Cold starts after 15 min inactivity |
> | **Starter** | $7/month | Always on - recommended for demos |
>
> For the best demo experience, consider the $7/month Starter tier. You can start with Free and upgrade later.

---

## Okta Configuration

This is the most critical section. Follow each step carefully using your own Okta organization.

### Step 1: Create the OIDC Application

This application handles user login and is linked to your AI Agent.

1. Log into **Okta Admin Console** at `https://your-org-admin.okta.com`
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select:
   - Sign-in method: **OIDC - OpenID Connect**
   - Application type: **Web Application**
5. Click **Next**
6. Configure the application:

   **General Settings:**
   ```
   App integration name: ProGear Sales Agent App
   ```

   **Grant Types:**

   You'll see checkboxes for grant types. Check these:
   - [x] **Authorization Code** (usually checked by default)
   - [x] **Refresh Token** (usually checked by default)
   - [ ] **Token Exchange** (This option is available under the Advanced section)

   **Sign-in redirect URIs:**
   ```
   https://placeholder.vercel.app/api/auth/callback/okta
   ```
   > **Note:** Use any placeholder URL for now. We'll update this with your real Vercel URL in Phase 4.

   **Sign-out redirect URIs:**
   ```
   https://placeholder.vercel.app/auth/signin
   ```

   **Controlled access:**
   - Select: **Allow everyone in your organization to access**
   - (This makes testing easier - you can restrict later)

7. Click **Save**

8. **Copy and save these values** (you'll need them for environment variables):

   | Value | Where to Find It | Example Format |
   |-------|------------------|----------------|
   | **Client ID** | General tab, top of page | `0oaxxxxxxxxx` |
   | **Client Secret** | General tab, click "Copy to clipboard" | Long random string |

   Store these securely - you'll need them for both Vercel and Render configuration.

### Step 2: Create Demo Users

Create three demo users to showcase different access levels:

1. Navigate to **Directory** → **People** → **Add Person**
2. Create these users:

   | Username | First Name | Last Name | Email | Password |
   |----------|------------|-----------|-------|----------|
   | `sarah.sales` | Sarah | Sales | sarah.sales@`<your-domain>` | `<your-secure-password>` |
   | `mike.manager` | Mike | Manager | mike.manager@`<your-domain>` | `<your-secure-password>` |
   | `frank.finance` | Frank | Finance | frank.finance@`<your-domain>` | `<your-secure-password>` |

3. **Important**: Uncheck "User must change password on first login" for demo purposes

> **Note**: Use any email domain you control, or use your Okta organization's default domain. The passwords should be secure - these are demo users but treat them like any other credential.

### Step 3: Create User Groups

Create three groups to demonstrate RBAC:

1. Navigate to **Directory** → **Groups**
2. Click **Add Group** and create:

   | Group Name | Description |
   |------------|-------------|
   | `ProGear-Sales` | Sales team - full agent access |
   | `ProGear-Warehouse` | Warehouse team - inventory only |
   | `ProGear-Finance` | Finance team - pricing only |

3. **Assign users to groups:**

   For each group, click the group name → **Assign People** button → search for and add the user:

   | User | Group | Access Level |
   |------|-------|--------------|
   | Sarah Sales | `ProGear-Sales` | Full access to all 4 agents |
   | Mike Manager | `ProGear-Warehouse` | Inventory agent only |
   | Frank Finance | `ProGear-Finance` | Pricing agent only |

   > **Verification:** Click on each user in **Directory** → **People** and check the **Groups** tab to confirm they're in the correct group.

### Step 4: Register the AI Agent

1. Navigate to **Directory** → **AI Agents**
   - If you don't see this menu item, contact Okta support to enable AI Agent Governance for your org
2. Click **Register AI Agent**
3. Provide following details and register the Agent:

   ```
   Name: ProGear Sales Agent
   Description: Multi-agent sales assistant for ProGear sporting goods
   ```
  When prompted to assign Owners, select the currently logged in Okta admin or any other user you have as the owner and save.
  
4. **Add Credentials:**
   - Select the ***Registered Agent** and navigate to ***Credentials** tab
   - Click **Add Public Key**
   - Select **Generate new key pair**
   - Okta generates an RS256 public/private key pair
   - **Download and save the private key (JWK format)** - click the download button

   The downloaded file contains JSON like this:
   ```json
   {
     "kty": "RSA",
     "kid": "your-unique-key-id",
     "alg": "RS256",
     "n": "base64-encoded-modulus...",
     "e": "AQAB",
     "d": "base64-encoded-private-exponent...",
     "p": "base64-encoded-prime-p...",
     "q": "base64-encoded-prime-q...",
     "dp": "base64-encoded-dp...",
     "dq": "base64-encoded-dq...",
     "qi": "base64-encoded-qi..."
   }
   ```

   > **⚠️ CRITICAL: Converting JWK to Single-Line Format**
   >
   > Environment variables cannot contain line breaks. You MUST convert the multi-line JSON to a single line.
   >
   > **Method 1: Online Tool**
   > 1. Go to [jsonformatter.org/json-minify](https://jsonformatter.org/json-minify)
   > 2. Paste your JWK JSON
   > 3. Click "Minify"
   > 4. Copy the single-line result
   >
   > **Method 2: Command Line (Mac/Linux)**
   > ```bash
   > cat your-downloaded-key.json | tr -d '\n' | tr -s ' '
   > ```
   >
   > **Method 3: Manual**
   > 1. Open the JSON file in a text editor
   > 2. Remove all line breaks and extra spaces
   > 3. Result should look like: `{"kty":"RSA","kid":"xxx","alg":"RS256","n":"xxx",...}`
   >
   > **Store this single-line version** - you'll paste it into Render's environment variables.

5. **Link to OIDC Application:**
   - In the AI Agent settings, find **Linked Applications**
   - Click **Add** and select the OIDC app created in Step 1

6. **Activate** the agent
7. **Copy the Agent ID** (starts with `wlp...`)

> **CRITICAL: AI Agent Owners vs User Assignments**
>
> These are two completely different concepts - don't confuse them!
>
> | Concept | What it is | Where configured | Who to add |
> |---------|------------|------------------|------------|
> | **Owners** | Admins responsible for the agent | AI Agent → Owners tab | Admin users (yourself, your team) |
> | **User Assignments** | Users the agent acts on behalf of | Linked App → Assignments tab | End users (Sarah, Mike, Frank) |
>
> The AI Agent entity has NO Assignments tab. Users are assigned to the **linked OIDC app**, and the agent can then act on behalf of any user who:
> 1. Is assigned to the linked app
> 2. Passes the access policy rules (group membership)

### Step 5: Create Authorization Servers (4 MCP APIs)

Create one authorization server per MCP API. Each represents a different domain of your business data.

> **Important: The Sales Auth Server Does Double Duty**
>
> The Sales authorization server will be used for TWO purposes:
> 1. **User Authentication** - Users log in through this auth server (the "main" auth server)
> 2. **Sales MCP API** - Controls access to sales data
>
> This is required because the ID-JAG token exchange (Step 1 of the agent flow) must happen at the same authorization server that issued the user's ID token. The Org Authorization Server does not support the token exchange grant type needed for AI Agents.
>
> You'll set both `OKTA_MAIN_AUTH_SERVER_ID` and `OKTA_SALES_AUTH_SERVER_ID` to the same value.

#### 5.1 Sales MCP Authorization Server

1. Navigate to **Security** → **API** → **Authorization Servers**
2. Click **Add Authorization Server**
3. Configure:

   ```
   Name: ProGear Sales MCP
   Audience: api://progear-sales
   Description: Authorization for Sales MCP API
   ```

4. Click **Save**

5. **Extract the Authorization Server ID:**

   After saving, you'll see an **Issuer URI** that looks like this:
   ```
   https://your-org.okta.com/oauth2/aus8xdftgwlTMxp3u0g7
   ```

   The **Authorization Server ID** is the last segment after `/oauth2/`:
   ```
   aus8xdftgwlTMxp3u0g7  ← This is your Auth Server ID
   ```

   Copy this ID - you'll need it for both:
   - `OKTA_SALES_AUTH_SERVER_ID` (Sales MCP access)
   - `OKTA_MAIN_AUTH_SERVER_ID` (User login and ID-JAG exchange)

6. **Add Scopes:**
   - Go to **Scopes** tab → **Add Scope**
   - Add these scopes:

   | Name | Description | Default Scope |
   |------|-------------|---------------|
   | `sales:read`  | View sales data | No |
   | `sales:quote` | Create quotes   | No |
   | `sales:order` | Create/modify orders | No |

7. **Add Access Policy:**
   - Go to **Access Policies** tab → **Add Policy**

   ```
   Name: Sales Agent Policy
   Description: Controls access to Sales MCP
   Assign to: ProGear Sales Agent and ProGear Sales Agent App
   ```

8. **Add Policy Rule:**
   - Inside the policy, click **Add Rule**

   ```
   Rule Name: Sales Group Access
   IF Grant type is: Authorization Code, Token Exchange, JWT Bearer
   AND User is: Assigned the app and a member of: ProGear-Sales
   AND Scopes requested: sales:read, sales:quote, sales:order
   ```

#### 5.2 Inventory MCP Authorization Server

Repeat the process:

```
Name: ProGear Inventory MCP
Audience: api://progear-inventory
Description: Authorization for Sales Inventory API
```

**Scopes:**
- `inventory:read` - View inventory levels
- `inventory:write` - Modify inventory
- `inventory:alert` - Manage inventory alerts

**Access Policy:**
   ```
   Name: Inventory Agent Policy
   Description: Controls access to Inventory MCP
   Assign to: ProGear Sales Agent and ProGear Sales Agent App
   ```

**Policy Rules (add TWO rules):**

**Rule 1: Warehouse Full Access** (Priority 1)
```
IF Grant type is: Authorization Code, Token Exchange, JWT Bearer
AND User is member of: ProGear-Warehouse
AND Scopes: inventory:read, inventory:write, inventory:alert
```

**Rule 2: Sales Read Access** (Priority 2)
```
IF Grant type is: Authorization Code, Token Exchange, JWT Bearer
AND User is member of: ProGear-Sales
AND Scopes: inventory:read
```

#### 5.3 Customer MCP Authorization Server

```
Name: ProGear Customer MCP
Audience: api://progear-customer
Description: Authorization for Sales Customer API
```

**Scopes:**
- `customer:read` - View customer info
- `customer:lookup` - Search customers
- `customer:history` - View purchase history

**Access Policy:**
   ```
   Name: Customer Agent Policy
   Description: Controls access to Customer MCP
   Assign to: ProGear Sales Agent and ProGear Sales Agent App
   ```

**Policy Rule:**
```
Rule Name: Customer Group Access
IF Grant type is: Authorization Code, Token Exchange, JWT Bearer
AND User is member of: ProGear-Sales
AND Scopes: customer:read, customer:lookup, customer:history
```

#### 5.4 Pricing MCP Authorization Server

```
Name: ProGear Pricing MCP
Audience: api://progear-pricing
Description: Authorization for Sales Pricing API
```

**Scopes:**
- `pricing:read` - View prices
- `pricing:margin` - View profit margins
- `pricing:discount` - View/apply discounts

**Access Policy:**
   ```
   Name: Pricing Agent Policy
   Description: Controls access to Pricing MCP
   Assign to: ProGear Sales Agent and ProGear Sales Agent App
   ```

**Policy Rules (add TWO rules):**

**Rule 1: Finance Full Access** (Priority 1)
```
IF Grant type is: Authorization Code, Token Exchange, JWT Bearer
AND User is member of: ProGear-Finance
AND Scopes: pricing:read, pricing:margin, pricing:discount
```

**Rule 2: Sales Read Access** (Priority 2)
```
IF Grant type is: Authorization Code, Token Exchange, JWT Bearer
AND User is member of: ProGear-Sales
AND Scopes: pricing:read
```

### Step 6: Verify Policy Assigned Clients (CRITICAL!)

> **This step is the #1 cause of "no_matching_policy" errors.** Don't skip it!

For each Authorization Server, you must add the AI Agent to the policy's "Assigned clients":

1. Go to **Security** → **API** → **[Your Auth Server]** → **Access Policies** → **[Your Policy]**
2. Click **Edit** on the policy
3. In **Assigned clients**, add the following **Clients** (`ProGear Sales Agent` and `ProGear Sales Agent App`)

Repeat for all 4 authorization servers.

### Step 7: Update Agent managed connections
Once you have create authorization servers per MCP API, Use managed connections to add connections to all auth servers with scopes listed for data access while maintaining centralized control through Okta.
**Manage Connection:**
   - Select the ***Registered Agent** and navigate to ***Managed Connections** tab
   - Click **Add Connection**
     
     | Name | Details  |  Allowed Scopes |
     |------|----------|-----------------|
     | `ProGear Customer MCP` | Only allow | customer:history customer:lookup customer:read |
     | `ProGear Pricing MCP` | Only allow | pricing:discount pricing:margin pricing:read |
     | `ProGear Inventory MCP` | Only allow | inventory:write inventory:alert inventory:read |
     | `ProGear Sales MCP` | Only allow | sales:order sales:read sales:quote |

### Step 8: Record All Your IDs

**Before proceeding, verify you have collected all these values.** You'll need them for Vercel and Render configuration.

Use this checklist to track what you've collected:

```
┌───────────────────────────────────────────────────────────────────────┐
│                       OKTA VALUES CHECKLIST                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  □ OKTA_DOMAIN                                                        │
│    Your Okta org URL                                                  │
│    Example: https://dev-12345.okta.com                                │
│    Where: Browser URL bar when logged into Okta Admin                 │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_CLIENT_ID                                                     │
│    OIDC Application Client ID                                         │
│    Example: 0oaXXXXXXXXXXXXXX                                         │
│    Where: Applications → ProGear Sales Agent App → General tab        │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_CLIENT_SECRET                                                 │
│    OIDC Application Client Secret                                     │
│    Where: Applications → ProGear Sales Agent App → General tab        │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_AI_AGENT_ID                                                   │
│    AI Agent Entity ID                                                 │
│    Example: wlpXXXXXXXXXXXXXX                                         │
│    Where: Applications → AI Agents → ProGear Sales Agent              │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_AI_AGENT_PRIVATE_KEY                                          │
│    JWK Private Key (SINGLE LINE - no line breaks!)                    │
│    Where: Downloaded when you created credentials in Step 4           │
│    Status: □ Downloaded  □ Converted to single line                   │
│                                                                       │
│  □ OKTA_SALES_AUTH_SERVER_ID                                          │
│    Example: ausXXXXXXXXXXXXXX                                         │
│    Where: Security → API → ProGear Sales MCP → Issuer URI             │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_INVENTORY_AUTH_SERVER_ID                                      │
│    Where: Security → API → ProGear Inventory MCP → Issuer URI         │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_CUSTOMER_AUTH_SERVER_ID                                       │
│    Where: Security → API → ProGear Customer MCP → Issuer URI          │
│    Your value: ___________________________________________            │
│                                                                       │
│  □ OKTA_PRICING_AUTH_SERVER_ID                                        │
│    Where: Security → API → ProGear Pricing MCP → Issuer URI           │
│    Your value: ___________________________________________            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

> **Tip:** Copy this checklist to a text file and fill it in as you go. You'll reference these values multiple times during deployment.

---

## Clone and Deploy to Vercel (Frontend)

### Step 1: Fork the Repository

1. Go to this repository on GitHub
2. Click **Fork** to create your own copy
3. This allows Vercel to deploy from your GitHub account

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Click **Import** next to your forked repository
4. Configure the project:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Next.js |
   | **Root Directory** | `packages/progear-sales-agent` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `.next` |

5. Click **Deploy** (it will fail initially - that's OK, we need to add environment variables)

### Step 3: Configure Environment Variables

1. In Vercel, go to your project → **Settings** → **Environment Variables**

2. **Generate a NEXTAUTH_SECRET first:**

   This is a random string used to encrypt session tokens. Generate it using one of these methods:

   **Mac/Linux:**
   ```bash
   openssl rand -base64 32
   ```

   **Windows (PowerShell):**
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
   ```

   **Online Generator:**
   Visit [generate-secret.vercel.app](https://generate-secret.vercel.app/) and copy the generated secret

   Copy the output - it will look like `K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=`

3. **Add these environment variables:**

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NEXTAUTH_URL` | `https://your-project-name.vercel.app` | Use your actual Vercel URL from dashboard |
   | `NEXTAUTH_SECRET` | (the value you generated above) | Required for session encryption |
   | `NEXT_PUBLIC_API_URL` | Leave empty for now | We'll add this after Render deployment |
   | `NEXT_PUBLIC_OKTA_CLIENT_ID` | Your OIDC client ID | Starts with `0oa...` |
   | `NEXT_PUBLIC_OKTA_DOMAIN` | `https://your-org.okta.com` | Your Okta org URL |
   | `NEXT_PUBLIC_OKTA_ISSUER` | `https://your-org.okta.com/oauth2/{SALES_AUTH_SERVER_ID}` | Include Sales auth server ID in path |
   | `OKTA_CLIENT_ID` | Your OIDC client ID | Same as NEXT_PUBLIC version |
   | `OKTA_CLIENT_SECRET` | Your OIDC client secret | From Okta app settings |

5. Click **Save** for each variable, then go to **Deployments** and click **Redeploy** on the latest deployment

### Step 4: Update Okta Redirect URIs

Now that you have your real Vercel URL, go back to Okta and replace the placeholder URLs:

1. Go to Okta Admin Console → **Applications** → **ProGear Sales Agent App**
2. Click the **General** tab → **Edit**
3. **Replace the placeholder redirect URIs with your actual Vercel URL:**

   **Sign-in redirect URIs:**
   - Remove: `https://placeholder.vercel.app/api/auth/callback/okta`
   - Add: `https://your-actual-project.vercel.app/api/auth/callback/okta`

   **Sign-out redirect URIs:**
   - Remove: `https://placeholder.vercel.app`
   - Add: `https://your-actual-project.vercel.app/auth/signin`

4. Click **Save**

> **Example:** If your Vercel project URL is `https://progear-demo-abc123.vercel.app`, your redirect URI would be `https://progear-demo-abc123.vercel.app/api/auth/callback/okta`

### Step 5: Verify Frontend

1. Visit your Vercel URL
2. You should see the ProGear Sales AI interface
3. The chat won't work yet (backend not deployed)
4. You should be able to click "Sign in with Okta" and authenticate

---

## Deploy to Render (Backend)

### Step 1: Create a Render Account

1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account when prompted

### Step 2: Create a New Web Service

1. Click **New** → **Web Service**
2. Connect your forked repository
3. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `progear-backend` (or your preferred name) |
   | **Language** | Python 3 |
   | **Branch** | `main` |
   | **Region** | Oregon (US West) or closest to you |
   | **Root Directory** | `backend` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |

5. Choose your plan:
   - **Free**: Works but has cold starts (service sleeps after 15 min inactivity)
   - **Starter ($7/mo)**: Recommended for demos - always on

### Step 3: Configure Environment Variables

In Render, go to **Environment** and add these variables:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `OKTA_DOMAIN` | `https://your-org.okta.com` |
| `OKTA_CLIENT_ID` | Your OIDC client ID |
| `OKTA_AI_AGENT_ID` | Your AI Agent ID (`wlp...`) |
| `OKTA_AI_AGENT_PRIVATE_KEY` | Your JWK private key (entire JSON on one line) |
| `OKTA_MAIN_AUTH_SERVER_ID` | Your Sales auth server ID (same as OKTA_SALES_AUTH_SERVER_ID) |
| `OKTA_SALES_AUTH_SERVER_ID` | Your Sales auth server ID |
| `OKTA_SALES_AUDIENCE` | `api://progear-sales` |
| `OKTA_INVENTORY_AUTH_SERVER_ID` | Your Inventory auth server ID |
| `OKTA_INVENTORY_AUDIENCE` | `api://progear-inventory` |
| `OKTA_CUSTOMER_AUTH_SERVER_ID` | Your Customer auth server ID |
| `OKTA_CUSTOMER_AUDIENCE` | `api://progear-customer` |
| `OKTA_PRICING_AUTH_SERVER_ID` | Your Pricing auth server ID |
| `OKTA_PRICING_AUDIENCE` | `api://progear-pricing` |
| `CORS_ORIGINS` | Your Vercel URL: `https://your-project-name.vercel.app` |

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will build and deploy your backend
3. Wait for deployment to complete (usually 2-5 minutes)
4. Note your Render URL: `https://your-service-name.onrender.com`

### Step 5: Verify Backend

Test that your backend is running:

```bash
curl https://your-service-name.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "progear-ai-api",
  "version": "0.2.0",
  "agents": ["sales", "inventory", "customer", "pricing"]
}
```

---

## Connect Frontend to Backend

### Step 1: Update Vercel Environment Variable

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Add/update:
   ```
   NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com
   ```

### Step 2: Redeploy Frontend

1. In Vercel, go to **Deployments**
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**

### Step 3: Test the Complete System

1. Visit your Vercel URL
2. Click **Sign in with Okta**
3. Log in as one of your demo users
4. Try a test query: "What basketballs do we have in stock?"
5. Verify:
   - You get a response from the AI
   - Token exchanges are shown in the security panel
   - Scopes are granted based on user's group membership

---

## Environment Variables Reference

### Complete List

| Variable | Platform | Required | Description |
|----------|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Render | Yes | Anthropic Claude API key |
| `OKTA_DOMAIN` | Both | Yes | Your Okta org URL |
| `OKTA_CLIENT_ID` | Both | Yes | OIDC application client ID |
| `OKTA_CLIENT_SECRET` | Vercel | Yes | OIDC application client secret |
| `OKTA_AI_AGENT_ID` | Render | Yes | AI Agent entity ID (`wlp...`) |
| `OKTA_AI_AGENT_PRIVATE_KEY` | Render | Yes | JWK private key (JSON string) |
| `OKTA_MAIN_AUTH_SERVER_ID` | Render | Yes | Main auth server for user login (same as Sales) |
| `OKTA_SALES_AUTH_SERVER_ID` | Render | Yes | Sales MCP auth server ID |
| `OKTA_SALES_AUDIENCE` | Render | Yes | `api://progear-sales` |
| `OKTA_INVENTORY_AUTH_SERVER_ID` | Render | Yes | Inventory MCP auth server ID |
| `OKTA_INVENTORY_AUDIENCE` | Render | Yes | `api://progear-inventory` |
| `OKTA_CUSTOMER_AUTH_SERVER_ID` | Render | Yes | Customer MCP auth server ID |
| `OKTA_CUSTOMER_AUDIENCE` | Render | Yes | `api://progear-customer` |
| `OKTA_PRICING_AUTH_SERVER_ID` | Render | Yes | Pricing MCP auth server ID |
| `OKTA_PRICING_AUDIENCE` | Render | Yes | `api://progear-pricing` |
| `NEXTAUTH_URL` | Vercel | Yes | Your Vercel URL |
| `NEXTAUTH_SECRET` | Vercel | Yes | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_URL` | Vercel | Yes | Your Render URL |
| `NEXT_PUBLIC_OKTA_CLIENT_ID` | Vercel | Yes | OIDC client ID (for frontend) |
| `NEXT_PUBLIC_OKTA_DOMAIN` | Vercel | Yes | Your Okta org URL |
| `NEXT_PUBLIC_OKTA_ISSUER` | Vercel | Yes | `https://your-org.okta.com/oauth2/{SALES_AUTH_SERVER_ID}` |
| `CORS_ORIGINS` | Render | Yes | Your Vercel URL |

---

## Demo Scenarios

Three key scenarios to demonstrate RBAC and governance:

### Scenario 1: Full Access (Sarah Sales)

**Login as**: Your sarah.sales user

**Question**: "Can we fulfill an order of 1500 basketballs for State University at a bulk discount?"

**What Happens**:
1. Orchestrator routes to all 4 agents
2. **Customer Agent** → Looks up State University (Platinum tier)
3. **Inventory Agent** → Checks basketball stock (available)
4. **Pricing Agent** → Calculates bulk discount
5. **Sales Agent** → Generates quote

**Expected Result**:
- 4 successful token exchanges
- Full combined answer with customer, inventory, pricing, and quote
- All scopes granted in the security panel

### Scenario 2: Limited Access (Mike Manager)

**Login as**: Your mike.manager user

**Question**: Same as above

**What Happens**:
1. Orchestrator tries to route to all agents
2. **Customer Agent** → ACCESS DENIED (Mike not in ProGear-Sales)
3. **Inventory Agent** → SUCCESS: "Stock available"
4. **Pricing Agent** → ACCESS DENIED (Mike not in ProGear-Finance)
5. **Sales Agent** → ACCESS DENIED

**Expected Result**:
- 1 granted, 3 denied token exchanges
- Partial answer: "I can see we have basketballs in stock, but I don't have access to customer or pricing information."
- Demonstrates governance working

### Scenario 3: Finance Only (Frank Finance)

**Login as**: Your frank.finance user

**Question**: "What's our profit margin on professional basketballs?"

**What Happens**:
1. Orchestrator routes to Pricing Agent only
2. **Pricing Agent** → SUCCESS: Shows cost, wholesale, retail, margin %

**Expected Result**:
- Single token exchange (Pricing only)
- Complete pricing/margin information
- No unnecessary access to other systems

---

## Demo Script

Use these talking points when presenting:

### Opening
> "Let me show you how Okta AI Agent Governance secures AI access to enterprise data. We have a basketball equipment company with 4 AI agents - Sales, Inventory, Customer, and Pricing - each with different access to company resources."

### Demo 1: Full Access (Sarah)
> "Sarah is a sales rep. Watch what happens when she asks about fulfilling an order..."
> [Show 4 agents working, 4 token exchanges, full answer]
> "Notice each agent got only the scopes it needed. The audit trail shows exactly who accessed what."

### Demo 2: Limited Access (Mike)
> "Now let's see what happens when Mike, a warehouse manager, asks the same question..."
> [Show 3 access denied, 1 success]
> "Same app, same question, different access. Mike can only see inventory - not customers, not pricing."

### Demo 3: Governance in Action
> "Notice in the Okta System Log - every token exchange is recorded. We see the AI Agent actor, the user it's acting for, the scopes requested, and whether access was granted or denied."

### Closing
> "With Okta AI Agent Governance, you know exactly which AI agents are accessing your data, for which users, with what permissions. Full visibility, full control."

---

## Troubleshooting

### "Token exchange failed" error

**Cause**: Misconfigured authorization server or missing policy rule

**Solution**:
1. Verify the user is in the correct group
2. Check the authorization server policy rules include the requested scopes
3. Ensure Token Exchange grant type is enabled on the OIDC app
4. Verify the AI Agent is linked to the OIDC app

### "Invalid client assertion" error

**Cause**: Private key mismatch or malformed JWK

**Solution**:
1. Re-download the private key from Okta AI Agent settings
2. Ensure the entire JWK is on a single line in environment variables (no line breaks!)
3. Verify the `kid` in the JWK matches the public key in Okta

### "Access denied" for all requests

**Cause**: User not in any group with access policies

**Solution**:
1. Add the test user to the appropriate group in Okta
2. Verify the policy rules reference the correct group names
3. Check that policy rules are Active (not Inactive)

### CORS errors

**Cause**: `CORS_ORIGINS` doesn't include frontend URL

**Solution**:
1. Update `CORS_ORIGINS` in Render to include your exact Vercel URL
2. For multiple origins: `CORS_ORIGINS=https://app1.vercel.app,https://app2.vercel.app`
3. Redeploy the backend after changing

### "Unauthorized" on backend health check

**Cause**: Backend not receiving valid tokens

**Solution**:
1. Check that `NEXT_PUBLIC_API_URL` points to the correct Render URL
2. Verify the backend is running (check Render dashboard)
3. Check browser console for network errors

### `invalid_subject_token` error

**Cause**: ID token from an app not in AI Agent's linked applications

**Solution**:
1. Go to AI Agent → Linked Applications
2. Add your OIDC app (the one users log into)
3. The AI Agent can only exchange tokens from linked apps

### `user_not_assigned` error

**Cause**: User not assigned to the OIDC application

**Solution**:
1. Go to your OIDC App → Assignments tab
2. Add the user or a group containing the user
3. Users must be assigned to the app to authenticate

### `no_matching_policy` error

**Cause**: AI Agent not added to authorization server policy's "Assigned clients"

**Solution**:
1. Go to each Authorization Server → Access Policies → Your Policy
2. Edit the policy
3. Add the AI Agent entity (`wlp...`) to "Assigned clients"
4. **This is the #1 cause of token exchange failures!**

### Backend cold start (Free Render tier)

**Cause**: Render free tier spins down inactive services

**Solution**:
1. Wait 15-30 seconds for the service to wake up
2. Upgrade to Starter tier ($7/mo) for always-on service
3. First request after sleep will be slow, subsequent requests fast

### Issuer mismatch / ID-JAG exchange failed

**Cause**: `NEXT_PUBLIC_OKTA_ISSUER` and `OKTA_MAIN_AUTH_SERVER_ID` don't match, or using Org Auth Server

**Solution**:
1. `NEXT_PUBLIC_OKTA_ISSUER` must include your Sales auth server ID: `https://your-org.okta.com/oauth2/{SALES_AUTH_SERVER_ID}`
2. `OKTA_MAIN_AUTH_SERVER_ID` must be set to the same auth server ID (the `aus...` part)
3. The Org Authorization Server (just the org URL without `/oauth2/{id}`) does NOT support ID-JAG token exchange
4. Both values must point to the same Custom Authorization Server

---

## Verification Checklist

Use this checklist to verify your deployment is complete:

### Okta Configuration
- [ ] OIDC Application created with Token Exchange grant enabled
- [ ] 3 demo users created and can log in
- [ ] 3 groups created with correct user assignments
- [ ] AI Agent registered with JWK credentials
- [ ] AI Agent linked to OIDC application
- [ ] 4 authorization servers with scopes configured
- [ ] **Access policies include AI Agent entity (not just OIDC app)**
- [ ] All demo users assigned to OIDC app
- [ ] **Sales auth server ID noted for `OKTA_MAIN_AUTH_SERVER_ID` and `NEXT_PUBLIC_OKTA_ISSUER`**

### Vercel Deployment
- [ ] Project imported from GitHub
- [ ] Root directory set to `packages/progear-sales-agent`
- [ ] All environment variables configured
- [ ] Okta redirect URIs updated with Vercel URL
- [ ] Frontend loads without errors

### Render Deployment
- [ ] Web service created from `backend` directory
- [ ] All environment variables configured
- [ ] `CORS_ORIGINS` includes Vercel URL
- [ ] `/health` endpoint returns 200

### Integration
- [ ] `NEXT_PUBLIC_API_URL` in Vercel points to Render
- [ ] Okta login works from frontend
- [ ] Chat messages get responses
- [ ] Token exchanges visible in security panel

### Demo Verification
- [ ] Sarah can access all 4 agents
- [ ] Mike can only access Inventory agent
- [ ] Frank can only access Pricing agent
- [ ] Access denied scenarios show clearly in UI
- [ ] Okta System Log shows token exchange events

---

## Quick Reference: What to Change When Cloning

If you're cloning this repository to deploy your own instance, here's everything you need:

### 1. Okta Configuration (Create New in Your Org)
- [ ] OIDC Application → get Client ID & Secret
- [ ] AI Agent → get Agent ID & download Private Key
- [ ] 4 Authorization Servers → get Auth Server IDs
- [ ] 3 User Groups → configure access policies

### 2. Vercel Environment Variables
- [ ] `NEXTAUTH_URL` - Your Vercel URL
- [ ] `NEXTAUTH_SECRET` - Generate new
- [ ] `NEXT_PUBLIC_API_URL` - Your Render URL
- [ ] `NEXT_PUBLIC_OKTA_*` - Your Okta values
- [ ] `OKTA_CLIENT_*` - Your Okta credentials

### 3. Render Environment Variables
- [ ] `ANTHROPIC_API_KEY` - Your key
- [ ] All `OKTA_*` variables - Your Okta values
- [ ] `CORS_ORIGINS` - Your Vercel URL

### 4. Okta Redirect URIs
- [ ] Add your Vercel URL to OIDC app

### That's It!
The code is designed to work with any Okta org - just update the configuration values.

---

**Questions?** Check the [README](../README.md)
