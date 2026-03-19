"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  _count: { transactions: number };
  workspaceAccounts: Array<{ account: { code: string; name: string } }>;
}

export default function WorkspacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/workspaces")
        .then((r) => r.json())
        .then(setWorkspaces)
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pracovní prostory</h1>
        <Link
          href="/workspaces/new"
          className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          + Vytvořit prostor
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <p className="text-muted text-lg">Nemáte žádné pracovní prostory</p>
          <Link
            href="/workspaces/new"
            className="mt-4 inline-block text-accent hover:underline text-sm"
          >
            Vytvořte svůj první prostor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="block bg-white rounded-lg border border-border hover:border-accent/30 hover:shadow-sm transition-all p-5"
            >
              <h2 className="text-base font-semibold text-foreground">{ws.name}</h2>
              <div className="mt-2 flex items-center gap-3 text-sm text-muted">
                <span>{ws.workspaceAccounts.length} účtů</span>
                <span>·</span>
                <span>{ws._count.transactions} transakcí</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {new Date(ws.createdAt).toLocaleDateString("cs-CZ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
