"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  createdAt: string;
  user: { email: string };
  class?: { id: string; name: string } | null;
  _count: { submissions: number; exerciseTransactions: number };
}

export default function ExercisesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeacher = (session?.user as { role?: string })?.role === "TEACHER" || (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/exercises")
        .then((r) => r.json())
        .then(setExercises)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const difficultyBadge = (d: string) => {
    const colors: Record<string, string> = {
      EASY: "bg-success-light text-success",
      MEDIUM: "bg-warning-light text-warning",
      HARD: "bg-danger-light text-danger",
    };
    const labels: Record<string, string> = {
      EASY: "Snadné",
      MEDIUM: "Střední",
      HARD: "Těžké",
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[d] || ""}`}>
        {labels[d] || d}
      </span>
    );
  };

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
        <h1 className="text-2xl font-bold text-foreground">Cvičení</h1>
        {isTeacher && (
          <Link
            href="/exercises/new"
            className="bg-success text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors text-sm font-medium"
          >
            + Vytvořit cvičení
          </Link>
        )}
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <p className="text-muted text-lg">Žádná cvičení</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/exercises/${ex.id}`}
              className="block bg-white rounded-lg border border-border hover:border-accent/30 hover:shadow-sm transition-all p-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{ex.title}</h2>
                  <p className="mt-1 text-sm text-muted line-clamp-2">{ex.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                    <span>Autor: {ex.user.email}</span>
                    {ex.class && (
                      <>
                        <span>·</span>
                        <span>Třída: {ex.class.name}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{new Date(ex.createdAt).toLocaleDateString("cs-CZ")}</span>
                    <span>·</span>
                    <span>{ex._count.exerciseTransactions} transakcí</span>
                    <span>·</span>
                    <span>{ex._count.submissions} odevzdání</span>
                  </div>
                </div>
                <div>{difficultyBadge(ex.difficulty)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
