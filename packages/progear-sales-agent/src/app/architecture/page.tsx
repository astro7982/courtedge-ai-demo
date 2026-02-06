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

        {/* Token Flow - Improved with Two Auth Servers */}
        <CollapsibleSection
          title="ID-JAG Token Exchange Flow"
          subtitle="Why ID-JAG exists and how it works"
          icon={<Key className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="mt-4">
            {/* Why ID-JAG Exists - The Problem */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 mb-6 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-lg mb-2">The Problem ID-JAG Solves</div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>The user authenticated to the <strong>Main Auth Server</strong> and got an ID Token.</p>
                    <p>But each MCP has its <strong>own Authorization Server</strong> with its own access policies.</p>
                    <p className="text-red-700 font-medium">The MCP Auth Server did not issue that ID Token. It cannot just trust it directly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 mb-6 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-lg mb-2">The Solution: ID-JAG as a Bridge</div>
                  <div className="text-sm text-gray-700">
                    <p>The <strong>ID-JAG</strong> (Identity Assertion JWT Authorization Grant) is a cryptographically signed "letter of introduction" from the Main Auth Server to the MCP Auth Server:</p>
                    <p className="mt-2 italic text-teal-700">"I authenticated this user. I verified this agent. Here is a signed token binding them together, addressed specifically to you. Now YOU apply YOUR policies."</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Authorization Servers Diagram */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
              <div className="text-center text-xs text-gray-500 uppercase tracking-wide mb-4 font-semibold">
                Two Authorization Servers / One Okta Tenant
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Main Auth Server */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-6 h-6" />
                    <div>
                      <div className="font-bold">Main Auth Server</div>
                      <div className="text-xs text-orange-200">org / default</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-200"></div>
                      <span>Issues ID Tokens (OIDC login)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-200"></div>
                      <span>Validates agent JWT assertion</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      <span>Step 1: ID Token → ID-JAG</span>
                    </div>
                  </div>
                </div>

                {/* MCP Auth Server */}
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-6 h-6" />
                    <div>
                      <div className="font-bold">MCP Auth Server</div>
                      <div className="text-xs text-teal-200">e.g., aus...inventory</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-200"></div>
                      <span>Validates ID-JAG signature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-200"></div>
                      <span>Applies access policies (user groups)</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      <span>Step 2: ID-JAG → Access Token</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* The Bridge - ID-JAG */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-orange-400 via-purple-500 to-teal-400 rounded-full"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-gradient-to-r from-orange-400 via-purple-500 to-teal-400 px-6 py-3 rounded-full shadow-lg">
                    <div className="text-white font-bold text-sm flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      ID-JAG Token
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mt-4">
                The ID-JAG bridges trust between authorization servers
              </div>
            </div>

            {/* Sequence Diagram - Code Window Style */}
            <div className="bg-gray-900 rounded-xl overflow-hidden mb-6 shadow-xl">
              <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-gray-400 text-sm font-mono ml-2">id-jag-token-exchange.sequence</div>
              </div>
              <div className="p-6 font-mono text-sm">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-purple-400">User</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-blue-400">AI Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-orange-400">Main Auth Server</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <span className="text-teal-400">MCP Auth Server</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-green-400">MCP API</span>
                  </div>
                </div>

                {/* Sequence Steps */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">1</div>
                    <div className="flex-1">
                      <div className="text-purple-400 font-semibold">User logs in via OIDC</div>
                      <div className="text-gray-500 text-xs mt-1">User {"-->"} Main Auth Server {"-->"} User</div>
                      <div className="mt-2 inline-block px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300">
                        Returns: <span className="text-purple-200 font-semibold">ID Token</span> (sub: user identity)
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">2</div>
                    <div className="flex-1">
                      <div className="text-orange-400 font-semibold">Agent requests ID-JAG from Main Auth Server</div>
                      <div className="text-gray-500 text-xs mt-1">AI Agent {"-->"} Main Auth Server</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300 text-xs">ID Token</span>
                        <span className="text-gray-500">+</span>
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 text-xs">Agent JWT (signed with private key)</span>
                        <span className="text-gray-500">+</span>
                        <span className="px-2 py-1 bg-teal-500/20 border border-teal-500/50 rounded text-teal-300 text-xs">audience: MCP Auth Server</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-teal-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">3</div>
                    <div className="flex-1">
                      <div className="text-purple-400 font-semibold">Main Auth Server returns ID-JAG</div>
                      <div className="text-gray-500 text-xs mt-1">Main Auth Server {"-->"} AI Agent</div>
                      <div className="mt-2 inline-block px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-teal-500/20 border border-purple-500/50 rounded">
                        <span className="text-purple-300">Returns: </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-purple-400 to-teal-400 font-bold">ID-JAG Token</span>
                        <span className="text-gray-400 ml-2">(binds user + agent, addressed to MCP Auth)</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center text-teal-400 font-bold flex-shrink-0">4</div>
                    <div className="flex-1">
                      <div className="text-teal-400 font-semibold">Agent exchanges ID-JAG at MCP Auth Server</div>
                      <div className="text-gray-500 text-xs mt-1">AI Agent {"-->"} MCP Auth Server</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gradient-to-r from-orange-500/20 to-teal-500/20 border border-purple-500/50 rounded text-purple-300 text-xs">ID-JAG</span>
                        <span className="text-gray-500">+</span>
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 text-xs">Agent JWT</span>
                        <span className="text-gray-500">+</span>
                        <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-300 text-xs">requested scopes</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center text-teal-400 font-bold flex-shrink-0">5</div>
                    <div className="flex-1">
                      <div className="text-teal-400 font-semibold">MCP Auth Server evaluates access policies</div>
                      <div className="text-gray-500 text-xs mt-1">MCP Auth Server (internal)</div>
                      <div className="mt-2 px-3 py-2 bg-teal-500/10 border border-teal-500/30 rounded text-sm">
                        <div className="text-teal-300">Checks user group membership against policy rules:</div>
                        <div className="text-gray-400 mt-1 text-xs">if user in "ProGear-Sales" {"-->"} grant inventory:read</div>
                        <div className="text-gray-400 text-xs">if user in "ProGear-Managers" {"-->"} grant inventory:write</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-green-400 font-bold flex-shrink-0">6</div>
                    <div className="flex-1">
                      <div className="text-green-400 font-semibold">MCP Auth Server returns scoped Access Token</div>
                      <div className="text-gray-500 text-xs mt-1">MCP Auth Server {"-->"} AI Agent</div>
                      <div className="mt-2 inline-block px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded text-green-300">
                        Returns: <span className="text-green-200 font-semibold">Access Token</span> (sub: user, act.sub: agent, scp: granted scopes)
                      </div>
                    </div>
                  </div>

                  {/* Step 7 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-green-400 font-bold flex-shrink-0">7</div>
                    <div className="flex-1">
                      <div className="text-green-400 font-semibold">Agent calls MCP API with Access Token</div>
                      <div className="text-gray-500 text-xs mt-1">AI Agent {"-->"} MCP API {"-->"} AI Agent</div>
                      <div className="mt-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-xs">
                        <div className="text-green-400">GET /api/inventory/stock?product=basketball</div>
                        <div className="text-blue-300">Authorization: Bearer &lt;access_token&gt;</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Contents - Dark Background */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* ID Token */}
              <div className="bg-gray-900 rounded-xl border-2 border-purple-500/50 overflow-hidden shadow-lg">
                <div className="bg-purple-500 text-white px-4 py-3 text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  ID Token
                </div>
                <div className="p-4 font-mono text-sm space-y-2">
                  <div><span className="text-purple-400">sub:</span> <span className="text-purple-300 font-semibold">{userSub}</span></div>
                  <div><span className="text-purple-400">aud:</span> <span className="text-gray-400">frontend-app</span></div>
                  <div><span className="text-purple-400">iss:</span> <span className="text-gray-400">main-auth-server</span></div>
                </div>
                <div className="px-4 pb-4 text-sm text-purple-400 font-medium">
                  User identity only
                </div>
              </div>

              {/* ID-JAG */}
              <div className="bg-gray-900 rounded-xl border-2 border-purple-500/50 overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-orange-500 via-purple-500 to-teal-500 text-white px-4 py-3 text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  ID-JAG Token
                </div>
                <div className="p-4 font-mono text-sm space-y-2">
                  <div><span className="text-purple-400">sub:</span> <span className="text-purple-300 font-semibold">{userSub}</span></div>
                  <div><span className="text-blue-400">act.sub:</span> <span className="text-blue-300 font-semibold">wlp...agent</span></div>
                  <div><span className="text-teal-400">aud:</span> <span className="text-teal-300 font-semibold">mcp-auth-server</span></div>
                </div>
                <div className="px-4 pb-4 text-sm text-purple-400 font-medium">
                  Bridges user + agent to target
                </div>
              </div>

              {/* Access Token */}
              <div className="bg-gray-900 rounded-xl border-2 border-green-500/50 overflow-hidden shadow-lg">
                <div className="bg-green-500 text-white px-4 py-3 text-base font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Access Token
                </div>
                <div className="p-4 font-mono text-sm space-y-2">
                  <div><span className="text-purple-400">sub:</span> <span className="text-purple-300 font-semibold">{userSub}</span></div>
                  <div><span className="text-blue-400">act.sub:</span> <span className="text-blue-300 font-semibold">wlp...agent</span></div>
                  <div><span className="text-green-400">scp:</span> <span className="text-green-300 font-semibold">inventory:read</span></div>
                </div>
                <div className="px-4 pb-4 text-sm text-green-400 font-medium">
                  Policy-granted scopes
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <div className="mt-6 bg-okta-blue/10 rounded-xl p-4 border border-okta-blue/30">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-okta-blue mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-800">Why Two Authorization Servers?</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Each MCP has its own auth server with its own access policies. This separation allows fine-grained control:
                    the Inventory MCP can have different policies than the Pricing MCP. The ID-JAG securely carries the
                    user+agent identity across this boundary so each MCP auth server can make independent authorization decisions.
                  </div>
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
