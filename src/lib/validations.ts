import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
});

// Registration: always creates STUDENT - role field removed
export const registerSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Název je povinný").max(100),
  exerciseId: z.string().optional(),
});

export const addWorkspaceAccountSchema = z.object({
  accountId: z.string().min(1, "Vyberte účet"),
});

const entrySchema = z.object({
  accountId: z.string().min(1, "Vyberte účet"),
  side: z.enum(["MD", "DAL"]),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Částka musí být kladné číslo" }
  ),
  description: z.string().optional(),
});

export const createTransactionSchema = z.object({
  workspaceId: z.string().min(1),
  description: z.string().min(1, "Popis je povinný"),
  entries: z.array(entrySchema).min(2, "Transakce musí mít alespoň 2 položky"),
});

const expectedEntrySchema = z.object({
  accountCode: z.string().min(1),
  side: z.enum(["MD", "DAL"]),
  amount: z.string(),
});

const expectedTransactionSchema = z.object({
  description: z.string(),
  entries: z.array(expectedEntrySchema).min(2),
});

export const createExerciseSchema = z.object({
  title: z.string().min(1, "Název je povinný"),
  description: z.string().min(1, "Popis je povinný"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  classId: z.string().optional(),
  expectedTransactions: z.array(expectedTransactionSchema).min(1, "Alespoň jedna transakce"),
});

export const submitExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  workspaceId: z.string().min(1),
});

// Admin: create teacher account
export const adminCreateTeacherSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
});

// Admin: update user role
export const adminUpdateUserSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
  active: z.boolean().optional(),
});

// Classes
export const createClassSchema = z.object({
  name: z.string().min(1, "Název třídy je povinný").max(100),
});

// Invitations
export const createInvitationSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token je povinný"),
});

// Opening balances
export const setOpeningBalanceSchema = z.object({
  accountId: z.string().min(1, "Vyberte účet"),
  side: z.enum(["MD", "DAL"]),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Částka musí být kladné číslo" }
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type SubmitExerciseInput = z.infer<typeof submitExerciseSchema>;
