"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
  createdAt: string;
  teacher: { email: string };
  _count: { members: number; exercises: number; invitations?: number };
}

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const role = (session?.user as { role?: string })?.role;
  const isTeacher = role === "TEACHER" || role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadClasses();
    }
  }, [status, router]);

  async function loadClasses() {
    const res = await fetch("/api/classes");
    if (res.ok) {
      setClasses(await res.json());
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error || "Chyba");
    } else {
      setNewName("");
      setShowCreate(false);
      loadClasses();
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-muted text-sm">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Třídy</h1>
        {isTeacher && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
          >
            + Vytvořit třídu
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
        </div>
      )}

      {showCreate && (
        <div className="mb-6 bg-white rounded-lg border border-border p-5">
          <form onSubmit={handleCreate} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">Název třídy</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="např. Účetnictví 1A"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-accent text-white px-5 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {creating ? "..." : "Vytvořit"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-gray-50 text-sm transition-colors"
            >
              Zrušit
            </button>
          </form>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <p className="text-muted text-lg">
            {isTeacher ? "Nemáte žádné třídy" : "Nejste členem žádné třídy"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/classes/${cls.id}`}
              className="block bg-white rounded-lg border border-border hover:border-accent/30 hover:shadow-sm transition-all p-5"
            >
              <h2 className="text-base font-semibold text-foreground">{cls.name}</h2>
              <p className="mt-1 text-xs text-muted">Učitel: {cls.teacher.email}</p>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted">
                <span>{cls._count.members} studentů</span>
                <span>·</span>
                <span>{cls._count.exercises} cvičení</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {new Date(cls.createdAt).toLocaleDateString("cs-CZ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
