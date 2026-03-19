import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL!.replace(/\?schema=\w+/, '');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create chart of accounts (Czech accounting standard)
  const accounts = [
    // Class 0 - Dlouhodobý majetek (Long-term assets)
    { code: "013", name: "Software", type: "ASSET" as const, normalBalance: "MD" as const, description: "Softwarové licence a aplikace" },
    { code: "021", name: "Stavby", type: "ASSET" as const, normalBalance: "MD" as const, description: "Budovy a stavby" },
    { code: "022", name: "Hmotné movité věci", type: "ASSET" as const, normalBalance: "MD" as const, description: "Stroje, přístroje, inventář" },
    { code: "031", name: "Pozemky", type: "ASSET" as const, normalBalance: "MD" as const, description: "Pozemky" },
    { code: "042", name: "Nedokončený DHM", type: "ASSET" as const, normalBalance: "MD" as const, description: "Nedokončený dlouhodobý hmotný majetek" },
    { code: "081", name: "Oprávky ke stavbám", type: "ASSET" as const, normalBalance: "DAL" as const, description: "Oprávky ke stavbám" },
    { code: "082", name: "Oprávky k HMV", type: "ASSET" as const, normalBalance: "DAL" as const, description: "Oprávky k hmotným movitým věcem" },

    // Class 1 - Zásoby (Inventory)
    { code: "111", name: "Pořízení materiálu", type: "ASSET" as const, normalBalance: "MD" as const, description: "Pořízení materiálu" },
    { code: "112", name: "Materiál na skladě", type: "ASSET" as const, normalBalance: "MD" as const, description: "Materiál na skladě" },
    { code: "131", name: "Pořízení zboží", type: "ASSET" as const, normalBalance: "MD" as const, description: "Pořízení zboží" },
    { code: "132", name: "Zboží na skladě", type: "ASSET" as const, normalBalance: "MD" as const, description: "Zboží na skladě a v prodejnách" },

    // Class 2 - Finanční účty (Financial accounts)
    { code: "211", name: "Pokladna", type: "ASSET" as const, normalBalance: "MD" as const, description: "Pokladna (hotovost)" },
    { code: "213", name: "Ceniny", type: "ASSET" as const, normalBalance: "MD" as const, description: "Ceniny (stravenky, kolky)" },
    { code: "221", name: "Bankovní účty", type: "ASSET" as const, normalBalance: "MD" as const, description: "Peněžní prostředky na účtech" },
    { code: "231", name: "Krátkodobé úvěry", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Krátkodobé bankovní úvěry" },
    { code: "261", name: "Peníze na cestě", type: "ASSET" as const, normalBalance: "MD" as const, description: "Peníze na cestě" },

    // Class 3 - Zúčtovací vztahy (Receivables & Payables)
    { code: "311", name: "Odběratelé", type: "ASSET" as const, normalBalance: "MD" as const, description: "Pohledávky za odběrateli" },
    { code: "314", name: "Poskytnuté zálohy", type: "ASSET" as const, normalBalance: "MD" as const, description: "Poskytnuté provozní zálohy" },
    { code: "321", name: "Dodavatelé", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Závazky vůči dodavatelům" },
    { code: "324", name: "Přijaté zálohy", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Přijaté zálohy" },
    { code: "331", name: "Zaměstnanci", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Závazky vůči zaměstnancům" },
    { code: "336", name: "Zúčtování s institucemi SZ a ZP", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Zúčtování s institucemi sociálního zabezpečení a zdravotního pojištění" },
    { code: "341", name: "Daň z příjmů", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Daň z příjmů" },
    { code: "343", name: "DPH", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Daň z přidané hodnoty" },
    { code: "345", name: "Ostatní daně a poplatky", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Ostatní daně a poplatky" },
    { code: "379", name: "Jiné závazky", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Jiné závazky" },

    // Class 4 - Kapitálové účty (Equity)
    { code: "411", name: "Základní kapitál", type: "EQUITY" as const, normalBalance: "DAL" as const, description: "Základní kapitál" },
    { code: "421", name: "Zákonný rezervní fond", type: "EQUITY" as const, normalBalance: "DAL" as const, description: "Zákonný rezervní fond" },
    { code: "428", name: "Nerozdělený zisk", type: "EQUITY" as const, normalBalance: "DAL" as const, description: "Nerozdělený zisk minulých let" },
    { code: "431", name: "Výsledek hospodaření", type: "EQUITY" as const, normalBalance: "DAL" as const, description: "Výsledek hospodaření ve schvalovacím řízení" },
    { code: "451", name: "Rezervy", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Rezervy zákonné a ostatní" },
    { code: "461", name: "Dlouhodobé úvěry", type: "LIABILITY" as const, normalBalance: "DAL" as const, description: "Bankovní úvěry dlouhodobé" },

    // Class 5 - Náklady (Expenses)
    { code: "501", name: "Spotřeba materiálu", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Spotřeba materiálu" },
    { code: "502", name: "Spotřeba energie", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Spotřeba energie" },
    { code: "504", name: "Prodané zboží", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Prodané zboží" },
    { code: "511", name: "Opravy a udržování", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Opravy a udržování" },
    { code: "512", name: "Cestovné", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Cestovné" },
    { code: "513", name: "Náklady na reprezentaci", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Náklady na reprezentaci" },
    { code: "518", name: "Ostatní služby", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Ostatní služby" },
    { code: "521", name: "Mzdové náklady", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Mzdové náklady" },
    { code: "524", name: "Zákonné sociální pojištění", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Zákonné sociální a zdravotní pojištění" },
    { code: "531", name: "Daň silniční", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Daň silniční" },
    { code: "532", name: "Daň z nemovitostí", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Daň z nemovitých věcí" },
    { code: "538", name: "Ostatní daně a poplatky", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Ostatní daně a poplatky (náklady)" },
    { code: "541", name: "Zůstatková cena prodaného DM", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Zůstatková cena prodaného dlouhodobého majetku" },
    { code: "542", name: "Prodaný materiál", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Prodaný materiál" },
    { code: "543", name: "Dary", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Dary" },
    { code: "544", name: "Smluvní pokuty a úroky z prodlení", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Smluvní pokuty a úroky z prodlení" },
    { code: "545", name: "Ostatní pokuty a penále", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Ostatní pokuty a penále" },
    { code: "546", name: "Odpis pohledávky", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Odpis pohledávky" },
    { code: "548", name: "Ostatní provozní náklady", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Ostatní provozní náklady" },
    { code: "551", name: "Odpisy DHM a DNM", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Odpisy dlouhodobého hmotného a nehmotného majetku" },
    { code: "562", name: "Úroky", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Úroky" },
    { code: "563", name: "Kurzové ztráty", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Kurzové ztráty" },
    { code: "591", name: "Daň z příjmů - splatná", type: "EXPENSE" as const, normalBalance: "MD" as const, description: "Daň z příjmů z běžné činnosti - splatná" },

    // Class 6 - Výnosy (Revenue)
    { code: "601", name: "Tržby za vlastní výrobky", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Tržby za vlastní výrobky" },
    { code: "602", name: "Tržby z prodeje služeb", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Tržby z prodeje služeb" },
    { code: "604", name: "Tržby za zboží", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Tržby za zboží" },
    { code: "641", name: "Tržby z prodeje DM", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Tržby z prodeje dlouhodobého majetku" },
    { code: "642", name: "Tržby z prodeje materiálu", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Tržby z prodeje materiálu" },
    { code: "644", name: "Smluvní pokuty a úroky z prodlení", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Smluvní pokuty a úroky z prodlení (výnosy)" },
    { code: "648", name: "Ostatní provozní výnosy", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Ostatní provozní výnosy" },
    { code: "662", name: "Úroky", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Úroky (výnosy)" },
    { code: "663", name: "Kurzové zisky", type: "REVENUE" as const, normalBalance: "DAL" as const, description: "Kurzové zisky" },
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    });
  }
  console.log(`Created ${accounts.length} accounts`);

  // Create demo admin
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@skola.cz" },
    update: {},
    create: {
      email: "admin@skola.cz",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create demo teacher
  const teacherPassword = await hash("teacher123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "ucitel@skola.cz" },
    update: {},
    create: {
      email: "ucitel@skola.cz",
      passwordHash: teacherPassword,
      role: "TEACHER",
    },
  });
  console.log(`Created teacher: ${teacher.email}`);

  // Create demo student
  const studentPassword = await hash("student123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@skola.cz" },
    update: {},
    create: {
      email: "student@skola.cz",
      passwordHash: studentPassword,
      role: "STUDENT",
    },
  });
  console.log(`Created student: ${student.email}`);

  // Create demo class and add student
  const demoClass = await prisma.class.upsert({
    where: { id: "demo-class-1" },
    update: {},
    create: {
      id: "demo-class-1",
      name: "Účetnictví 1A",
      teacherId: teacher.id,
    },
  });
  await prisma.classMember.upsert({
    where: { classId_studentId: { classId: demoClass.id, studentId: student.id } },
    update: {},
    create: {
      classId: demoClass.id,
      studentId: student.id,
    },
  });
  console.log(`Created class: ${demoClass.name} with student`);

  // Create a demo exercise
  const pokladna = await prisma.account.findUnique({ where: { code: "211" } });
  const material = await prisma.account.findUnique({ where: { code: "112" } });
  const dodavatele = await prisma.account.findUnique({ where: { code: "321" } });
  const bankovniUcty = await prisma.account.findUnique({ where: { code: "221" } });

  if (pokladna && material && dodavatele && bankovniUcty) {
    const exercise = await prisma.exercise.upsert({
      where: { id: "demo-exercise-1" },
      update: {},
      create: {
        id: "demo-exercise-1",
        title: "Základní účetní operace",
        description: `Zaúčtujte následující operace:\n\n1. Nákup materiálu na fakturu za 10 000 Kč\n2. Úhrada faktury z bankovního účtu`,
        difficulty: "EASY",
        createdBy: teacher.id,
        classId: demoClass.id,
      },
    });

    // Expected transactions
    await prisma.exerciseTransaction.deleteMany({
      where: { exerciseId: exercise.id },
    });

    await prisma.exerciseTransaction.create({
      data: {
        exerciseId: exercise.id,
        expectedData: {
          description: "Nákup materiálu na fakturu",
          entries: [
            { accountCode: "112", side: "MD", amount: "10000" },
            { accountCode: "321", side: "DAL", amount: "10000" },
          ],
        },
      },
    });

    await prisma.exerciseTransaction.create({
      data: {
        exerciseId: exercise.id,
        expectedData: {
          description: "Úhrada faktury z bankovního účtu",
          entries: [
            { accountCode: "321", side: "MD", amount: "10000" },
            { accountCode: "221", side: "DAL", amount: "10000" },
          ],
        },
      },
    });

    console.log(`Created demo exercise: ${exercise.title}`);
  }

  console.log("\nSeed complete!");
  console.log("\nDemo accounts:");
  console.log("  Admin:   admin@skola.cz / admin123");
  console.log("  Teacher: ucitel@skola.cz / teacher123");
  console.log("  Student: student@skola.cz / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
