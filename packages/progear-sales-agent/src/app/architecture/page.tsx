'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();

  // Extract user info from session for live token display
  const userSub = (session?.user as { sub?: string })?.sub || '00u8xdeptoh4cK9pG0g7';
  const userName = session?.user?.name || 'Sarah Sales';
  const userEmail = session?.user?.email || 'sarah.sales@progear.demo';

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
            {/* Redesigned Architecture Flow */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-6">

              {/* Step 1: User Logged In */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold mb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px]">1</span>
                  USER AUTHENTICATED
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-7 h-7" />
                    <div>
                      <div className="font-semibold text-lg">{userName}</div>
                      <div className="text-sm text-purple-200">Logged in via Okta OIDC • Has ID Token</div>
                      <div className="text-sm font-mono text-purple-300 mt-1">sub: {userSub}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
              </div>

              {/* Step 2: User Request */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold mb-2">
                  <span className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-white text-[10px]">2</span>
                  USER REQUEST
                </div>
                <div className="bg-white border-2 border-gray-200 px-5 py-3 rounded-xl shadow-sm">
                  <div className="text-gray-700 font-medium">"Our customer State University wants to order 1500 basketballs. Can we fulfill that and what would the pricing look like?"</div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
              </div>

              {/* Step 3: LangGraph Orchestrator */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-purple-700 font-semibold mb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px]">3</span>
                  LANGGRAPH ORCHESTRATOR
                  <span className="text-[10px] text-gray-400 font-normal ml-2">(routing only — no security boundary)</span>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-4 rounded-xl shadow-lg relative overflow-hidden">
                  {/* Animated scanning line */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Cpu className="w-6 h-6" />
                        <div className="absolute -inset-1 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                      </div>
                      <div>
                        <div className="font-semibold">Analyzes Request & Determines Required MCPs</div>
                        <div className="text-xs text-purple-300 mt-0.5">LangGraph decides what's needed → Okta decides what's allowed</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-green-500/30 border border-green-400/50 rounded text-sm font-medium flex items-center gap-1.5 animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0s' }}>
                        <CheckCircle className="w-4 h-4 text-green-300" /> Inventory
                      </span>
                      <span className="px-3 py-1.5 bg-purple-500/30 border border-purple-400/50 rounded text-sm font-medium flex items-center gap-1.5 animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}>
                        <CheckCircle className="w-4 h-4 text-purple-300" /> Customer
                      </span>
                      <span className="px-3 py-1.5 bg-orange-500/30 border border-orange-400/50 rounded text-sm font-medium flex items-center gap-1.5 animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }}>
                        <CheckCircle className="w-4 h-4 text-orange-300" /> Pricing
                      </span>
                      <span className="px-3 py-1.5 bg-blue-500/30 border border-blue-400/50 rounded text-sm font-medium flex items-center gap-1.5 animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.6s' }}>
                        <CheckCircle className="w-4 h-4 text-blue-300" /> Sales
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
              </div>

              {/* Step 4: ProGear Sales Agent + ID-JAG Exchange (Okta Governance) */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-okta-blue font-semibold mb-2">
                  <span className="w-5 h-5 rounded-full bg-okta-blue flex items-center justify-center text-white text-[10px]">4</span>
                  PROGEAR SALES AGENT — ID-JAG TOKEN EXCHANGE
                  <Shield className="w-4 h-4 text-okta-blue ml-1" />
                  <span className="text-[10px] text-okta-blue font-normal">Okta Governance</span>
                </div>
                <div className="bg-gradient-to-r from-okta-blue to-blue-700 text-white rounded-xl shadow-lg overflow-hidden border-2 border-okta-blue/50">
                  {/* Agent Header */}
                  <div className="px-5 py-3 border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <Bot className="w-7 h-7" />
                      <div>
                        <div className="font-semibold text-lg">ProGear Sales Agent</div>
                        <div className="text-sm text-blue-200">Okta AI Agent • wlp8x5q7mvH86KvFJ0g7</div>
                      </div>
                    </div>
                  </div>

                  {/* Exchange Process */}
                  <div className="px-5 py-4 bg-black/10">
                    <div className="text-sm text-blue-200 mb-3">For each MCP selected by LangGraph, Okta evaluates access:</div>
                    <div className="flex items-center gap-3 text-base flex-wrap">
                      <span className="px-3 py-1.5 bg-white/20 rounded text-sm font-medium">User ID Token</span>
                      <ArrowRight className="w-5 h-5 text-blue-300" />
                      <span className="px-3 py-1.5 bg-purple-500/50 rounded text-sm font-mono font-medium">ID-JAG</span>
                      <ArrowRight className="w-5 h-5 text-blue-300" />
                      <span className="px-3 py-1.5 bg-green-500/50 rounded text-sm font-mono font-medium flex items-center gap-1">
                        <Shield className="w-4 h-4" /> MCP Access Token
                      </span>
                    </div>
                  </div>

                  {/* Token Contents - Live Data */}
                  <div className="bg-gray-900 p-5 font-mono space-y-2">
                    <div className="text-sm text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      Example: Inventory MCP Access Token (Granted)
                    </div>
                    <div className="text-base"><span className="text-gray-500">sub:</span>       <span className="text-purple-400 font-semibold">{userSub}</span> <span className="text-gray-400 text-sm italic ml-3">← {userName}</span></div>
                    <div className="text-base"><span className="text-gray-500">actor.sub:</span> <span className="text-blue-400 font-semibold">wlp8x5q7mvH86KvFJ0g7</span> <span className="text-gray-400 text-sm italic ml-3">← AI Agent identity</span></div>
                    <div className="text-base"><span className="text-gray-500">aud:</span>       <span className="text-cyan-400 font-semibold">api://progear-inventory</span> <span className="text-gray-400 text-sm italic ml-3">← Target MCP</span></div>
                    <div className="text-base"><span className="text-gray-500">scope:</span>     <span className="text-green-400 font-semibold">inventory:read</span> <span className="text-gray-400 text-sm italic ml-3">← Granted by Okta policy</span></div>
                    <div className="text-base"><span className="text-gray-500">iat:</span>       <span className="text-gray-300">{Math.floor(Date.now() / 1000)}</span> <span className="text-gray-400 text-sm italic ml-3">← Issued at</span></div>
                    <div className="text-base"><span className="text-gray-500">exp:</span>       <span className="text-gray-300">{Math.floor(Date.now() / 1000) + 3600}</span> <span className="text-gray-400 text-sm italic ml-3">← Expires in 1hr</span></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
              </div>

              {/* Step 5: Agent Authorizes with MCPs using Tokens */}
              <div>
                <div className="flex items-center gap-2 text-xs text-green-600 font-semibold mb-2">
                  <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px]">5</span>
                  AGENT CALLS MCPS WITH GRANTED TOKENS
                </div>
                <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
                  {/* Show one detailed example of the authorization flow */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Example: Inventory MCP Call</div>

                    {/* Request */}
                    <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm mb-3">
                      <div className="text-gray-400 text-xs mb-2">→ Request to MCP</div>
                      <div className="text-green-400">GET /api/inventory/stock?product=basketball&qty=1500</div>
                      <div className="text-blue-300 mt-1">Authorization: Bearer <span className="text-yellow-300">eyJhbGciOiJSUzI1...</span></div>
                      <div className="text-gray-500 text-xs mt-2 italic">↑ MCP Access Token from Step 4 (contains sub, actor.sub, scope)</div>
                    </div>

                    {/* MCP Validation */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 border-t border-dashed border-gray-300"></div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full text-xs text-green-700 font-medium">
                        <Shield className="w-3.5 h-3.5" />
                        MCP Validates Token
                      </div>
                      <div className="flex-1 border-t border-dashed border-gray-300"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-gray-600">Signature valid (Okta-signed)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-gray-600">aud = api://progear-inventory</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-gray-600">scope includes inventory:read</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-gray-600">Token not expired</span>
                      </div>
                    </div>

                    {/* Response */}
                    <div className="text-xs text-gray-500 mb-1">← Response from MCP</div>
                    <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                      <div className="text-green-400">200 OK</div>
                      <div className="text-gray-300 mt-1">{'{'} "available": 2340, "canFulfill": true {'}'}</div>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-green-50 border-t border-green-100 text-center">
                    <span className="text-sm text-green-700 font-medium">✓ All responses aggregated and returned to user</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </CollapsibleSection>

        {/* Token Comparison - Role-Based Access */}
        <CollapsibleSection
          title="Token Comparison: Role-Based Access"
          subtitle="Same AI Agent, different user permissions"
          icon={<Key className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            {/* Explanation */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border border-purple-100">
              <p className="text-gray-700 text-sm">
                <strong>Key insight:</strong> The same AI Agent (wlp...) receives different scopes based on which user is logged in.
                Okta policies evaluate the <em>user's group membership</em> to determine what the agent can do on their behalf.
              </p>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Sarah's Token */}
              <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Sarah Sales</div>
                      <div className="text-xs text-purple-200">Sales Representative</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Groups</div>
                  <div className="flex gap-1 mb-4">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">ProGear-Sales</span>
                  </div>

                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">MCP Access Token Claims</div>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs space-y-1.5">
                    <div><span className="text-gray-500">sub:</span> <span className="text-purple-400">sarah.sales@progear.demo</span></div>
                    <div><span className="text-gray-500">actor.sub:</span> <span className="text-blue-400">wlp8x5q7mvH86KvFJ0g7</span></div>
                    <div><span className="text-gray-500">aud:</span> <span className="text-cyan-400">api://progear-inventory</span></div>
                  </div>

                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-4 mb-2">Granted Scopes</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-mono text-green-700">inventory:read</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-sm font-mono text-red-400">inventory:write</span>
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-mono text-green-700">pricing:read</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-sm font-mono text-red-400">pricing:margin</span>
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-xs text-purple-700 font-medium">Read-only access</div>
                    <div className="text-xs text-purple-600 mt-1">Can view data but cannot modify inventory or see margins</div>
                  </div>
                </div>
              </div>

              {/* Mike's Token */}
              <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Mike Manager</div>
                      <div className="text-xs text-green-200">Sales Manager</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Groups</div>
                  <div className="flex gap-1 mb-4">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">ProGear-Sales</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">ProGear-Managers</span>
                  </div>

                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">MCP Access Token Claims</div>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs space-y-1.5">
                    <div><span className="text-gray-500">sub:</span> <span className="text-green-400">mike.manager@progear.demo</span></div>
                    <div><span className="text-gray-500">actor.sub:</span> <span className="text-blue-400">wlp8x5q7mvH86KvFJ0g7</span></div>
                    <div><span className="text-gray-500">aud:</span> <span className="text-cyan-400">api://progear-inventory</span></div>
                  </div>

                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-4 mb-2">Granted Scopes</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-mono text-green-700">inventory:read</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-mono text-green-700">inventory:write</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-mono text-green-700">pricing:read</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-mono text-green-700">pricing:margin</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 font-medium">Full read/write access</div>
                    <div className="text-xs text-green-600 mt-1">Can modify inventory and view profit margins</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key takeaway */}
            <div className="mt-6 bg-okta-blue/10 rounded-xl p-4 border border-okta-blue/30">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-okta-blue mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-800">Same AI Agent • Different Permissions</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Notice <code className="bg-gray-100 px-1 rounded text-xs">actor.sub</code> is identical in both tokens —
                    it's the same AI agent. But the <em>granted scopes</em> differ based on the user's group membership.
                    This is Okta's governance in action.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* LangGraph Orchestration */}
        <CollapsibleSection
          title="LangGraph Orchestration"
          subtitle="LangGraph workflow with intent-based scope detection"
          icon={<Cpu className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="mt-4 space-y-6">
            {/* Workflow Pipeline */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">LangGraph Workflow</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center gap-2 flex-wrap text-gray-300">
                  <span className="px-2 py-1 bg-purple-500/30 rounded text-purple-300">router</span>
                  <span className="text-gray-500">→</span>
                  <span className="px-2 py-1 bg-okta-blue/30 rounded text-blue-300">exchange_tokens</span>
                  <span className="text-gray-500">→</span>
                  <span className="px-2 py-1 bg-green-500/30 rounded text-green-300">process_agents</span>
                  <span className="text-gray-500">→</span>
                  <span className="px-2 py-1 bg-gray-500/30 rounded text-gray-300">generate_response</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-500">END</span>
                </div>
              </div>
            </div>

            {/* Router Decision */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Router Node Output</h3>
              <p className="text-sm text-gray-600 mb-3">LLM analyzes query intent and returns agents + required scopes:</p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-gray-300">{`{
  "inventory": { "needed": true,  "scopes": ["inventory:read"] },
  "customer":  { "needed": true,  "scopes": ["customer:lookup"] },
  "pricing":   { "needed": true,  "scopes": ["pricing:discount"] },
  "sales":     { "needed": true,  "scopes": ["sales:quote"] }
}`}</pre>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">Scope selection based on operation type: read queries → :read, write operations → :write, bulk pricing → :discount</p>
            </div>

            {/* Example with Scopes */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Example Query → Token Exchange</h3>
              <div className="bg-purple-50 rounded-lg p-3 mb-4 border-l-4 border-purple-500">
                <div className="text-sm text-purple-800 font-mono">
                  "Our customer State University wants to order 1500 basketballs. Can we fulfill that and what would the pricing look like?"
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-700 font-semibold text-sm">Inventory MCP</div>
                  <div className="font-mono text-xs text-green-600 mt-1 bg-green-100 px-2 py-0.5 rounded inline-block">inventory:read</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-purple-700 font-semibold text-sm">Customer MCP</div>
                  <div className="font-mono text-xs text-purple-600 mt-1 bg-purple-100 px-2 py-0.5 rounded inline-block">customer:lookup</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-orange-700 font-semibold text-sm">Pricing MCP</div>
                  <div className="font-mono text-xs text-orange-600 mt-1 bg-orange-100 px-2 py-0.5 rounded inline-block">pricing:discount</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-blue-700 font-semibold text-sm">Sales MCP</div>
                  <div className="font-mono text-xs text-blue-600 mt-1 bg-blue-100 px-2 py-0.5 rounded inline-block">sales:quote</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Each MCP gets its own ID-JAG exchange → Okta policy evaluated per scope</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* MCP Server Security */}
        <CollapsibleSection
          title="Securing MCP Servers"
          subtitle="Zero-trust access to AI capabilities"
          icon={<Lock className="w-5 h-5" />}
          defaultOpen={false}
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

        {/* Token Flow */}
        <CollapsibleSection
          title="ID-JAG Token Exchange Flow"
          subtitle="How users authorize AI agents"
          icon={<Key className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="mt-4">
            {/* Flow Diagram */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between gap-4 overflow-x-auto">
                {[
                  { step: 1, label: "User Login", desc: "Okta OIDC", color: "#3b82f6" },
                  { step: 2, label: "ID Token", desc: "User Identity", color: "#10b981" },
                  { step: 3, label: "ID-JAG Exchange", desc: "Agent + User", color: "#8b5cf6" },
                  { step: 4, label: "Access Token", desc: "MCP Scoped", color: "#f59e0b" },
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
                <div className="font-semibold text-orange-800">Step 4: MCP Access Token Issuance</div>
                <div className="text-sm text-orange-700 mt-1">
                  ID-JAG is exchanged for an access token scoped to the specific MCP.
                  Access policies determine what scopes are granted based on user groups.
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="font-semibold text-green-800">Step 5: Authorized API Access</div>
                <div className="text-sm text-green-700 mt-1">
                  Agent uses MCP access token to call APIs. Token contains: user sub, agent sub, granted scopes.
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
