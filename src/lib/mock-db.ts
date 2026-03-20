/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory mock database for demo mode.
 * Replaces Prisma – no external database needed.
 * Data resets on server restart (cold start).
 */

import { hashSync } from "bcryptjs";

// ─── ID generation ───────────────────────────────────────────
let _seq = 1000;
function cuid(): string {
  return `demo-${(++_seq).toString(36)}-${Date.now().toString(36)}`;
}
function now(): string {
  return new Date().toISOString();
}

// ─── Data stores ─────────────────────────────────────────────
const S: Record<string, any[]> = {
  users: [],
  accounts: [],
  workspaces: [],
  workspaceAccounts: [],
  openingBalances: [],
  transactions: [],
  entries: [],
  classes: [],
  classMembers: [],
  invitations: [],
  exercises: [],
  exerciseTransactions: [],
  submissions: [],
};

// ─── Relation map ────────────────────────────────────────────
interface Rel {
  store: string;
  type: "one" | "many";
  lk: string; // local key on the parent
  fk: string; // foreign key on the related store OR id if one
}

const REL: Record<string, Record<string, Rel>> = {
  users: {
    workspaces: { store: "workspaces", type: "many", lk: "id", fk: "userId" },
    transactions: { store: "transactions", type: "many", lk: "id", fk: "createdBy" },
    exercises: { store: "exercises", type: "many", lk: "id", fk: "createdBy" },
    submissions: { store: "submissions", type: "many", lk: "id", fk: "studentId" },
    teacherClasses: { store: "classes", type: "many", lk: "id", fk: "teacherId" },
    classMembers: { store: "classMembers", type: "many", lk: "id", fk: "studentId" },
  },
  accounts: {
    workspaceAccounts: { store: "workspaceAccounts", type: "many", lk: "id", fk: "accountId" },
    entries: { store: "entries", type: "many", lk: "id", fk: "accountId" },
    openingBalances: { store: "openingBalances", type: "many", lk: "id", fk: "accountId" },
  },
  workspaces: {
    user: { store: "users", type: "one", lk: "userId", fk: "id" },
    exercise: { store: "exercises", type: "one", lk: "exerciseId", fk: "id" },
    workspaceAccounts: { store: "workspaceAccounts", type: "many", lk: "id", fk: "workspaceId" },
    transactions: { store: "transactions", type: "many", lk: "id", fk: "workspaceId" },
    submissions: { store: "submissions", type: "many", lk: "id", fk: "workspaceId" },
    openingBalances: { store: "openingBalances", type: "many", lk: "id", fk: "workspaceId" },
  },
  workspaceAccounts: {
    workspace: { store: "workspaces", type: "one", lk: "workspaceId", fk: "id" },
    account: { store: "accounts", type: "one", lk: "accountId", fk: "id" },
  },
  openingBalances: {
    workspace: { store: "workspaces", type: "one", lk: "workspaceId", fk: "id" },
    account: { store: "accounts", type: "one", lk: "accountId", fk: "id" },
  },
  transactions: {
    workspace: { store: "workspaces", type: "one", lk: "workspaceId", fk: "id" },
    user: { store: "users", type: "one", lk: "createdBy", fk: "id" },
    entries: { store: "entries", type: "many", lk: "id", fk: "transactionId" },
  },
  entries: {
    transaction: { store: "transactions", type: "one", lk: "transactionId", fk: "id" },
    account: { store: "accounts", type: "one", lk: "accountId", fk: "id" },
  },
  classes: {
    teacher: { store: "users", type: "one", lk: "teacherId", fk: "id" },
    members: { store: "classMembers", type: "many", lk: "id", fk: "classId" },
    invitations: { store: "invitations", type: "many", lk: "id", fk: "classId" },
    exercises: { store: "exercises", type: "many", lk: "id", fk: "classId" },
  },
  classMembers: {
    class: { store: "classes", type: "one", lk: "classId", fk: "id" },
    student: { store: "users", type: "one", lk: "studentId", fk: "id" },
  },
  invitations: {
    class: { store: "classes", type: "one", lk: "classId", fk: "id" },
  },
  exercises: {
    user: { store: "users", type: "one", lk: "createdBy", fk: "id" },
    class: { store: "classes", type: "one", lk: "classId", fk: "id" },
    exerciseTransactions: { store: "exerciseTransactions", type: "many", lk: "id", fk: "exerciseId" },
    submissions: { store: "submissions", type: "many", lk: "id", fk: "exerciseId" },
    workspaces: { store: "workspaces", type: "many", lk: "id", fk: "exerciseId" },
  },
  exerciseTransactions: {
    exercise: { store: "exercises", type: "one", lk: "exerciseId", fk: "id" },
  },
  submissions: {
    exercise: { store: "exercises", type: "one", lk: "exerciseId", fk: "id" },
    student: { store: "users", type: "one", lk: "studentId", fk: "id" },
    workspace: { store: "workspaces", type: "one", lk: "workspaceId", fk: "id" },
  },
};

// ─── Where‑clause matching ───────────────────────────────────
function matchWhere(item: any, where: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const val = where[key];
    if (key === "OR") {
      if (!(val as any[]).some((c: any) => matchWhere(item, c))) return false;
    } else if (key === "AND") {
      if (!(val as any[]).every((c: any) => matchWhere(item, c))) return false;
    } else if (key === "NOT") {
      if (matchWhere(item, val)) return false;
    } else if (key === "members" && typeof val === "object" && "some" in val) {
      // Relation filter: { members: { some: { studentId: 'x' } } }
      const relStore = S.classMembers;
      const found = relStore.some(
        (m: any) => m.classId === item.id && matchWhere(m, val.some)
      );
      if (!found) return false;
    } else if (
      typeof val === "object" &&
      val !== null &&
      !Array.isArray(val)
    ) {
      if ("in" in val) {
        if (!val.in.includes(item[key])) return false;
      } else if ("contains" in val) {
        if (!String(item[key] ?? "").includes(val.contains)) return false;
      } else {
        // Compound key expansion: classId_studentId -> { classId, studentId }
        const subKeys = Object.keys(val);
        for (const sk of subKeys) {
          if (item[sk] !== val[sk]) return false;
        }
      }
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

// ─── Include/select resolution ───────────────────────────────
function resolve(item: any, storeName: string, include: any, selectOpt?: any): any {
  if (!item) return item;
  let result = selectOpt ? applySelect(item, selectOpt) : { ...item };

  if (!include) {
    if (selectOpt && selectOpt._count) {
      result._count = resolveCount(item, storeName, selectOpt._count.select);
    }
    return result;
  }

  const rels = REL[storeName] || {};

  for (const key of Object.keys(include)) {
    const incVal = include[key];
    if (key === "_count") {
      result._count = resolveCount(item, storeName, incVal.select);
      continue;
    }
    const rel = rels[key];
    if (!rel) continue;

    if (incVal === false) continue;

    if (rel.type === "one") {
      const fkVal = item[rel.lk];
      const related = fkVal != null ? S[rel.store].find((r: any) => r[rel.fk] === fkVal) : null;
      if (related && typeof incVal === "object" && incVal !== null) {
        result[key] = resolve(
          related,
          rel.store,
          incVal.include,
          incVal.select
        );
      } else {
        result[key] = related ? { ...related } : null;
      }
    } else {
      let items = S[rel.store].filter((r: any) => r[rel.fk] === item[rel.lk]);
      // Handle where inside include
      if (typeof incVal === "object" && incVal !== null && incVal.where) {
        items = items.filter((r: any) => matchWhere(r, incVal.where));
      }
      // Handle orderBy inside include
      if (typeof incVal === "object" && incVal !== null && incVal.orderBy) {
        items = applySorting(items, incVal.orderBy);
      }
      if (typeof incVal === "object" && incVal !== null && (incVal.include || incVal.select)) {
        items = items.map((r: any) => resolve(r, rel.store, incVal.include, incVal.select));
      } else {
        items = items.map((r: any) => ({ ...r }));
      }
      result[key] = items;
    }
  }
  return result;
}

function resolveCount(item: any, storeName: string, selectFields: any): any {
  const counts: any = {};
  const rels = REL[storeName] || {};
  for (const key of Object.keys(selectFields)) {
    if (!selectFields[key]) continue;
    const rel = rels[key];
    if (!rel) {
      counts[key] = 0;
      continue;
    }
    counts[key] = S[rel.store].filter((r: any) => r[rel.fk] === item[rel.lk]).length;
  }
  return counts;
}

function applySelect(item: any, sel: any): any {
  const result: any = {};
  for (const key of Object.keys(sel)) {
    if (key === "_count") continue; // handled separately
    if (sel[key] === true) result[key] = item[key];
  }
  return result;
}

function applySorting(items: any[], orderBy: any): any[] {
  if (!orderBy) return items;
  const arr = [...items];
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const ob of entries.reverse()) {
    for (const key of Object.keys(ob)) {
      const dir = typeof ob[key] === "object" ? "asc" : ob[key];
      // nested orderBy like { account: { code: 'asc' } } — resolve via relation
      if (typeof ob[key] === "object") {
        const relStore = Object.keys(REL).length; // skip complex nested sort in demo
        void relStore;
        continue;
      }
      arr.sort((a: any, b: any) => {
        const va = a[key] ?? "";
        const vb = b[key] ?? "";
        return dir === "desc"
          ? String(vb).localeCompare(String(va))
          : String(va).localeCompare(String(vb));
      });
    }
  }
  return arr;
}

// ─── Nested create handling ──────────────────────────────────
function processData(storeName: string, data: any): { item: any; nested: Array<{ store: string; items: any[]; fkField: string }> } {
  const item: any = { id: cuid(), createdAt: now() };
  const nested: Array<{ store: string; items: any[]; fkField: string }> = [];
  const rels = REL[storeName] || {};

  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val && typeof val === "object" && val.create !== undefined) {
      // Nested create: entries: { create: [...] }
      const rel = rels[key];
      if (rel && rel.type === "many") {
        const nestedItems = Array.isArray(val.create) ? val.create : [val.create];
        nested.push({ store: rel.store, items: nestedItems, fkField: rel.fk });
      }
    } else if (val && typeof val === "object" && val.connect !== undefined) {
      // Connect: user: { connect: { id: '123' } } → set userId
      // (Not used in our codebase but handle for safety)
      const rel = rels[key];
      if (rel && rel.type === "one") {
        item[rel.lk] = val.connect.id;
      }
    } else {
      item[key] = val;
    }
  }
  // Add default fields
  if (!item.joinedAt && storeName === "classMembers") item.joinedAt = now();
  if (!item.submittedAt && storeName === "submissions") item.submittedAt = now();
  if (!item.status && storeName === "invitations") item.status = "PENDING";
  if (!item.token && storeName === "invitations") item.token = cuid();
  if (!item.active && storeName === "users" && item.active === undefined) item.active = true;
  if (!item.difficulty && storeName === "exercises" && !item.difficulty) item.difficulty = "MEDIUM";
  return { item, nested };
}

// ─── Model factory ───────────────────────────────────────────
function createModel(storeName: string) {
  return {
    findUnique: async (args: any = {}) => {
      const { where, include, select } = args;
      const item = S[storeName].find((r: any) => matchWhere(r, where)) ?? null;
      if (!item) return null;
      return resolve(item, storeName, include, select);
    },

    findFirst: async (args: any = {}) => {
      const { where, include, select } = args;
      const item = S[storeName].find((r: any) => matchWhere(r, where)) ?? null;
      if (!item) return null;
      return resolve(item, storeName, include, select);
    },

    findMany: async (args: any = {}) => {
      const { where, include, select, orderBy } = args;
      let items = S[storeName].filter((r: any) => matchWhere(r, where));
      if (orderBy) items = applySorting(items, orderBy);
      return items.map((r: any) => resolve(r, storeName, include, select));
    },

    create: async (args: any = {}) => {
      const { data, include, select } = args;
      const { item, nested } = processData(storeName, data);
      S[storeName].push(item);
      // Process nested creates
      for (const n of nested) {
        for (const nestedData of n.items) {
          const child: any = { id: cuid(), ...nestedData, [n.fkField]: item.id };
          S[n.store].push(child);
        }
      }
      return resolve(item, storeName, include, select);
    },

    update: async (args: any = {}) => {
      const { where, data, include, select } = args;
      const idx = S[storeName].findIndex((r: any) => matchWhere(r, where));
      if (idx === -1) throw new Error(`Record not found in ${storeName}`);
      Object.assign(S[storeName][idx], data);
      return resolve(S[storeName][idx], storeName, include, select);
    },

    upsert: async (args: any = {}) => {
      const { where, create: createData, update: updateData, include, select } = args;
      const existing = S[storeName].find((r: any) => matchWhere(r, where));
      if (existing) {
        Object.assign(existing, updateData);
        return resolve(existing, storeName, include, select);
      }
      const { item } = processData(storeName, createData);
      S[storeName].push(item);
      return resolve(item, storeName, include, select);
    },

    delete: async (args: any = {}) => {
      const { where } = args;
      const idx = S[storeName].findIndex((r: any) => matchWhere(r, where));
      if (idx === -1) throw new Error(`Record not found in ${storeName}`);
      const [removed] = S[storeName].splice(idx, 1);
      // Cascade deletes for owned relations
      cascadeDelete(storeName, removed);
      return removed;
    },

    deleteMany: async (args: any = {}) => {
      const { where } = args;
      const before = S[storeName].length;
      const toRemove = S[storeName].filter((r: any) => matchWhere(r, where));
      S[storeName] = S[storeName].filter((r: any) => !matchWhere(r, where));
      for (const removed of toRemove) cascadeDelete(storeName, removed);
      return { count: before - S[storeName].length };
    },

    count: async (args: any = {}) => {
      const { where } = args;
      return S[storeName].filter((r: any) => matchWhere(r, where)).length;
    },
  };
}

function cascadeDelete(storeName: string, item: any) {
  const cascades: Record<string, string[]> = {
    workspaces: ["workspaceAccounts", "transactions", "openingBalances", "submissions"],
    transactions: ["entries"],
    classes: ["classMembers", "invitations"],
    exercises: ["exerciseTransactions"],
  };
  const stores = cascades[storeName];
  if (!stores) return;
  const rels = REL[storeName] || {};
  for (const relName of Object.keys(rels)) {
    const rel = rels[relName];
    if (rel.type === "many" && stores.includes(rel.store)) {
      const children = S[rel.store].filter((r: any) => r[rel.fk] === item[rel.lk]);
      S[rel.store] = S[rel.store].filter((r: any) => r[rel.fk] !== item[rel.lk]);
      for (const child of children) cascadeDelete(rel.store, child);
    }
  }
}

// ─── Prisma mock export ──────────────────────────────────────
export const prisma: any = {
  user: createModel("users"),
  account: createModel("accounts"),
  workspace: createModel("workspaces"),
  workspaceAccount: createModel("workspaceAccounts"),
  openingBalance: createModel("openingBalances"),
  transaction: createModel("transactions"),
  entry: createModel("entries"),
  class: createModel("classes"),
  classMember: createModel("classMembers"),
  invitation: createModel("invitations"),
  exercise: createModel("exercises"),
  exerciseTransaction: createModel("exerciseTransactions"),
  submission: createModel("submissions"),
  $transaction: async (fnOrArray: any) => {
    if (typeof fnOrArray === "function") return fnOrArray(prisma);
    return Promise.all(fnOrArray);
  },
  $disconnect: async () => {},
};

// ─── Seed data ───────────────────────────────────────────────
(function seed() {
  // Users
  const teacherPw = hashSync("teacher123", 10);
  const studentPw = hashSync("student123", 10);

  S.users.push(
    { id: "teacher-1", email: "ucitel@skola.cz", passwordHash: teacherPw, role: "TEACHER", active: true, createdAt: "2025-01-01T00:00:00.000Z" },
    { id: "student-1", email: "student@skola.cz", passwordHash: studentPw, role: "STUDENT", active: true, createdAt: "2025-01-02T00:00:00.000Z" }
  );

  // Chart of accounts (Czech standard)
  const accts: Array<[string, string, string, string, string]> = [
    ["013", "Software", "ASSET", "MD", "Softwarové licence a aplikace"],
    ["021", "Stavby", "ASSET", "MD", "Budovy a stavby"],
    ["022", "Hmotné movité věci", "ASSET", "MD", "Stroje, přístroje, inventář"],
    ["031", "Pozemky", "ASSET", "MD", "Pozemky"],
    ["042", "Nedokončený DHM", "ASSET", "MD", "Nedokončený dlouhodobý hmotný majetek"],
    ["081", "Oprávky ke stavbám", "ASSET", "DAL", "Oprávky ke stavbám"],
    ["082", "Oprávky k HMV", "ASSET", "DAL", "Oprávky k hmotným movitým věcem"],
    ["111", "Pořízení materiálu", "ASSET", "MD", "Pořízení materiálu"],
    ["112", "Materiál na skladě", "ASSET", "MD", "Materiál na skladě"],
    ["131", "Pořízení zboží", "ASSET", "MD", "Pořízení zboží"],
    ["132", "Zboží na skladě", "ASSET", "MD", "Zboží na skladě a v prodejnách"],
    ["211", "Pokladna", "ASSET", "MD", "Pokladna (hotovost)"],
    ["213", "Ceniny", "ASSET", "MD", "Ceniny (stravenky, kolky)"],
    ["221", "Bankovní účty", "ASSET", "MD", "Peněžní prostředky na účtech"],
    ["231", "Krátkodobé úvěry", "LIABILITY", "DAL", "Krátkodobé bankovní úvěry"],
    ["261", "Peníze na cestě", "ASSET", "MD", "Peníze na cestě"],
    ["311", "Odběratelé", "ASSET", "MD", "Pohledávky za odběrateli"],
    ["314", "Poskytnuté zálohy", "ASSET", "MD", "Poskytnuté provozní zálohy"],
    ["321", "Dodavatelé", "LIABILITY", "DAL", "Závazky vůči dodavatelům"],
    ["324", "Přijaté zálohy", "LIABILITY", "DAL", "Přijaté zálohy"],
    ["331", "Zaměstnanci", "LIABILITY", "DAL", "Závazky vůči zaměstnancům"],
    ["336", "Zúčtování s institucemi SZ a ZP", "LIABILITY", "DAL", "Sociální a zdravotní pojištění"],
    ["341", "Daň z příjmů", "LIABILITY", "DAL", "Daň z příjmů"],
    ["343", "DPH", "LIABILITY", "DAL", "Daň z přidané hodnoty"],
    ["345", "Ostatní daně a poplatky", "LIABILITY", "DAL", "Ostatní daně a poplatky"],
    ["379", "Jiné závazky", "LIABILITY", "DAL", "Jiné závazky"],
    ["411", "Základní kapitál", "EQUITY", "DAL", "Základní kapitál"],
    ["421", "Zákonný rezervní fond", "EQUITY", "DAL", "Zákonný rezervní fond"],
    ["428", "Nerozdělený zisk", "EQUITY", "DAL", "Nerozdělený zisk minulých let"],
    ["431", "Výsledek hospodaření", "EQUITY", "DAL", "Výsledek hospodaření ve schvalovacím řízení"],
    ["451", "Rezervy", "LIABILITY", "DAL", "Rezervy zákonné a ostatní"],
    ["461", "Dlouhodobé úvěry", "LIABILITY", "DAL", "Bankovní úvěry dlouhodobé"],
    ["501", "Spotřeba materiálu", "EXPENSE", "MD", "Spotřeba materiálu"],
    ["502", "Spotřeba energie", "EXPENSE", "MD", "Spotřeba energie"],
    ["504", "Prodané zboží", "EXPENSE", "MD", "Prodané zboží"],
    ["511", "Opravy a udržování", "EXPENSE", "MD", "Opravy a udržování"],
    ["512", "Cestovné", "EXPENSE", "MD", "Cestovné"],
    ["513", "Náklady na reprezentaci", "EXPENSE", "MD", "Náklady na reprezentaci"],
    ["518", "Ostatní služby", "EXPENSE", "MD", "Ostatní služby"],
    ["521", "Mzdové náklady", "EXPENSE", "MD", "Mzdové náklady"],
    ["524", "Zákonné sociální pojištění", "EXPENSE", "MD", "Zákonné sociální a zdravotní pojištění"],
    ["531", "Daň silniční", "EXPENSE", "MD", "Daň silniční"],
    ["532", "Daň z nemovitostí", "EXPENSE", "MD", "Daň z nemovitých věcí"],
    ["538", "Ostatní daně a poplatky", "EXPENSE", "MD", "Ostatní daně a poplatky (náklady)"],
    ["541", "Zůstatková cena prodaného DM", "EXPENSE", "MD", "Zůstatková cena prodaného dlouhodobého majetku"],
    ["542", "Prodaný materiál", "EXPENSE", "MD", "Prodaný materiál"],
    ["543", "Dary", "EXPENSE", "MD", "Dary"],
    ["544", "Smluvní pokuty a úroky z prodlení", "EXPENSE", "MD", "Smluvní pokuty a úroky z prodlení"],
    ["545", "Ostatní pokuty a penále", "EXPENSE", "MD", "Ostatní pokuty a penále"],
    ["546", "Odpis pohledávky", "EXPENSE", "MD", "Odpis pohledávky"],
    ["548", "Ostatní provozní náklady", "EXPENSE", "MD", "Ostatní provozní náklady"],
    ["551", "Odpisy DHM a DNM", "EXPENSE", "MD", "Odpisy dlouhodobého hmotného a nehmotného majetku"],
    ["562", "Úroky", "EXPENSE", "MD", "Úroky"],
    ["563", "Kurzové ztráty", "EXPENSE", "MD", "Kurzové ztráty"],
    ["591", "Daň z příjmů - splatná", "EXPENSE", "MD", "Daň z příjmů z běžné činnosti - splatná"],
    ["601", "Tržby za vlastní výrobky", "REVENUE", "DAL", "Tržby za vlastní výrobky"],
    ["602", "Tržby z prodeje služeb", "REVENUE", "DAL", "Tržby z prodeje služeb"],
    ["604", "Tržby za zboží", "REVENUE", "DAL", "Tržby za zboží"],
    ["641", "Tržby z prodeje DM", "REVENUE", "DAL", "Tržby z prodeje dlouhodobého majetku"],
    ["642", "Tržby z prodeje materiálu", "REVENUE", "DAL", "Tržby z prodeje materiálu"],
    ["644", "Smluvní pokuty a úroky z prodlení", "REVENUE", "DAL", "Smluvní pokuty a úroky z prodlení (výnosy)"],
    ["648", "Ostatní provozní výnosy", "REVENUE", "DAL", "Ostatní provozní výnosy"],
    ["662", "Úroky", "REVENUE", "DAL", "Úroky (výnosy)"],
    ["663", "Kurzové zisky", "REVENUE", "DAL", "Kurzové zisky"],
  ];

  for (const [code, name, type, normalBalance, description] of accts) {
    S.accounts.push({ id: `acct-${code}`, code, name, type, normalBalance, description });
  }

  // Demo class
  S.classes.push({
    id: "class-1",
    name: "Účetnictví 1A",
    teacherId: "teacher-1",
    createdAt: "2025-01-10T00:00:00.000Z",
  });

  S.classMembers.push({
    id: "cm-1",
    classId: "class-1",
    studentId: "student-1",
    joinedAt: "2025-01-11T00:00:00.000Z",
  });

  // Demo exercise
  S.exercises.push({
    id: "exercise-1",
    createdBy: "teacher-1",
    classId: "class-1",
    title: "Základní účetní operace",
    description:
      "Zaúčtujte následující operace:\n\n1. Nákup materiálu na fakturu za 10 000 Kč\n2. Úhrada faktury z bankovního účtu",
    difficulty: "EASY",
    createdAt: "2025-01-15T00:00:00.000Z",
  });

  S.exerciseTransactions.push(
    {
      id: "et-1",
      exerciseId: "exercise-1",
      expectedData: {
        description: "Nákup materiálu na fakturu",
        entries: [
          { accountCode: "112", side: "MD", amount: "10000" },
          { accountCode: "321", side: "DAL", amount: "10000" },
        ],
      },
    },
    {
      id: "et-2",
      exerciseId: "exercise-1",
      expectedData: {
        description: "Úhrada faktury z bankovního účtu",
        entries: [
          { accountCode: "321", side: "MD", amount: "10000" },
          { accountCode: "221", side: "DAL", amount: "10000" },
        ],
      },
    }
  );
})();
