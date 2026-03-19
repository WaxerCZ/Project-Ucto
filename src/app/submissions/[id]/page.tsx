"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface SubmissionDetail {
  id: string;
  score: string | null;
  isCorrect: boolean | null;
  feedback: Array<{ expectedIndex: number; status: string; details: string }> | null;
  submittedAt: string;
  exercise: {
    title: string;
    description: string;
    exerciseTransactions?: Array<{
      expectedData: {
        description: string;
        entries: Array<{ accountCode: string; side: string; amount: string }>;
      };
    }>;
  };
  student: { email: string };
  workspace: {
    name: string;
    transactions: Array<{
      description: string;
      entries: Array<{
        side: string;
        amount: string;
        account: { code: string; name: string };
      }>;
    }>;
  };
}

export default function SubmissionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = (session?.user as { role?: string })?.role === "TEACHER" || (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch(`/api/submissions/${id}`)
        .then((r) => r.json())
        .then(setSubmission)
        .finally(() => setLoading(false));
    }
  }, [status, router, id]);

  if (loading || !submission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted text-sm">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/submissions" className="text-sm text-accent hover:underline">
        ← Zpět na odevzdání
      </Link>

      <div className="mt-4 bg-white rounded-lg border border-border p-5">
        <h1 className="text-xl font-bold text-foreground">{submission.exercise.title}</h1>
        <p className="mt-2 text-sm text-muted">{submission.exercise.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted uppercase">Student</p>
            <p className="text-sm font-medium text-foreground">{submission.student.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase">Datum odevzdání</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(submission.submittedAt).toLocaleString("cs-CZ")}
            </p>
          </div>
        </div>

        <div className={`mt-4 p-4 rounded-lg ${submission.isCorrect ? "bg-success-light border border-green-200" : "bg-danger-light border border-red-200"}`}>
          <p className="text-xl font-bold font-tabular">
            Skóre: {submission.score !== null ? `${Number(submission.score).toFixed(0)}%` : "—"}
            {submission.isCorrect ? " ✓" : " ✗"}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {submission.feedback && submission.feedback.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Zpětná vazba</h2>
          <div className="space-y-2">
            {submission.feedback.map((f, i) => (
              <div
                key={i}
                className={`p-3 rounded-md text-sm ${
                  f.status === "correct"
                    ? "bg-success-light text-success"
                    : "bg-danger-light text-danger"
                }`}
              >
                {f.details}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student's transactions */}
      <div className="mt-6 bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Transakce studenta ({submission.workspace.name})
        </h2>
        {submission.workspace.transactions.length === 0 ? (
          <p className="text-muted text-sm">Žádné transakce</p>
        ) : (
          <div className="space-y-2">
            {submission.workspace.transactions.map((txn, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-foreground">{txn.description}</p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-md">MD</p>
                    {txn.entries
                      .filter((e) => e.side === "MD")
                      .map((e, j) => (
                        <p key={j} className="text-xs text-muted">
                          {e.account.code} - {e.account.name}: {Number(e.amount).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}
                        </p>
                      ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dal">Dal</p>
                    {txn.entries
                      .filter((e) => e.side === "DAL")
                      .map((e, j) => (
                        <p key={j} className="text-xs text-muted">
                          {e.account.code} - {e.account.name}: {Number(e.amount).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expected transactions (teacher only) */}
      {isTeacher && submission.exercise.exerciseTransactions && (
        <div className="mt-6 bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Očekávané transakce
          </h2>
          <div className="space-y-2">
            {submission.exercise.exerciseTransactions.map((et, i) => (
              <div key={i} className="p-3 bg-accent-light rounded-md">
                <p className="text-sm font-medium text-foreground">{et.expectedData.description}</p>
                <div className="mt-2 space-y-1">
                  {et.expectedData.entries.map((entry, j) => (
                    <p key={j} className="text-xs text-muted">
                      <span className={entry.side === "MD" ? "text-md font-semibold" : "text-dal font-semibold"}>
                        {entry.side}
                      </span>{" "}
                      {entry.accountCode}: {Number(entry.amount).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
