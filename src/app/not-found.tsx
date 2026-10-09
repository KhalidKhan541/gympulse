import Link from "next/link";
import { Dumbbell, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b0f07] via-[#12180c] to-[#0b0f07] px-6 text-center">
      {/* Glow accents */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gp-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-gp-400/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(163,230,53,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 max-w-lg">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-gp-400/30 bg-gp-500/10 shadow-[0_0_40px_rgba(132,204,22,0.25)]">
          <Dumbbell className="h-10 w-10 text-gp-400" aria-hidden />
        </div>

        <p className="font-mono text-sm font-semibold uppercase tracking-[0.35em] text-gp-400">
          Error 404
        </p>

        <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
          Rest day,{" "}
          <span className="bg-gradient-to-r from-gp-300 to-gp-500 bg-clip-text text-transparent">
            page
          </span>
          <br />
          not found
        </h1>

        <p className="mt-5 text-base leading-relaxed text-zinc-400">
          This set doesn&apos;t exist. The page you&apos;re looking for was
          moved, renamed, or never made it into the program.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gp-500 px-6 py-3 text-sm font-semibold text-[#10160a] transition hover:bg-gp-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gp-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f07]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-200 backdrop-blur transition hover:border-gp-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gp-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f07]"
          >
            <Search className="h-4 w-4" aria-hidden />
            Go to dashboard
          </Link>
        </div>

        <p className="mt-12 font-mono text-xs uppercase tracking-widest text-zinc-600">
          GymPulse — keep the streak alive
        </p>
      </div>
    </div>
  );
}
