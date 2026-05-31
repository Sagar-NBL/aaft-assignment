import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/90 p-10 text-center shadow-2xl shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.32em] text-sky-300/80">404 — Not found</p>
        <h1 className="mt-4 text-5xl font-semibold">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">The path you followed may have been removed or is temporarily unavailable.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90">
          Return to home
        </Link>
      </div>
    </main>
  );
}
