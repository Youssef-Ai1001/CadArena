'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

/**
 * SiteFooter
 * ----------
 * Shared minimal footer used across public pages so the look is consistent.
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm mt-24">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 px-4 sm:px-6 lg:px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Logo size="sm" className="mr-1" />
          <span className="hidden sm:inline-block">·</span>
          <span>
            Built by <span className="font-semibold text-slate-800">Youssef&nbsp;Taha</span>{' '}
            (<a href="mailto:ytaha8586@gmail.com" className="underline hover:text-slate-900">
              ytaha8586@gmail.com
            </a>)
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
          <Link href="/docs" className="hover:text-slate-900 transition-colors">
            Docs
          </Link>
          <Link href="/about" className="hover:text-slate-900 transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-slate-900 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}


