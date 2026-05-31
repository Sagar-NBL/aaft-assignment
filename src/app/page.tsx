'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden aaft-gradient text-white">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      {/* <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[rgb(var(--gold))]/20 blur-[100px]" aria-hidden /> */}
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[rgb(var(--gold))]/10 blur-[80px]" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm uppercase tracking-[0.35em] text-[rgb(var(--gold))]"
        >
          AAFT Creative Academy
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl"
        >
          Premium learning experiences for the next generation of creators.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-6 max-w-2xl text-lg text-neutral-300"
        >
          A production-grade Mini LMS with admin operations, student portals, video progress tracking, and elegant analytics.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link href="/login?role=admin">
            <Button variant="gold" size="lg" className="w-full sm:w-auto">
              Sign in as Admin <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login?role=student">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign in as Student <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="mt-16 grid gap-6 sm:grid-cols-2"
        >
          <div className="glass-card rounded-2xl p-6">
            <Shield className="h-8 w-8 text-[rgb(var(--gold))]" />
            <h3 className="mt-4 font-semibold">Admin Portal</h3>
            <p className="mt-2 text-sm text-neutral-400">Students, courses, enrollments, and analytics.</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <GraduationCap className="h-8 w-8 text-[rgb(var(--gold))]" />
            <h3 className="mt-4 font-semibold">Student Portal</h3>
            <p className="mt-2 text-sm text-neutral-400">Course library, video lessons, and progress dashboard.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
