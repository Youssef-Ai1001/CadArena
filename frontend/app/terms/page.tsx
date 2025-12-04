'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <Link href="/" className="text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
          </div>
          
          <p className="text-slate-600 mb-8">Last updated: December 4, 2024</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-700 leading-relaxed">
                By accessing and using CadArena, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Service Description</h2>
              <p className="text-slate-700 leading-relaxed">
                CadArena provides an AI-powered platform for creating CAD designs through natural language. The service uses machine learning to generate DXF files based on user prompts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
              <p className="text-slate-700 leading-relaxed mb-2">You are responsible for:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Acceptable Use</h2>
              <p className="text-slate-700 leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access to the system</li>
                <li>Use automated systems to access the service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
              <p className="text-slate-700 leading-relaxed">
                You retain all rights to the CAD designs you create using our service. CadArena retains all rights to the platform, software, and AI technology. You grant us a license to use your designs to improve our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-slate-700 leading-relaxed">
                CadArena is provided "as is" without warranties. We are not liable for any damages resulting from your use of the service, including but not limited to direct, indirect, incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Service Modifications</h2>
              <p className="text-slate-700 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Termination</h2>
              <p className="text-slate-700 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Information</h2>
              <p className="text-slate-700 leading-relaxed">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@cadarena.com" className="text-[#0066FF] hover:underline">
                  legal@cadarena.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Logo size="sm" textColor="text-white" className="justify-center mb-4" />
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm">© 2024 CadArena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

