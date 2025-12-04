'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import SiteFooter from '@/components/SiteFooter';
import { ArrowRight, Sparkles, Zap, Box, CheckCircle2, Bot, User, Loader2 } from 'lucide-react';

interface DemoMessage {
  id: string;
  from: 'user' | 'ai';
  text: string;
}

export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<DemoMessage[]>([
    {
      id: 'welcome',
      from: 'ai',
      text: 'Hi, I am the CadArena assistant. Describe a simple shape and I will show you how the chat feels.',
    },
  ]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/app/dashboard');
    }
  }, [router]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToChat = () => {
    const el = document.getElementById('home-chat');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDemoSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatSending) return;

    const userMsg: DemoMessage = { id: Date.now().toString(), from: 'user', text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatSending(true);

    // Simulate AI response locally (no backend call)
    setTimeout(() => {
      const aiMsg: DemoMessage = {
        id: `${Date.now()}-ai`,
        from: 'ai',
        text:
          'This is a demo chat on the landing page. For full DXF generation, sign up and use the main CadArena workspace.',
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setChatSending(false);
    }, 700);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav
        className={`sticky top-0 z-50 border-b border-slate-200 transition-all ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white/80 backdrop-blur-md shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/about"
                className="text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/auth/login"
                className="text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary text-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered CAD Design
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-6">
            Design in{' '}
            <span className="bg-gradient-to-r from-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent">
              Natural Language
            </span>
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Transform your ideas into professional CAD designs through conversational AI. Simply describe what you want, and watch it come to life in real-time.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <button
              type="button"
              onClick={scrollToChat}
              className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
            >
              Try the Chat
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={scrollToChat}
              className="btn-secondary text-lg px-8 py-4"
            >
              See Live Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#0066FF] to-[#3385FF] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Conversational AI</h3>
            <p className="text-slate-600 leading-relaxed">
              Describe your design in plain English. Our AI understands natural language and generates precise CAD drawings.
            </p>
          </div>
          
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Generation</h3>
            <p className="text-slate-600 leading-relaxed">
              Watch your designs appear instantly as the AI generates them. No waiting, no delays—just pure creativity.
            </p>
          </div>
          
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-2xl flex items-center justify-center">
              <Box className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Industry Standard</h3>
            <p className="text-slate-600 leading-relaxed">
              Export professional DXF files compatible with AutoCAD, SolidWorks, and all major CAD software.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-24 bg-white/80 rounded-2xl shadow-xl p-12 border border-slate-200 backdrop-blur-md">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Why Choose CadArena?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'No CAD software experience required',
              'Instant design generation',
              'Professional-quality outputs',
              'Save time and resources',
              'Iterate quickly with natural language',
              'Export to industry-standard formats'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simple in-page chat demo */}
        <section id="home-chat" className="mt-24 max-w-4xl mx-auto">
          <div className="card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#0066FF]" />
              Chat with CadArena (Demo)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              This is a lightweight demo chat on the landing page. It simulates how the real CadArena chat feels,
              without connecting to the DXF backend.
            </p>
            <div className="h-64 border border-slate-200 rounded-xl p-4 mb-4 overflow-y-auto bg-slate-50">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-3 flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      m.from === 'user'
                        ? 'bg-gradient-to-r from-[#0066FF] to-[#7C3AED] text-white'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {m.from === 'user' ? (
                        <>
                          <span className="text-xs font-semibold opacity-80">You</span>
                          <User className="w-3 h-3 opacity-80" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-[#0066FF]" />
                          <span className="text-xs font-semibold text-slate-700">CadArena</span>
                        </>
                      )}
                    </div>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
              {chatSending && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin text-[#0066FF]" />
                  CadArena is thinking...
                </div>
              )}
            </div>
            <form onSubmit={handleDemoSend} className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Describe a simple CAD shape, e.g. 'Draw a rectangle 50x20'"
                className="flex-1 input-field"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatSending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
