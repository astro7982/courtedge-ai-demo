'use client';

import { CheckCircle, XCircle, Shield, Key } from 'lucide-react';

interface TokenExchange {
  agent: string;
  agent_name: string;
  color: string;
  success: boolean;
  access_denied: boolean;
  status: string;
  scopes: string[];
  requested_scopes?: string[];  // What was requested (shown for denied cases)
  error?: string;
  demo_mode: boolean;
}

interface Props {
  exchanges: TokenExchange[];
}

// Helper to detect if an error is a policy denial (even if access_denied flag isn't set)
const isPolicyDenial = (exchange: TokenExchange): boolean => {
  if (exchange.access_denied) return true;
  if (!exchange.error) return false;

  const errorLower = exchange.error.toLowerCase();
  const policyKeywords = [
    'policy', 'denied', 'token_exchange_failed',
    'no_matching_policy', 'access_denied', 'authorization'
  ];
  return policyKeywords.some(kw => errorLower.includes(kw));
};

export default function TokenExchangeCard({ exchanges }: Props) {
  const granted = exchanges.filter(e => e.success && !isPolicyDenial(e));
  const denied = exchanges.filter(e => isPolicyDenial(e));

  return (
    <div className="bg-white rounded-xl border-2 border-neutral-border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-okta-blue to-okta-blue-light px-4 py-3 border-b border-neutral-border">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Key className="w-5 h-5" />
          Token Exchanges
        </h3>
      </div>

      <div className="p-4">
        {/* Summary */}
        <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-success-green/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success-green" />
            </div>
            <div>
              <div className="text-lg font-bold text-success-green">{granted.length}</div>
              <div className="text-[10px] text-gray-500 uppercase">Granted</div>
            </div>
          </div>

          {denied.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-error-red/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-error-red" />
              </div>
              <div>
                <div className="text-lg font-bold text-error-red">{denied.length}</div>
                <div className="text-[10px] text-gray-500 uppercase">Denied</div>
              </div>
            </div>
          )}
        </div>

        {/* Exchange List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {exchanges.map((exchange, idx) => {
            const isDenied = isPolicyDenial(exchange);
            const isGranted = exchange.success && !isDenied;

            return (
              <div
                key={idx}
                className={`rounded-lg border-2 p-3 transition-all ${
                  isGranted
                    ? 'border-success-green/30 bg-success-green/5'
                    : 'border-error-red/30 bg-error-red/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: exchange.color }}
                    >
                      {exchange.agent.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {exchange.agent_name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {exchange.demo_mode ? 'Demo Mode' : 'ID-JAG Exchange'}
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    isGranted
                      ? 'bg-success-green/20 text-success-green'
                      : 'bg-error-red/20 text-error-red'
                  }`}>
                    {isGranted ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Granted</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Denied</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Granted Scopes */}
                {isGranted && exchange.scopes.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Granted scope:</div>
                    <div className="flex flex-wrap gap-1">
                      {exchange.scopes.map((scope, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-success-green/10 text-success-green text-[10px] rounded-full font-mono border border-success-green/30"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Denied Scopes - show what was requested but denied */}
                {isDenied && (
                  <div className="mt-2">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Requested scope:</div>
                    <div className="flex flex-wrap gap-1">
                      {(exchange.requested_scopes && exchange.requested_scopes.length > 0
                        ? exchange.requested_scopes
                        : exchange.scopes && exchange.scopes.length > 0
                          ? exchange.scopes
                          : ['(unknown scope)']
                      ).map((scope, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-error-red/10 text-error-red text-[10px] rounded-full font-mono border border-error-red/30"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policy blocked message - clean and subtle */}
                {isDenied && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Blocked by Okta governance policy</span>
                  </div>
                )}
              </div>
            );
          })}

          {exchanges.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No token exchanges yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
