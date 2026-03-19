"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  active: boolean;
  createdAt: string;
  _count: {
    workspaces: number;
    submissions: number;
    exercises: number;
    teacherClasses: number;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      if (role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      loadUsers();
    }
  }, [status, session, router]);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  async function updateUser(userId: string, data: { role?: string; active?: boolean }) {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    if (res.ok) {
      loadUsers();
    } else {
      const d = await res.json();
      setError(d.error || "Chyba");
    }
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-700",
      TEACHER: "bg-purple-100 text-purple-700",
      STUDENT: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
      ADMIN: "Admin",
      TEACHER: "Učitel",
      STUDENT: "Student",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[role] || ""}`}>
        {labels[role] || role}
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
        <h1 className="text-2xl font-bold text-foreground">Správa uživatelů</h1>
        <button
          onClick={() => setShowCreateTeacher(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          + Vytvořit učitele
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
        </div>
      )}

      {showCreateTeacher && (
        <CreateTeacherModal
          onClose={() => setShowCreateTeacher(false)}
          onCreated={() => {
            setShowCreateTeacher(false);
            loadUsers();
          }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Celkem</p>
          <p className="text-2xl font-bold text-foreground font-tabular">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Učitelé</p>
          <p className="text-2xl font-bold text-purple-700 font-tabular">
            {users.filter((u) => u.role === "TEACHER").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Studenti</p>
          <p className="text-2xl font-bold text-blue-700 font-tabular">
            {users.filter((u) => u.role === "STUDENT").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">E-mail</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Stav</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Statistiky</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Registrace</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.active ? "opacity-50" : ""}`}>
                <td className="px-5 py-3 text-sm text-foreground">{u.email}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    className="rounded border border-border px-2 py-1 text-xs bg-white"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Učitel</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => updateUser(u.id, { active: !u.active })}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.active ? "bg-success-light text-success" : "bg-danger-light text-danger"
                    }`}
                  >
                    {u.active ? "Aktivní" : "Neaktivní"}
                  </button>
                </td>
                <td className="px-5 py-3 text-xs text-muted">
                  {u._count.workspaces}P · {u._count.submissions}O · {u._count.exercises}C · {u._count.teacherClasses}T
                </td>
                <td className="px-5 py-3 text-xs text-muted">
                  {new Date(u.createdAt).toLocaleDateString("cs-CZ")}
                </td>
                <td className="px-5 py-3">{roleBadge(u.role)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateTeacherModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Chyba");
    } else {
      onCreated();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Vytvořit účet učitele</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-xl">×</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-5 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? "Vytváření..." : "Vytvořit učitele"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-gray-50 text-sm transition-colors"
            >
              Zrušit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
