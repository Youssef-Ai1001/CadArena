'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { Target, Users, Zap, Shield, Code, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/contact" className="text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-6">
            About <span className="bg-gradient-to-r from-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent">CadArena</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transforming the way designers create CAD drawings through the power of artificial intelligence and natural language processing.
          </p>
        </div>

        {/* Mission */}
        <div className="card p-12 mb-16">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-2xl flex items-center justify-center flex-shrink-0">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-4">
                CadArena democratizes CAD design by making it accessible to everyone, regardless of technical expertise. 
                We believe that great design should be limited only by imagination, not by complex software interfaces.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                Our platform bridges the gap between creative vision and technical implementation, allowing designers, 
                engineers, and creators to bring their ideas to life through simple, conversational interactions.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Innovation',
                description: 'We push the boundaries of what\'s possible with AI and CAD technology to deliver cutting-edge solutions.'
              },
              {
                icon: Shield,
                title: 'Security',
                description: 'Your data and designs are protected with enterprise-grade security and privacy measures.'
              },
              {
                icon: Users,
                title: 'Accessibility',
                description: 'We make professional CAD tools available to everyone, breaking down barriers to entry.'
              },
              {
                icon: Code,
                title: 'Open Standards',
                description: 'We support industry-standard formats like DXF, ensuring compatibility with existing workflows.'
              },
              {
                icon: Heart,
                title: 'User-Centric',
                description: 'Every feature is designed with our users\' needs in mind, prioritizing ease of use and efficiency.'
              },
              {
                icon: Target,
                title: 'Excellence',
                description: 'We strive for excellence in every aspect of our platform, from design to performance.'
              }
            ].map((value, idx) => (
              <div key={idx} className="card p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology */}
        <div className="card p-12 mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Built with Modern Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'FastAPI',
              'Next.js',
              'TypeScript',
              'Ollama AI',
              'SQLAlchemy',
              'Tailwind CSS',
              'WebSockets',
              'PostgreSQL'
            ].map((tech, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="font-semibold text-slate-900">{tech}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Join thousands of designers creating amazing CAD designs with AI.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary">
              Start Creating
            </Link>
            <Link href="/contact" className="btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Logo size="sm" textColor="text-white" />
            <div className="flex gap-6">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-center mt-8 text-sm">© 2024 CadArena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

