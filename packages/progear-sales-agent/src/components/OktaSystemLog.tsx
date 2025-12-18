'use client';

// Stacked key-value log display with syntax highlighting
// Shows actual Okta system log fields in a vertical, readable format

export default function OktaSystemLog() {
  return (
    <div className="mt-4 space-y-4">
      {/* SUCCESS Log */}
      <div className="rounded-lg overflow-hidden border-2 border-green-500/40">
        <div className="bg-green-500/20 px-4 py-2 border-b border-green-500/40">
          <span className="text-green-600 font-semibold">SUCCESS</span>
          <span className="text-gray-500 text-sm ml-2">Token Grant</span>
        </div>
        <div className="bg-gray-900 p-4 font-mono text-sm space-y-1">
          <div><span className="text-gray-500">published:</span>       <span className="text-gray-400">2025-12-18T17:29:13.031Z</span></div>
          <div><span className="text-gray-500">eventType:</span>       <span className="text-yellow-300">app.oauth2.as.token.grant.access_token</span></div>
          <div className="pt-2"><span className="text-gray-500">outcome.result:</span>  <span className="text-green-400 font-bold">SUCCESS</span> <span className="text-gray-400 text-sm italic ml-4">← Governance decision</span></div>
          <div className="pt-2"><span className="text-gray-500">actor.displayName:</span>   <span className="text-blue-400 font-semibold">ProGear Sales Agent</span> <span className="text-gray-400 text-sm italic ml-4">← AI Agent</span></div>
          <div><span className="text-gray-500">actor.id:</span>            <span className="text-blue-300">wlp8x5q7mvH86KvFJ0g7</span></div>
          <div className="pt-2"><span className="text-gray-500">target.displayName:</span>  <span className="text-purple-400 font-semibold">Sarah Sales</span> <span className="text-gray-400 text-sm italic ml-4">← Acting on behalf of</span></div>
          <div><span className="text-gray-500">target.alternateId:</span>  <span className="text-purple-300">sarah.sales@progear.demo</span></div>
          <div className="pt-2"><span className="text-gray-500">authorizationServer:</span> <span className="text-cyan-300">ProGear Inventory MCP</span> <span className="text-gray-400 text-sm italic ml-4">← Resource being accessed</span></div>
          <div><span className="text-gray-500">requestedScopes:</span>     <span className="text-gray-300">inventory:read</span></div>
          <div><span className="text-gray-500">grantedScopes:</span>       <span className="text-green-400 font-semibold">inventory:read</span> <span className="text-gray-400 text-sm italic ml-4">← Access granted</span></div>
        </div>
      </div>

      {/* FAILURE Log */}
      <div className="rounded-lg overflow-hidden border-2 border-red-500/40">
        <div className="bg-red-500/20 px-4 py-2 border-b border-red-500/40">
          <span className="text-red-600 font-semibold">FAILURE</span>
          <span className="text-gray-500 text-sm ml-2">Policy Denied</span>
        </div>
        <div className="bg-gray-900 p-4 font-mono text-sm space-y-1">
          <div><span className="text-gray-500">published:</span>       <span className="text-gray-400">2025-12-18T17:25:30.227Z</span></div>
          <div><span className="text-gray-500">eventType:</span>       <span className="text-yellow-300">app.oauth2.as.token.grant</span></div>
          <div className="pt-2"><span className="text-gray-500">outcome.result:</span>  <span className="text-red-400 font-bold">FAILURE</span> <span className="text-gray-400 text-sm italic ml-4">← Governance decision</span></div>
          <div><span className="text-gray-500">outcome.reason:</span>  <span className="text-red-400 font-bold">no_matching_policy</span> <span className="text-gray-400 text-sm italic ml-4">← Policy blocked this request</span></div>
          <div className="pt-2"><span className="text-gray-500">actor.displayName:</span>   <span className="text-blue-400 font-semibold">ProGear Sales Agent</span> <span className="text-gray-400 text-sm italic ml-4">← Same AI Agent</span></div>
          <div><span className="text-gray-500">actor.id:</span>            <span className="text-blue-300">wlp8x5q7mvH86KvFJ0g7</span></div>
          <div className="pt-2"><span className="text-gray-500">target.subject:</span>      <span className="text-purple-300">00u8xdeptoh4cK9pG0g7</span> <span className="text-gray-600">(Sarah Sales)</span> <span className="text-gray-400 text-sm italic ml-2">← Same user</span></div>
          <div className="pt-2"><span className="text-gray-500">authorizationServer:</span> <span className="text-cyan-300">ProGear Inventory MCP</span></div>
          <div><span className="text-gray-500">requestedScopes:</span>     <span className="text-red-400 line-through">inventory:write</span> <span className="text-gray-400 text-sm italic ml-4">← Write access denied</span></div>
          <div><span className="text-gray-500">grantedScopes:</span>       <span className="text-gray-500">(none)</span></div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
          <div className="font-semibold text-purple-800">Complete Attribution</div>
          <div className="text-sm text-purple-700 mt-1">
            Every request shows both the AI agent AND the user it acted on behalf of.
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <div className="font-semibold text-green-800">Real-Time Visibility</div>
          <div className="text-sm text-green-700 mt-1">
            Okta logs capture every governance decision as it happens.
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="font-semibold text-blue-800">Policy Enforcement</div>
          <div className="text-sm text-blue-700 mt-1">
            See exactly when and why access was granted or denied.
          </div>
        </div>
      </div>
    </div>
  );
}
