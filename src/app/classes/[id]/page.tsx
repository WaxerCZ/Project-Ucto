"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ClassDetail {
  id: string;
  name: string;
  createdAt: string;
  teacher: { id: string; email: string };
  members: Array<{
    id: string;
    joinedAt: string;
    student: { id: string; email: string };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    token: string;
    status: string;
    createdAt: string;
  }>;
  exercises: Array<{
    id: string;
    title: string;
    difficulty: string;
    createdAt: string;
  }>;
}

export default function ClassDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const role = (session?.user as { role?: string })?.role;
  const isTeacher = role === "TEACHER" || role === "ADMIN";

  const loadClass = useCallback(async () => {
    const res = await fetch(`/api/classes/${id}`);
    if (res.ok) {
      setCls(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadClass();
    }
  }, [status, router, loadClass]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviting(true);

    const res = await fetch(`/api/classes/${id}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });

    const data = await res.json();
    setInviting(false);

    if (!res.ok) {
      setError(data.error || "Chyba");
    } else {
      setInviteEmail("");
      loadClass();
    }
  }

  async function removeMember(studentId: string) {
    if (!confirm("Odebrat studenta z třídy?")) return;
    await fetch(`/api/classes/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    loadClass();
  }

  async function deleteClass() {
    if (!confirm("Opravdu smazat třídu? Tato akce je nevratná.")) return;
    const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/classes");
    }
  }

  const difficultyLabels: Record<string, string> = {
    EASY: "Snadné",
    MEDIUM: "Střední",
    HARD: "Těžké",
  };

  if (loading || !cls) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted text-sm">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/classes" className="text-sm text-accent hover:underline">
        ← Zpět na třídy
      </Link>

      <div className="mt-4 bg-white rounded-lg border border-border p-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-foreground">{cls.name}</h1>
            <p className="mt-1 text-sm text-muted">Učitel: {cls.teacher.email}</p>
            <p className="mt-1 text-xs text-muted">
              Vytvořeno: {new Date(cls.createdAt).toLocaleDateString("cs-CZ")}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={deleteClass}
              className="text-sm text-danger hover:opacity-80"
            >
              Smazat třídu
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Members */}
      <div className="mt-6 bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Studenti ({cls.members.length})
        </h2>
        {cls.members.length === 0 ? (
          <p className="text-muted text-sm">Žádní studenti</p>
        ) : (
          <div className="space-y-2">
            {cls.members.map((m) => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm text-foreground">{m.student.email}</p>
                  <p className="text-xs text-muted">
                    Připojen: {new Date(m.joinedAt).toLocaleDateString("cs-CZ")}
                  </p>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => removeMember(m.student.id)}
                    className="text-xs text-danger hover:opacity-80"
                  >
                    Odebrat
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite */}
      {isTeacher && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Pozvat studenta</h2>
          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="E-mail studenta"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="bg-accent text-white px-5 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {inviting ? "..." : "Pozvat"}
            </button>
          </form>
        </div>
      )}

      {/* Invitations */}
      {isTeacher && cls.invitations.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Pozvánky ({cls.invitations.length})
          </h2>
          <div className="space-y-2">
            {cls.invitations.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted font-mono">Token: {inv.token}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    inv.status === "ACCEPTED"
                      ? "bg-success-light text-success"
                      : "bg-warning-light text-warning"
                  }`}
                >
                  {inv.status === "ACCEPTED" ? "Přijato" : "Čeká"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="mt-6 bg-white rounded-lg border border-border p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Cvičení ({cls.exercises.length})
          </h2>
          {isTeacher && (
            <Link href="/exercises/new" className="text-sm text-accent hover:underline">
              + Vytvořit cvičení
            </Link>
          )}
        </div>
        {cls.exercises.length === 0 ? (
          <p className="text-muted text-sm">Žádná cvičení</p>
        ) : (
          <div className="space-y-2">
            {cls.exercises.map((ex) => (
              <Link
                key={ex.id}
                href={`/exercises/${ex.id}`}
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{ex.title}</span>
                  <span className="text-xs text-muted">{difficultyLabels[ex.difficulty] || ex.difficulty}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
