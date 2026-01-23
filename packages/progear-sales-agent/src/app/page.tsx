'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AgentFlowCard from '@/components/AgentFlowCard';
import TokenExchangeCard from '@/components/TokenExchangeCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentFlow?: any[];
  tokenExchanges?: any[];
}

const exampleQuestions = [
  { text: "Can we fulfill 1500 basketballs for State University?", icon: "🏀" },
  { text: "What basketball hoops do we have in stock?", icon: "🏀" },
  { text: "Look up State University's account", icon: "👥" },
  { text: "What's our margin on pro basketballs?", icon: "💰" },
  { text: "Show me recent bulk equipment orders", icon: "📦" },
  { text: "Which customers have Platinum tier?", icon: "⭐" },
];

const CHAT_STORAGE_KEY = 'progear-chat-messages';
const AGENT_FLOW_STORAGE_KEY = 'progear-agent-flow';
const TOKEN_EXCHANGE_STORAGE_KEY = 'progear-token-exchanges';
const SESSION_ID_STORAGE_KEY = 'progear-session-id';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgentFlow, setCurrentAgentFlow] = useState<any[]>([]);
  const [currentTokenExchanges, setCurrentTokenExchanges] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoadingAuth = status === 'loading';

  // Load chat history and session ID from sessionStorage on mount
  useEffect(() => {
    try {
      const savedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);
      const savedAgentFlow = sessionStorage.getItem(AGENT_FLOW_STORAGE_KEY);
      const savedTokenExchanges = sessionStorage.getItem(TOKEN_EXCHANGE_STORAGE_KEY);
      const savedSessionId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);

      if (savedMessages) {
        setChatMessages(JSON.parse(savedMessages));
      }
      if (savedAgentFlow) {
        setCurrentAgentFlow(JSON.parse(savedAgentFlow));
      }
      if (savedTokenExchanges) {
        setCurrentTokenExchanges(JSON.parse(savedTokenExchanges));
      }
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
  }, []);

  // Save chat history to sessionStorage whenever it changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Save agent flow and token exchanges to sessionStorage
  useEffect(() => {
    if (currentAgentFlow.length > 0) {
      sessionStorage.setItem(AGENT_FLOW_STORAGE_KEY, JSON.stringify(currentAgentFlow));
    }
    if (currentTokenExchanges.length > 0) {
      sessionStorage.setItem(TOKEN_EXCHANGE_STORAGE_KEY, JSON.stringify(currentTokenExchanges));
    }
  }, [currentAgentFlow, currentTokenExchanges]);

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSignOut = async () => {
    // Get the idToken BEFORE signing out (session will be cleared after signOut)
    const idToken = session?.idToken;

    // Clear the NextAuth session
    await signOut({ redirect: false });

    // Clear chat history and session on sign out
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    sessionStorage.removeItem(AGENT_FLOW_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXCHANGE_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_ID_STORAGE_KEY);

    // End Okta session using OIDC logout endpoint
    // Reference: https://developer.okta.com/docs/guides/sign-users-out/react/main/
    const oktaDomain = process.env.NEXT_PUBLIC_OKTA_DOMAIN;
    const postLogoutRedirect = encodeURIComponent(`${window.location.origin}/auth/signin`);

    if (oktaDomain && idToken) {
      // OIDC logout endpoint with id_token_hint
      window.location.href = `${oktaDomain}/oauth2/v1/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutRedirect}`;
    } else if (oktaDomain) {
      // Fallback without id_token
      window.location.href = `${oktaDomain}/oauth2/v1/logout?post_logout_redirect_uri=${postLogoutRedirect}`;
    } else {
      window.location.href = '/auth/signin';
    }
  };

  const handleSendMessage = async (text?: string) => {
    const userMessage = text || message.trim();
    if (!userMessage) return;

    setMessage('');
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setCurrentAgentFlow([{ step: 'router', action: 'Processing request...', status: 'processing' }]);
    setCurrentTokenExchanges([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const idToken = session?.idToken;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId  // Send session ID for conversation continuity
        }),
      });

      const data = await response.json();

      // Store session ID for future requests (enables conversation memory)
      if (data.session_id) {
        setSessionId(data.session_id);
        sessionStorage.setItem(SESSION_ID_STORAGE_KEY, data.session_id);
      }

      // Update agent flow and token exchanges
      setCurrentAgentFlow(data.agent_flow || []);
      setCurrentTokenExchanges(data.token_exchanges || []);

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        agentFlow: data.agent_flow,
        tokenExchanges: data.token_exchanges,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ]);
      setCurrentAgentFlow([{ step: 'error', action: 'Request failed', status: 'error' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth status
  if (isLoadingAuth || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-light to-court-brown">
        <div className="flex flex-col items-center space-y-4">
          <span className="text-6xl animate-bounce">🏀</span>
          <div className="text-white text-xl font-display">Loading CourtEdge ProGear...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-bg to-primary flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-court-brown to-primary-light border-b-4 border-accent shadow-lg relative overflow-hidden">
        {/* Court pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <line x1="50" y1="0" x2="50" y2="30" stroke="#ff6b35" strokeWidth="0.5"/>
            <circle cx="50" cy="15" r="8" fill="none" stroke="#ff6b35" strokeWidth="0.3"/>
          </svg>
        </div>

        <div className="px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="text-5xl">🏀</span>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-okta-blue rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">CourtEdge ProGear</h1>
              <p className="text-gray-300 text-sm">AI-Powered Basketball Equipment Sales</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-200 text-sm">{session?.user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-white/10 hover:bg-accent/30 text-white rounded-lg transition border border-white/20 hover:border-accent/50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Chat Interface */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-neutral-bg to-white">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 max-w-2xl mx-auto">
                <div className="inline-block mb-4 relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
                  <span className="text-6xl relative z-10">🏀</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome, {session?.user?.name || 'Team Member'}!</h2>
                <p className="text-gray-300 mb-6">
                  Your AI-powered basketball equipment sales assistant is ready. Ask about orders, inventory, pricing, or customers.
                </p>

                {/* Example Questions */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {exampleQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(question.text)}
                      className="group p-4 bg-white/95 backdrop-blur-sm border-2 border-accent/20 hover:border-accent hover:shadow-xl rounded-xl transition-all text-left flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-accent/20 to-court-orange/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-accent group-hover:to-court-orange transition-all">
                        <span className="text-lg group-hover:scale-110 transition-transform">{question.icon}</span>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-primary font-medium leading-relaxed">
                        {question.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-court-orange to-accent'
                      : 'bg-gradient-to-br from-primary to-court-brown'
                  }`}>
                    {msg.role === 'user' ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <span className="text-xl">🏀</span>
                    )}
                  </div>

                  <div className={`rounded-xl p-4 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-accent to-court-orange text-white'
                      : 'bg-white border-2 border-neutral-border'
                  }`}>
                    <p className={`whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-gray-700' : ''}`}>
                      {msg.content}
                    </p>
                    <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-court-brown rounded-lg flex items-center justify-center">
                    <span className="text-xl animate-bounce">🏀</span>
                  </div>
                  <div className="bg-white border-2 border-accent/30 rounded-xl p-4 shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-court-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-court-brown rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Processing with AI agents...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t-4 border-accent bg-gradient-to-r from-white via-accent/5 to-white px-6 py-4 shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about orders, inventory, pricing, or customers..."
                  className="w-full px-5 py-3 border-2 border-neutral-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition text-gray-700 placeholder-gray-400"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                  🏀
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="px-6 py-3 bg-gradient-to-r from-accent to-court-orange hover:from-court-orange hover:to-accent text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center space-x-2 border-b-4 border-court-brown/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Pane - Security Dashboard */}
        <div className="w-96 bg-gradient-to-b from-gray-50 to-white border-l-4 border-accent/30 overflow-y-auto p-4 space-y-4">
          <div className="text-center pb-4 border-b-2 border-accent/20">
            <h2 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-okta-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Security Dashboard
            </h2>
          </div>

          {/* Agent Flow */}
          <AgentFlowCard steps={currentAgentFlow} isLoading={isLoading} />

          {/* Token Exchanges */}
          <TokenExchangeCard exchanges={currentTokenExchanges} />

          {/* Architecture Link */}
          <Link
            href="/architecture"
            className="block p-4 bg-gradient-to-r from-okta-blue to-okta-blue-light text-white rounded-xl hover:shadow-lg transition hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Learn More</div>
                <div className="text-sm text-white/80">View Architecture Details</div>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
