export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-16">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Agent Stack
        </h1>
        <p className="max-w-md text-center text-lg text-zinc-600 dark:text-zinc-400">
          Mastra + Next.js + PostgreSQL (pgvector) + Langfuse
        </p>
      </main>
    </div>
  );
}
