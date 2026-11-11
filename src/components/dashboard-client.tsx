"use client";
import Image from "next/image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import type { Me, FactResponse } from "@/lib/contracts";
import { editReducer } from "@/lib/edit-state";
import { getFreshFact, type CachedFact } from "@/lib/fact-cache";
import {
  Sparkles,
  Pencil,
  Check,
  X,
  RefreshCw,
  Film,
  CalendarDays,
  Clapperboard,
  LoaderCircle,
  UserRound,
} from "lucide-react";

export function DashboardClient({
  user,
}: {
  user: Me & { favoriteMovie: string };
}) {
  const [edit, dispatch] = useReducer(editReducer, {
    movie: user.favoriteMovie,
    draft: user.favoriteMovie,
    editing: false,
    saving: false,
    error: null,
  });
  const [fact, setFact] = useState<FactResponse["fact"] | null>(null);
  const [factError, setFactError] = useState("");
  const [loading, setLoading] = useState(false);
  const cache = useRef<CachedFact | null>(null);
  const requests = useRef({
    id: 0,
    mounted: false,
    saving: false,
    controller: null as AbortController | null,
  });
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const movieRef = useRef(edit.movie);

  const loadFact = useCallback(async (movie: string, force = false) => {
    const state = requests.current;
    if (!state.mounted || state.saving) return;
    state.controller?.abort();
    const currentId = ++state.id;
    const cached = !force
      ? getFreshFact(cache.current, movie, Date.now())
      : null;
    if (cached) {
      setFact(cached);
      setFactError("");
      setLoading(false);
      return;
    }
    state.controller = new AbortController();
    setLoading(true);
    setFactError("");
    try {
      const result = await api.fact(state.controller.signal);
      if (
        !state.mounted ||
        currentId !== state.id ||
        movieRef.current !== movie
      )
        return;
      if (result.fact.movie !== movie) throw new Error("Movie changed");
      cache.current = { movie, savedAt: Date.now(), fact: result.fact };
      setFact(result.fact);
    } catch (err) {
      if (
        !state.mounted ||
        currentId !== state.id ||
        movieRef.current !== movie
      )
        return;
      const message =
        err instanceof ApiClientError ? err.message : "Could not load a fact.";
      setFactError(
        cache.current?.movie === movie
          ? `Could not refresh. Showing your last fact. ${message}`
          : message,
      );
    } finally {
      if (state.mounted && currentId === state.id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const state = requests.current;
    state.mounted = true;
    void loadFact(movieRef.current);
    // Reuse fresh trivia on focus; explicit refresh bypasses the cache.
    const onFocus = () => {
      void loadFact(movieRef.current);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      state.mounted = false;
      state.id++;
      state.controller?.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [loadFact]);

  async function saveMovie(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requests.current.saving) return;
    const nextMovie = edit.draft.trim();
    if (nextMovie.length < 2 || nextMovie.length > 120) {
      dispatch({
        type: "failure",
        previous: edit.movie,
        message: "Movie names must be 2–120 characters.",
      });
      return;
    }
    if (nextMovie === edit.movie) {
      dispatch({ type: "cancel" });
      return;
    }
    const previous = edit.movie;
    requests.current.saving = true;
    requests.current.controller?.abort();
    // Invalidate pending trivia before showing the optimistic title.
    requests.current.id++;
    cache.current = null;
    setFact(null);
    setFactError("");
    setLoading(false);
    movieRef.current = nextMovie;
    dispatch({ type: "save", movie: nextMovie });
    try {
      const result = await api.updateMovie(nextMovie);
      if (!requests.current.mounted) return;
      requests.current.saving = false;
      dispatch({ type: "success", movie: result.movie });
      movieRef.current = result.movie;
      void loadFact(result.movie);
    } catch (err) {
      if (!requests.current.mounted) return;
      requests.current.saving = false;
      requests.current.id++;
      movieRef.current = previous;
      cache.current = null;
      setFact(null);
      setLoading(false);
      dispatch({
        type: "failure",
        previous,
        message:
          err instanceof ApiClientError
            ? err.message
            : "Unable to save. Try again.",
      });
      void loadFact(previous);
    }
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="mb-11 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[.22em] text-amber-200 uppercase">
            Your personal collection
          </p>
          <h1 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            Welcome back,{" "}
            <span className="font-serif font-normal italic text-[#f0c27e]">
              {user.name?.trim()?.split(" ")[0] || "movie lover"}.
            </span>
          </h1>
          <p className="mt-4 text-sm text-slate-400">
            Every great movie is worth remembering.
          </p>
        </div>
        <div className="glass flex items-center gap-3 rounded-xl px-4 py-3">
          {user.image && failedImage !== user.image ? (
            <Image
              unoptimized
              width={44}
              height={44}
              onError={() => setFailedImage(user.image)}
              src={user.image}
              alt="Your Google profile"
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-slate-200">
              <UserRound size={21} />
            </div>
          )}
          <div>
            <p className="max-w-48 truncate text-sm font-medium text-white">
              {user.name || "Movie lover"}
            </p>
            <p className="max-w-48 truncate text-xs text-slate-400">
              {user.email || "Google account"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-7 py-5">
            <span className="text-xs font-semibold tracking-[.18em] text-slate-400 uppercase">
              The one you love
            </span>
            <Clapperboard className="text-amber-200/70" size={19} />
          </div>
          <div className="p-7 sm:p-9">
            <div className="flex h-44 items-center justify-center rounded-xl border border-amber-200/10 bg-gradient-to-br from-[#594638] via-[#303041] to-[#131721]">
              <Film size={62} className="text-amber-200/70" strokeWidth={1} />
            </div>
            <div className="mt-7">
              <p className="mb-3 text-xs font-medium tracking-widest text-amber-200 uppercase">
                Favorite movie
              </p>
              {edit.editing ? (
                <form onSubmit={saveMovie} className="space-y-3">
                  <label htmlFor="edit-movie" className="sr-only">
                    Edit favorite movie
                  </label>
                  <input
                    id="edit-movie"
                    autoFocus
                    minLength={2}
                    maxLength={120}
                    value={edit.draft}
                    onChange={(e) =>
                      dispatch({ type: "draft", value: e.target.value })
                    }
                    className="focus-ring w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-lg text-white outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={edit.saving}
                      type="submit"
                      className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#efc27d] px-4 py-2 text-sm font-bold text-[#20170e] disabled:opacity-50"
                    >
                      <Check size={15} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "cancel" })}
                      className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200"
                    >
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <h2 className="break-words text-3xl font-semibold tracking-tight">
                    {edit.movie}
                  </h2>
                  <button
                    disabled={edit.saving}
                    onClick={() => dispatch({ type: "start" })}
                    type="button"
                    aria-label="Edit favorite movie"
                    className="focus-ring inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              )}
              {edit.saving && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-xs text-amber-200"
                >
                  <LoaderCircle className="animate-spin" size={13} /> Saving
                  your movie...
                </p>
              )}
              {edit.error && (
                <p role="alert" className="mt-3 text-sm text-rose-300">
                  {edit.error}
                </p>
              )}
            </div>
            <div className="mt-8 flex items-center gap-2 border-t border-white/8 pt-5 text-xs text-slate-500">
              <CalendarDays size={14} /> Your favorite, saved just for you
            </div>
          </div>
        </section>
        <section className="glass flex min-h-[450px] flex-col rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-7 py-5">
            <span className="text-xs font-semibold tracking-[.18em] text-slate-400 uppercase">
              Behind the scenes
            </span>
            <Sparkles className="text-amber-200" size={19} />
          </div>
          <div className="flex flex-1 flex-col justify-between p-7 sm:p-9">
            <div>
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
                <Sparkles size={22} />
              </div>
              <p className="mb-3 text-xs font-medium tracking-widest text-amber-200 uppercase">
                Did you know?
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                A little movie magic.
              </h2>
              <div aria-live="polite" className="mt-7 min-h-28">
                {loading && (
                  <div
                    role="status"
                    className="flex items-center gap-3 text-sm text-slate-400"
                  >
                    <LoaderCircle size={18} className="animate-spin" /> Finding
                    a story worth telling...
                  </div>
                )}
                {!loading && fact && (
                  <p className="text-lg leading-relaxed text-slate-200">
                    {fact.text}
                  </p>
                )}
                {!loading && factError && (
                  <p
                    role="alert"
                    className="text-sm leading-relaxed text-rose-300"
                  >
                    {factError}
                  </p>
                )}
                {!loading && !fact && !factError && (
                  <p className="text-sm text-slate-400">
                    Your next fun fact is only a click away.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-10">
              <button
                type="button"
                onClick={() => void loadFact(edit.movie, true)}
                disabled={loading || edit.saving}
                className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200/25 bg-amber-200/10 px-5 py-3.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/20 disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Discover another fact
              </button>
              <p className="mt-3 text-xs text-slate-500">
                Generated with AI · A new surprise every time
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
