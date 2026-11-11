"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-semibold">Unable to load Movie Memory</h1>
      <p role="alert" className="mt-4 text-slate-300">
        Something went wrong. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-6 rounded-lg bg-amber-200 px-4 py-2 text-slate-900"
      >
        Try again
      </button>
    </main>
  );
}
