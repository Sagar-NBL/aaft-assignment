'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { StudentCourseCard } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function ProgressRing({ value }: { value: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="88" height="88" className="-rotate-180" aria-label={`${value}% complete`}>
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(196, 30, 58)" />
          <stop offset="100%" stopColor="rgb(227, 38, 55)" />
        </linearGradient>
      </defs>
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgb(var(--muted))" strokeWidth="6" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="44"
        y="48"
        textAnchor="middle"
        className="fill-[rgb(var(--foreground))] rotate-90 text-sm font-bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: '44px 44px' }}
      >
        {value}%
      </text>
    </svg>
  );
}

export function CourseCard({ course }: { course: StudentCourseCard }) {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <Link href={`/student/courses/${course.id}`}>
        <Card className="group h-full overflow-hidden border-[rgb(var(--border))] transition-all hover:border-[rgb(var(--gold))]/40 hover:shadow-lg hover:shadow-[rgb(var(--gold))]/10">
          <div className="relative h-44 overflow-hidden">
            <SafeImage
              src={course.thumbnail}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>
          <CardContent className="flex gap-4 p-5">
            <ProgressRing value={course.progress.percentage} />
            <div className="min-w-0 flex-1">
              <Badge variant={course.status === 'completed' ? 'success' : 'gold'} className="mb-2 capitalize">
                {course.status.replace('_', ' ')}
              </Badge>
              <h3 className="font-semibold line-clamp-1">{course.name}</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))] line-clamp-2">{course.description}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
