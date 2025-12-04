'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

/**
 * DocsPage
 * --------
 * Lightweight in-app documentation that gives users and collaborators
 * a quick overview of how CadArena works end‑to‑end.
 * This is intentionally concise; deeper technical details live in DOCUMENTATION.md.
 */
export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link
            href="/app/dashboard"
            className="text-sm font-medium text-slate-700 hover:text-[#0066FF] transition-colors"
          >
            Go to App →
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          CadArena Documentation
        </h1>
        <p className="text-slate-600 mb-8">
          High‑level guide to architecture, authentication, and the conversational CAD workflow.
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Overview</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
            CadArena is a full‑stack demo that lets you describe CAD designs in natural language,
            generates DXF output via an AI backend, and previews the result in a browser DXF viewer.
            The system is built with a FastAPI backend and a Next.js (App Router) frontend.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Core Flow</h2>
          <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
            <li>User signs up and logs in (JWT‑based auth with access + refresh tokens).</li>
            <li>Dashboard loads user projects from the `/projects` API.</li>
            <li>User creates a project and is redirected to `/app/chat/[id]`.</li>
            <li>Chat messages are sent over WebSocket to the AI service, which streams DXF output.</li>
            <li>DXF output is rendered live in the DXF viewer panel.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Key Components</h2>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            <li><code>backend/app/api/v1/auth.py</code> – Signup, login, tokens, email‑style flows.</li>
            <li><code>backend/app/api/v1/projects.py</code> – Project CRUD for each user.</li>
            <li><code>backend/app/api/v1/websocket.py</code> – Real‑time AI DXF generation.</li>
            <li><code>frontend/app/app/dashboard/page.tsx</code> – Project dashboard.</li>
            <li><code>frontend/app/app/chat/[id]/page.tsx</code> – Chat + DXF viewer workspace.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">More Details</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            For a deeper technical breakdown, including system design and implementation notes,
            see the <code>DOCUMENTATION.md</code> file in the project root.
          </p>
        </section>
      </main>
    </div>
  );
}


