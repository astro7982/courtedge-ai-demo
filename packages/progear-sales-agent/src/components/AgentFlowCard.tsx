'use client';

import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

interface AgentFlowStep {
  step: string;
  action: string;
  status: string;
  color?: string;
  agents?: string[];
}

interface Props {
  steps: AgentFlowStep[];
  isLoading?: boolean;
}

const agentColors: Record<string, string> = {
  sales: '#3b82f6',
  inventory: '#10b981',
  customer: '#8b5cf6',
  pricing: '#f59e0b',
};

const agentIcons: Record<string, string> = {
  sales: 'S',
  inventory: 'I',
  customer: 'C',
  pricing: 'P',
};

export default function AgentFlowCard({ steps, isLoading }: Props) {
  // Extract agent steps for the visual flow
  const agentSteps = steps.filter(s =>
    s.step.includes('agent') || s.step === 'router' || s.step === 'generate_response'
  );

  // Get involved agents from routing step
  const routingStep = steps.find(s => s.step === 'router' && s.agents);
  const involvedAgents = routingStep?.agents || [];

  return (
    <div className="bg-white rounded-xl border-2 border-neutral-border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary-light px-4 py-3 border-b border-neutral-border">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Agent Flow</span>
          <span className="text-white/60 text-sm font-normal">— LangGraph + Claude</span>
        </h3>
      </div>

      <div className="p-4">
        {/* Visual Agent Flow */}
        <div className="flex items-center justify-center gap-2">
          {/* Router */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-gray-700 text-white flex items-center justify-center text-xs font-bold">
              RT
            </div>
            <span className="text-[10px] text-gray-500 mt-1">Router</span>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400" />

          {/* Agents */}
          <div className="flex items-center gap-2">
            {['sales', 'inventory', 'customer', 'pricing'].map((agent) => {
              const isInvolved = involvedAgents.includes(agent);
              const agentStep = steps.find(s => s.step === `${agent}_agent`);
              const status = agentStep?.status || (isInvolved ? 'pending' : 'inactive');

              return (
                <div key={agent} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      status === 'completed' ? 'text-white shadow-lg' :
                      status === 'denied' ? 'text-white opacity-75' :
                      status === 'pending' ? 'text-white animate-pulse' :
                      'bg-gray-200 text-gray-400'
                    }`}
                    style={{
                      backgroundColor: status !== 'inactive' ? agentColors[agent] : undefined
                    }}
                  >
                    {status === 'completed' && <CheckCircle className="w-5 h-5" />}
                    {status === 'denied' && <XCircle className="w-5 h-5" />}
                    {status === 'pending' && <Clock className="w-5 h-5" />}
                    {status === 'inactive' && agentIcons[agent]}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 capitalize">{agent}</span>
                </div>
              );
            })}
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400" />

          {/* Response */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
              steps.some(s => s.step === 'generate_response' && s.status === 'completed')
                ? 'bg-success-green text-white'
                : 'bg-gray-200 text-gray-400'
            }`}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-gray-500 mt-1">Response</span>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Clock className="w-4 h-4 text-okta-blue animate-spin" />
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
