"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function JoinContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/join?token=${encodeURIComponent(token)}`);
    }
  }, [status, router, token]);

  async function acceptInvitation() {
    if (!token) {
      setError("Chybí token pozvánky");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Chyba při přijímání pozvánky");
    } else {
      setMessage(data.message);
      setClassName(data.class?.name || "");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-muted">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="max-w-sm w-full bg-white rounded-lg border border-border p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-4">Pozvánka do třídy</h1>

        {error && (
          <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
            {error}
          </div>
        )}

        {message ? (
          <div className="space-y-4">
            <div className="p-4 bg-success-light border border-green-200 rounded-lg">
              <p className="text-success font-medium">{message}</p>
              {className && <p className="text-sm text-muted mt-1">Třída: {className}</p>}
            </div>
            <Link
              href="/classes"
              className="inline-block bg-accent text-white px-6 py-2 rounded-md hover:bg-accent-hover text-sm font-medium transition-colors"
            >
              Přejít na třídy
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {token ? (
              <>
                <p className="text-sm text-muted">
                  Klikněte pro přijetí pozvánky a připojení do třídy.
                </p>
                <button
                  onClick={acceptInvitation}
                  disabled={loading}
                  className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {loading ? "Přijímání..." : "Přijmout pozvánku"}
                </button>
              </>
            ) : (
              <p className="text-sm text-danger">
                Neplatný odkaz — chybí token pozvánky.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center"><p className="text-muted">Načítání...</p></div>}>
      <JoinContent />
    </Suspense>
  );
}
