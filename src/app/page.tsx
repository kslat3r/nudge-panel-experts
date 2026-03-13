"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "submitted" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [jobId, setJobId] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setJobId(data.jobId);
      setStatus("submitted");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-black">
      <main className="w-full max-w-lg px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nudge Panel
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Six AI experts analyse your landing page and tell you exactly
            what&apos;s not working — and why.
          </p>
        </div>

        {status === "submitted" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950">
            <div className="mb-4 text-4xl">&#9989;</div>
            <h2 className="mb-2 text-xl font-semibold text-emerald-900 dark:text-emerald-100">
              Analysis Queued
            </h2>
            <p className="text-emerald-700 dark:text-emerald-300">
              Our panel of experts is reviewing your landing page. You&apos;ll
              receive the report at <strong>{email}</strong> shortly.
            </p>
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              Job ID: {jobId}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="url"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Landing Page URL
              </label>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/landing-page"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
            </div>

            {status === "error" && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting"
                ? "Submitting..."
                : "Analyse My Landing Page"}
            </button>
          </form>
        )}

        <div className="mt-12 grid grid-cols-3 gap-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
          <div>
            <div className="mb-1 text-lg">&#129504;</div>
            Behavioural Science
          </div>
          <div>
            <div className="mb-1 text-lg">&#127912;</div>
            Design & UX
          </div>
          <div>
            <div className="mb-1 text-lg">&#9997;&#65039;</div>
            Copywriting
          </div>
        </div>
      </main>
    </div>
  );
}
