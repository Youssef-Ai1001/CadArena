'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { projectsAPI, Project } from '@/lib/api';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';
import DxfViewer from '@/components/DxfViewer';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { Send, FolderOpen, Wifi, WifiOff, Loader2, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'system' | 'dxf';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [currentDxf, setCurrentDxf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'status') {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          content: message.message || 'Processing...',
          timestamp: new Date(),
        },
      ]);
    } else if (message.type === 'dxf_output' && message.data) {
      setCurrentDxf(message.data);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'dxf',
          content: 'DXF generated successfully!',
          timestamp: new Date(),
        },
      ]);
      setSending(false);
    } else if (message.type === 'error') {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          content: `Error: ${message.message || 'An error occurred'}`,
          timestamp: new Date(),
        },
      ]);
      setSending(false);
    }
  }, []);

  const { connected, sendMessage, error: wsError } = useWebSocket(
    projectId,
    handleWebSocketMessage
  );

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadProject();
    loadProjects();
  }, [projectId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProject = async () => {
    try {
      const data = await projectsAPI.get(projectId);
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      router.push('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await projectsAPI.list();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !connected || sending) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send via WebSocket
    sendMessage({
      type: 'prompt',
      prompt: prompt,
    });

    setPrompt('');
    setSending(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0066FF] animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="flex justify-between items-center h-16 px-6">
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="h-6 w-px bg-slate-300"></div>
            <span className="text-slate-700 font-medium">{project.title}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              connected 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {connected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Disconnected
                </>
              )}
            </div>
            {wsError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {wsError}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Projects */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#0066FF]" />
              Projects
            </h2>
          </div>
          <div className="p-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/app/chat/${p.id}`}
                className={`block p-3 rounded-lg mb-1 transition-all duration-200 ${
                  p.id === projectId
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#7C3AED] text-white font-medium shadow-md'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-2xl flex items-center justify-center">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Start Designing</h3>
                  <p className="text-slate-600 mb-4">
                    Describe your CAD design in natural language. For example:
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2">
                    <p className="text-sm text-slate-700">• "Draw a circle with radius 25"</p>
                    <p className="text-sm text-slate-700">• "Create a line from (10,10) to (50,50)"</p>
                    <p className="text-sm text-slate-700">• "Make a rectangle 100x50"</p>
                  </div>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type !== 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl px-5 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#7C3AED] text-white shadow-md'
                      : message.type === 'dxf'
                      ? 'bg-green-50 border-2 border-green-200 text-green-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {message.type === 'dxf' && (
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Success!</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
                    <span className="text-sm text-slate-700">Generating your design...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input */}
          <div className="border-t border-slate-200 bg-white p-4">
            <form onSubmit={handleSendPrompt} className="flex gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your CAD design in natural language..."
                disabled={!connected || sending}
                className="flex-1 input-field disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!connected || sending || !prompt.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* DXF Viewer Panel */}
        <div className="w-2/5 border-l border-slate-200 bg-white">
          <DxfViewer dxfContent={currentDxf} projectTitle={project.title} />
        </div>
      </div>
    </div>
  );
}
