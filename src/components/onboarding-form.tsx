"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { ArrowRight, LoaderCircle } from "lucide-react";
export function OnboardingForm() {
  const [movie, setMovie] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const pending = useRef(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await api.updateMovie(movie);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Something went wrong.",
      );
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-10">
      <label
        htmlFor="movie"
        className="mb-3 block text-sm font-medium text-slate-200"
      >
        Your favorite movie
      </label>
      <input
        id="movie"
        name="movie"
        autoComplete="off"
        minLength={2}
        maxLength={120}
        value={movie}
        onChange={(e) => setMovie(e.target.value)}
        required
        placeholder="e.g. Interstellar"
        className="focus-ring w-full rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-base text-white outline-none placeholder:text-slate-600"
      />
      <p className="mt-2 text-xs text-slate-500">
        You can always change this later.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      <button
        disabled={saving}
        type="submit"
        className="focus-ring mt-7 inline-flex cursor-pointer items-center gap-3 rounded-xl bg-[#efc27d] px-7 py-4 text-sm font-bold text-[#21170d] hover:bg-[#ffdda1] disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <ArrowRight size={17} />
        )}{" "}
        {saving ? "Saving..." : "Create my memory"}
      </button>
    </form>
  );
}
