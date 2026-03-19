"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push(`/workspaces/${data.id}`);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">
        Vytvořit pracovní prostor
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Název prostoru
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="např. Cvičení 1 - Základní transakce"
            className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white px-5 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? "Vytváření..." : "Vytvořit"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-gray-50 text-sm transition-colors"
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}
