"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  createdAt: string;
  user: { email: string };
  exerciseTransactions?: Array<{
    id: string;
    expectedData: {
      description: string;
      entries: Array<{ accountCode: string; side: string; amount: string }>;
    };
  }>;
  submissions: Array<{
    id: string;
    score: string | null;
    isCorrect: boolean | null;
    submittedAt: string;
    student?: { email: string };
  }>;
}

interface Workspace {
  id: string;
  name: string;
}

export default function ExerciseDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; isCorrect: boolean; feedback: Array<{ details: string }> } | null>(null);

  const isTeacher = (session?.user as { role?: string })?.role === "TEACHER" || (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch(`/api/exercises/${id}`).then((r) => r.json()),
        fetch("/api/workspaces").then((r) => r.json()),
      ]).then(([ex, ws]) => {
        setExercise(ex);
        setWorkspaces(ws);
        setLoading(false);
      });
    }
  }, [status, router, id]);

  async function handleSubmit() {
    if (!selectedWorkspace) {
      setError("Vyberte pracovní prostor");
      return;
    }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: id,
        workspaceId: selectedWorkspace,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Chyba při odevzdání");
    } else {
      setResult({
        score: Number(data.score),
        isCorrect: data.isCorrect,
        feedback: data.feedback,
      });
    }
  }

  const difficultyLabels: Record<string, string> = {
    EASY: "Snadné",
    MEDIUM: "Střední",
    HARD: "Těžké",
  };

  if (loading || !exercise) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted text-sm">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/exercises" className="text-sm text-accent hover:underline">
        ← Zpět na cvičení
      </Link>

      <div className="mt-4 bg-white rounded-lg border border-border p-5">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold text-foreground">{exercise.title}</h1>
          <span className="text-sm text-muted">
            {difficultyLabels[exercise.difficulty] || exercise.difficulty}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted whitespace-pre-wrap">{exercise.description}</p>
        <div className="mt-3 text-xs text-muted">
          Autor: {exercise.user.email} | {new Date(exercise.createdAt).toLocaleDateString("cs-CZ")}
        </div>
      </div>

      {/* Teacher view - expected transactions */}
      {isTeacher && exercise.exerciseTransactions && exercise.exerciseTransactions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Očekávané transakce (pouze pro učitele)
          </h2>
          <div className="space-y-2">
            {exercise.exerciseTransactions.map((et, i) => (
              <div key={et.id} className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-foreground">
                  {i + 1}. {et.expectedData.description}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {et.expectedData.entries.map((entry, j) => (
                    <div key={j} className="text-xs text-muted">
                      <span className={entry.side === "MD" ? "text-md font-semibold" : "text-dal font-semibold"}>
                        {entry.side}
                      </span>{" "}
                      {entry.accountCode}: {Number(entry.amount).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher view - submissions list */}
      {isTeacher && exercise.submissions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Odevzdání studentů</h2>
          <div className="space-y-2">
            {exercise.submissions.map((sub) => (
              <Link
                key={sub.id}
                href={`/submissions/${sub.id}`}
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{sub.student?.email}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium font-tabular ${sub.isCorrect ? "text-success" : "text-danger"}`}>
                      {sub.score !== null ? `${Number(sub.score).toFixed(0)}%` : "—"}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(sub.submittedAt).toLocaleString("cs-CZ")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Student view - submit exercise */}
      {!isTeacher && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Odevzdat cvičení</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
              {error}
            </div>
          )}

          {result ? (
            <div className={`p-4 rounded-lg ${result.isCorrect ? "bg-success-light border border-green-200" : "bg-warning-light border border-amber-200"}`}>
              <p className="text-lg font-bold font-tabular">
                Skóre: {result.score.toFixed(0)}%
                {result.isCorrect ? " ✓ Správně!" : " — Nesprávně"}
              </p>
              <div className="mt-3 space-y-1">
                {result.feedback.map((f, i) => (
                  <p key={i} className="text-sm text-muted">{f.details}</p>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted mb-4">
                Vyberte pracovní prostor s vašimi transakcemi a odevzdejte k hodnocení.
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">Pracovní prostor</label>
                  <select
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Vyberte prostor...</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedWorkspace}
                  className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {submitting ? "Odesílání..." : "Odevzdat"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Student's previous submissions */}
      {!isTeacher && exercise.submissions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Vaše odevzdání</h2>
          <div className="space-y-2">
            {exercise.submissions.map((sub) => (
              <Link
                key={sub.id}
                href={`/submissions/${sub.id}`}
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">
                    {new Date(sub.submittedAt).toLocaleString("cs-CZ")}
                  </span>
                  <span className={`font-medium font-tabular ${sub.isCorrect ? "text-success" : "text-danger"}`}>
                    {sub.score !== null ? `${Number(sub.score).toFixed(0)}%` : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
