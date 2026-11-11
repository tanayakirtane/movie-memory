import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { SignInButton } from "@/components/sign-in-button";
import { Film, Sparkles, Heart, ArrowUpRight } from "lucide-react";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  return (
    <main className="movie-glow min-h-screen overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <header className="flex items-center justify-between border-b border-white/10 py-7">
          <Brand />
          <span className="hidden text-xs tracking-[.2em] text-slate-500 uppercase sm:block">
            A home for your favorite films
          </span>
        </header>
        <section className="grid min-h-[75vh] items-center gap-16 py-20 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/5 px-4 py-2 text-xs font-medium tracking-widest text-amber-200 uppercase">
              <Sparkles size={13} /> Every film has a story
            </div>
            <h1 className="max-w-2xl text-6xl leading-[1.06] font-semibold tracking-[-.055em] sm:text-7xl">
              Great movies.
              <br />
              <span className="font-serif font-normal italic text-[#f0c27e]">
                Lasting memories.
              </span>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-slate-400">
              Your favorite movie deserves more than a spot on a list. Save the
              film you love, and discover fascinating trivia about it whenever
              you visit.
            </p>
            <div className="mt-10">
              <SignInButton />
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-rose-300">
                Google sign-in did not complete. Please try again.
              </p>
            )}
            <p className="mt-5 text-xs text-slate-500">
              Free to get started · Just your Google account
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-[2rem] bg-amber-500/5 blur-3xl" />
            <div className="glass relative overflow-hidden rounded-[1.75rem] p-7 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[.23em] text-amber-200 uppercase">
                  Your movie journal
                </span>
                <span className="text-xs text-slate-500">01 / ∞</span>
              </div>
              <div className="flex aspect-[1.45] items-center justify-center rounded-xl border border-amber-100/10 bg-gradient-to-br from-[#55443c] via-[#262737] to-[#141825]">
                <div className="text-center">
                  <Film
                    className="mx-auto mb-4 text-amber-200/70"
                    size={52}
                    strokeWidth={1}
                  />
                  <span className="text-xs tracking-[.3em] text-amber-100/60 uppercase">
                    The stories we keep
                  </span>
                </div>
              </div>
              <div className="mt-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    A film close to your heart
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Your next favorite fact
                  </h2>
                </div>
                <Heart className="mt-2 text-amber-300" size={20} />
              </div>
              <div className="mt-6 rounded-xl border border-white/8 bg-white/4 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-200">
                  <Sparkles size={14} /> Did you know?
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  Behind every unforgettable scene is a detail worth
                  discovering.
                </p>
              </div>
              <div className="mt-7 flex items-center gap-2 text-xs text-slate-500">
                Made for film lovers <ArrowUpRight size={13} />
              </div>
            </div>
          </div>
        </section>
        <footer className="border-t border-white/10 py-7 text-xs text-slate-500">
          Movie Memory · A little more magic after the credits.
        </footer>
      </div>
    </main>
  );
}
