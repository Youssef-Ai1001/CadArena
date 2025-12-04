'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          
          <p className="text-slate-600 mb-8">Last updated: December 4, 2024</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-700 leading-relaxed">
                CAD ARENA ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Personal Information</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Username and email address</li>
                <li>Password (stored securely using bcrypt hashing)</li>
                <li>Projects and CAD designs you create</li>
                <li>Communication history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>To provide and maintain our service</li>
                <li>To authenticate your account</li>
                <li>To send verification emails and important notifications</li>
                <li>To improve our service and user experience</li>
                <li>To respond to your inquiries and support requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p className="text-slate-700 leading-relaxed">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mt-2">
                <li>Bcrypt password hashing</li>
                <li>JWT token-based authentication</li>
                <li>HTTPS encryption for all data transmission</li>
                <li>Regular security audits</li>
                <li>Access controls and authentication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
              <p className="text-slate-700 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide services. You can delete your account at any time, and we will delete your personal information within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights</h2>
              <p className="text-slate-700 leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-slate-700 leading-relaxed">
                We use essential cookies for authentication and session management. We do not use tracking cookies or third-party analytics without your consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Third-Party Services</h2>
              <p className="text-slate-700 leading-relaxed">
                We may use third-party services (such as email providers) to deliver our service. These services have their own privacy policies governing the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@cadarena.com" className="text-[#0066FF] hover:underline">
                  privacy@cadarena.com
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
          <p className="text-sm">© 2024 CAD ARENA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

