"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Submission {
  id: string;
  score: string | null;
  isCorrect: boolean | null;
  submittedAt: string;
  exercise: { title: string; difficulty: string };
  student: { email: string };
}

export default function SubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeacher = (session?.user as { role?: string })?.role === "TEACHER" || (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/submissions")
        .then((r) => r.json())
        .then(setSubmissions)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-muted text-sm">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Odevzdání</h1>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <p className="text-muted text-lg">Žádná odevzdání</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Cvičení
                </th>
                {isTeacher && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Student
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Skóre
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Výsledek
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground">
                    {sub.exercise.title}
                  </td>
                  {isTeacher && (
                    <td className="px-5 py-3 text-sm text-muted">
                      {sub.student.email}
                    </td>
                  )}
                  <td className="px-5 py-3 text-sm font-medium font-tabular">
                    {sub.score !== null ? `${Number(sub.score).toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {sub.isCorrect !== null && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          sub.isCorrect
                            ? "bg-success-light text-success"
                            : "bg-danger-light text-danger"
                        }`}
                      >
                        {sub.isCorrect ? "Správně" : "Nesprávně"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">
                    {new Date(sub.submittedAt).toLocaleString("cs-CZ")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/submissions/${sub.id}`}
                      className="text-accent hover:underline text-sm"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
