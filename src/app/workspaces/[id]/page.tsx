"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
}

interface Entry {
  id: string;
  accountId: string;
  side: "MD" | "DAL";
  amount: string;
  description: string | null;
  account: Account;
}

interface Transaction {
  id: string;
  description: string;
  createdAt: string;
  entries: Entry[];
}

interface WorkspaceAccount {
  id: string;
  account: Account;
}

interface OpeningBalance {
  id: string;
  accountId: string;
  side: "MD" | "DAL";
  amount: string;
  account: Account;
}

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  exercise?: { id: string; title: string } | null;
  workspaceAccounts: WorkspaceAccount[];
  openingBalances: OpeningBalance[];
  transactions: Transaction[];
}

interface AllAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
}

interface EntryForm {
  accountId: string;
  side: "MD" | "DAL";
  amount: string;
  description: string;
}

export default function WorkspaceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allAccounts, setAllAccounts] = useState<AllAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showCreateTxn, setShowCreateTxn] = useState(false);
  const [showOpeningBalance, setShowOpeningBalance] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${id}`);
    if (res.ok) {
      const data = await res.json();
      setWorkspace(data);
    }
  }, [id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch(`/api/workspaces/${id}`).then((r) => r.json()),
        fetch("/api/accounts").then((r) => r.json()),
      ]).then(([ws, accs]) => {
        setWorkspace(ws);
        setAllAccounts(accs);
        setLoading(false);
      });
    }
  }, [status, router, id]);

  if (loading || !workspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Načítání...</p>
      </div>
    );
  }

  const wsAccountIds = new Set(workspace.workspaceAccounts.map((wa) => wa.account.id));
  const availableAccounts = allAccounts.filter((a) => !wsAccountIds.has(a.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/workspaces" className="text-sm text-blue-600 hover:underline">
            ← Zpět na prostory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">{workspace.name}</h1>
          {workspace.exercise && (
            <p className="text-sm text-muted mt-1">
              Cvičení: <Link href={`/exercises/${workspace.exercise.id}`} className="text-accent hover:underline">{workspace.exercise.title}</Link>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowOpeningBalance(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 text-sm"
          >
            PZ
          </button>
          <button
            onClick={() => setShowAddAccount(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            + Přidat účet
          </button>
          <button
            onClick={() => setShowCreateTxn(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            + Nová transakce
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-900 font-bold">×</button>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <AddAccountModal
          accounts={availableAccounts}
          workspaceId={id}
          onClose={() => setShowAddAccount(false)}
          onAdded={() => {
            setShowAddAccount(false);
            loadWorkspace();
          }}
        />
      )}

      {/* Create Transaction Modal */}
      {showCreateTxn && (
        <CreateTransactionModal
          workspaceAccounts={workspace.workspaceAccounts}
          workspaceId={id}
          onClose={() => setShowCreateTxn(false)}
          onCreated={() => {
            setShowCreateTxn(false);
            loadWorkspace();
          }}
          setError={setError}
        />
      )}

      {/* Opening Balance Modal */}
      {showOpeningBalance && (
        <OpeningBalanceModal
          workspaceAccounts={workspace.workspaceAccounts}
          openingBalances={workspace.openingBalances}
          workspaceId={id}
          onClose={() => setShowOpeningBalance(false)}
          onUpdated={() => {
            loadWorkspace();
          }}
        />
      )}

      {/* T-Accounts Grid */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">T-účty</h2>
      {workspace.workspaceAccounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Přidejte účty z účtové osnovy pro zobrazení T-účtů
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {workspace.workspaceAccounts.map((wa) => (
            <TAccount
              key={wa.id}
              account={wa.account}
              entries={workspace.transactions.flatMap((t) =>
                t.entries
                  .filter((e) => e.accountId === wa.account.id)
                  .map((e) => ({ ...e, txnDescription: t.description, txnDate: t.createdAt }))
              )}
              openingBalance={workspace.openingBalances.find((ob) => ob.accountId === wa.account.id)}
              workspaceId={id}
              onRemoved={loadWorkspace}
            />
          ))}
        </div>
      )}

      {/* Transactions List */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Transakce ({workspace.transactions.length})
      </h2>
      {workspace.transactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Žádné transakce
        </div>
      ) : (
        <div className="space-y-4">
          {workspace.transactions.map((txn) => (
            <div key={txn.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">{txn.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(txn.createdAt).toLocaleString("cs-CZ")}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Neměnné
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">MD (Má dáti)</p>
                  {txn.entries
                    .filter((e) => e.side === "MD")
                    .map((e) => (
                      <div key={e.id} className="text-sm text-gray-700 flex justify-between">
                        <span>{e.account.code} - {e.account.name}</span>
                        <span className="font-mono">{formatAmount(e.amount)}</span>
                      </div>
                    ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">Dal</p>
                  {txn.entries
                    .filter((e) => e.side === "DAL")
                    .map((e) => (
                      <div key={e.id} className="text-sm text-gray-700 flex justify-between">
                        <span>{e.account.code} - {e.account.name}</span>
                        <span className="font-mono">{formatAmount(e.amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAmount(amount: string | number): string {
  return Number(amount).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TAccount({
  account,
  entries,
  openingBalance,
  workspaceId,
  onRemoved,
}: {
  account: Account;
  entries: Array<Entry & { txnDescription: string; txnDate: string }>;
  openingBalance?: OpeningBalance;
  workspaceId: string;
  onRemoved: () => void;
}) {
  const mdEntries = entries.filter((e) => e.side === "MD");
  const dalEntries = entries.filter((e) => e.side === "DAL");

  const obMD = openingBalance && openingBalance.side === "MD" ? Number(openingBalance.amount) : 0;
  const obDAL = openingBalance && openingBalance.side === "DAL" ? Number(openingBalance.amount) : 0;

  const totalMD = mdEntries.reduce((sum, e) => sum + Number(e.amount), 0) + obMD;
  const totalDal = dalEntries.reduce((sum, e) => sum + Number(e.amount), 0) + obDAL;
  const balance = totalMD - totalDal;
  const balanceSide = balance >= 0 ? "MD" : "Dal";

  const typeLabels: Record<string, string> = {
    ASSET: "Aktivum",
    LIABILITY: "Pasivum",
    EQUITY: "Vlastní kapitál",
    REVENUE: "Výnos",
    EXPENSE: "Náklad",
  };

  async function removeAccount() {
    if (!confirm("Odebrat účet z pracovního prostoru?")) return;
    await fetch(`/api/workspaces/${workspaceId}/accounts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: account.id }),
    });
    onRemoved();
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <div>
          <span className="font-bold">{account.code}</span>
          <span className="ml-2">{account.name}</span>
        </div>
        <button onClick={removeAccount} className="text-gray-400 hover:text-red-300 text-xs">
          ×
        </button>
      </div>
      <div className="px-4 py-1 bg-gray-100 text-xs text-gray-500 flex justify-between">
        <span>{typeLabels[account.type] || account.type}</span>
        <span>Normální strana: {account.normalBalance}</span>
      </div>

      {/* T-Account Body */}
      <div className="grid grid-cols-2 divide-x min-h-[120px]">
        {/* MD Side */}
        <div className="p-3">
          <p className="text-xs font-bold text-blue-700 mb-2 text-center border-b pb-1">MD</p>
          <div className="space-y-1">
            {obMD > 0 && (
              <div className="text-xs flex justify-between text-amber-700 font-medium">
                <span>PZ (poč. zůst.)</span>
                <span className="font-mono">{formatAmount(obMD)}</span>
              </div>
            )}
            {mdEntries.map((e) => (
              <div key={e.id} className="text-xs flex justify-between">
                <span className="text-gray-500 truncate max-w-[60%]">{e.txnDescription}</span>
                <span className="font-mono text-gray-900">{formatAmount(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Dal Side */}
        <div className="p-3">
          <p className="text-xs font-bold text-red-700 mb-2 text-center border-b pb-1">Dal</p>
          <div className="space-y-1">
            {obDAL > 0 && (
              <div className="text-xs flex justify-between text-amber-700 font-medium">
                <span>PZ (poč. zůst.)</span>
                <span className="font-mono">{formatAmount(obDAL)}</span>
              </div>
            )}
            {dalEntries.map((e) => (
              <div key={e.id} className="text-xs flex justify-between">
                <span className="text-gray-500 truncate max-w-[60%]">{e.txnDescription}</span>
                <span className="font-mono text-gray-900">{formatAmount(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Totals & Balance */}
      <div className="border-t bg-gray-50 px-4 py-2">
        <div className="grid grid-cols-2 divide-x text-xs">
          <div className="pr-2 text-right">
            <span className="text-gray-500">Celkem MD: </span>
            <span className="font-mono font-bold">{formatAmount(totalMD)}</span>
          </div>
          <div className="pl-2 text-right">
            <span className="text-gray-500">Celkem Dal: </span>
            <span className="font-mono font-bold">{formatAmount(totalDal)}</span>
          </div>
        </div>
        <div className="text-center mt-1 text-sm font-semibold">
          Zůstatek: {formatAmount(Math.abs(balance))} ({balanceSide})
        </div>
      </div>
    </div>
  );
}

function AddAccountModal({
  accounts,
  workspaceId,
  onClose,
  onAdded,
}: {
  accounts: AllAccount[];
  workspaceId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = accounts.filter(
    (a) =>
      a.code.includes(search) ||
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  async function addAccount(accountId: string) {
    setLoading(true);
    await fetch(`/api/workspaces/${workspaceId}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    setLoading(false);
    onAdded();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Přidat účet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Hledat podle kódu nebo názvu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Žádné dostupné účty</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => addAccount(a.id)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded border hover:bg-blue-50 hover:border-blue-300 transition flex justify-between items-center disabled:opacity-50"
                >
                  <div>
                    <span className="font-mono font-bold text-gray-900">{a.code}</span>
                    <span className="ml-2 text-gray-700">{a.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{a.normalBalance}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateTransactionModal({
  workspaceAccounts,
  workspaceId,
  onClose,
  onCreated,
  setError,
}: {
  workspaceAccounts: WorkspaceAccount[];
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
  setError: (msg: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<EntryForm[]>([
    { accountId: "", side: "MD", amount: "", description: "" },
    { accountId: "", side: "DAL", amount: "", description: "" },
  ]);
  const [loading, setLoading] = useState(false);

  function updateEntry(index: number, field: keyof EntryForm, value: string) {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  }

  function addEntry() {
    setEntries([...entries, { accountId: "", side: "MD", amount: "", description: "" }]);
  }

  function removeEntry(index: number) {
    if (entries.length <= 2) return;
    setEntries(entries.filter((_, i) => i !== index));
  }

  const totalMD = entries
    .filter((e) => e.side === "MD")
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalDal = entries
    .filter((e) => e.side === "DAL")
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const isBalanced = totalMD > 0 && totalMD === totalDal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, description, entries }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Chyba při vytváření transakce");
    } else {
      onCreated();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Nová transakce</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Popis transakce</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="např. Nákup materiálu za hotové"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Položky</label>
              <button
                type="button"
                onClick={addEntry}
                className="text-sm text-blue-600 hover:underline"
              >
                + Přidat položku
              </button>
            </div>

            <div className="space-y-3">
              {entries.map((entry, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={entry.accountId}
                      onChange={(e) => updateEntry(i, "accountId", e.target.value)}
                      required
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Vyberte účet</option>
                      {workspaceAccounts.map((wa) => (
                        <option key={wa.account.id} value={wa.account.id}>
                          {wa.account.code} - {wa.account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <select
                      value={entry.side}
                      onChange={(e) => updateEntry(i, "side", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      <option value="MD">MD</option>
                      <option value="DAL">Dal</option>
                    </select>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={entry.amount}
                      onChange={(e) => updateEntry(i, "amount", e.target.value)}
                      required
                      placeholder="Částka"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right font-mono"
                    />
                  </div>
                  {entries.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      className="text-red-400 hover:text-red-600 px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Balance indicator */}
          <div className={`p-3 rounded-lg text-sm font-medium ${
            isBalanced
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
          }`}>
            <div className="flex justify-between">
              <span>Celkem MD: {formatAmount(totalMD)}</span>
              <span>Celkem Dal: {formatAmount(totalDal)}</span>
            </div>
            {!isBalanced && totalMD > 0 && (
              <p className="mt-1 text-xs">⚠ MD a Dal se musí rovnat</p>
            )}
            {isBalanced && <p className="mt-1 text-xs">✓ Transakce je vyvážená</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !isBalanced}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Vytváření..." : "Vytvořit transakci"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Zrušit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OpeningBalanceModal({
  workspaceAccounts,
  openingBalances,
  workspaceId,
  onClose,
  onUpdated,
}: {
  workspaceAccounts: WorkspaceAccount[];
  openingBalances: OpeningBalance[];
  workspaceId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [side, setSide] = useState<"MD" | "DAL">("MD");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const obMap = new Map(openingBalances.map((ob) => [ob.accountId, ob]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/workspaces/${workspaceId}/opening-balances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, side, amount }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Chyba");
    } else {
      setAccountId("");
      setAmount("");
      onUpdated();
    }
  }

  async function removeBalance(accId: string) {
    await fetch(`/api/workspaces/${workspaceId}/opening-balances`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: accId }),
    });
    onUpdated();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Počáteční zůstatky (PZ)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {openingBalances.length > 0 && (
            <div className="mb-4 space-y-2">
              {openingBalances.map((ob) => (
                <div key={ob.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-md border border-amber-200">
                  <div>
                    <span className="font-mono font-bold text-sm">{ob.account.code}</span>
                    <span className="ml-2 text-sm text-gray-700">{ob.account.name}</span>
                    <span className={`ml-2 text-xs font-medium ${ob.side === "MD" ? "text-blue-700" : "text-red-700"}`}>
                      {ob.side}
                    </span>
                    <span className="ml-2 font-mono text-sm">{formatAmount(ob.amount)}</span>
                  </div>
                  <button
                    onClick={() => removeBalance(ob.accountId)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  const existing = obMap.get(e.target.value);
                  if (existing) {
                    setSide(existing.side);
                    setAmount(String(Number(existing.amount)));
                  }
                }}
                required
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Vyberte účet</option>
                {workspaceAccounts.map((wa) => (
                  <option key={wa.account.id} value={wa.account.id}>
                    {wa.account.code} - {wa.account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as "MD" | "DAL")}
                className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="MD">MD</option>
                <option value="DAL">Dal</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="Částka"
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm text-right font-mono"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? "..." : obMap.has(accountId) ? "Aktualizovat PZ" : "Nastavit PZ"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Zavřít
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
