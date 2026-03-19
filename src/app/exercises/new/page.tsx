"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  code: string;
  name: string;
}

interface EntryForm {
  accountCode: string;
  side: "MD" | "DAL";
  amount: string;
}

interface TransactionForm {
  description: string;
  entries: EntryForm[];
}

interface ClassOption {
  id: string;
  name: string;
}

export default function NewExercisePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [classId, setClassId] = useState("");
  const [transactions, setTransactions] = useState<TransactionForm[]>([
    {
      description: "",
      entries: [
        { accountCode: "", side: "MD", amount: "" },
        { accountCode: "", side: "DAL", amount: "" },
      ],
    },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if ((session?.user as { role?: string })?.role !== "TEACHER") {
      router.push("/exercises");
      return;
    }
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts);
    fetch("/api/classes")
      .then((r) => r.json())
      .then(setClasses);
  }, [status, session, router]);

  function addTransaction() {
    setTransactions([
      ...transactions,
      {
        description: "",
        entries: [
          { accountCode: "", side: "MD", amount: "" },
          { accountCode: "", side: "DAL", amount: "" },
        ],
      },
    ]);
  }

  function removeTransaction(index: number) {
    if (transactions.length <= 1) return;
    setTransactions(transactions.filter((_, i) => i !== index));
  }

  function updateTransaction(index: number, field: string, value: string) {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
  }

  function addEntry(txnIndex: number) {
    const updated = [...transactions];
    updated[txnIndex].entries.push({ accountCode: "", side: "MD", amount: "" });
    setTransactions(updated);
  }

  function removeEntry(txnIndex: number, entryIndex: number) {
    if (transactions[txnIndex].entries.length <= 2) return;
    const updated = [...transactions];
    updated[txnIndex].entries = updated[txnIndex].entries.filter((_, i) => i !== entryIndex);
    setTransactions(updated);
  }

  function updateEntry(txnIndex: number, entryIndex: number, field: keyof EntryForm, value: string) {
    const updated = [...transactions];
    updated[txnIndex].entries[entryIndex] = {
      ...updated[txnIndex].entries[entryIndex],
      [field]: value,
    };
    setTransactions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        difficulty,
        classId: classId || undefined,
        expectedTransactions: transactions,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Chyba při vytváření cvičení");
    } else {
      router.push(`/exercises/${data.id}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">Vytvořit cvičení</h1>

      {error && (
        <div className="mb-4 p-3 bg-danger-light border border-red-200 text-danger rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Název cvičení</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Popis cvičení</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Obtížnost</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="EASY">Snadné</option>
              <option value="MEDIUM">Střední</option>
              <option value="HARD">Těžké</option>
            </select>
          </div>
          {classes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Třída (volitelné)</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Bez třídy</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Očekávané transakce</h2>
            <button
              type="button"
              onClick={addTransaction}
              className="text-sm text-accent hover:underline"
            >
              + Přidat transakci
            </button>
          </div>

          <div className="space-y-4">
            {transactions.map((txn, txnIndex) => (
              <div key={txnIndex} className="bg-white border border-border rounded-lg p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-foreground text-sm">Transakce {txnIndex + 1}</h3>
                  {transactions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTransaction(txnIndex)}
                      className="text-danger hover:opacity-80 text-sm"
                    >
                      Odebrat
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Popis</label>
                  <input
                    type="text"
                    value={txn.description}
                    onChange={(e) => updateTransaction(txnIndex, "description", e.target.value)}
                    required
                    className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-2">
                  {txn.entries.map((entry, entryIndex) => (
                    <div key={entryIndex} className="flex gap-2 items-center">
                      <select
                        value={entry.accountCode}
                        onChange={(e) => updateEntry(txnIndex, entryIndex, "accountCode", e.target.value)}
                        required
                        className="flex-1 rounded border border-border px-2 py-1.5 text-sm bg-white"
                      >
                        <option value="">Vyberte účet</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.code}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={entry.side}
                        onChange={(e) => updateEntry(txnIndex, entryIndex, "side", e.target.value)}
                        className="w-20 rounded border border-border px-2 py-1.5 text-sm bg-white"
                      >
                        <option value="MD">MD</option>
                        <option value="DAL">Dal</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={entry.amount}
                        onChange={(e) => updateEntry(txnIndex, entryIndex, "amount", e.target.value)}
                        required
                        placeholder="Částka"
                        className="w-28 rounded border border-border px-2 py-1.5 text-sm text-right font-mono font-tabular bg-white"
                      />
                      {txn.entries.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(txnIndex, entryIndex)}
                          className="text-danger hover:opacity-80"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addEntry(txnIndex)}
                    className="text-xs text-accent hover:underline mt-1"
                  >
                    + Přidat položku
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-success text-white px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? "Vytváření..." : "Vytvořit cvičení"}
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
