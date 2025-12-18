'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Shield, Key, Users, Server, ArrowRight, CheckCircle, XCircle, Cpu, Lock, GitBranch, Database, Activity, Bot } from 'lucide-react';
import OktaSystemLog from '@/components/OktaSystemLog';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, subtitle, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-okta-blue to-tech-purple flex items-center justify-center text-white">
            {icon}
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-800">{title}</div>
            {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
          </div>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-gray-100">{children}</div>}
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-5xl">🏀</span>
            <div>
              <h1 className="text-white text-2xl font-bold">CourtEdge ProGear</h1>
              <p className="text-gray-400 text-sm">Architecture & Security Overview</p>
            </div>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition font-semibold shadow-lg"
          >
            Back to Chat
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
        {/* Audit Trail - First section to highlight governance */}
        <CollapsibleSection
          title="Audit Trail (Okta Syslog)"
          subtitle="Sample audit logs from Okta System Log"
          icon={<Activity className="w-5 h-5" />}
          defaultOpen={true}
        >
          <OktaSystemLog />
        </CollapsibleSection>

        {/* End-to-End Architecture Diagram */}
        <CollapsibleSection
          title="End-to-End Architecture"
          subtitle="How the system works together"
          icon={<GitBranch className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            {/* Architecture Diagram */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
              {/* User Request */}
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                  User Request: "Can we fulfill 1500 basketballs for State University?"
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
              </div>

              {/* LangChain + AI Agent Row */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg text-center">
                  <Cpu className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-bold">LangChain</div>
                  <div className="text-xs text-purple-200">Routes to MCP servers</div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="bg-gradient-to-r from-okta-blue to-blue-600 text-white px-6 py-4 rounded-xl shadow-lg text-center border-2 border-white/30">
                  <Bot className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-bold">ProGear Sales Agent</div>
                  <div className="text-xs text-blue-200">Agent ID: wlp8x5q7mvH86KvFJ0g7</div>
                </div>
              </div>

              {/* ID-JAG Exchange Box */}
              <div className="bg-gradient-to-r from-okta-blue/10 to-purple-100 rounded-xl p-5 mb-6 border-2 border-okta-blue/30">
                <div className="flex items-center justify-center gap-2 text-okta-blue font-semibold mb-3">
                  <Lock className="w-5 h-5" />
                  ID-JAG Token Exchange (2-Step)
                </div>
                <div className="flex items-center justify-center gap-3 text-sm mb-4">
                  <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                    <span className="text-gray-600">Step 1:</span> User ID Token → <span className="font-mono text-purple-600">ID-JAG</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                    <span className="text-gray-600">Step 2:</span> ID-JAG → <span className="font-mono text-green-600">MCP Access Token</span>
                  </div>
                </div>
                {/* Token Contents */}
                <div className="bg-white/80 rounded-lg p-3 border border-okta-blue/20">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 text-center">Final Token Contains</div>
                  <div className="flex justify-center gap-6 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500">User Identity</div>
                      <div className="font-mono text-purple-600">sub: user_id</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Agent Identity</div>
                      <div className="font-mono text-blue-600">actor.sub: wlp...</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Granted Scopes</div>
                      <div className="font-mono text-green-600">scope: [...]</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow down to MCP servers */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-4">
                  <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                </div>
              </div>

              {/* MCP Servers Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { name: "Sales", color: "from-blue-500 to-blue-600", scopes: "sales:read, quote, order", authServer: "aus8xdftgwlTMxp3u0g7" },
                  { name: "Inventory", color: "from-green-500 to-green-600", scopes: "inventory:read, write", authServer: "aus8xdg1oaSVfDgxa0g7" },
                  { name: "Customer", color: "from-purple-500 to-purple-600", scopes: "customer:read, lookup", authServer: "aus8xdfti92mIRSAE0g7" },
                  { name: "Pricing", color: "from-orange-500 to-orange-600", scopes: "pricing:read, margin", authServer: "aus8xdepyb5DHmTlq0g7" },
                ].map((server, idx) => (
                  <div key={idx} className={`bg-gradient-to-br ${server.color} text-white p-4 rounded-xl text-center shadow-lg`}>
                    <Server className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">{server.name} MCP</div>
                    <div className="text-xs text-white/80 mt-1">{server.scopes}</div>
                  </div>
                ))}
              </div>

              {/* Clarification Note */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-yellow-800">
                  <strong>Key Distinction:</strong> LangChain handles <em>routing logic</em> (deciding which MCP servers to call),
                  while <strong>ProGear Sales Agent</strong> is the <em>registered Okta AI Agent identity</em> that authenticates and obtains tokens for each MCP server.
                </div>
              </div>
            </div>

          </div>
        </CollapsibleSection>

        {/* Okta Configuration */}
        <CollapsibleSection
          title="Live Okta Configuration"
          subtitle="Actual configuration from Okta Admin Console"
          icon={<Database className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="mt-4 space-y-6">
            {/* AI Agent Identity */}
            <div className="bg-gradient-to-r from-okta-blue/10 to-blue-50 rounded-xl p-5 border border-okta-blue/30">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-6 h-6 text-okta-blue" />
                <div>
                  <div className="font-bold text-gray-800">AI Agent Identity</div>
                  <div className="text-sm text-gray-500">Registered in Okta as Workload Identity Principal</div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Agent Name</div>
                  <div className="font-semibold text-gray-800">ProGear Sales Agent</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Agent ID (wlp)</div>
                  <div className="font-mono text-sm text-okta-blue">wlp8x5q7mvH86KvFJ0g7</div>
                </div>
              </div>
            </div>

            {/* Authorization Servers */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-600" />
                Authorization Servers (4 MCP APIs)
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { name: "ProGear Sales MCP", id: "aus8xdftgwlTMxp3u0g7", audience: "api://progear-sales", scopes: ["sales:read", "sales:quote", "sales:order"], color: "#3b82f6" },
                  { name: "ProGear Inventory MCP", id: "aus8xdg1oaSVfDgxa0g7", audience: "api://progear-inventory", scopes: ["inventory:read", "inventory:write", "inventory:alert"], color: "#10b981" },
                  { name: "ProGear Customer MCP", id: "aus8xdfti92mIRSAE0g7", audience: "api://progear-customer", scopes: ["customer:read", "customer:lookup", "customer:history"], color: "#8b5cf6" },
                  { name: "ProGear Pricing MCP", id: "aus8xdepyb5DHmTlq0g7", audience: "api://progear-pricing", scopes: ["pricing:read", "pricing:margin", "pricing:discount"], color: "#f59e0b" },
                ].map((server, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-gray-200 transition">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: server.color }} />
                      <span className="font-semibold text-gray-800 text-sm">{server.name}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div><span className="text-gray-500">ID:</span> <span className="font-mono text-gray-600">{server.id}</span></div>
                      <div><span className="text-gray-500">Audience:</span> <span className="font-mono text-gray-600">{server.audience}</span></div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {server.scopes.map((scope, sIdx) => (
                          <span key={sIdx} className="px-1.5 py-0.5 rounded text-white text-[10px] font-mono" style={{ backgroundColor: server.color }}>
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Groups */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                Access Control Groups
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { name: "ProGear-Sales", id: "00g8xdepuhJhZ3Ecs0g7", desc: "Full agent access", access: ["Sales", "Inventory", "Customer", "Pricing"] },
                  { name: "ProGear-Warehouse", id: "00g8xdf4j4wmXgZMe0g7", desc: "Inventory only", access: ["Inventory"] },
                  { name: "ProGear-Finance", id: "00g8xdfshmbpjDjSA0g7", desc: "Pricing only", access: ["Pricing"] },
                ].map((group, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border-2 border-gray-100">
                    <div className="font-semibold text-gray-800 text-sm mb-1">{group.name}</div>
                    <div className="text-xs text-gray-500 mb-2">{group.desc}</div>
                    <div className="text-[10px] font-mono text-gray-400 mb-2">{group.id}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.access.map((a, aIdx) => (
                        <span key={aIdx} className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Token Flow */}
        <CollapsibleSection
          title="ID-JAG Token Exchange Flow"
          subtitle="How users authorize AI agents"
          icon={<Key className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            {/* Flow Diagram */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between gap-4 overflow-x-auto">
                {[
                  { step: 1, label: "User Login", desc: "Okta OIDC", color: "#3b82f6" },
                  { step: 2, label: "ID Token", desc: "User Identity", color: "#10b981" },
                  { step: 3, label: "ID-JAG Exchange", desc: "Agent + User", color: "#8b5cf6" },
                  { step: 4, label: "MCP Token", desc: "Scoped Access", color: "#f59e0b" },
                  { step: 5, label: "API Access", desc: "Authorized", color: "#22c55e" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.step}
                      </div>
                      <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                    {idx < 4 && <ArrowRight className="w-6 h-6 text-gray-300 mx-2" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Steps */}
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="font-semibold text-blue-800">Step 1-2: User Authentication</div>
                <div className="text-sm text-blue-700 mt-1">
                  User logs in via Okta OIDC. Frontend receives ID token proving user identity.
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="font-semibold text-purple-800">Step 3: ID-JAG Token Exchange</div>
                <div className="text-sm text-purple-700 mt-1">
                  AI Agent presents: user ID token + agent JWT assertion (signed with private key).
                  Okta validates both and issues ID-JAG token combining user + agent identity.
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div className="font-semibold text-orange-800">Step 4: MCP Token Issuance</div>
                <div className="text-sm text-orange-700 mt-1">
                  ID-JAG is exchanged for authorization server token with specific scopes.
                  Access policies determine what scopes are granted based on user groups.
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="font-semibold text-green-800">Step 5: Authorized API Access</div>
                <div className="text-sm text-green-700 mt-1">
                  Agent uses MCP token to call APIs. Token contains: user sub, agent sub, granted scopes.
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* MCP Server Security */}
        <CollapsibleSection
          title="Securing MCP Servers"
          subtitle="Zero-trust access to AI capabilities"
          icon={<Lock className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-100">
              <h3 className="font-bold text-gray-800 text-lg mb-3">The Challenge</h3>
              <p className="text-gray-600 mb-4">
                MCP servers give AI agents powerful capabilities - but without proper security, any agent could access any server.
                How do you ensure the right agents access the right capabilities for the right users?
              </p>
              <h3 className="font-bold text-gray-800 text-lg mb-3">Okta's Solution</h3>
              <p className="text-gray-600">
                Each MCP server is protected by its own Okta Authorization Server. Agents must obtain scoped tokens
                through the ID-JAG exchange - which validates both the agent's identity AND the user's permissions.
              </p>
            </div>

            {/* MCP Servers */}
            <div className="space-y-4">
              {[
                {
                  name: "Sales MCP Server",
                  color: "#3b82f6",
                  scopes: ["sales:read", "sales:quote", "sales:order"],
                  desc: "Quote generation, order creation, sales pipeline access",
                  value: "Only authorized sales users can create quotes and orders"
                },
                {
                  name: "Inventory MCP Server",
                  color: "#10b981",
                  scopes: ["inventory:read", "inventory:write", "inventory:alert"],
                  desc: "Stock levels, product management, warehouse operations",
                  value: "Warehouse staff can update stock; sales can only read"
                },
                {
                  name: "Customer MCP Server",
                  color: "#8b5cf6",
                  scopes: ["customer:read", "customer:lookup", "customer:history"],
                  desc: "Customer PII, account details, purchase history",
                  value: "Sensitive customer data protected - sales access only"
                },
                {
                  name: "Pricing MCP Server",
                  color: "#f59e0b",
                  scopes: ["pricing:read", "pricing:margin", "pricing:discount"],
                  desc: "Product pricing, margin data, discount authorization",
                  value: "Finance sees margins; sales sees prices only"
                },
              ].map((server, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border-2 border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: server.color }}
                    >
                      <Server className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-semibold text-gray-800">{server.name}</div>
                        <div className="text-xs text-white px-2 py-1 rounded" style={{ backgroundColor: server.color }}>
                          {server.value}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{server.desc}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {server.scopes.map((scope, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 text-xs rounded-full font-mono"
                            style={{
                              backgroundColor: `${server.color}20`,
                              color: server.color
                            }}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* LangChain Orchestration */}
        <CollapsibleSection
          title="LangChain Orchestration"
          subtitle="Intelligent routing to MCP servers"
          icon={<Cpu className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">How Routing Works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <div className="font-semibold text-gray-800">User Query Analysis</div>
                    <div className="text-sm text-gray-600">LangChain analyzes the natural language query to understand what data is needed.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <div className="font-semibold text-gray-800">MCP Server Selection</div>
                    <div className="text-sm text-gray-600">Based on the query, the orchestrator determines which MCP servers to invoke.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <div className="font-semibold text-gray-800">Parallel Token Exchange</div>
                    <div className="text-sm text-gray-600">ID-JAG tokens are exchanged for each required MCP server simultaneously.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <div className="font-semibold text-gray-800">Response Aggregation</div>
                    <div className="text-sm text-gray-600">Results from each MCP server are combined into a coherent response.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Routing */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Example: Multi-Server Query</h3>
              <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                <div className="text-sm text-blue-800 font-mono">
                  "Can we fulfill 1500 basketballs for State University at a bulk discount?"
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-purple-700 font-semibold text-sm">Customer MCP</div>
                  <div className="text-xs text-purple-600 mt-1">Look up State University</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-green-700 font-semibold text-sm">Inventory MCP</div>
                  <div className="text-xs text-green-600 mt-1">Check basketball stock</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-orange-700 font-semibold text-sm">Pricing MCP</div>
                  <div className="text-xs text-orange-600 mt-1">Calculate bulk discount</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-700 font-semibold text-sm">Sales MCP</div>
                  <div className="text-xs text-blue-600 mt-1">Generate quote</div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm py-4">
          CourtEdge ProGear - Powered by Okta AI Agent Governance
        </div>
      </div>
    </main>
  );
}
