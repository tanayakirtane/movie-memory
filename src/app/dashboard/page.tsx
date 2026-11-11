import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { DashboardClient } from "@/components/dashboard-client";
export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      favoriteMovie: true,
    },
  });
  if (!user) redirect("/");
  if (!user.favoriteMovie) redirect("/onboarding");
  return (
    <main className="movie-glow min-h-screen">
      <div className="mx-auto max-w-6xl px-6">
        <header className="flex items-center justify-between border-b border-white/10 py-6">
          <Brand />
          <LogoutButton />
        </header>
        <DashboardClient
          user={{ ...user, favoriteMovie: user.favoriteMovie }}
        />
        <footer className="mt-16 border-t border-white/10 py-7 text-xs text-slate-500">
          Your story, one movie at a time.
        </footer>
      </div>
    </main>
  );
}
