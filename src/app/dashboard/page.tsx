import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const role = (user as { role?: string }).role;
  const isTeacher = role === "TEACHER";

  const [workspaceCount, submissionCount, exerciseCount] = await Promise.all([
    prisma.workspace.count({ where: { userId: user.id } }),
    prisma.submission.count({ where: { studentId: user.id } }),
    role === "TEACHER"
      ? prisma.exercise.count({ where: { createdBy: user.id } })
      : prisma.exercise.count(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Přehled</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <DashboardCard
          title="Pracovní prostory"
          count={workspaceCount}
          href="/workspaces"
          color="accent"
        />
        <DashboardCard
          title={isTeacher ? "Moje cvičení" : "Dostupná cvičení"}
          count={exerciseCount}
          href="/exercises"
          color="success"
        />
        <DashboardCard
          title="Odevzdání"
          count={submissionCount}
          href="/submissions"
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Rychlé akce</h2>
          <div className="space-y-2">
            <Link
              href="/workspaces/new"
              className="block px-4 py-3 bg-accent-light text-accent rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              + Vytvořit nový pracovní prostor
            </Link>
            {isTeacher && (
              <Link
                href="/exercises/new"
                className="block px-4 py-3 bg-success-light text-success rounded-md hover:bg-green-100 transition-colors text-sm font-medium"
              >
                + Vytvořit nové cvičení
              </Link>
            )}
            <Link
              href="/exercises"
              className="block px-4 py-3 bg-warning-light text-warning rounded-md hover:bg-amber-100 transition-colors text-sm font-medium"
            >
              Procházet cvičení
            </Link>
            {isTeacher && (
              <Link
                href="/classes"
                className="block px-4 py-3 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                Správa tříd
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Jak začít</h2>
          <ol className="space-y-2 text-sm text-muted list-decimal list-inside">
            <li>Vytvořte pracovní prostor pro vaše účetní záznamy</li>
            <li>Přidejte účty z účtové osnovy do prostoru</li>
            <li>Vytvářejte transakce s položkami MD a Dal</li>
            <li>Sledujte zůstatky na T-účtech</li>
            {!isTeacher && (
              <li>Odevzdejte cvičení od učitele pro automatické hodnocení</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  count,
  href,
  color,
}: {
  title: string;
  count: number;
  href: string;
  color: "accent" | "success" | "warning";
}) {
  const colors = {
    accent: "bg-accent-light text-accent border-blue-200",
    success: "bg-success-light text-success border-green-200",
    warning: "bg-warning-light text-warning border-amber-200",
  };

  return (
    <Link
      href={href}
      className={`block rounded-lg border p-5 ${colors[color]} hover:shadow-md transition-colors`}
    >
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold font-tabular mt-1">{count}</p>
    </Link>
  );
}
