import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { OnboardingForm } from "@/components/onboarding-form";
import { Sparkles } from "lucide-react";
export default async function Onboarding() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { favoriteMovie: true },
  });
  if (!user) redirect("/");
  if (user.favoriteMovie) redirect("/dashboard");
  return (
    <main className="movie-glow min-h-screen">
      <div className="mx-auto max-w-5xl px-6">
        <header className="border-b border-white/10 py-7">
          <Brand />
        </header>
        <div className="mx-auto flex min-h-[75vh] max-w-lg flex-col justify-center py-20">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
            <Sparkles size={25} />
          </div>
          <p className="mb-4 text-xs font-semibold tracking-[.25em] text-amber-200 uppercase">
            Step 01 · Make it yours
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-[-.05em]">
            What movie stays{" "}
            <span className="font-serif font-normal italic text-[#f0c27e]">
              with you?
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            We all have that one movie. Tell us yours to start your personal
            movie memory.
          </p>
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
